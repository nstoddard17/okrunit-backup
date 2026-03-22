// ---------------------------------------------------------------------------
// OKRunit -- Notification Orchestrator
// ---------------------------------------------------------------------------
//
// Central fan-out for all notification channels (web push, email, Slack,
// Teams, Telegram, Discord).
//
// Usage:
//   import { dispatchNotifications } from "@/lib/notifications/orchestrator";
//   await dispatchNotifications({ type: "approval.created", ... });
//
// Per-user channels: email, web push (controlled by notification_settings).
// Org-wide channels: Slack, Teams, Telegram, Discord (controlled by
// messaging_connections table).
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
import { getOrgMessagingConnections } from "@/lib/notifications/messaging";
import type { NotificationSettings, MessagingConnection } from "@/lib/types/database";
import type { PushPayload } from "@/lib/notifications/channels/web-push";
import { PRIORITY_ORDER } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Default settings applied when a user has not configured preferences
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: Pick<
  NotificationSettings,
  | "email_enabled"
  | "push_enabled"
  | "quiet_hours_enabled"
  | "quiet_hours_start"
  | "quiet_hours_end"
  | "quiet_hours_timezone"
  | "minimum_priority"
> = {
  email_enabled: true,
  push_enabled: true,
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
 *  1. Load all org members and their notification settings (for email + push).
 *  2. Load all org messaging connections (for Slack, Teams, Telegram, Discord).
 *  3. For each member, check `shouldNotify` (quiet hours + priority).
 *  4. Fan out to enabled per-user channels (web push, email) in parallel.
 *  5. Fan out to org-wide messaging connections in parallel.
 *
 * This function **never throws**. Individual channel failures are logged but
 * do not prevent other channels or other users from receiving their
 * notifications (thanks to `Promise.allSettled`).
 */
export async function dispatchNotifications(
  event: NotificationEvent,
): Promise<void> {
  try {
    // Load per-user settings and org-wide messaging connections in parallel
    const [orgUsers, messagingConnections] = await Promise.all([
      getOrgNotificationSettings(event.orgId),
      getOrgMessagingConnections(event.orgId),
    ]);

    // If targeted, only notify specific users
    let recipients = orgUsers;
    if (event.targetUserIds && event.targetUserIds.length > 0) {
      recipients = orgUsers.filter(u => event.targetUserIds!.includes(u.userId));
    }

    const promises: Promise<void>[] = [];

    // -- Per-user channels (email + web push) ---------------------------------
    for (const { userId, email, settings } of recipients) {
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
    }

    // -- Org-wide messaging connections (Slack, Teams, Telegram, Discord) ------
    for (const conn of messagingConnections) {
      // Filter by connection's priority_filter
      if (!meetsMinimumPriority(event.requestPriority, conn.priority_filter)) {
        continue;
      }

      // Filter by event type
      const isCreateEvent =
        event.type === "approval.created" || event.type === "approval.next_approver";
      const isDecisionEvent =
        event.type === "approval.approved" ||
        event.type === "approval.rejected" ||
        event.type === "approval.cancelled" ||
        event.type === "approval.expired";

      if (isCreateEvent && !conn.notify_on_create) continue;
      if (isDecisionEvent && !conn.notify_on_decide) continue;

      // Dispatch based on platform
      const channelPromise = dispatchToMessagingConnection(conn, event);
      if (channelPromise) {
        promises.push(channelPromise);
      }
    }

    await Promise.allSettled(promises);
  } catch (error) {
    console.error("[Notifications] Orchestrator error:", error);
  }
}

// ---------------------------------------------------------------------------
// Messaging Connection Dispatcher
// ---------------------------------------------------------------------------

function dispatchToMessagingConnection(
  conn: MessagingConnection,
  event: NotificationEvent,
): Promise<void> | null {
  const isCreateEvent =
    event.type === "approval.created" || event.type === "approval.next_approver";

  switch (conn.platform) {
    case "slack":
      return dispatchSlack(conn, event, isCreateEvent);
    case "discord":
      return dispatchDiscord(conn, event, isCreateEvent);
    case "teams":
      return dispatchTeams(conn, event, isCreateEvent);
    case "telegram":
      return dispatchTelegram(conn, event, isCreateEvent);
    default:
      return null;
  }
}

function dispatchSlack(
  conn: MessagingConnection,
  event: NotificationEvent,
  isCreateEvent: boolean,
): Promise<void> {
  const webhookUrl = conn.webhook_url;
  if (!webhookUrl) return Promise.resolve();

  if (isCreateEvent) {
    return sendSlackNotification({
      webhookUrl,
      requestId: event.requestId,
      title: event.requestTitle,
      description: event.requestDescription,
      priority: event.requestPriority,
      connectionName: event.connectionName,
    }).catch((err: unknown) => {
      console.error(
        `[Notifications] Slack notification failed for connection ${conn.id}:`,
        err,
      );
    });
  }

  const decision = extractDecision(event.type);
  return sendSlackDecisionNotification({
    webhookUrl,
    requestTitle: event.requestTitle,
    decision,
    decidedBy: event.decidedBy,
    comment: event.decisionComment,
  }).catch((err: unknown) => {
    console.error(
      `[Notifications] Slack decision failed for connection ${conn.id}:`,
      err,
    );
  });
}

function dispatchDiscord(
  conn: MessagingConnection,
  event: NotificationEvent,
  isCreateEvent: boolean,
): Promise<void> {
  const webhookUrl = conn.webhook_url;
  if (!webhookUrl) return Promise.resolve();

  if (isCreateEvent) {
    return sendDiscordNotification({
      webhookUrl,
      requestId: event.requestId,
      title: event.requestTitle,
      description: event.requestDescription,
      priority: event.requestPriority,
      connectionName: event.connectionName,
    }).catch((err: unknown) => {
      console.error(
        `[Notifications] Discord notification failed for connection ${conn.id}:`,
        err,
      );
    });
  }

  const decision = extractDecision(event.type);
  return sendDiscordDecisionNotification({
    webhookUrl,
    requestTitle: event.requestTitle,
    decision,
    decidedBy: event.decidedBy,
    comment: event.decisionComment,
  }).catch((err: unknown) => {
    console.error(
      `[Notifications] Discord decision failed for connection ${conn.id}:`,
      err,
    );
  });
}

function dispatchTeams(
  conn: MessagingConnection,
  event: NotificationEvent,
  isCreateEvent: boolean,
): Promise<void> {
  const webhookUrl = conn.webhook_url;
  if (!webhookUrl) return Promise.resolve();

  if (isCreateEvent) {
    return sendTeamsNotification({
      webhookUrl,
      requestId: event.requestId,
      title: event.requestTitle,
      description: event.requestDescription,
      priority: event.requestPriority,
      connectionName: event.connectionName,
    }).catch((err: unknown) => {
      console.error(
        `[Notifications] Teams notification failed for connection ${conn.id}:`,
        err,
      );
    });
  }

  const decision = extractDecision(event.type);
  return sendTeamsDecisionNotification({
    webhookUrl,
    requestTitle: event.requestTitle,
    decision,
    decidedBy: event.decidedBy,
    comment: event.decisionComment,
  }).catch((err: unknown) => {
    console.error(
      `[Notifications] Teams decision failed for connection ${conn.id}:`,
      err,
    );
  });
}

function dispatchTelegram(
  conn: MessagingConnection,
  event: NotificationEvent,
  isCreateEvent: boolean,
): Promise<void> {
  const chatId = conn.channel_id;
  // For Telegram, we need either the connection's bot_token or the env var
  if (!chatId) return Promise.resolve();

  if (isCreateEvent) {
    return sendTelegramNotification({
      chatId,
      botToken: conn.bot_token ?? undefined,
      requestId: event.requestId,
      title: event.requestTitle,
      description: event.requestDescription,
      priority: event.requestPriority,
      connectionName: event.connectionName,
    }).catch((err: unknown) => {
      console.error(
        `[Notifications] Telegram notification failed for connection ${conn.id}:`,
        err,
      );
    });
  }

  const decision = extractDecision(event.type);
  return sendTelegramDecisionNotification({
    chatId,
    botToken: conn.bot_token ?? undefined,
    requestTitle: event.requestTitle,
    decision,
    decidedBy: event.decidedBy,
    comment: event.decisionComment,
  }).catch((err: unknown) => {
    console.error(
      `[Notifications] Telegram decision failed for connection ${conn.id}:`,
      err,
    );
  });
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
  "approval.execution_cancelled": "Scheduled Execution Cancelled",
};

function getNotificationTitle(event: NotificationEvent): string {
  return TITLE_MAP[event.type] ?? "OKRunit Notification";
}

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

function extractDecision(type: NotificationEventType): string {
  return type.split(".")[1] ?? "updated";
}

/**
 * Check if an event's priority meets the minimum priority threshold
 * set on a messaging connection.
 */
function meetsMinimumPriority(
  eventPriority: string,
  minimumPriority: string,
): boolean {
  const eventOrder =
    PRIORITY_ORDER[eventPriority as keyof typeof PRIORITY_ORDER] ?? 0;
  const minOrder =
    PRIORITY_ORDER[minimumPriority as keyof typeof PRIORITY_ORDER] ?? 0;
  return eventOrder >= minOrder;
}
