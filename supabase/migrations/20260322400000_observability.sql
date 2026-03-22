-- ---------------------------------------------------------------------------
-- OKRunit -- Phase 17: Observability (SLA Tracking + Bottleneck Detection)
-- ---------------------------------------------------------------------------

-- Org-level SLA configuration per priority (minutes until breach)
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS sla_config JSONB DEFAULT '{"low": null, "medium": null, "high": 60, "critical": 15}';

-- SLA tracking on approval requests
ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_breached BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sla_breached_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sla_warning_sent BOOLEAN DEFAULT false;

-- Bottleneck alert settings
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS bottleneck_threshold INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS bottleneck_alert_enabled BOOLEAN DEFAULT true;

-- Index for SLA breach queries (pending approvals past their deadline)
CREATE INDEX IF NOT EXISTS idx_approval_requests_sla_pending
  ON approval_requests (org_id, status, sla_deadline)
  WHERE status = 'pending' AND sla_deadline IS NOT NULL AND sla_breached = false;

-- Index for bottleneck detection (pending approvals by assigned approvers)
CREATE INDEX IF NOT EXISTS idx_approval_requests_pending_approvers
  ON approval_requests USING GIN (assigned_approvers)
  WHERE status = 'pending';
