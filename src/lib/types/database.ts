// ---------------------------------------------------------------------------
// Gatekeeper -- Database Types
// Generated TypeScript types for all Supabase/Postgres tables and enums.
// ---------------------------------------------------------------------------

// ---- Enums ----------------------------------------------------------------

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type ApprovalPriority = "low" | "medium" | "high" | "critical";

export type UserRole = "owner" | "admin" | "member";

export type InviteRole = "admin" | "member";

export type DecisionSource =
  | "dashboard"
  | "email"
  | "slack"
  | "push"
  | "api"
  | "auto_rule"
  | "batch";

export type EmailAction = "approve" | "reject";

export type ApprovalRuleAction = "auto_approve" | "route";

export type VoteValue = "approve" | "reject";

export type VoteSource = "dashboard" | "email" | "slack" | "push" | "api";

// ---- Table Row Interfaces -------------------------------------------------

export interface Organization {
  id: string;
  name: string;
  emergency_stop_active: boolean;
  emergency_stop_activated_at: string | null;
  emergency_stop_activated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Connection {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  api_key_hash: string;
  api_key_prefix: string;
  is_active: boolean;
  rate_limit_per_hour: number;
  allowed_action_types: string[] | null;
  max_priority: ApprovalPriority | null;
  scoping_rules: Record<string, unknown> | null;
  last_used_at: string | null;
  rotated_at: string | null;
  previous_key_hash: string | null;
  previous_key_expires_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  org_id: string;
  connection_id: string;
  title: string;
  description: string | null;
  action_type: string;
  priority: ApprovalPriority;
  status: ApprovalStatus;
  callback_url: string | null;
  callback_headers: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  context_html: string | null;
  decided_by: string | null;
  decided_at: string | null;
  decision_comment: string | null;
  decision_source: DecisionSource | null;
  expires_at: string | null;
  idempotency_key: string | null;
  required_approvals: number;
  current_approvals: number;
  auto_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgInvite {
  id: string;
  org_id: string;
  email: string;
  role: InviteRole;
  token: string;
  invited_by: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  org_id: string;
  user_id: string | null;
  connection_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface NotificationSettings {
  id: string;
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  slack_enabled: boolean;
  slack_webhook_url: string | null;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  quiet_hours_timezone: string | null;
  minimum_priority: ApprovalPriority;
  created_at: string;
  updated_at: string;
}

export interface EmailActionToken {
  id: string;
  request_id: string;
  user_id: string;
  action: EmailAction;
  token: string;
  consumed_at: string | null;
  expires_at: string;
  created_at: string;
}

export interface ApprovalComment {
  id: string;
  request_id: string;
  user_id: string | null;
  connection_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface WebhookDeliveryLog {
  id: string;
  request_id: string;
  connection_id: string;
  url: string;
  method: string;
  request_headers: Record<string, unknown>;
  request_body: Record<string, unknown>;
  response_status: number | null;
  response_headers: Record<string, unknown> | null;
  response_body: string | null;
  duration_ms: number | null;
  attempt_number: number;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export interface ApprovalRule {
  id: string;
  org_id: string;
  connection_id: string | null;
  name: string;
  description: string | null;
  is_active: boolean;
  priority_order: number;
  conditions: Record<string, unknown>;
  action: ApprovalRuleAction;
  action_config: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ApprovalVote {
  id: string;
  request_id: string;
  user_id: string;
  vote: VoteValue;
  comment: string | null;
  source: VoteSource;
  created_at: string;
}

export interface SavedFilter {
  id: string;
  user_id: string;
  org_id: string;
  name: string;
  filters: Record<string, unknown>;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApprovalAttachment {
  id: string;
  request_id: string;
  file_name: string;
  file_size: number;
  content_type: string;
  storage_path: string;
  uploaded_by: string | null;
  connection_id: string | null;
  created_at: string;
}

// ---- Insert Types (omit server-generated columns) -------------------------

export type OrganizationInsert = Omit<Organization, "id" | "created_at" | "updated_at">;
export type UserProfileInsert = Omit<UserProfile, "created_at" | "updated_at">;
export type ConnectionInsert = Omit<
  Connection,
  "id" | "last_used_at" | "rotated_at" | "previous_key_hash" | "previous_key_expires_at" | "created_at" | "updated_at"
>;
export type ApprovalRequestInsert = Omit<
  ApprovalRequest,
  | "id"
  | "status"
  | "decided_by"
  | "decided_at"
  | "decision_comment"
  | "decision_source"
  | "current_approvals"
  | "auto_approved"
  | "created_at"
  | "updated_at"
>;
export type OrgInviteInsert = Omit<OrgInvite, "id" | "accepted_at" | "created_at">;
export type AuditLogEntryInsert = Omit<AuditLogEntry, "id" | "created_at">;
export type PushSubscriptionInsert = Omit<PushSubscription, "id" | "created_at">;
export type NotificationSettingsInsert = Omit<NotificationSettings, "id" | "created_at" | "updated_at">;
export type EmailActionTokenInsert = Omit<EmailActionToken, "id" | "consumed_at" | "created_at">;
export type ApprovalCommentInsert = Omit<ApprovalComment, "id" | "created_at" | "updated_at">;
export type WebhookDeliveryLogInsert = Omit<WebhookDeliveryLog, "id" | "created_at">;
export type ApprovalRuleInsert = Omit<ApprovalRule, "id" | "created_at" | "updated_at">;
export type ApprovalVoteInsert = Omit<ApprovalVote, "id" | "created_at">;
export type SavedFilterInsert = Omit<SavedFilter, "id" | "created_at" | "updated_at">;
export type ApprovalAttachmentInsert = Omit<ApprovalAttachment, "id" | "created_at">;

// ---- Update Types (all fields optional except id) -------------------------

export type OrganizationUpdate = Partial<Omit<Organization, "id" | "created_at">> & { id: string };
export type UserProfileUpdate = Partial<Omit<UserProfile, "id" | "created_at">> & { id: string };
export type ConnectionUpdate = Partial<Omit<Connection, "id" | "created_at">> & { id: string };
export type ApprovalRequestUpdate = Partial<Omit<ApprovalRequest, "id" | "created_at">> & { id: string };
export type NotificationSettingsUpdate = Partial<Omit<NotificationSettings, "id" | "created_at">> & { id: string };
export type ApprovalRuleUpdate = Partial<Omit<ApprovalRule, "id" | "created_at">> & { id: string };
export type SavedFilterUpdate = Partial<Omit<SavedFilter, "id" | "created_at">> & { id: string };
export type ApprovalCommentUpdate = Partial<Omit<ApprovalComment, "id" | "created_at">> & { id: string };
