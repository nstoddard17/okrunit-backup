// ---------------------------------------------------------------------------
// Gatekeeper -- Team Members API: List + Add + Remove
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { logAuditEvent } from "@/lib/api/audit";
import { createAdminClient } from "@/lib/supabase/admin";

// ---- Validation -----------------------------------------------------------

const addMemberSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
});

const removeMemberSchema = z.object({
  user_id: z.string().uuid("Invalid user ID"),
});

// ---- Helpers --------------------------------------------------------------

function getIpAddress(request: Request): string {
  return (
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Verify that a team exists and belongs to the given org. Returns the team
 * row or throws a 404.
 */
async function fetchTeamOrThrow(
  admin: ReturnType<typeof createAdminClient>,
  teamId: string,
  orgId: string,
) {
  const { data: team, error } = await admin
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .eq("org_id", orgId)
    .single();

  if (error || !team) {
    throw new ApiError(404, "Team not found");
  }

  return team;
}

// ---- GET /api/v1/teams/[id]/members ---------------------------------------

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);

    // Session or OAuth (Zapier needs this for dynamic dropdowns).
    // API keys cannot access team members.
    if (auth.type === "api_key") {
      throw new ApiError(403, "API key auth not supported for this endpoint");
    }

    const admin = createAdminClient();

    // Verify the team exists and belongs to this org.
    await fetchTeamOrThrow(admin, id, auth.orgId);

    // Fetch team memberships.
    const { data: memberships, error: memberError } = await admin
      .from("team_memberships")
      .select("user_id, created_at")
      .eq("team_id", id);

    if (memberError) {
      console.error("[Teams] Failed to fetch team members:", memberError);
      throw new ApiError(500, "Failed to fetch team members");
    }

    // Fetch user profiles for the members.
    const userIds = (memberships ?? []).map((m) => m.user_id);
    let members: Array<{
      id: string;
      email: string;
      full_name: string | null;
      avatar_url: string | null;
      joined_at: string;
    }> = [];

    if (userIds.length > 0) {
      const { data: profiles } = await admin
        .from("user_profiles")
        .select("id, email, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(
        (profiles ?? []).map((p) => [p.id, p]),
      );

      members = (memberships ?? []).map((m) => {
        const profile = profileMap.get(m.user_id);
        return {
          id: m.user_id,
          email: profile?.email ?? "",
          full_name: profile?.full_name ?? null,
          avatar_url: profile?.avatar_url ?? null,
          joined_at: m.created_at,
        };
      });
    }

    return NextResponse.json({ data: members });
  } catch (err) {
    return errorResponse(err);
  }
}

// ---- POST /api/v1/teams/[id]/members --------------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);

    // Only dashboard (session) users may manage team members.
    if (auth.type !== "session") {
      throw new ApiError(403, "Only dashboard users can manage teams");
    }

    // Must be owner or admin.
    if (auth.membership.role !== "owner" && auth.membership.role !== "admin") {
      throw new ApiError(403, "Insufficient permissions");
    }

    // Validate request body.
    let body: z.infer<typeof addMemberSchema>;
    try {
      body = addMemberSchema.parse(await request.json());
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          { error: "Validation failed", issues: err.issues },
          { status: 400 },
        );
      }
      throw err;
    }

    const admin = createAdminClient();

    // Verify the team exists and belongs to this org.
    const team = await fetchTeamOrThrow(admin, id, auth.orgId);

    // Verify the user is a member of this org.
    const { data: orgMembership, error: orgMemberError } = await admin
      .from("org_memberships")
      .select("id")
      .eq("user_id", body.user_id)
      .eq("org_id", auth.orgId)
      .single();

    if (orgMemberError || !orgMembership) {
      throw new ApiError(
        400,
        "User is not a member of this organization",
        "NOT_ORG_MEMBER",
      );
    }

    // Add the user to the team.
    const { data: membership, error: insertError } = await admin
      .from("team_memberships")
      .insert({
        team_id: id,
        user_id: body.user_id,
      })
      .select("*")
      .single();

    if (insertError || !membership) {
      // Handle unique constraint violation (team_id + user_id).
      if (insertError?.code === "23505") {
        throw new ApiError(
          409,
          "User is already a member of this team",
          "DUPLICATE_MEMBER",
        );
      }
      console.error("[Teams] Failed to add team member:", insertError);
      throw new ApiError(500, "Failed to add team member");
    }

    // Audit the addition.
    await logAuditEvent({
      orgId: auth.orgId,
      userId: auth.user.id,
      action: "team.member_added",
      resourceType: "team",
      resourceId: id,
      details: { added_user_id: body.user_id, team_name: team.name },
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({ data: membership }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

// ---- DELETE /api/v1/teams/[id]/members ------------------------------------

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const auth = await authenticateRequest(request);

    // Only dashboard (session) users may manage team members.
    if (auth.type !== "session") {
      throw new ApiError(403, "Only dashboard users can manage teams");
    }

    // Must be owner or admin.
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

    const admin = createAdminClient();

    // Verify the team exists and belongs to this org.
    const team = await fetchTeamOrThrow(admin, id, auth.orgId);

    // Verify the user is actually a member of this team.
    const { data: existingMembership, error: checkError } = await admin
      .from("team_memberships")
      .select("id")
      .eq("team_id", id)
      .eq("user_id", body.user_id)
      .single();

    if (checkError || !existingMembership) {
      throw new ApiError(404, "User is not a member of this team");
    }

    // Remove the membership.
    const { error: deleteError } = await admin
      .from("team_memberships")
      .delete()
      .eq("team_id", id)
      .eq("user_id", body.user_id);

    if (deleteError) {
      console.error("[Teams] Failed to remove team member:", deleteError);
      throw new ApiError(500, "Failed to remove team member");
    }

    // Audit the removal.
    await logAuditEvent({
      orgId: auth.orgId,
      userId: auth.user.id,
      action: "team.member_removed",
      resourceType: "team",
      resourceId: id,
      details: { removed_user_id: body.user_id, team_name: team.name },
      ipAddress: getIpAddress(request),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
