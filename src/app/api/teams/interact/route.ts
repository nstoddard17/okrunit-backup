// ---------------------------------------------------------------------------
// OKRunit -- Microsoft Teams Interactive Callback Route
// ---------------------------------------------------------------------------
//
// Receives Action.Submit payloads from Teams Adaptive Cards when a user
// clicks "Approve" or "Reject". Optionally verifies an HMAC signature,
// processes the action, and returns an updated card showing the decision.
//
// Teams sends these as POST requests with JSON body containing the
// action data from the Adaptive Card's Action.Submit.
// ---------------------------------------------------------------------------

import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/api/audit";
import { deliverCallback } from "@/lib/api/callbacks";

// ---------------------------------------------------------------------------
// Signature Verification (optional)
// ---------------------------------------------------------------------------

/**
 * Verify the Teams HMAC signature if TEAMS_SIGNING_SECRET is configured.
 *
 * When set, the caller is expected to send an `X-OKRunit-Signature` header
 * containing `sha256=<hex digest>` computed over the raw body.
 */
function verifyTeamsSignature(
  signingSecret: string,
  rawBody: string,
  expectedSignature: string,
): boolean {
  const computed = `sha256=${createHmac("sha256", signingSecret).update(rawBody).digest("hex")}`;

  const a = Buffer.from(computed, "utf-8");
  const b = Buffer.from(expectedSignature, "utf-8");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build an Adaptive Card message showing the decision result. */
function buildResponseCard(
  title: string,
  decision: string,
  userName: string,
): object {
  const isApproved = decision === "approved";
  const statusEmoji = isApproved ? "\u2705" : "\u274C";
  const statusLabel = isApproved ? "Approved" : "Rejected";

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: `${statusEmoji} ${statusLabel}: **${title}**`,
              wrap: true,
              weight: "Bolder",
            },
            {
              type: "TextBlock",
              text: `by ${userName}`,
              wrap: true,
              isSubtle: true,
              size: "Small",
            },
          ],
        },
      },
    ],
  };
}

/** Build an error Adaptive Card. */
function buildErrorCard(message: string): object {
  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: `\u26A0\uFE0F ${message}`,
              wrap: true,
            },
          ],
        },
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// POST /api/teams/interact
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // 1. Read the raw body.
  const rawBody = await request.text();

  // 2. Verify signature if TEAMS_SIGNING_SECRET is configured.
  const signingSecret = process.env.TEAMS_SIGNING_SECRET;

  if (signingSecret) {
    const signature = request.headers.get("X-OKRunit-Signature") ?? "";

    if (!verifyTeamsSignature(signingSecret, rawBody, signature)) {
      console.warn("[Teams Interact] Invalid signature");
      return NextResponse.json(
        { error: "Invalid request signature" },
        { status: 401 },
      );
    }
  }

  // 3. Parse the JSON payload.
  let payload: {
    type?: string;
    value?: {
      action?: string;
      requestId?: string;
    };
    from?: {
      id?: string;
      name?: string;
    };
  };

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // 4. Extract action data.
  //    Teams Adaptive Card Action.Submit sends the data in `value`.
  //    Bot Framework wraps it further; we support both shapes.
  const actionData = payload.value;

  if (!actionData?.action || !actionData?.requestId) {
    return NextResponse.json({ ok: true, message: "No action to process" });
  }

  const actionType = actionData.action;
  const requestId = actionData.requestId;

  // 5. Determine the decision.
  let decision: "approve" | "reject";
  if (actionType === "approve") {
    decision = "approve";
  } else if (actionType === "reject") {
    decision = "reject";
  } else {
    return NextResponse.json({ ok: true, message: "Unknown action" });
  }

  const teamsUserId = payload.from?.id ?? "unknown";
  const teamsUserName = payload.from?.name ?? "Teams User";

  const admin = createAdminClient();

  // 6. Fetch the approval request.
  const { data: approval, error: fetchError } = await admin
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError || !approval) {
    return NextResponse.json(
      buildErrorCard("Approval request not found. It may have been deleted."),
    );
  }

  // 7. Check that the request is still pending.
  if (approval.status !== "pending") {
    const statusLabel =
      approval.status.charAt(0).toUpperCase() + approval.status.slice(1);

    return NextResponse.json(
      buildErrorCard(
        `This request has already been ${statusLabel.toLowerCase()}. No action taken.`,
      ),
    );
  }

  // 8. Check for lazy expiration.
  if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
    await admin
      .from("approval_requests")
      .update({ status: "expired" })
      .eq("id", approval.id);

    return NextResponse.json(
      buildErrorCard(
        "This request has expired and can no longer be actioned.",
      ),
    );
  }

  // 9. Apply the decision.
  const newStatus = decision === "approve" ? "approved" : "rejected";
  const decidedAt = new Date().toISOString();

  // Try to find a matching user in the org for decided_by.
  const { data: userProfile } = await admin
    .from("user_profiles")
    .select("id")
    .eq("org_id", approval.org_id)
    .limit(1)
    .maybeSingle();

  const decidedBy = userProfile?.id ?? null;

  const { data: updated, error: updateError } = await admin
    .from("approval_requests")
    .update({
      status: newStatus,
      decided_by: decidedBy,
      decided_at: decidedAt,
      decision_source: "teams",
    })
    .eq("id", requestId)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("[Teams Interact] Failed to update approval:", updateError);
    return NextResponse.json(
      buildErrorCard(
        "Failed to process your action. Please try again from the dashboard.",
      ),
    );
  }

  // 10. Audit log (fire-and-forget).
  logAuditEvent({
    orgId: approval.org_id,
    userId: decidedBy ?? undefined,
    action: `approval.${newStatus}`,
    resourceType: "approval_request",
    resourceId: requestId,
    details: {
      decision,
      decision_source: "teams",
      teams_user_id: teamsUserId,
      teams_user_name: teamsUserName,
    },
  });

  // 11. Deliver callback if configured (fire-and-forget).
  if (approval.callback_url) {
    deliverCallback({
      requestId: approval.id,
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

  // 12. Return an updated card that replaces the original.
  return NextResponse.json(
    buildResponseCard(approval.title, newStatus, teamsUserName),
  );
}
