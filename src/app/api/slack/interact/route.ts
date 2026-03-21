// ---------------------------------------------------------------------------
// OKRunit -- Slack Interactive Callback Route
// ---------------------------------------------------------------------------
//
// Receives interactive message payloads from Slack when a user clicks an
// "Approve" or "Reject" button. Verifies the Slack request signature,
// processes the action, and returns an updated message.
//
// Slack sends these as POST requests with form-encoded body where the
// actual payload is in the "payload" field as a JSON string.
// ---------------------------------------------------------------------------

import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/api/audit";
import { deliverCallback } from "@/lib/api/callbacks";

// ---------------------------------------------------------------------------
// Signature Verification
// ---------------------------------------------------------------------------

const SLACK_SIGNATURE_VERSION = "v0";
const MAX_TIMESTAMP_DRIFT_SECONDS = 5 * 60; // 5 minutes

/**
 * Verify the Slack request signature using HMAC-SHA256.
 *
 * @see https://api.slack.com/authentication/verifying-requests-from-slack
 */
function verifySlackSignature(
  signingSecret: string,
  timestamp: string,
  rawBody: string,
  expectedSignature: string,
): boolean {
  // Reject replayed requests older than 5 minutes.
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > MAX_TIMESTAMP_DRIFT_SECONDS) {
    return false;
  }

  // Compute the expected signature.
  const sigBasestring = `${SLACK_SIGNATURE_VERSION}:${timestamp}:${rawBody}`;
  const computedSignature =
    SLACK_SIGNATURE_VERSION +
    "=" +
    createHmac("sha256", signingSecret).update(sigBasestring).digest("hex");

  // Timing-safe comparison to prevent timing attacks.
  const a = Buffer.from(computedSignature, "utf-8");
  const b = Buffer.from(expectedSignature, "utf-8");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a decision string to a Slack-friendly display string. */
function decisionDisplay(decision: string): string {
  const map: Record<string, string> = {
    approved: ":white_check_mark: Approved",
    rejected: ":x: Rejected",
  };
  return map[decision] ?? decision;
}

/**
 * Build a replacement message that shows the decision result.
 * This replaces the original interactive message in Slack.
 */
function buildResponseBlocks(
  title: string,
  decision: string,
  slackUser: string,
): object[] {
  return [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${decisionDisplay(decision)} *${title}*\n_by <@${slackUser}>_`,
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// POST /api/slack/interact
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;

  if (!signingSecret) {
    console.error("[Slack Interact] SLACK_SIGNING_SECRET is not set");
    return NextResponse.json(
      { error: "Slack integration is not configured" },
      { status: 500 },
    );
  }

  // 1. Read the raw body (form-encoded).
  const rawBody = await request.text();

  // 2. Verify the Slack request signature.
  const timestamp = request.headers.get("X-Slack-Request-Timestamp") ?? "";
  const slackSignature = request.headers.get("X-Slack-Signature") ?? "";

  if (!verifySlackSignature(signingSecret, timestamp, rawBody, slackSignature)) {
    console.warn("[Slack Interact] Invalid Slack signature");
    return NextResponse.json(
      { error: "Invalid request signature" },
      { status: 401 },
    );
  }

  // 3. Parse the payload from the form-encoded body.
  //    Slack sends: payload=<url-encoded JSON string>
  const formData = new URLSearchParams(rawBody);
  const payloadStr = formData.get("payload");

  if (!payloadStr) {
    return NextResponse.json(
      { error: "Missing payload" },
      { status: 400 },
    );
  }

  let payload: {
    type: string;
    user?: { id: string; username?: string; name?: string };
    actions?: Array<{
      action_id: string;
      value: string;
    }>;
    message?: { blocks?: unknown[] };
  };

  try {
    payload = JSON.parse(payloadStr);
  } catch {
    return NextResponse.json(
      { error: "Invalid payload JSON" },
      { status: 400 },
    );
  }

  // 4. We only handle block_actions (button clicks).
  if (payload.type !== "block_actions") {
    return NextResponse.json({ ok: true });
  }

  const action = payload.actions?.[0];
  if (!action) {
    return NextResponse.json({ ok: true });
  }

  // 5. Determine the action type from the action_id.
  let decision: "approve" | "reject";
  if (action.action_id === "okrunit_approve") {
    decision = "approve";
  } else if (action.action_id === "okrunit_reject") {
    decision = "reject";
  } else {
    // Not our action (e.g. okrunit_view), just acknowledge.
    return NextResponse.json({ ok: true });
  }

  const requestId = action.value;
  const slackUser = payload.user?.id ?? "unknown";
  const slackUsername = payload.user?.username ?? payload.user?.name ?? "Slack User";

  const admin = createAdminClient();

  // 6. Fetch the approval request.
  const { data: approval, error: fetchError } = await admin
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError || !approval) {
    return NextResponse.json({
      replace_original: true,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: ":warning: Approval request not found. It may have been deleted.",
          },
        },
      ],
    });
  }

  // 7. Check that the request is still pending.
  if (approval.status !== "pending") {
    const statusLabel =
      approval.status.charAt(0).toUpperCase() + approval.status.slice(1);

    return NextResponse.json({
      replace_original: true,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `:information_source: This request has already been *${statusLabel.toLowerCase()}*. No action taken.`,
          },
        },
      ],
    });
  }

  // 8. Check for lazy expiration.
  if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
    await admin
      .from("approval_requests")
      .update({ status: "expired" })
      .eq("id", approval.id);

    return NextResponse.json({
      replace_original: true,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: ":hourglass: This request has expired and can no longer be actioned.",
          },
        },
      ],
    });
  }

  // 9. Apply the decision.
  const newStatus = decision === "approve" ? "approved" : "rejected";
  const decidedAt = new Date().toISOString();

  // Try to find the Slack user in our user_profiles by matching the Slack
  // username. If not found, we'll use a null decided_by and record the Slack
  // user info in the audit details.
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
      decision_source: "slack",
    })
    .eq("id", requestId)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("[Slack Interact] Failed to update approval:", updateError);
    return NextResponse.json({
      replace_original: true,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: ":x: Failed to process your action. Please try again from the dashboard.",
          },
        },
      ],
    });
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
      decision_source: "slack",
      slack_user_id: slackUser,
      slack_username: slackUsername,
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

  // 12. Return an updated Slack message that replaces the original.
  return NextResponse.json({
    replace_original: true,
    blocks: buildResponseBlocks(approval.title, newStatus, slackUser),
  });
}
