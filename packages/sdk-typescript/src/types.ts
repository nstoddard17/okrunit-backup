// ---------------------------------------------------------------------------
// OKRunit SDK -- Type Definitions
// ---------------------------------------------------------------------------

// ---- Enums ----------------------------------------------------------------

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired";

export type ApprovalPriority = "low" | "medium" | "high" | "critical";

export type DecisionSource =
  | "dashboard"
  | "email"
  | "slack"
  | "teams"
  | "telegram"
  | "discord"
  | "push"
  | "api"
  | "auto_rule"
  | "batch";

export type ExecutionStatus = "immediate" | "scheduled" | "executed" | "cancelled";

// ---- Core Types -----------------------------------------------------------

export interface RiskFactor {
  name: string;
  score: number;
  reason: string;
}

export interface CreatedByInfo {
  type: "api_key" | "oauth";
  connection_id?: string;
  connection_name?: string;
  client_id?: string;
  client_name?: string;
  user_id?: string;
}

export interface Approval {
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
  required_role: string | null;
  is_sequential: boolean;
  risk_score: number | null;
  risk_level: string | null;
  risk_factors: RiskFactor[] | null;
  delegated_from: string | null;
  delegation_id: string | null;
  auto_action: string | null;
  auto_action_after_minutes: number | null;
  auto_action_deadline: string | null;
  require_rejection_reason: boolean;
  scheduled_execution_at: string | null;
  execution_status: ExecutionStatus;
  conditions_met: boolean;
  sla_deadline: string | null;
  sla_breached: boolean;
  sla_breached_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
  // Enriched fields added by the API
  decided_by_name?: string | null;
  rejection_reason_required?: boolean;
}

export interface Comment {
  id: string;
  request_id: string;
  user_id: string | null;
  connection_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
}

// ---- Input Types ----------------------------------------------------------

export interface CreateApprovalInput {
  title: string;
  description?: string;
  action_type?: string;
  priority?: ApprovalPriority;
  callback_url?: string;
  callback_headers?: Record<string, string>;
  metadata?: Record<string, unknown>;
  context_html?: string;
  expires_at?: string;
  idempotency_key?: string;
  required_approvals?: number;
  assigned_approvers?: string[];
  assigned_team_id?: string;
  source?: string;
  source_id?: string;
  is_sequential?: boolean;
  auto_action?: "approve" | "reject";
  auto_action_after_minutes?: number;
  require_rejection_reason?: boolean;
  conditions?: Array<{
    name: string;
    check_type: "webhook" | "manual";
    webhook_url?: string;
    description?: string;
  }>;
}

export interface RespondInput {
  decision: "approve" | "reject";
  comment?: string;
  source?: DecisionSource;
  scheduled_execution_at?: string;
}

export interface ListFilters {
  page?: number;
  page_size?: number;
  status?: ApprovalStatus;
  priority?: ApprovalPriority;
  search?: string;
}

// ---- Response Types -------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

// ---- Client Options -------------------------------------------------------

export interface OKRunitClientOptions {
  apiKey: string;
  baseUrl?: string;
}

export interface WaitOptions {
  timeoutMs?: number;
  pollIntervalMs?: number;
}
