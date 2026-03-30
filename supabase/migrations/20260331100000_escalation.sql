-- ---------------------------------------------------------------------------
-- OKrunit -- Approval Escalation
-- ---------------------------------------------------------------------------
-- Adds escalation configuration to organizations and escalation tracking
-- fields to approval requests. Escalation rules define progressive
-- notification targets when approvals go unacted upon.
-- ---------------------------------------------------------------------------

-- 1. Org-level escalation configuration (JSONB, same pattern as sla_config)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS escalation_config JSONB DEFAULT NULL;

-- 2. Escalation tracking on approval requests
ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_escalation_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_escalated_at TIMESTAMPTZ;

-- 3. Index for cron query: find pending requests due for escalation
CREATE INDEX IF NOT EXISTS idx_approval_requests_escalation_pending
  ON approval_requests (org_id, next_escalation_at)
  WHERE status = 'pending' AND next_escalation_at IS NOT NULL;
