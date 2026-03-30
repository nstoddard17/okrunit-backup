// ---------------------------------------------------------------------------
// OKrunit -- Reassign Approval Request
// ---------------------------------------------------------------------------
// POST: Reassign a pending approval to different approvers
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { logAuditEvent } from "@/lib/api/audit";
import { createAdminClient } from "@/lib/supabase/admin";

const reassignSchema = z.object({
  approval_id: z.string().uuid(),
  assigned_approvers: z.array(z.string().uuid()).min(1).max(10).optional(),
  assigned_team_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  try {
    const auth = await authenticateRequest(request);
    if (auth.type !== "session") {
      throw new ApiError(403, "Session required");
    }

    const body = reassignSchema.parse(await request.json());
    if (!body.assigned_approvers && !body.assigned_team_id) {
      throw new ApiError(400, "Provide assigned_approvers or assigned_team_id");
    }

    const admin = createAdminClient();

    // Verify the request exists, is pending, and belongs to this org
    const { data: approval, error } = await admin
      .from("approval_requests")
      .select("id, status, org_id")
      .eq("id", body.approval_id)
      .eq("org_id", auth.orgId)
      .single();

    if (error || !approval) {
      throw new ApiError(404, "Approval not found");
    }
    if (approval.status !== "pending") {
      throw new ApiError(400, "Can only reassign pending approvals");
    }

    // Update the assignment
    const updateData: Record<string, unknown> = {};
    if (body.assigned_approvers) {
      updateData.assigned_approvers = body.assigned_approvers;
    }
    if (body.assigned_team_id) {
      updateData.assigned_team_id = body.assigned_team_id;
    }

    await admin
      .from("approval_requests")
      .update(updateData)
      .eq("id", body.approval_id);

    await logAuditEvent({
      orgId: auth.orgId,
      userId: auth.user.id,
      action: "approval.reassigned",
      resourceType: "approval_request",
      resourceId: body.approval_id,
      details: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
