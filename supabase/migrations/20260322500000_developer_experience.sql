-- ---------------------------------------------------------------------------
-- Phase 18: Developer Experience -- GitHub App Installations
-- ---------------------------------------------------------------------------

-- GitHub App installations linked to organizations
CREATE TABLE github_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  installation_id INTEGER NOT NULL UNIQUE,
  account_login TEXT NOT NULL,
  account_type TEXT NOT NULL, -- 'User' or 'Organization'
  repositories JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for looking up by installation_id (used in webhook handler)
CREATE INDEX idx_github_installations_installation_id
  ON github_installations(installation_id);

-- Index for looking up by org_id
CREATE INDEX idx_github_installations_org_id
  ON github_installations(org_id);

-- Enable RLS
ALTER TABLE github_installations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: org members can read their own installations
CREATE POLICY "org_members_read_github_installations"
  ON github_installations
  FOR SELECT
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships WHERE user_id = auth.uid()
    )
  );

-- Only admins/owners can insert/update/delete installations
CREATE POLICY "org_admins_manage_github_installations"
  ON github_installations
  FOR ALL
  USING (
    org_id IN (
      SELECT org_id FROM org_memberships
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- Index on approval_requests source+metadata for faster GitHub PR lookups
CREATE INDEX idx_approval_requests_github_source
  ON approval_requests(org_id, source)
  WHERE source = 'github';
