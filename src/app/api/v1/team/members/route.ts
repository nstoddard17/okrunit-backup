// ---------------------------------------------------------------------------
// Gatekeeper -- Team Members API: List, Update Role, Remove
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { logAuditEvent } from "@/lib/api/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import type { UserProfile } from "@/lib/types/database";

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
    if (auth.type === "api_key") {
      throw new ApiError(403, "Only dashboard users can manage team members");
    }

    const admin = createAdminClient();

    const { data: members, error } = await admin
      .from("user_profiles")
      .select("*")
      .eq("org_id", auth.orgId)
      .order("role", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<UserProfile[]>();

    if (error) {
      console.error("[Team] Failed to list members:", error);
      throw new ApiError(500, "Failed to list members");
    }

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
    if (auth.type === "api_key") {
      throw new ApiError(403, "Only dashboard users can manage team members");
    }

    if (auth.profile.role !== "owner") {
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

    // Verify the target user belongs to the same org.
    const { data: targetUser } = await admin
      .from("user_profiles")
      .select("id, role")
      .eq("id", body.user_id)
      .eq("org_id", auth.orgId)
      .single<Pick<UserProfile, "id" | "role">>();

    if (!targetUser) {
      throw new ApiError(404, "Member not found");
    }

    // Cannot demote the last owner.
    if (targetUser.role === "owner") {
      const { count } = await admin
        .from("user_profiles")
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

    // Update the role.
    const { data: updated, error: updateError } = await admin
      .from("user_profiles")
      .update({ role: body.role, updated_at: new Date().toISOString() })
      .eq("id", body.user_id)
      .eq("org_id", auth.orgId)
      .select("*")
      .single<UserProfile>();

    if (updateError || !updated) {
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
      resourceType: "user_profile",
      resourceId: body.user_id,
      details: { old_role: targetUser.role, new_role: body.role },
      ipAddress,
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

// ---- DELETE /api/v1/team/members ------------------------------------------

export async function DELETE(request: Request) {
  try {
    const auth = await authenticateRequest(request);

    // Session-only, admin or owner.
    if (auth.type === "api_key") {
      throw new ApiError(403, "Only dashboard users can manage team members");
    }

    if (auth.profile.role !== "owner" && auth.profile.role !== "admin") {
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

    // Verify the target user belongs to the same org.
    const { data: targetUser } = await admin
      .from("user_profiles")
      .select("id, role, email")
      .eq("id", body.user_id)
      .eq("org_id", auth.orgId)
      .single<Pick<UserProfile, "id" | "role" | "email">>();

    if (!targetUser) {
      throw new ApiError(404, "Member not found");
    }

    // Cannot remove the last owner.
    if (targetUser.role === "owner") {
      const { count } = await admin
        .from("user_profiles")
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

    // Delete the user profile (removes them from the org, not from auth.users).
    const { error: deleteError } = await admin
      .from("user_profiles")
      .delete()
      .eq("id", body.user_id)
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
      resourceType: "user_profile",
      resourceId: body.user_id,
      details: { email: targetUser.email, role: targetUser.role },
      ipAddress,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
