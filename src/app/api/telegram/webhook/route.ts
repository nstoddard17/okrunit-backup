// ---------------------------------------------------------------------------
// OKrunit -- Telegram Webhook Route
// ---------------------------------------------------------------------------
//
// Flow:
//   1. User clicks Approve/Reject button → decision applied immediately
//   2. Confirmation message says "Reply to add a reason" (optional)
//   3. If user replies with text → reason is attached as decision_comment
//
// Exception: If rejection reason is REQUIRED by org policy, the reject button
// prompts for a reason first and blocks until provided.
//
// Callback data formats:
//   okrunit:approve:<requestId>   -- Approve (immediate)
//   okrunit:reject:<requestId>    -- Reject (immediate, unless reason required)
//   okrunit:reason:reject:<requestId> -- Forced reason prompt (when required)
// ---------------------------------------------------------------------------

import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { logAuditEvent } from "@/lib/api/audit";
import { getClientIp } from "@/lib/api/ip-rate-limiter";
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
// Pending reason prompts (only used when rejection reason is required)
// ---------------------------------------------------------------------------

interface PendingReason {
  action: "reject";
  requestId: string;
  botMessageId: number;
  expiresAt: number;
}

const pendingReasons = new Map<string, PendingReason>();
const PENDING_TTL_MS = 10 * 60 * 1000;

function pendingKey(chatId: number, userId: number): string {
  return `${chatId}:${userId}`;
}

function cleanExpired(): void {
  const now = Date.now();
  for (const [key, value] of pendingReasons) {
    if (value.expiresAt < now) pendingReasons.delete(key);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function escapeMarkdownV2(text: string): string {
  return text.replace(/([_*\[\]()~`>#+\-=|{}.!\\])/g, "\\$1");
}

function verifyTelegramSecret(expected: string, header: string): boolean {
  const a = Buffer.from(expected, "utf-8");
  const b = Buffer.from(header, "utf-8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function telegramDisplayName(user: TelegramUser): string {
  if (user.username) return `@${user.username}`;
  const parts = [user.first_name, user.last_name].filter(Boolean);
  return parts.join(" ") || `User ${user.id}`;
}

// ---------------------------------------------------------------------------
// Apply decision to the approval
// ---------------------------------------------------------------------------

async function applyDecision(request: Request, params: {
  decision: "approve" | "reject";
  requestId: string;
  telegramUser: TelegramUser;
  chatId?: number;
  messageId?: number;
  comment?: string;
}): Promise<void> {
  const { decision, requestId, telegramUser, chatId, messageId, comment } =
    params;
  const displayName = telegramDisplayName(telegramUser);
  const admin = createAdminClient();

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

  if (approval.status !== "pending") {
    if (chatId && messageId) {
      await editMessage(
        String(chatId),
        messageId,
        escapeMarkdownV2(
          `\u2139\uFE0F Already ${approval.status}. No action taken.`,
        ),
      );
    }
    return;
  }

  if (approval.expires_at && new Date(approval.expires_at) < new Date()) {
    await admin
      .from("approval_requests")
      .update({ status: "expired" })
      .eq("id", approval.id);
    if (chatId && messageId) {
      await editMessage(
        String(chatId),
        messageId,
        escapeMarkdownV2("\u231B This request has expired."),
      );
    }
    return;
  }

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
  if (comment) updatePayload.decision_comment = comment;

  const { data: updated, error: updateError } = await admin
    .from("approval_requests")
    .update(updatePayload)
    .eq("id", requestId)
    .select("*")
    .single();

  if (updateError || !updated) {
    console.error("[Telegram Webhook] Update failed:", updateError);
    return;
  }

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
      telegram_display_name: displayName,
    },
    ipAddress: getClientIp(request),
  });

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

  if (chatId && messageId) {
    const emoji = newStatus === "approved" ? "\u2705" : "\u274C";
    const label = newStatus === "approved" ? "Approved" : "Rejected";
    const commentLine = comment ? `\nReason: ${comment}` : "";

    await editMessage(
      String(chatId),
      messageId,
      `${emoji} ${label}: ${approval.title}\nby ${displayName}${commentLine}`,
      undefined,
      false,
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/telegram/webhook
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    console.error("[Telegram Webhook] TELEGRAM_BOT_TOKEN is not set");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const header =
      request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "";
    if (!verifyTelegramSecret(webhookSecret, header)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  cleanExpired();

  // -------------------------------------------------------------------------
  // Handle text messages (reply with reason — only for required rejections)
  // -------------------------------------------------------------------------
  if (update.message && !update.callback_query) {
    const msg = update.message;
    const fromUser = msg.from;
    if (!fromUser || !msg.text) return NextResponse.json({ ok: true });

    const key = pendingKey(msg.chat.id, fromUser.id);
    const pending = pendingReasons.get(key);
    if (!pending) return NextResponse.json({ ok: true });

    pendingReasons.delete(key);

    await applyDecision(request, {
      decision: pending.action,
      requestId: pending.requestId,
      telegramUser: fromUser,
      chatId: msg.chat.id,
      messageId: pending.botMessageId,
      comment: msg.text,
    });

    return NextResponse.json({ ok: true });
  }

  // -------------------------------------------------------------------------
  // Handle button clicks
  // -------------------------------------------------------------------------
  const cb = update.callback_query;
  if (!cb?.data) return NextResponse.json({ ok: true });

  const parts = cb.data.split(":");
  if (parts[0] !== "okrunit" || parts.length < 3) {
    await answerCallbackQuery(cb.id, "Unknown action");
    return NextResponse.json({ ok: true });
  }

  const chatId = cb.message?.chat.id;
  const messageId = cb.message?.message_id;

  // -------------------------------------------------------------------------
  // Approve — always immediate
  // -------------------------------------------------------------------------
  if (parts[1] === "approve" && parts.length === 3) {
    await answerCallbackQuery(cb.id, "Approved!");
    await applyDecision(request, {
      decision: "approve",
      requestId: parts[2],
      telegramUser: cb.from,
      chatId,
      messageId,
    });
    return NextResponse.json({ ok: true });
  }

  // -------------------------------------------------------------------------
  // Reject — immediate unless reason is required
  // -------------------------------------------------------------------------
  if (parts[1] === "reject" && parts.length === 3) {
    const requestId = parts[2];

    // Check if rejection reason is required
    const admin = createAdminClient();
    const { data: approval } = await admin
      .from("approval_requests")
      .select("org_id, require_rejection_reason, priority")
      .eq("id", requestId)
      .single();

    const reasonRequired = approval
      ? await isRejectionReasonRequired(approval.org_id, {
          require_rejection_reason: approval.require_rejection_reason,
          priority: approval.priority,
        })
      : false;

    if (reasonRequired) {
      // Must provide a reason — prompt for it
      await answerCallbackQuery(cb.id, "A rejection reason is required");
      if (chatId && messageId) {
        pendingReasons.set(pendingKey(chatId, cb.from.id), {
          action: "reject",
          requestId,
          botMessageId: messageId,
          expiresAt: Date.now() + PENDING_TTL_MS,
        });
        await editMessage(
          String(chatId),
          messageId,
          "⚠️ A rejection reason is required.\n\nType your reason below:",
          undefined,
          false,
        );
      }
      return NextResponse.json({ ok: true });
    }

    // No reason required — apply immediately
    await answerCallbackQuery(cb.id, "Rejected!");
    await applyDecision(request, {
      decision: "reject",
      requestId,
      telegramUser: cb.from,
      chatId,
      messageId,
    });
    return NextResponse.json({ ok: true });
  }

  // -------------------------------------------------------------------------
  // Forced reason prompt submit (legacy format, kept for compatibility)
  // -------------------------------------------------------------------------
  if (parts[1] === "reason" && parts.length === 4) {
    const action = parts[2] as "reject";
    const requestId = parts[3];

    await answerCallbackQuery(cb.id, "");
    if (chatId && messageId) {
      pendingReasons.set(pendingKey(chatId, cb.from.id), {
        action,
        requestId,
        botMessageId: messageId,
        expiresAt: Date.now() + PENDING_TTL_MS,
      });
      await editMessage(
        String(chatId),
        messageId,
        "⚠️ Please type your rejection reason below:",
        undefined,
        false,
      );
    }
    return NextResponse.json({ ok: true });
  }

  await answerCallbackQuery(cb.id, "Unknown action");
  return NextResponse.json({ ok: true });
}
