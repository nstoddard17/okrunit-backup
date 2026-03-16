// ---------------------------------------------------------------------------
// Gatekeeper -- Notification Event Types
// ---------------------------------------------------------------------------

/**
 * All notification-worthy events in the approval lifecycle.
 */
export type NotificationEventType =
  | "approval.created"
  | "approval.approved"
  | "approval.rejected"
  | "approval.cancelled"
  | "approval.expired"
  | "approval.comment"
  | "approval.next_approver";

/**
 * Payload passed into the notification orchestrator whenever an event occurs.
 * Contains everything the channel adapters need to build their messages.
 */
export interface NotificationEvent {
  /** The lifecycle event that triggered the notification. */
  type: NotificationEventType;
  /** Organisation that owns the approval request. */
  orgId: string;
  /** The approval request this event relates to. */
  requestId: string;
  /** Human-readable title of the approval request. */
  requestTitle: string;
  /** Optional longer description of what is being requested. */
  requestDescription?: string;
  /** Priority level of the request (low | medium | high | critical). */
  requestPriority: string;
  /** The connection (integration) that created the request, if applicable. */
  connectionId?: string;
  /** Human-readable name of the connection, if available. */
  connectionName?: string;
  /** User ID of whoever made the decision (approve / reject / cancel). */
  decidedBy?: string;
  /** Optional comment left with the decision. */
  decisionComment?: string;
  /** When set, only notify these specific users instead of all org members. */
  targetUserIds?: string[];
}
