// ---------------------------------------------------------------------------
// OKRunit -- Approval Comments API: GET (list) + POST (create)
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";
import { z } from "zod";

import { authenticateRequest } from "@/lib/api/auth";
import { ApiError, errorResponse } from "@/lib/api/errors";
import { createCommentSchema } from "@/lib/api/validation";
import { logAuditEvent } from "@/lib/api/audit";
import { getClientIp } from "@/lib/api/ip-rate-limiter";
import { dispatchNotifications } from "@/lib/notifications/orchestrator";
import { createAdminClient } from "@/lib/supabase/admin";

// ---- GET /api/v1/approvals/[id]/comments ----------------------------------

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Authenticate (both API key and session supported)
    const auth = await authenticateRequest(request);
    const admin = createAdminClient();

    // 2. Verify the approval exists and belongs to the org
    const { data: approval, error: approvalError } = await admin
      .from("approval_requests")
      .select("id")
      .eq("id", id)
      .eq("org_id", auth.orgId)
      .single();

    if (approvalError || !approval) {
      throw new ApiError(404, "Approval request not found", "NOT_FOUND");
    }

    // 3. Fetch comments ordered chronologically
    const { data: comments, error: commentsError } = await admin
      .from("approval_comments")
      .select("*")
      .eq("request_id", id)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("[Comments] Failed to fetch comments:", commentsError);
      throw new ApiError(500, "Failed to fetch comments");
    }

    return NextResponse.json({ data: comments });
  } catch (error) {
    return errorResponse(error);
  }
}

// ---- POST /api/v1/approvals/[id]/comments ---------------------------------

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    // 1. Authenticate (both API key and session supported)
    const auth = await authenticateRequest(request);

    // 2. Validate request body
    const body = await request.json();
    const validated = createCommentSchema.parse(body);

    const admin = createAdminClient();

    // 3. Verify the approval exists and belongs to the org
    const { data: approval, error: approvalError } = await admin
      .from("approval_requests")
      .select("id, title, priority, connection_id, source, action_type")
      .eq("id", id)
      .eq("org_id", auth.orgId)
      .single();

    if (approvalError || !approval) {
      throw new ApiError(404, "Approval request not found", "NOT_FOUND");
    }

    // 4. Insert the comment
    const { data: comment, error: insertError } = await admin
      .from("approval_comments")
      .insert({
        request_id: id,
        body: validated.body,
        user_id: auth.type === "session" ? auth.user.id : null,
        connection_id: auth.type === "api_key" ? auth.connection.id : null,
      })
      .select("*")
      .single();

    if (insertError || !comment) {
      console.error("[Comments] Failed to insert comment:", insertError);
      throw new ApiError(500, "Failed to create comment");
    }

    // 5. Audit log
    logAuditEvent({
      orgId: auth.orgId,
      userId: auth.type === "session" ? auth.user.id : undefined,
      connectionId: auth.type === "api_key" ? auth.connection.id : undefined,
      action: "comment.created",
      resourceType: "approval_comment",
      resourceId: comment.id,
      ipAddress: getClientIp(request),
      details: {
        request_id: id,
      },
    });

    // 6. Dispatch comment notification (fire and forget)
    dispatchNotifications({
      type: "approval.comment",
      orgId: auth.orgId,
      requestId: id,
      requestTitle: approval.title,
      requestPriority: approval.priority,
      connectionId: approval.connection_id ?? undefined,
      source: approval.source ?? undefined,
      actionType: approval.action_type ?? undefined,
      decidedBy: auth.type === "session" ? auth.user.id : undefined,
    }).catch((err) => {
      console.error("[Comments] Failed to dispatch notification:", err);
    });

    return NextResponse.json(comment, { status: 201 });
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
