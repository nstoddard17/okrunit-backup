// ---------------------------------------------------------------------------
// OKRunit -- Discord Interaction Callback Route
// ---------------------------------------------------------------------------
//
// Receives interaction payloads from Discord when a user clicks an
// "Approve" or "Reject" button. Verifies the Discord request signature
// (Ed25519), processes the action, and returns an updated message.
//
// Discord sends these as POST requests with JSON body.
//
// Required env vars:
//   DISCORD_PUBLIC_KEY  -- The application's public key for signature verification
//   DISCORD_APP_ID      -- The application ID (optional, for richer responses)
// ---------------------------------------------------------------------------

import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/api/audit";
import { deliverCallback } from "@/lib/api/callbacks";

// ---------------------------------------------------------------------------
// Discord Interaction Types
// ---------------------------------------------------------------------------

/** Discord interaction types. */
const INTERACTION_TYPE = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
} as const;

/** Discord interaction callback types. */
const CALLBACK_TYPE = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  UPDATE_MESSAGE: 7,
} as const;

interface DiscordUser {
  id: string;
  username: string;
  global_name?: string;
  discriminator?: string;
}

interface DiscordInteractionData {
  custom_id: string;
  component_type: number;
}

interface DiscordInteraction {
  type: number;
  data?: DiscordInteractionData;
  user?: DiscordUser;
  member?: { user: DiscordUser };
  message?: {
    embeds?: Array<{
      title?: string;
      description?: string;
    }>;
  };
}

// ---------------------------------------------------------------------------
// Ed25519 Signature Verification
// ---------------------------------------------------------------------------

/**
 * Verify the Discord request signature using Ed25519.
 *
 * @see https://discord.com/developers/docs/interactions/overview#setting-up-an-endpoint-verifying-security-request-headers
 */
async function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string,
): Promise<boolean> {
  try {
    // Import the public key as a CryptoKey for Ed25519 verification.
    const keyBytes = hexToUint8Array(publicKey);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyBytes.buffer as ArrayBuffer,
      { name: "Ed25519" },
      false,
      ["verify"],
    );

    // The message to verify is timestamp + body.
    const message = new TextEncoder().encode(timestamp + body);
    const signatureBytes = hexToUint8Array(signature);

    return await crypto.subtle.verify(
      "Ed25519",
      cryptoKey,
      signatureBytes.buffer as ArrayBuffer,
      message,
    );
  } catch (err) {
    console.error("[Discord Interact] Signature verification error:", err);
    return false;
  }
}

/** Convert a hex string to a Uint8Array. */
function hexToUint8Array(hex: string): Uint8Array {
  const length = hex.length / 2;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map a decision string to a Discord-friendly display string with emoji. */
function decisionEmoji(decision: string): string {
  const map: Record<string, string> = {
    approved: "Approved",
    rejected: "Rejected",
  };
  return map[decision] ?? decision;
}

/** Map a decision to an embed color. */
function decisionColor(decision: string): number {
  const map: Record<string, number> = {
    approved: 0x57f287,  // Green
    rejected: 0xed4245,  // Red
  };
  return map[decision] ?? 0x5865f2;
}

/**
 * Build a response that updates the original message to show the decision.
 */
function buildDecisionResponse(
  title: string,
  decision: string,
  discordUser: string,
): object {
  return {
    type: CALLBACK_TYPE.UPDATE_MESSAGE,
    data: {
      embeds: [
        {
          title: `Request ${decisionEmoji(decision)}`,
          description: `**${title}** was **${decisionEmoji(decision)}** by ${discordUser}`,
          color: decisionColor(decision),
          footer: { text: "OKRunit" },
          timestamp: new Date().toISOString(),
        },
      ],
      components: [], // Remove buttons after action
    },
  };
}

/**
 * Build an error/info response that updates the original message.
 */
function buildInfoResponse(message: string): object {
  return {
    type: CALLBACK_TYPE.UPDATE_MESSAGE,
    data: {
      embeds: [
        {
          description: message,
          color: 0xfee75c, // Yellow for warnings
          footer: { text: "OKRunit" },
        },
      ],
      components: [], // Remove buttons
    },
  };
}

// ---------------------------------------------------------------------------
// POST /api/discord/interact
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  if (!publicKey) {
    console.error("[Discord Interact] DISCORD_PUBLIC_KEY is not set");
    return NextResponse.json(
      { error: "Discord integration is not configured" },
      { status: 500 },
    );
  }

  // 1. Read the raw body.
  const rawBody = await request.text();

  // 2. Verify the Discord request signature (Ed25519).
  const signature = request.headers.get("X-Signature-Ed25519") ?? "";
  const timestamp = request.headers.get("X-Signature-Timestamp") ?? "";

  if (!signature || !timestamp) {
    return NextResponse.json(
      { error: "Missing signature headers" },
      { status: 401 },
    );
  }

  const isValid = await verifyDiscordSignature(
    publicKey,
    signature,
    timestamp,
    rawBody,
  );

  if (!isValid) {
    console.warn("[Discord Interact] Invalid Discord signature");
    return NextResponse.json(
      { error: "Invalid request signature" },
      { status: 401 },
    );
  }

  // 3. Parse the interaction payload.
  let interaction: DiscordInteraction;

  try {
    interaction = JSON.parse(rawBody);
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  // 4. Handle PING (required by Discord for endpoint verification).
  if (interaction.type === INTERACTION_TYPE.PING) {
    return NextResponse.json({ type: CALLBACK_TYPE.PONG });
  }

  // 5. We only handle MESSAGE_COMPONENT (button clicks).
  if (interaction.type !== INTERACTION_TYPE.MESSAGE_COMPONENT) {
    return NextResponse.json({ type: CALLBACK_TYPE.PONG });
  }

  const customId = interaction.data?.custom_id;
  if (!customId) {
    return NextResponse.json({ type: CALLBACK_TYPE.PONG });
  }

  // 6. Parse the custom_id to determine action and request ID.
  //    Format: okrunit:approve:<requestId> or okrunit:reject:<requestId>
  const parts = customId.split(":");
  if (parts.length !== 3 || parts[0] !== "okrunit") {
    // Not our button, just acknowledge.
    return NextResponse.json({ type: CALLBACK_TYPE.PONG });
  }

  const actionStr = parts[1];
  const requestId = parts[2];

  let decision: "approve" | "reject";
  if (actionStr === "approve") {
    decision = "approve";
  } else if (actionStr === "reject") {
    decision = "reject";
  } else {
    return NextResponse.json({ type: CALLBACK_TYPE.PONG });
  }

  // Resolve the Discord user from the interaction.
  const discordUser =
    interaction.member?.user ?? interaction.user;
  const discordUserId = discordUser?.id ?? "unknown";
  const discordUsername =
    discordUser?.global_name ?? discordUser?.username ?? "Discord User";

  const admin = createAdminClient();

  // 7. Fetch the approval request.
  const { data: approval, error: fetchError } = await admin
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError || !approval) {
    return NextResponse.json(
      buildInfoResponse(
        "Approval request not found. It may have been deleted.",
      ),
    );
  }

  // 8. Check that the request is still pending.
  if (approval.status !== "pending") {
    const statusLabel =
      approval.status.charAt(0).toUpperCase() + approval.status.slice(1);

    return NextResponse.json(
      buildInfoResponse(
        `This request has already been **${statusLabel.toLowerCase()}**. No action taken.`,
      ),
    );
  }

  // 9. Check for lazy expiration.
  if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
    await admin
      .from("approval_requests")
      .update({ status: "expired" })
      .eq("id", approval.id);

    return NextResponse.json(
      buildInfoResponse(
        "This request has expired and can no longer be actioned.",
      ),
    );
  }

  // 10. Apply the decision.
  const newStatus = decision === "approve" ? "approved" : "rejected";
  const decidedAt = new Date().toISOString();

  // Try to find the Discord user in our user_profiles by matching within
  // the org. If not found, we use a null decided_by and record the Discord
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
      decision_source: "discord",
    })
    .eq("id", requestId)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("[Discord Interact] Failed to update approval:", updateError);
    return NextResponse.json(
      buildInfoResponse(
        "Failed to process your action. Please try again from the dashboard.",
      ),
    );
  }

  // 11. Audit log (fire-and-forget).
  logAuditEvent({
    orgId: approval.org_id,
    userId: decidedBy ?? undefined,
    action: `approval.${newStatus}`,
    resourceType: "approval_request",
    resourceId: requestId,
    details: {
      decision,
      decision_source: "discord",
      discord_user_id: discordUserId,
      discord_username: discordUsername,
    },
  });

  // 12. Deliver callback if configured (fire-and-forget).
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

  // 13. Return an updated Discord message that replaces the original.
  return NextResponse.json(
    buildDecisionResponse(approval.title, newStatus, discordUsername),
  );
}
