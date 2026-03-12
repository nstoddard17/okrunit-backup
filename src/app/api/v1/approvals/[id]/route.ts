// ---------------------------------------------------------------------------
// Gatekeeper -- Approvals API: GET (single) + PATCH (respond) + DELETE (cancel)
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { respondApprovalSchema } from "@/lib/api/validation";
import { logAuditEvent } from "@/lib/api/audit";
import { deliverCallback } from "@/lib/api/callbacks";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchNotifications } from "@/lib/notifications/orchestrator";

// ---- Helpers --------------------------------------------------------------

function getIpAddress(request: Request): string {
  return (
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

/**
 * Fetch a single approval by id scoped to the org. Throws 404 if not found.
 */
async function fetchApproval(
  admin: ReturnType<typeof createAdminClient>,
  id: string,
  orgId: string,
) {
  const { data: approval, error } = await admin
    .from("approval_requests")
    .select("*")
    .eq("id", id)
    .eq("org_id", orgId)
    .single();

  if (error || !approval) {
    throw new ApiError(404, "Approval request not found", "NOT_FOUND");
  }

  return approval;
}

/**
 * Lazy expiration check. If the approval is pending and past its expiry time,
 * update its status to expired and throw a 409 (or return the updated record).
 * Returns true if the approval was expired.
 */
async function checkAndExpire(
  admin: ReturnType<typeof createAdminClient>,
  approval: { id: string; status: string; expires_at: string | null },
): Promise<boolean> {
  if (
    approval.status === "pending" &&
    approval.expires_at &&
    approval.expires_at < new Date().toISOString()
  ) {
    await admin
      .from("approval_requests")
      .update({ status: "expired" })
      .eq("id", approval.id);

    return true;
  }
  return false;
}

// ---- GET /api/v1/approvals/[id] -------------------------------------------

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Authenticate (both types)
    const auth = await authenticateRequest(request);
    const admin = createAdminClient();

    // 2. Fetch single approval
    const approval = await fetchApproval(admin, id, auth.orgId);

    // 3. Lazy expiration check
    const expired = await checkAndExpire(admin, approval);
    if (expired) {
      return NextResponse.json(
        { ...approval, status: "expired" },
      );
    }

    return NextResponse.json(approval);
  } catch (error) {
    return errorResponse(error);
  }
}

// ---- PATCH /api/v1/approvals/[id] -----------------------------------------

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Authenticate -- session auth only
    const auth = await authenticateRequest(request);

    if (auth.type !== "session") {
      throw new ApiError(
        403,
        "Only dashboard users can respond to approvals",
        "SESSION_REQUIRED",
      );
    }

    // 1b. Check approval permission
    if (!auth.membership.can_approve) {
      throw new ApiError(
        403,
        "You do not have approval permissions",
        "NOT_APPROVER",
      );
    }

    const actorId = auth.user.id;

    // 2. Validate body
    const body = await request.json();
    const validated = respondApprovalSchema.parse(body);

    const admin = createAdminClient();

    // 3. Fetch the approval
    const approval = await fetchApproval(admin, id, auth.orgId);

    // 4. Check status is pending
    if (approval.status !== "pending") {
      throw new ApiError(
        409,
        "Approval is not pending",
        "NOT_PENDING",
      );
    }

    // 5. Lazy expiration check
    const expired = await checkAndExpire(admin, approval);
    if (expired) {
      throw new ApiError(409, "Approval has expired", "EXPIRED");
    }

    // 5b. If assigned_approvers is set, enforce that only listed users can decide
    const assignedApprovers: string[] | null = approval.assigned_approvers;
    if (assignedApprovers && assignedApprovers.length > 0) {
      if (!assignedApprovers.includes(actorId)) {
        throw new ApiError(
          403,
          "You are not an assigned approver for this request",
          "NOT_ASSIGNED_APPROVER",
        );
      }
    }

    // 6. Determine if this is a multi-approver workflow
    const isMultiApprover = approval.required_approvals > 1;

    if (isMultiApprover) {
      // ---- Multi-approver flow ------------------------------------------------

      // 6a. Check for duplicate votes (UNIQUE constraint: request_id + user_id)
      const { data: existingVote } = await admin
        .from("approval_votes")
        .select("id")
        .eq("request_id", id)
        .eq("user_id", actorId)
        .maybeSingle();

      if (existingVote) {
        throw new ApiError(
          409,
          "You have already voted on this request",
          "DUPLICATE_VOTE",
        );
      }

      // 6b. Insert the vote
      const { error: voteError } = await admin
        .from("approval_votes")
        .insert({
          request_id: id,
          user_id: actorId,
          vote: validated.decision,
          comment: validated.comment ?? null,
          source: (validated.source as "dashboard" | "email" | "slack" | "push" | "api") ?? "dashboard",
        });

      if (voteError) {
        // Handle unique constraint violation gracefully
        if (voteError.code === "23505") {
          throw new ApiError(
            409,
            "You have already voted on this request",
            "DUPLICATE_VOTE",
          );
        }
        console.error("[Approvals] Vote insert failed:", voteError);
        throw new ApiError(500, "Failed to record vote");
      }

      // 6c. Determine final outcome
      const decidedAt = new Date().toISOString();
      const ipAddress = getIpAddress(request);
      let updated: typeof approval;

      if (validated.decision === "reject") {
        // Any rejection immediately rejects the entire request
        const { data: rejectedData, error: rejectError } = await admin
          .from("approval_requests")
          .update({
            status: "rejected",
            decided_by: actorId,
            decided_at: decidedAt,
            decision_comment: validated.comment ?? null,
            decision_source: validated.source ?? "dashboard",
          })
          .eq("id", id)
          .select("*")
          .single();

        if (rejectError || !rejectedData) {
          console.error("[Approvals] Reject update failed:", rejectError);
          throw new ApiError(500, "Failed to update approval request");
        }

        updated = rejectedData;
      } else {
        // Approve vote: increment current_approvals
        const newCurrentApprovals = approval.current_approvals + 1;
        const thresholdMet = newCurrentApprovals >= approval.required_approvals;

        const updatePayload: Record<string, unknown> = {
          current_approvals: newCurrentApprovals,
        };

        if (thresholdMet) {
          updatePayload.status = "approved";
          updatePayload.decided_by = actorId;
          updatePayload.decided_at = decidedAt;
          updatePayload.decision_comment = validated.comment ?? null;
          updatePayload.decision_source = validated.source ?? "dashboard";
        }

        const { data: approvedData, error: approveError } = await admin
          .from("approval_requests")
          .update(updatePayload)
          .eq("id", id)
          .select("*")
          .single();

        if (approveError || !approvedData) {
          console.error("[Approvals] Approve update failed:", approveError);
          throw new ApiError(500, "Failed to update approval request");
        }

        updated = approvedData;
      }

      // 6d. Audit log for the vote
      logAuditEvent({
        orgId: auth.orgId,
        userId: actorId,
        action: `approval.vote.${validated.decision}`,
        resourceType: "approval_request",
        resourceId: id,
        details: {
          decision: validated.decision,
          comment: validated.comment ?? null,
          source: validated.source ?? "dashboard",
          current_approvals: updated.current_approvals,
          required_approvals: updated.required_approvals,
          final_status: updated.status,
        },
        ipAddress,
      });

      // 6e. Callback delivery + notifications only when a final decision is reached
      if (updated.status !== "pending") {
        if (approval.callback_url) {
          deliverCallback({
            requestId: id,
            connectionId: approval.connection_id,
            callbackUrl: approval.callback_url,
            callbackHeaders:
              (approval.callback_headers as Record<string, string>) ?? undefined,
            payload: {
              id: updated.id,
              status: updated.status,
              decided_by: updated.decided_by,
              decided_at: updated.decided_at,
              decision_comment: updated.decision_comment,
              title: updated.title,
              priority: updated.priority,
              metadata: updated.metadata,
            },
          });
        }

        dispatchNotifications({
          type: updated.status === "approved" ? "approval.approved" : "approval.rejected",
          orgId: auth.orgId,
          requestId: id,
          requestTitle: updated.title,
          requestPriority: updated.priority,
          connectionId: approval.connection_id,
          decidedBy: actorId,
          decisionComment: validated.comment,
        });
      }

      return NextResponse.json(updated);
    }

    // ---- Single-approver flow (default, required_approvals === 1) ----------

    // 6. Update the approval
    const decidedAt = new Date().toISOString();
    const newStatus = validated.decision === "approve" ? "approved" : "rejected";

    const { data: updated, error: updateError } = await admin
      .from("approval_requests")
      .update({
        status: newStatus,
        decided_by: actorId,
        decided_at: decidedAt,
        decision_comment: validated.comment ?? null,
        decision_source: validated.source ?? "dashboard",
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("[Approvals] Update failed:", updateError);
      throw new ApiError(500, "Failed to update approval request");
    }

    // 7. Audit log
    const ipAddress = getIpAddress(request);

    logAuditEvent({
      orgId: auth.orgId,
      userId: actorId,
      action: `approval.${newStatus}`,
      resourceType: "approval_request",
      resourceId: id,
      details: {
        decision: validated.decision,
        comment: validated.comment ?? null,
        source: validated.source ?? "dashboard",
      },
      ipAddress,
    });

    // 8. Callback delivery
    if (approval.callback_url) {
      deliverCallback({
        requestId: id,
        connectionId: approval.connection_id,
        callbackUrl: approval.callback_url,
        callbackHeaders:
          (approval.callback_headers as Record<string, string>) ?? undefined,
        payload: {
          id: updated.id,
          status: updated.status,
          decided_by: updated.decided_by,
          decided_at: updated.decided_at,
          decision_comment: updated.decision_comment,
          title: updated.title,
          priority: updated.priority,
          metadata: updated.metadata,
        },
      });
    }

    // 9. Dispatch notifications
    dispatchNotifications({
      type: newStatus === "approved" ? "approval.approved" : "approval.rejected",
      orgId: auth.orgId,
      requestId: id,
      requestTitle: updated.title,
      requestPriority: updated.priority,
      connectionId: approval.connection_id,
      decidedBy: actorId,
      decisionComment: validated.comment,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 },
      );
    }
    return errorResponse(error);
  }
}

// ---- DELETE /api/v1/approvals/[id] ----------------------------------------

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Authenticate -- session auth only
    const auth = await authenticateRequest(request);

    if (auth.type !== "session") {
      throw new ApiError(
        403,
        "Only dashboard users can cancel approvals",
        "SESSION_REQUIRED",
      );
    }

    const deleteActorId = auth.user.id;
    const admin = createAdminClient();

    // 2. Fetch approval
    const approval = await fetchApproval(admin, id, auth.orgId);

    // 3. Check status is pending
    if (approval.status !== "pending") {
      throw new ApiError(
        409,
        "Approval is not pending",
        "NOT_PENDING",
      );
    }

    // 4. Update status to cancelled
    const { data: updated, error: updateError } = await admin
      .from("approval_requests")
      .update({ status: "cancelled" })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError || !updated) {
      console.error("[Approvals] Cancel failed:", updateError);
      throw new ApiError(500, "Failed to cancel approval request");
    }

    // 5. Audit log
    const ipAddress = getIpAddress(request);

    logAuditEvent({
      orgId: auth.orgId,
      userId: deleteActorId,
      action: "approval.cancelled",
      resourceType: "approval_request",
      resourceId: id,
      ipAddress,
    });

    // 6. Callback delivery
    if (approval.callback_url) {
      deliverCallback({
        requestId: id,
        connectionId: approval.connection_id,
        callbackUrl: approval.callback_url,
        callbackHeaders:
          (approval.callback_headers as Record<string, string>) ?? undefined,
        payload: {
          id: updated.id,
          status: updated.status,
          decided_by: null,
          decided_at: null,
          decision_comment: null,
          title: updated.title,
          priority: updated.priority,
          metadata: updated.metadata,
        },
      });
    }

    // 7. Dispatch notifications
    dispatchNotifications({
      type: "approval.cancelled",
      orgId: auth.orgId,
      requestId: id,
      requestTitle: updated.title,
      requestPriority: updated.priority,
      connectionId: approval.connection_id,
      decidedBy: deleteActorId,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
