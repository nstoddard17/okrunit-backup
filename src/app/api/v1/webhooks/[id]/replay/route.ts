// ---------------------------------------------------------------------------
// OKRunit -- Webhook Replay API: POST (replay a specific delivery)
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { logAuditEvent } from "@/lib/api/audit";
import { deliverCallback, type CallbackParams } from "@/lib/api/callbacks";
import { createAdminClient } from "@/lib/supabase/admin";

// ---- POST /api/v1/webhooks/[id]/replay -----------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // 1. Authenticate -- session only (dashboard users)
    const auth = await authenticateRequest(request);

    if (auth.type !== "session") {
      throw new ApiError(
        403,
        "Only dashboard users can replay webhooks",
        "SESSION_REQUIRED",
      );
    }

    const { id: deliveryId } = await params;
    const orgId = auth.orgId;
    const admin = createAdminClient();

    // 2. Fetch the original delivery log entry
    const { data: delivery, error: deliveryError } = await admin
      .from("webhook_delivery_log")
      .select("*")
      .eq("id", deliveryId)
      .single();

    if (deliveryError || !delivery) {
      throw new ApiError(404, "Webhook delivery not found", "NOT_FOUND");
    }

    // 3. Verify org scope: the delivery's connection must belong to this org
    if (delivery.connection_id) {
      const { data: connection } = await admin
        .from("connections")
        .select("org_id")
        .eq("id", delivery.connection_id)
        .single();

      if (!connection || connection.org_id !== orgId) {
        throw new ApiError(404, "Webhook delivery not found", "NOT_FOUND");
      }
    } else {
      // Verify via the approval request
      const { data: approvalReq } = await admin
        .from("approval_requests")
        .select("org_id")
        .eq("id", delivery.request_id)
        .single();

      if (!approvalReq || approvalReq.org_id !== orgId) {
        throw new ApiError(404, "Webhook delivery not found", "NOT_FOUND");
      }
    }

    // 4. Fetch the original approval to get the current state
    const { data: approval, error: approvalError } = await admin
      .from("approval_requests")
      .select("*")
      .eq("id", delivery.request_id)
      .single();

    if (approvalError || !approval) {
      throw new ApiError(
        404,
        "Associated approval request not found",
        "APPROVAL_NOT_FOUND",
      );
    }

    // 5. Build the callback payload from the current approval state
    const callbackPayload: Record<string, unknown> = {
      id: approval.id,
      status: approval.status,
      decided_by: approval.decided_by,
      decided_at: approval.decided_at,
      decision_comment: approval.decision_comment,
      title: approval.title,
      priority: approval.priority,
      metadata: approval.metadata,
      replayed: true,
      original_delivery_id: deliveryId,
    };

    // 6. Deliver the callback
    const callbackParams: CallbackParams = {
      requestId: approval.id,
      connectionId: delivery.connection_id,
      callbackUrl: delivery.url,
      callbackHeaders: delivery.request_headers as Record<string, string>,
      payload: callbackPayload,
    };

    // We await the delivery here (unlike fire-and-forget in normal flow)
    // so we can return the result to the user.
    await deliverCallback(callbackParams);

    // 7. Fetch the most recent delivery log entry for this replay
    const { data: replayLog } = await admin
      .from("webhook_delivery_log")
      .select("*")
      .eq("request_id", approval.id)
      .eq("url", delivery.url)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    // 8. Audit log
    const ipAddress =
      request.headers.get("x-forwarded-for") ??
      request.headers.get("x-real-ip") ??
      "unknown";

    logAuditEvent({
      orgId,
      userId: auth.user.id,
      action: "webhook.replayed",
      resourceType: "webhook_delivery_log",
      resourceId: deliveryId,
      details: {
        original_delivery_id: deliveryId,
        approval_id: approval.id,
        callback_url: delivery.url,
        replay_success: replayLog?.success ?? false,
      },
      ipAddress,
    });

    return NextResponse.json({
      message: "Webhook replayed",
      original_delivery_id: deliveryId,
      replay_result: replayLog ?? null,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
