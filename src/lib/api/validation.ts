// ---------------------------------------------------------------------------
// OKRunit -- Zod Validation Schemas for API Endpoints
// ---------------------------------------------------------------------------

import { z } from "zod";

import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/constants";

// ---- Shared Enums ---------------------------------------------------------

const priorityEnum = z.enum(["low", "medium", "high", "critical"]);

const decisionEnum = z.enum(["approve", "reject"]);

const decisionSourceEnum = z.enum([
  "dashboard",
  "email",
  "slack",
  "push",
  "api",
  "auto_rule",
  "batch",
]);

const statusEnum = z.enum([
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "expired",
]);

const ruleActionEnum = z.enum(["auto_approve", "route"]);

// ---- Approval Requests ----------------------------------------------------

export const createApprovalSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  action_type: z.string().optional(),
  priority: priorityEnum.optional(),
  callback_url: z.url().optional(),
  callback_headers: z.record(z.string(), z.string()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  context_html: z.string().max(50_000).optional(),
  expires_at: z.iso.datetime().optional(),
  idempotency_key: z.string().optional(),
  required_approvals: z.int().min(1).max(10).default(1).optional(),
  assigned_approvers: z.array(z.uuid()).min(1).max(10).optional(),
  assigned_team_id: z.uuid().optional(),
  source: z.string().max(50).optional(),
  source_id: z.string().max(200).optional(),
  is_sequential: z.boolean().optional(),
});

export type CreateApprovalInput = z.infer<typeof createApprovalSchema>;

// ---- Approval Responses ---------------------------------------------------

export const respondApprovalSchema = z.object({
  decision: decisionEnum,
  comment: z.string().max(2000).optional(),
  source: decisionSourceEnum.optional(),
});

export type RespondApprovalInput = z.infer<typeof respondApprovalSchema>;

// ---- Connections ----------------------------------------------------------

export const createConnectionSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  rate_limit_per_hour: z.int().min(1).max(10_000).default(100).optional(),
  allowed_action_types: z.array(z.string()).optional(),
  max_priority: priorityEnum.nullable().optional(),
  scoping_rules: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;

export const updateConnectionSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  rate_limit_per_hour: z.int().min(1).max(10_000).optional(),
  allowed_action_types: z.array(z.string()).optional(),
  max_priority: priorityEnum.nullable().optional(),
  scoping_rules: z.record(z.string(), z.unknown()).nullable().optional(),
  is_active: z.boolean().optional(),
});

export type UpdateConnectionInput = z.infer<typeof updateConnectionSchema>;

// ---- Pagination & Filtering -----------------------------------------------

export const paginationSchema = z.object({
  page: z.int().min(1).default(1).optional(),
  page_size: z
    .int()
    .min(1)
    .max(MAX_PAGE_SIZE)
    .default(DEFAULT_PAGE_SIZE)
    .optional(),
  status: statusEnum.optional(),
  priority: priorityEnum.optional(),
  search: z.string().optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

// ---- Comments -------------------------------------------------------------

export const createCommentSchema = z.object({
  body: z.string().min(1).max(5000),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

// ---- Batch Operations -----------------------------------------------------

export const batchApprovalSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(50),
  decision: decisionEnum,
  comment: z.string().optional(),
});

export type BatchApprovalInput = z.infer<typeof batchApprovalSchema>;

export const batchArchiveSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(50),
  action: z.enum(["archive", "unarchive"]),
});

export type BatchArchiveInput = z.infer<typeof batchArchiveSchema>;

// ---- Approval Rules -------------------------------------------------------

export const createRuleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
  priority_order: z.int().optional(),
  conditions: z.record(z.string(), z.unknown()),
  action: ruleActionEnum,
  action_config: z.record(z.string(), z.unknown()).optional(),
  connection_id: z.uuid().optional(),
});

export type CreateRuleInput = z.infer<typeof createRuleSchema>;

// ---- Teams ----------------------------------------------------------------

export const createTeamSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;

export const updateTeamSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
});

export type UpdateTeamInput = z.infer<typeof updateTeamSchema>;
