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

export type DashboardLayout = "cards" | "grouped" | "split";

export type VoteValue = "approve" | "reject";

export type VoteSource = "dashboard" | "email" | "slack" | "push" | "api";

export type ApproverMode = "any" | "designated" | "role_based";

export interface CreatedByInfo {
  type: "api_key" | "oauth";
  connection_id?: string;
  connection_name?: string;
  client_id?: string;
  client_name?: string;
}

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
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_app_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrgMembership {
  id: string;
  user_id: string;
  org_id: string;
  role: UserRole;
  can_approve: boolean;
  is_default: boolean;
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
  connection_id: string | null;
  flow_id: string | null;
  source: string | null;
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
  assigned_approvers: string[] | null;
  assigned_team_id: string | null;
  created_by: CreatedByInfo | null;
  required_role: UserRole | null;
  is_sequential: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApprovalFlow {
  id: string;
  org_id: string;
  source: string;
  source_id: string;
  name: string;
  is_configured: boolean;
  default_priority: ApprovalPriority | null;
  default_expiration_hours: number | null;
  default_required_approvals: number | null;
  default_action_type: string | null;
  assigned_team_id: string | null;
  assigned_approvers: string[] | null;
  approver_mode: ApproverMode;
  required_role: UserRole | null;
  is_sequential: boolean;
  request_count: number;
  last_request_at: string | null;
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
  skip_approval_confirmation: boolean;
  dashboard_layout: DashboardLayout;
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

export interface Team {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamMembership {
  id: string;
  team_id: string;
  user_id: string;
  created_at: string;
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

// ---- Webhook Tester Types -------------------------------------------------

export interface WebhookTestEndpoint {
  id: string;
  org_id: string;
  token: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookTestRequest {
  id: string;
  endpoint_id: string;
  org_id: string;
  method: string;
  url: string;
  query_params: Record<string, unknown>;
  headers: Record<string, unknown>;
  body: string | null;
  body_json: Record<string, unknown> | null;
  content_type: string | null;
  ip_address: string | null;
  created_at: string;
}

// ---- OAuth 2.0 Types -----------------------------------------------------

export interface OAuthClient {
  id: string;
  org_id: string;
  name: string;
  client_id: string;
  client_secret_hash: string;
  client_secret_prefix: string;
  redirect_uris: string[];
  scopes: string[];
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OAuthAuthorizationCode {
  id: string;
  client_id: string;
  user_id: string;
  org_id: string;
  code_hash: string;
  redirect_uri: string;
  scopes: string[];
  code_challenge: string | null;
  code_challenge_method: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

export interface OAuthAccessToken {
  id: string;
  client_id: string;
  user_id: string;
  org_id: string;
  token_hash: string;
  scopes: string[];
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
}

export interface OAuthRefreshToken {
  id: string;
  access_token_id: string | null;
  client_id: string;
  user_id: string;
  org_id: string;
  token_hash: string;
  scopes: string[];
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  previous_token_hash: string | null;
  previous_token_expires_at: string | null;
  created_at: string;
}

// ---- Insert Types (omit server-generated columns) -------------------------

export type OrganizationInsert = Omit<Organization, "id" | "created_at" | "updated_at">;
export type UserProfileInsert = Omit<UserProfile, "created_at" | "updated_at">;
export type OrgMembershipInsert = Omit<OrgMembership, "id" | "created_at" | "updated_at">;
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
export type TeamInsert = Omit<Team, "id" | "created_at" | "updated_at">;
export type TeamMembershipInsert = Omit<TeamMembership, "id" | "created_at">;
export type ApprovalVoteInsert = Omit<ApprovalVote, "id" | "created_at">;
export type SavedFilterInsert = Omit<SavedFilter, "id" | "created_at" | "updated_at">;
export type ApprovalAttachmentInsert = Omit<ApprovalAttachment, "id" | "created_at">;
export type WebhookTestEndpointInsert = Omit<WebhookTestEndpoint, "id" | "created_at" | "updated_at">;
export type WebhookTestRequestInsert = Omit<WebhookTestRequest, "id" | "created_at">;

// ---- Update Types (all fields optional except id) -------------------------

export type OrganizationUpdate = Partial<Omit<Organization, "id" | "created_at">> & { id: string };
export type UserProfileUpdate = Partial<Omit<UserProfile, "id" | "created_at">> & { id: string };
export type OrgMembershipUpdate = Partial<Omit<OrgMembership, "id" | "created_at">> & { id: string };
export type ConnectionUpdate = Partial<Omit<Connection, "id" | "created_at">> & { id: string };
export type ApprovalRequestUpdate = Partial<Omit<ApprovalRequest, "id" | "created_at">> & { id: string };
export type NotificationSettingsUpdate = Partial<Omit<NotificationSettings, "id" | "created_at">> & { id: string };
export type ApprovalRuleUpdate = Partial<Omit<ApprovalRule, "id" | "created_at">> & { id: string };
export type SavedFilterUpdate = Partial<Omit<SavedFilter, "id" | "created_at">> & { id: string };
export type ApprovalCommentUpdate = Partial<Omit<ApprovalComment, "id" | "created_at">> & { id: string };
