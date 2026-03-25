// ---------------------------------------------------------------------------
// OKRunit TypeScript SDK -- Types
// ---------------------------------------------------------------------------

export type ApprovalStatus = "pending" | "approved" | "rejected" | "cancelled" | "expired";
export type ApprovalPriority = "low" | "medium" | "high" | "critical";
export type DecisionSource = "dashboard" | "email" | "slack" | "teams" | "telegram" | "discord" | "push" | "api" | "auto_rule" | "batch";

export interface OKRunitConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
}

export interface CreateApprovalParams {
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
  notify_channel_ids?: string[];
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
  risk_score: number | null;
  risk_level: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ListApprovalsParams {
  status?: ApprovalStatus;
  priority?: ApprovalPriority;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface RespondApprovalParams {
  decision: "approve" | "reject";
  comment?: string;
  source?: DecisionSource;
  scheduled_execution_at?: string;
}

export interface BatchApprovalParams {
  ids: string[];
  decision: "approve" | "reject";
  comment?: string;
}

export interface Comment {
  id: string;
  request_id: string;
  user_id: string | null;
  connection_id: string | null;
  body: string;
  created_at: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}

export interface WaitOptions {
  timeout?: number;
  poll_interval?: number;
}
