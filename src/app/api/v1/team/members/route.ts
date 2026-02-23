// ---------------------------------------------------------------------------
// Gatekeeper -- Team Members API: List, Update Role, Remove
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { logAuditEvent } from "@/lib/api/audit";
import { createAdminClient } from "@/lib/supabase/admin";

// ---- Validation -----------------------------------------------------------

const updateRoleSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
  role: z.enum(["admin", "member"]),
});

const removeMemberSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
});

// ---- GET /api/v1/team/members ---------------------------------------------

export async function GET(request: Request) {
  try {
    const auth = await authenticateRequest(request);

    // Session-only: API keys cannot list team members.
    if (auth.type !== "session") {
      throw new ApiError(403, "Only dashboard users can manage team members");
    }

    const admin = createAdminClient();

    // Fetch memberships for this org, joined with user profiles
    const { data: memberships, error } = await admin
      .from("org_memberships")
      .select("id, user_id, org_id, role, is_default, created_at, updated_at")
      .eq("org_id", auth.orgId)
      .order("role", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[Team] Failed to list members:", error);
      throw new ApiError(500, "Failed to list members");
    }

    // Fetch the user profiles for these members
    const userIds = (memberships ?? []).map((m) => m.user_id);
    const { data: profiles } = await admin
      .from("user_profiles")
      .select("id, email, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p]),
    );

    // Combine into a flat structure matching what the frontend expects
    const members = (memberships ?? []).map((m) => {
      const profile = profileMap.get(m.user_id);
      return {
        id: m.user_id,
        email: profile?.email ?? "",
        full_name: profile?.full_name ?? null,
        avatar_url: profile?.avatar_url ?? null,
        role: m.role,
        created_at: m.created_at,
        updated_at: m.updated_at,
      };
    });

    return NextResponse.json({ data: members });
  } catch (err) {
    return errorResponse(err);
  }
}

// ---- PATCH /api/v1/team/members -------------------------------------------

export async function PATCH(request: Request) {
  try {
    const auth = await authenticateRequest(request);

    // Session-only, owner only.
    if (auth.type !== "session") {
      throw new ApiError(403, "Only dashboard users can manage team members");
    }

    if (auth.membership.role !== "owner") {
      throw new ApiError(403, "Only owners can change member roles");
    }

    // Validate request body.
    let body: z.infer<typeof updateRoleSchema>;
    try {
      body = updateRoleSchema.parse(await request.json());
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", issues: err.issues },
          { status: 400 },
        );
      }
      throw err;
    }

    // Cannot change own role.
    if (body.user_id === auth.user.id) {
      throw new ApiError(400, "You cannot change your own role", "SELF_CHANGE");
    }

    const admin = createAdminClient();

    // Verify the target user has a membership in this org.
    const { data: targetMembership } = await admin
      .from("org_memberships")
      .select("id, role")
      .eq("user_id", body.user_id)
      .eq("org_id", auth.orgId)
      .single();

    if (!targetMembership) {
      throw new ApiError(404, "Member not found");
    }

    // Cannot demote the last owner.
    if (targetMembership.role === "owner") {
      const { count } = await admin
        .from("org_memberships")
        .select("*", { count: "exact", head: true })
        .eq("org_id", auth.orgId)
        .eq("role", "owner");

      if ((count ?? 0) <= 1) {
        throw new ApiError(
          400,
          "Cannot demote the last owner",
          "LAST_OWNER",
        );
      }
    }

    // Update the role on org_memberships.
    const { error: updateError } = await admin
      .from("org_memberships")
      .update({ role: body.role })
      .eq("user_id", body.user_id)
      .eq("org_id", auth.orgId);

    if (updateError) {
      console.error("[Team] Failed to update member role:", updateError);
      throw new ApiError(500, "Failed to update member role");
    }

    // Audit the role change.
    const ipAddress =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    await logAuditEvent({
      orgId: auth.orgId,
      userId: auth.user.id,
      action: "member.role_changed",
      resourceType: "org_membership",
      resourceId: body.user_id,
      details: { old_role: targetMembership.role, new_role: body.role },
      ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

// ---- DELETE /api/v1/team/members ------------------------------------------

export async function DELETE(request: Request) {
  try {
    const auth = await authenticateRequest(request);

    // Session-only, admin or owner.
    if (auth.type !== "session") {
      throw new ApiError(403, "Only dashboard users can manage team members");
    }

    if (auth.membership.role !== "owner" && auth.membership.role !== "admin") {
      throw new ApiError(403, "Insufficient permissions");
    }

    // Validate request body.
    let body: z.infer<typeof removeMemberSchema>;
    try {
      body = removeMemberSchema.parse(await request.json());
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", issues: err.issues },
          { status: 400 },
        );
      }
      throw err;
    }

    // Cannot remove yourself.
    if (body.user_id === auth.user.id) {
      throw new ApiError(400, "You cannot remove yourself", "SELF_REMOVAL");
    }

    const admin = createAdminClient();

    // Verify the target user has a membership in this org.
    const { data: targetMembership } = await admin
      .from("org_memberships")
      .select("id, role, user_id")
      .eq("user_id", body.user_id)
      .eq("org_id", auth.orgId)
      .single();

    if (!targetMembership) {
      throw new ApiError(404, "Member not found");
    }

    // Get the target user's email for audit
    const { data: targetProfile } = await admin
      .from("user_profiles")
      .select("email")
      .eq("id", body.user_id)
      .single();

    // Cannot remove the last owner.
    if (targetMembership.role === "owner") {
      const { count } = await admin
        .from("org_memberships")
        .select("*", { count: "exact", head: true })
        .eq("org_id", auth.orgId)
        .eq("role", "owner");

      if ((count ?? 0) <= 1) {
        throw new ApiError(
          400,
          "Cannot remove the last owner",
          "LAST_OWNER",
        );
      }
    }

    // Delete the membership (removes them from the org, not from auth.users).
    const { error: deleteError } = await admin
      .from("org_memberships")
      .delete()
      .eq("user_id", body.user_id)
      .eq("org_id", auth.orgId);

    if (deleteError) {
      console.error("[Team] Failed to remove member:", deleteError);
      throw new ApiError(500, "Failed to remove member");
    }

    // Audit the removal.
    const ipAddress =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    await logAuditEvent({
      orgId: auth.orgId,
      userId: auth.user.id,
      action: "member.removed",
      resourceType: "org_membership",
      resourceId: body.user_id,
      details: { email: targetProfile?.email, role: targetMembership.role },
      ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
