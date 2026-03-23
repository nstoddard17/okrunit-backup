// ---------------------------------------------------------------------------
// OKRunit -- Telegram Webhook Route
// ---------------------------------------------------------------------------
//
// Receives callback_query and message updates from Telegram.
//
// Flow:
//   1. User clicks Approve/Reject button (callback_query)
//   2. Bot asks "Would you like to add a reason?" with "Type a reason" / "Skip"
//   3a. If "Type a reason": bot asks user to reply with their reason
//   3b. If "Skip": decision is applied immediately
//   4. When user replies with text, the decision is applied with that comment
//
// Callback data formats:
//   okrunit:approve:<requestId>     -- Initial approve button
//   okrunit:reject:<requestId>      -- Initial reject button
//   okrunit:confirm:<action>:<requestId>  -- Skip / apply without reason
//   okrunit:reason:<action>:<requestId>   -- User wants to type a reason
//
// Webhook URL should be registered via:
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/telegram/webhook&allowed_updates=["callback_query","message"]
// ---------------------------------------------------------------------------

import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/api/audit";
import { deliverCallback } from "@/lib/api/callbacks";
import { isRejectionReasonRequired } from "@/lib/api/rejection-reason";
import {
  answerCallbackQuery,
  editMessage,
} from "@/lib/notifications/channels/telegram";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
    type: string;
  };
  from?: TelegramUser;
  text?: string;
  reply_to_message?: TelegramMessage;
}

interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

interface TelegramUpdate {
  update_id: number;
  callback_query?: TelegramCallbackQuery;
  message?: TelegramMessage;
}

// ---------------------------------------------------------------------------
// In-memory store for pending reason prompts
// ---------------------------------------------------------------------------
//
// Maps "chatId:userId" to { action, requestId, botMessageId } so we can
// associate a text reply with a pending decision. Entries expire after 10
// minutes. In a multi-instance deployment this would need Redis or similar,
// but for a single Vercel serverless function (or small-scale use) the
// in-memory map is sufficient since Telegram retries on failure.
// ---------------------------------------------------------------------------

interface PendingReason {
  action: "approve" | "reject";
  requestId: string;
  botMessageId: number;
  expiresAt: number;
}

const pendingReasons = new Map<string, PendingReason>();

const PENDING_REASON_TTL_MS = 10 * 60 * 1000; // 10 minutes

function pendingKey(chatId: number, userId: number): string {
  return `${chatId}:${userId}`;
}

function cleanExpired(): void {
  const now = Date.now();
  for (const [key, value] of pendingReasons) {
    if (value.expiresAt < now) {
      pendingReasons.delete(key);
    }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Escape special characters for Telegram MarkdownV2. */
function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

/**
 * Verify the Telegram webhook secret token if TELEGRAM_WEBHOOK_SECRET is
 * configured.
 */
function verifyTelegramSecret(
  expectedSecret: string,
  headerSecret: string,
): boolean {
  const a = Buffer.from(expectedSecret, "utf-8");
  const b = Buffer.from(headerSecret, "utf-8");

  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Build the display name from a Telegram user. */
function telegramDisplayName(user: TelegramUser): string {
  if (user.username) return `@${user.username}`;
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.join(" ") || `User ${user.id}`;
}

// ---------------------------------------------------------------------------
// Core: Apply the decision to the approval request
// ---------------------------------------------------------------------------

async function applyDecision(params: {
  decision: "approve" | "reject";
  requestId: string;
  telegramUser: TelegramUser;
  chatId?: number;
  messageId?: number;
  comment?: string;
}): Promise<void> {
  const { decision, requestId, telegramUser, chatId, messageId, comment } =
    params;
  const telegramUserName = telegramDisplayName(telegramUser);
  const admin = createAdminClient();

  // Fetch the approval request.
  const { data: approval, error: fetchError } = await admin
    .from("approval_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError || !approval) {
    if (chatId && messageId) {
      await editMessage(
        String(chatId),
        messageId,
        escapeMarkdownV2(
          "\u26A0\uFE0F Approval request not found. It may have been deleted.",
        ),
      );
    }
    return;
  }

  // Check that the request is still pending.
  if (approval.status !== "pending") {
    if (chatId && messageId) {
      await editMessage(
        String(chatId),
        messageId,
        escapeMarkdownV2(
          `\u2139\uFE0F This request has already been ${approval.status}. No action taken.`,
        ),
      );
    }
    return;
  }

  // Check for lazy expiration.
  if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
    await admin
      .from("approval_requests")
      .update({ status: "expired" })
      .eq("id", approval.id);

    if (chatId && messageId) {
      await editMessage(
        String(chatId),
        messageId,
        escapeMarkdownV2(
          "\u231B This request has expired and can no longer be actioned.",
        ),
      );
    }
    return;
  }

  // Apply the decision.
  const newStatus = decision === "approve" ? "approved" : "rejected";
  const decidedAt = new Date().toISOString();

  const { data: userProfile } = await admin
    .from("user_profiles")
    .select("id")
    .eq("org_id", approval.org_id)
    .limit(1)
    .maybeSingle();

  const decidedBy = userProfile?.id ?? null;

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    decided_by: decidedBy,
    decided_at: decidedAt,
    decision_source: "telegram",
  };

  if (comment) {
    updatePayload.decision_comment = comment;
  }

  const { data: updated, error: updateError } = await admin
    .from("approval_requests")
    .update(updatePayload)
    .eq("id", requestId)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error(
      "[Telegram Webhook] Failed to update approval:",
      updateError,
    );
    return;
  }

  // Audit log (fire-and-forget).
  logAuditEvent({
    orgId: approval.org_id,
    userId: decidedBy ?? undefined,
    action: `approval.${newStatus}`,
    resourceType: "approval_request",
    resourceId: requestId,
    details: {
      decision,
      decision_source: "telegram",
      decision_comment: comment ?? null,
      telegram_user_id: telegramUser.id,
      telegram_username: telegramUser.username ?? null,
      telegram_display_name: telegramUserName,
    },
  });

  // Deliver callback if configured (fire-and-forget).
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

  // Edit the original message to show the result.
  if (chatId && messageId) {
    const statusEmoji = newStatus === "approved" ? "\u2705" : "\u274C";
    const statusLabel = newStatus === "approved" ? "Approved" : "Rejected";

    const commentLine = comment
      ? `\n${escapeMarkdownV2(`Reason: ${comment}`)}`
      : "";

    const updatedText = [
      `${escapeMarkdownV2(`${statusEmoji} ${statusLabel}`)}: *${escapeMarkdownV2(approval.title)}*`,
      `${escapeMarkdownV2(`by ${telegramUserName}`)}${commentLine}`,
    ].join("\n");

    await editMessage(String(chatId), messageId, updatedText);
  }
}

// ---------------------------------------------------------------------------
// POST /api/telegram/webhook
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    console.error("[Telegram Webhook] TELEGRAM_BOT_TOKEN is not set");
    return NextResponse.json(
      { error: "Telegram integration is not configured" },
      { status: 500 },
    );
  }

  // 1. Verify the webhook secret if configured.
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (webhookSecret) {
    const headerSecret =
      request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";

    if (!verifyTelegramSecret(webhookSecret, headerSecret)) {
      console.warn("[Telegram Webhook] Invalid webhook secret");
      return NextResponse.json(
        { error: "Invalid webhook secret" },
        { status: 401 },
      );
    }
  }

  // 2. Parse the update payload.
  let update: TelegramUpdate;

  try {
    update = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  // Clean up expired pending reasons periodically.
  cleanExpired();

  // ---------------------------------------------------------------------------
  // Handle text message replies (user typing a reason)
  // ---------------------------------------------------------------------------
  if (update.message && !update.callback_query) {
    const msg = update.message;
    const fromUser = msg.from;

    if (!fromUser || !msg.text) {
      return NextResponse.json({ ok: true });
    }

    const key = pendingKey(msg.chat.id, fromUser.id);
    const pending = pendingReasons.get(key);

    if (!pending) {
      // Not a reply we're expecting -- ignore.
      return NextResponse.json({ ok: true });
    }

    // We have a pending reason prompt for this user in this chat.
    pendingReasons.delete(key);

    await applyDecision({
      decision: pending.action,
      requestId: pending.requestId,
      telegramUser: fromUser,
      chatId: msg.chat.id,
      messageId: pending.botMessageId,
      comment: msg.text,
    });

    return NextResponse.json({ ok: true });
  }

  // ---------------------------------------------------------------------------
  // Handle callback_query (button presses)
  // ---------------------------------------------------------------------------
  const callbackQuery = update.callback_query;

  if (!callbackQuery) {
    return NextResponse.json({ ok: true });
  }

  const callbackData = callbackQuery.data;
  if (!callbackData) {
    return NextResponse.json({ ok: true });
  }

  const parts = callbackData.split(":");
  if (parts[0] !== "okrunit" || parts.length < 3) {
    await answerCallbackQuery(callbackQuery.id, "Unknown action");
    return NextResponse.json({ ok: true });
  }

  const telegramUser = callbackQuery.from;
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;

  // -------------------------------------------------------------------------
  // Case 1: Initial approve/reject button press
  // Format: okrunit:approve:<requestId> or okrunit:reject:<requestId>
  // -------------------------------------------------------------------------
  if (
    parts.length === 3 &&
    (parts[1] === "approve" || parts[1] === "reject")
  ) {
    const action = parts[1] as "approve" | "reject";
    const requestId = parts[2];

    // Validate the request exists and is still pending before prompting.
    const admin = createAdminClient();
    const { data: approval, error: fetchError } = await admin
      .from("approval_requests")
      .select("id, status, expires_at, org_id, require_rejection_reason, priority, title")
      .eq("id", requestId)
      .single();

    if (fetchError || !approval) {
      await answerCallbackQuery(
        callbackQuery.id,
        "Approval request not found.",
      );
      if (chatId && messageId) {
        await editMessage(
          String(chatId),
          messageId,
          escapeMarkdownV2(
            "\u26A0\uFE0F Approval request not found. It may have been deleted.",
          ),
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (approval.status !== "pending") {
      await answerCallbackQuery(
        callbackQuery.id,
        `Already ${approval.status}. No action taken.`,
      );
      if (chatId && messageId) {
        await editMessage(
          String(chatId),
          messageId,
          escapeMarkdownV2(
            `\u2139\uFE0F This request has already been ${approval.status}. No action taken.`,
          ),
        );
      }
      return NextResponse.json({ ok: true });
    }

    if (
      approval.expires_at &&
      new Date(approval.expires_at) < new Date()
    ) {
      await admin
        .from("approval_requests")
        .update({ status: "expired" })
        .eq("id", approval.id);

      await answerCallbackQuery(
        callbackQuery.id,
        "This request has expired.",
      );
      if (chatId && messageId) {
        await editMessage(
          String(chatId),
          messageId,
          escapeMarkdownV2(
            "\u231B This request has expired and can no longer be actioned.",
          ),
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Check if rejection reason is required.
    const reasonRequired =
      action === "reject" &&
      (await isRejectionReasonRequired(approval.org_id, {
        require_rejection_reason: approval.require_rejection_reason,
        priority: approval.priority,
      }));

    // Build the "add a reason?" prompt with buttons.
    const actionLabel = action === "approve" ? "approval" : "rejection";
    const promptText = escapeMarkdownV2(
      `Would you like to add a reason for your ${actionLabel} of "${approval.title}"?`,
    );

    const buttons: Array<{ text: string; callback_data: string }> = [
      {
        text: "Type a reason",
        callback_data: `okrunit:reason:${action}:${requestId}`,
      },
    ];

    // Only show "Skip" if reason is not required.
    if (!reasonRequired) {
      buttons.push({
        text: "Skip",
        callback_data: `okrunit:confirm:${action}:${requestId}`,
      });
    }

    await answerCallbackQuery(callbackQuery.id, "");

    if (chatId && messageId) {
      await editMessage(String(chatId), messageId, promptText, {
        inline_keyboard: [buttons],
      });
    }

    return NextResponse.json({ ok: true });
  }

  // -------------------------------------------------------------------------
  // Case 2: "Skip" -- apply without reason
  // Format: okrunit:confirm:<action>:<requestId>
  // -------------------------------------------------------------------------
  if (parts.length === 4 && parts[1] === "confirm") {
    const action = parts[2] as "approve" | "reject";
    const requestId = parts[3];

    await answerCallbackQuery(
      callbackQuery.id,
      action === "approve" ? "Approved!" : "Rejected!",
    );

    await applyDecision({
      decision: action,
      requestId,
      telegramUser,
      chatId,
      messageId,
    });

    return NextResponse.json({ ok: true });
  }

  // -------------------------------------------------------------------------
  // Case 3: "Type a reason" -- prompt user to reply with text
  // Format: okrunit:reason:<action>:<requestId>
  // -------------------------------------------------------------------------
  if (parts.length === 4 && parts[1] === "reason") {
    const action = parts[2] as "approve" | "reject";
    const requestId = parts[3];

    await answerCallbackQuery(callbackQuery.id, "");

    if (chatId && messageId) {
      // Store the pending reason.
      const key = pendingKey(chatId, telegramUser.id);
      pendingReasons.set(key, {
        action,
        requestId,
        botMessageId: messageId,
        expiresAt: Date.now() + PENDING_REASON_TTL_MS,
      });

      const actionLabel = action === "approve" ? "approval" : "rejection";
      await editMessage(
        String(chatId),
        messageId,
        escapeMarkdownV2(
          `Please type your reason for the ${actionLabel} as a reply to this message.`,
        ),
      );
    }

    return NextResponse.json({ ok: true });
  }

  // Unknown callback data format.
  await answerCallbackQuery(callbackQuery.id, "Unknown action");
  return NextResponse.json({ ok: true });
}
