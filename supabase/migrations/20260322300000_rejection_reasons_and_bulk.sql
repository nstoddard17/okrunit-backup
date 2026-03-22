-- ---------------------------------------------------------------------------
-- Phase 16: Rejection Reason Controls + Bulk Approval Rules
-- ---------------------------------------------------------------------------

-- 1. Org-level rejection reason requirement
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS rejection_reason_policy TEXT NOT NULL DEFAULT 'optional'
    CHECK (rejection_reason_policy IN ('optional', 'required', 'required_high_critical'));

-- 2. Per-request override for rejection reason requirement
ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS require_rejection_reason BOOLEAN DEFAULT false;

-- 3. Bulk approval rules table
CREATE TABLE IF NOT EXISTS bulk_approval_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  action TEXT NOT NULL CHECK (action IN ('approve', 'reject', 'archive')),
  -- Filter criteria
  status_filter TEXT DEFAULT 'pending',
  priority_filter TEXT[],
  source_filter TEXT[],
  action_type_filter TEXT[],
  older_than_minutes INTEGER,
  -- Scheduling
  is_scheduled BOOLEAN DEFAULT false,
  schedule_cron TEXT,
  -- State
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  last_run_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. RLS for bulk_approval_rules
ALTER TABLE bulk_approval_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bulk_approval_rules_org_read"
  ON bulk_approval_rules FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "bulk_approval_rules_org_insert"
  ON bulk_approval_rules FOR INSERT
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "bulk_approval_rules_org_update"
  ON bulk_approval_rules FOR UPDATE
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "bulk_approval_rules_org_delete"
  ON bulk_approval_rules FOR DELETE
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- 5. Index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_bulk_approval_rules_org_id
  ON bulk_approval_rules(org_id);

-- 6. Auto-update updated_at trigger (reuse existing function if available)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bulk_approval_rules_updated_at
  BEFORE UPDATE ON bulk_approval_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
