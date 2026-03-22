// ---------------------------------------------------------------------------
// OKRunit -- Notification Orchestrator
// ---------------------------------------------------------------------------
//
// Central fan-out for all notification channels (web push, email, Slack, Teams, Telegram, Discord).
//
// Usage:
//   import { dispatchNotifications } from "@/lib/notifications/orchestrator";
//   await dispatchNotifications({ type: "approval.created", ... });
//
// This module is designed to be called from the approvals API routes (POST for
// new requests, PATCH for decisions) but never modifies those routes itself.
// ---------------------------------------------------------------------------

import type { NotificationEvent, NotificationEventType } from "@/lib/notifications/types";
import {
  shouldNotify,
  getOrgNotificationSettings,
} from "@/lib/notifications/filters";
import { sendWebPush } from "@/lib/notifications/channels/web-push";
import {
  sendApprovalEmail,
  sendDecisionEmail,
} from "@/lib/notifications/channels/email";
import {
  sendSlackNotification,
  sendSlackDecisionNotification,
} from "@/lib/notifications/channels/slack";
import {
  sendTeamsNotification,
  sendTeamsDecisionNotification,
} from "@/lib/notifications/channels/teams";
import {
  sendTelegramNotification,
  sendTelegramDecisionNotification,
} from "@/lib/notifications/channels/telegram";
import {
  sendDiscordNotification,
  sendDiscordDecisionNotification,
} from "@/lib/notifications/channels/discord";
import { generateActionTokens } from "@/lib/notifications/tokens";
import type { NotificationSettings } from "@/lib/types/database";
import type { PushPayload } from "@/lib/notifications/channels/web-push";

// ---------------------------------------------------------------------------
// Default settings applied when a user has not configured preferences
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: Pick<
  NotificationSettings,
  | "email_enabled"
  | "push_enabled"
  | "slack_enabled"
  | "slack_webhook_url"
  | "teams_enabled"
  | "teams_webhook_url"
  | "telegram_enabled"
  | "telegram_chat_id"
  | "discord_enabled"
  | "discord_webhook_url"
  | "quiet_hours_enabled"
  | "quiet_hours_start"
  | "quiet_hours_end"
  | "quiet_hours_timezone"
  | "minimum_priority"
> = {
  email_enabled: true,
  push_enabled: true,
  slack_enabled: false,
  slack_webhook_url: null,
  teams_enabled: false,
  teams_webhook_url: null,
  telegram_enabled: false,
  telegram_chat_id: null,
  discord_enabled: false,
  discord_webhook_url: null,
  quiet_hours_enabled: false,
  quiet_hours_start: null,
  quiet_hours_end: null,
  quiet_hours_timezone: "UTC",
  minimum_priority: "low",
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Dispatch notifications for a lifecycle event to every relevant org member
 * across all enabled channels.
 *
 * Flow:
 *  1. Load all org members and their notification settings.
 *  2. For each member, check `shouldNotify` (quiet hours + priority).
 *  3. Fan out to enabled channels (web push, email, Slack) in parallel.
 *
 * This function **never throws**. Individual channel failures are logged but
 * do not prevent other channels or other users from receiving their
 * notifications (thanks to `Promise.allSettled`).
 */
export async function dispatchNotifications(
  event: NotificationEvent,
): Promise<void> {
  try {
    const orgUsers = await getOrgNotificationSettings(event.orgId);

    // If targeted, only notify specific users
    let recipients = orgUsers;
    if (event.targetUserIds && event.targetUserIds.length > 0) {
      recipients = orgUsers.filter(u => event.targetUserIds!.includes(u.userId));
    }

    if (recipients.length === 0) {
      return;
    }

    const promises: Promise<void>[] = [];

    for (const { userId, email, settings } of recipients) {
      // Apply defaults when the user has no saved settings row.
      const effective = settings ?? (DEFAULT_SETTINGS as NotificationSettings);

      // Gate: quiet hours + priority threshold
      if (!shouldNotify(effective, event.requestPriority)) {
        continue;
      }

      // -- Web Push -----------------------------------------------------------
      if (effective.push_enabled) {
        const pushPayload: PushPayload = {
          title: getNotificationTitle(event),
          body: getNotificationBody(event),
          url: "/dashboard",
          requestId: event.requestId,
          tag: `gk-${event.requestId}`,
        };
        promises.push(
          sendWebPush(userId, pushPayload).catch((err: unknown) => {
            console.error(
              `[Notifications] Web push failed for user ${userId}:`,
              err,
            );
          }),
        );
      }

      // -- Email --------------------------------------------------------------
      if (effective.email_enabled) {
        if (event.type === "approval.created" || event.type === "approval.next_approver") {
          // Generate one-click approve/reject tokens, then send the email.
          const emailPromise = generateActionTokens(
            event.requestId,
            userId,
          ).then((tokens: { approveToken: string; rejectToken: string }) =>
            sendApprovalEmail({
              to: email,
              subject: `[OKRunit] ${event.requestTitle}`,
              requestId: event.requestId,
              title: event.requestTitle,
              description: event.requestDescription,
              priority: event.requestPriority,
              approveToken: tokens.approveToken,
              rejectToken: tokens.rejectToken,
            }),
          );
          promises.push(
            emailPromise.catch((err: unknown) => {
              console.error(
                `[Notifications] Approval email failed for ${email}:`,
                err,
              );
            }),
          );
        } else {
          const decision = extractDecision(event.type);
          promises.push(
            sendDecisionEmail({
              to: email,
              subject: `[OKRunit] ${event.requestTitle} - ${decision}`,
              requestTitle: event.requestTitle,
              decision,
              decidedBy: event.decidedBy,
              comment: event.decisionComment,
            }).catch((err: unknown) => {
              console.error(
                `[Notifications] Decision email failed for ${email}:`,
                err,
              );
            }),
          );
        }
      }

      // -- Slack --------------------------------------------------------------
      if (effective.slack_enabled && effective.slack_webhook_url) {
        if (event.type === "approval.created" || event.type === "approval.next_approver") {
          promises.push(
            sendSlackNotification({
              webhookUrl: effective.slack_webhook_url,
              requestId: event.requestId,
              title: event.requestTitle,
              description: event.requestDescription,
              priority: event.requestPriority,
              connectionName: event.connectionName,
            }).catch((err: unknown) => {
              console.error(
                `[Notifications] Slack notification failed for user ${userId}:`,
                err,
              );
            }),
          );
        } else {
          const decision = extractDecision(event.type);
          promises.push(
            sendSlackDecisionNotification({
              webhookUrl: effective.slack_webhook_url,
              requestTitle: event.requestTitle,
              decision,
              decidedBy: event.decidedBy,
              comment: event.decisionComment,
            }).catch((err: unknown) => {
              console.error(
                `[Notifications] Slack decision failed for user ${userId}:`,
                err,
              );
            }),
          );
        }
      }

      // -- Teams ----------------------------------------------------------------
      if (effective.teams_enabled && effective.teams_webhook_url) {
        if (event.type === "approval.created" || event.type === "approval.next_approver") {
          promises.push(
            sendTeamsNotification({
              webhookUrl: effective.teams_webhook_url,
              requestId: event.requestId,
              title: event.requestTitle,
              description: event.requestDescription,
              priority: event.requestPriority,
              connectionName: event.connectionName,
            }).catch((err: unknown) => {
              console.error(
                `[Notifications] Teams notification failed for user ${userId}:`,
                err,
              );
            }),
          );
        } else {
          const decision = extractDecision(event.type);
          promises.push(
            sendTeamsDecisionNotification({
              webhookUrl: effective.teams_webhook_url,
              requestTitle: event.requestTitle,
              decision,
              decidedBy: event.decidedBy,
              comment: event.decisionComment,
            }).catch((err: unknown) => {
              console.error(
                `[Notifications] Teams decision failed for user ${userId}:`,
                err,
              );
            }),
          );
        }
      }

      // -- Telegram -------------------------------------------------------------
      if (effective.telegram_enabled && effective.telegram_chat_id) {
        if (event.type === "approval.created" || event.type === "approval.next_approver") {
          promises.push(
            sendTelegramNotification({
              chatId: effective.telegram_chat_id,
              requestId: event.requestId,
              title: event.requestTitle,
              description: event.requestDescription,
              priority: event.requestPriority,
              connectionName: event.connectionName,
            }).catch((err: unknown) => {
              console.error(
                `[Notifications] Telegram notification failed for user ${userId}:`,
                err,
              );
            }),
          );
        } else {
          const decision = extractDecision(event.type);
          promises.push(
            sendTelegramDecisionNotification({
              chatId: effective.telegram_chat_id,
              requestTitle: event.requestTitle,
              decision,
              decidedBy: event.decidedBy,
              comment: event.decisionComment,
            }).catch((err: unknown) => {
              console.error(
                `[Notifications] Telegram decision failed for user ${userId}:`,
                err,
              );
            }),
          );
        }
      }

      // -- Discord ------------------------------------------------------------
      if (effective.discord_enabled && effective.discord_webhook_url) {
        if (event.type === "approval.created" || event.type === "approval.next_approver") {
          promises.push(
            sendDiscordNotification({
              webhookUrl: effective.discord_webhook_url,
              requestId: event.requestId,
              title: event.requestTitle,
              description: event.requestDescription,
              priority: event.requestPriority,
              connectionName: event.connectionName,
            }).catch((err: unknown) => {
              console.error(
                `[Notifications] Discord notification failed for user ${userId}:`,
                err,
              );
            }),
          );
        } else {
          const decision = extractDecision(event.type);
          promises.push(
            sendDiscordDecisionNotification({
              webhookUrl: effective.discord_webhook_url,
              requestTitle: event.requestTitle,
              decision,
              decidedBy: event.decidedBy,
              comment: event.decisionComment,
            }).catch((err: unknown) => {
              console.error(
                `[Notifications] Discord decision failed for user ${userId}:`,
                err,
              );
            }),
          );
        }
      }
    }

    // Wait for all channel deliveries. Individual failures have already been
    // caught above, so allSettled is used purely for awaiting completion.
    await Promise.allSettled(promises);
  } catch (error) {
    console.error("[Notifications] Orchestrator error:", error);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Map of event types to human-readable push notification titles. */
const TITLE_MAP: Record<NotificationEventType, string> = {
  "approval.created": "New Approval Request",
  "approval.approved": "Request Approved",
  "approval.rejected": "Request Rejected",
  "approval.cancelled": "Request Cancelled",
  "approval.expired": "Request Expired",
  "approval.comment": "New Comment",
  "approval.next_approver": "Your Approval Needed",
};

/**
 * Build a short title for push notifications / toast headings.
 */
function getNotificationTitle(event: NotificationEvent): string {
  return TITLE_MAP[event.type] ?? "OKRunit Notification";
}

/**
 * Build a one-line body for push notifications.
 */
function getNotificationBody(event: NotificationEvent): string {
  switch (event.type) {
    case "approval.created":
      return `"${event.requestTitle}" needs your review.`;
    case "approval.approved":
      return `"${event.requestTitle}" was approved${event.decidedBy ? ` by ${event.decidedBy}` : ""}.`;
    case "approval.rejected":
      return `"${event.requestTitle}" was rejected${event.decidedBy ? ` by ${event.decidedBy}` : ""}.`;
    case "approval.cancelled":
      return `"${event.requestTitle}" was cancelled.`;
    case "approval.expired":
      return `"${event.requestTitle}" has expired.`;
    case "approval.comment":
      return `New comment on "${event.requestTitle}".`;
    case "approval.next_approver":
      return `Your approval is now needed for "${event.requestTitle}".`;
    default:
      return event.requestTitle;
  }
}

/**
 * Extract the human-readable decision word from an event type.
 * e.g. "approval.approved" -> "approved"
 */
function extractDecision(type: NotificationEventType): string {
  return type.split(".")[1] ?? "updated";
}
