-- ---------------------------------------------------------------------------
-- OKRunit -- Risk Scoring + Approval Delegation
-- ---------------------------------------------------------------------------

-- ---- Risk scoring columns on approval_requests ----------------------------

ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS risk_score INTEGER,
  ADD COLUMN IF NOT EXISTS risk_level TEXT,
  ADD COLUMN IF NOT EXISTS risk_factors JSONB;

-- ---- Delegation columns on approval_requests ------------------------------

ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS delegated_from UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS delegation_id UUID;

-- ---- Approval delegations table -------------------------------------------

CREATE TABLE IF NOT EXISTS approval_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  delegator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delegate_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(org_id, delegator_id, delegate_id)
);

ALTER TABLE approval_delegations ENABLE ROW LEVEL SECURITY;

-- RLS: org members can read delegations in their org
CREATE POLICY "org_members_read_delegations"
  ON approval_delegations
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
    )
  );

-- RLS: users can create delegations where they are the delegator
CREATE POLICY "delegator_create_delegations"
  ON approval_delegations
  FOR INSERT
  WITH CHECK (
    delegator_id = auth.uid()
    AND org_id IN (
      SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
    )
  );

-- RLS: delegators can update (deactivate) their own delegations
CREATE POLICY "delegator_update_delegations"
  ON approval_delegations
  FOR UPDATE
  USING (
    delegator_id = auth.uid()
    AND org_id IN (
      SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
    )
  );

-- Index for fast delegation lookups
CREATE INDEX IF NOT EXISTS idx_delegations_org_delegator
  ON approval_delegations(org_id, delegator_id)
  WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_delegations_org_delegate
  ON approval_delegations(org_id, delegate_id)
  WHERE is_active = true;
