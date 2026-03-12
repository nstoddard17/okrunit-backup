-- Migration: Add managed action types + assigned approvers
-- 1. Add action_types JSONB array to organizations for managed dropdown options
-- 2. Add assigned_approvers UUID[] to approval_requests for specific approver assignment

-- ============================================================
-- 1. Organization-level action types list
-- ============================================================

ALTER TABLE organizations
  ADD COLUMN action_types TEXT[] DEFAULT '{}';

-- ============================================================
-- 2. Assigned approvers on approval requests
-- ============================================================

ALTER TABLE approval_requests
  ADD COLUMN assigned_approvers UUID[] DEFAULT NULL;

-- Index for querying approvals assigned to a specific user
CREATE INDEX idx_approval_requests_assigned_approvers
  ON approval_requests USING gin(assigned_approvers)
  WHERE assigned_approvers IS NOT NULL;
