-- ---------------------------------------------------------------------------
-- Trust Counters (auto-approve after N consecutive approvals) +
-- Time-based auto-action fields on approval_requests and organizations
-- ---------------------------------------------------------------------------

-- ---- Trust Counters --------------------------------------------------------

CREATE TABLE approval_trust_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  -- Match criteria (what kind of request this counter tracks)
  match_field TEXT NOT NULL CHECK (match_field IN ('action_type', 'source', 'title_pattern', 'connection_id')),
  match_value TEXT NOT NULL,
  -- Counter state
  consecutive_approvals INTEGER NOT NULL DEFAULT 0,
  total_approvals INTEGER NOT NULL DEFAULT 0,
  total_rejections INTEGER NOT NULL DEFAULT 0,
  last_decision TEXT CHECK (last_decision IS NULL OR last_decision IN ('approved', 'rejected')),
  last_decision_at TIMESTAMPTZ,
  -- Auto-approve threshold
  auto_approve_threshold INTEGER, -- NULL = never auto-approve
  auto_approve_active BOOLEAN NOT NULL DEFAULT false, -- true when threshold reached
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, match_field, match_value)
);

ALTER TABLE approval_trust_counters ENABLE ROW LEVEL SECURITY;

-- RLS: org members can view their org's counters
CREATE POLICY "org_members_select_trust_counters"
  ON approval_trust_counters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = approval_trust_counters.org_id
        AND org_memberships.user_id = auth.uid()
    )
  );

-- RLS: org admins/owners can insert, update, delete
CREATE POLICY "org_admins_manage_trust_counters"
  ON approval_trust_counters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM org_memberships
      WHERE org_memberships.org_id = approval_trust_counters.org_id
        AND org_memberships.user_id = auth.uid()
        AND org_memberships.role IN ('admin', 'owner')
    )
  );

-- Index for fast lookups during approval creation
CREATE INDEX idx_trust_counters_org_active
  ON approval_trust_counters (org_id)
  WHERE auto_approve_active = true;

CREATE INDEX idx_trust_counters_org_field
  ON approval_trust_counters (org_id, match_field, match_value);

-- ---- Auto-action fields on approval_requests ------------------------------

ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS auto_action TEXT CHECK (auto_action IS NULL OR auto_action IN ('approve', 'reject')),
  ADD COLUMN IF NOT EXISTS auto_action_after_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS auto_action_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_action_warning_sent BOOLEAN DEFAULT false;

-- Index for lazy deadline checks
CREATE INDEX idx_approval_requests_auto_deadline
  ON approval_requests (auto_action_deadline)
  WHERE status = 'pending' AND auto_action_deadline IS NOT NULL;

-- ---- Org-level auto-action defaults ---------------------------------------

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS default_auto_action TEXT CHECK (default_auto_action IS NULL OR default_auto_action IN ('approve', 'reject')),
  ADD COLUMN IF NOT EXISTS default_auto_action_minutes INTEGER;
