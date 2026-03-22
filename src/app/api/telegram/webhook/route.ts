// ---------------------------------------------------------------------------
// OKRunit -- Telegram Webhook Route
// ---------------------------------------------------------------------------
//
// Receives callback_query updates from Telegram when a user presses an
// inline keyboard button (Approve/Reject). Verifies the request, processes
// the action, edits the original message to show the result, and delivers
// the callback if configured.
//
// Telegram sends updates as POST requests with a JSON body.
//
// Webhook URL should be registered via:
//   https://api.telegram.org/bot<TOKEN>/setWebhook?url=<APP_URL>/api/telegram/webhook
// ---------------------------------------------------------------------------

import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/api/audit";
import { deliverCallback } from "@/lib/api/callbacks";
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
  text?: string;
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
 * configured. Telegram sends this in the `X-Telegram-Bot-Api-Secret-Token`
 * header when a secret_token is provided during setWebhook.
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

  // 3. We only handle callback_query (inline keyboard button presses).
  const callbackQuery = update.callback_query;

  if (!callbackQuery) {
    // Not a callback query -- acknowledge and ignore.
    return NextResponse.json({ ok: true });
  }

  const callbackData = callbackQuery.data;
  if (!callbackData) {
    return NextResponse.json({ ok: true });
  }

  // 4. Parse the callback data. Format: "okrunit:<action>:<requestId>"
  const parts = callbackData.split(":");
  if (parts.length !== 3 || parts[0] !== "okrunit") {
    // Not our callback data -- acknowledge and ignore.
    await answerCallbackQuery(callbackQuery.id, "Unknown action");
    return NextResponse.json({ ok: true });
  }

  const actionType = parts[1];
  const requestId = parts[2];

  // 5. Determine the decision.
  let decision: "approve" | "reject";
  if (actionType === "approve") {
    decision = "approve";
  } else if (actionType === "reject") {
    decision = "reject";
  } else {
    await answerCallbackQuery(callbackQuery.id, "Unknown action type");
    return NextResponse.json({ ok: true });
  }

  const telegramUser = callbackQuery.from;
  const telegramUserName = telegramDisplayName(telegramUser);
  const chatId = callbackQuery.message?.chat.id;
  const messageId = callbackQuery.message?.message_id;

  const admin = createAdminClient();

  // 6. Fetch the approval request.
  const { data: approval, error: fetchError } = await admin
    .from("approval_requests")
    .select("*")
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
        escapeMarkdownV2("\u26A0\uFE0F Approval request not found. It may have been deleted."),
      );
    }

    return NextResponse.json({ ok: true });
  }

  // 7. Check that the request is still pending.
  if (approval.status !== "pending") {
    const statusLabel = approval.status;

    await answerCallbackQuery(
      callbackQuery.id,
      `Already ${statusLabel}. No action taken.`,
    );

    if (chatId && messageId) {
      await editMessage(
        String(chatId),
        messageId,
        `${escapeMarkdownV2(`\u2139\uFE0F This request has already been ${statusLabel}. No action taken.`)}`,
      );
    }

    return NextResponse.json({ ok: true });
  }

  // 8. Check for lazy expiration.
  if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
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
        escapeMarkdownV2("\u231B This request has expired and can no longer be actioned."),
      );
    }

    return NextResponse.json({ ok: true });
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
      decision_source: "telegram",
    })
    .eq("id", requestId)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error(
      "[Telegram Webhook] Failed to update approval:",
      updateError,
    );

    await answerCallbackQuery(
      callbackQuery.id,
      "Failed to process. Try the dashboard.",
    );

    return NextResponse.json({ ok: true });
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
      decision_source: "telegram",
      telegram_user_id: telegramUser.id,
      telegram_username: telegramUser.username ?? null,
      telegram_display_name: telegramUserName,
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

  // 12. Answer the callback query and edit the original message.
  const statusEmoji = newStatus === "approved" ? "\u2705" : "\u274C";
  const statusLabel = newStatus === "approved" ? "Approved" : "Rejected";

  await answerCallbackQuery(
    callbackQuery.id,
    `${statusLabel}!`,
  );

  if (chatId && messageId) {
    const updatedText = [
      `${escapeMarkdownV2(`${statusEmoji} ${statusLabel}`)}: *${escapeMarkdownV2(approval.title)}*`,
      `${escapeMarkdownV2(`by ${telegramUserName}`)}`,
    ].join("\n");

    await editMessage(String(chatId), messageId, updatedText);
  }

  return NextResponse.json({ ok: true });
}
