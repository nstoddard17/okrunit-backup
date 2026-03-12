-- Teams + Role-Based Permissions Migration
-- 1. Add can_approve flag to org_memberships
-- 2. Create teams and team_memberships tables
-- 3. Add assigned_team_id to approval_requests

-- ============================================================
-- 1. APPROVAL PERMISSION FLAG
-- ============================================================

ALTER TABLE org_memberships
  ADD COLUMN can_approve BOOLEAN NOT NULL DEFAULT false;

-- Existing owners and admins can approve by default
UPDATE org_memberships SET can_approve = true WHERE role IN ('owner', 'admin');

-- ============================================================
-- 2. TEAMS TABLE
-- ============================================================

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (org_id, name)
);

CREATE TABLE team_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- ============================================================
-- 3. ASSIGNED TEAM ON APPROVAL REQUESTS
-- ============================================================

ALTER TABLE approval_requests
  ADD COLUMN assigned_team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX idx_teams_org_id ON teams(org_id);
CREATE INDEX idx_team_memberships_team_id ON team_memberships(team_id);
CREATE INDEX idx_team_memberships_user_id ON team_memberships(user_id);
CREATE INDEX idx_org_memberships_can_approve ON org_memberships(org_id, can_approve) WHERE can_approve = true;
CREATE INDEX idx_approval_requests_assigned_team_id ON approval_requests(assigned_team_id) WHERE assigned_team_id IS NOT NULL;

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

CREATE TRIGGER set_updated_at BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_memberships ENABLE ROW LEVEL SECURITY;

-- Teams: org-scoped
CREATE POLICY "Users can view org teams" ON teams
  FOR SELECT USING (org_id = auth_org_id());
CREATE POLICY "Admins can create teams" ON teams
  FOR INSERT WITH CHECK (org_id = auth_org_id());
CREATE POLICY "Admins can update org teams" ON teams
  FOR UPDATE USING (org_id = auth_org_id())
  WITH CHECK (org_id = auth_org_id());
CREATE POLICY "Admins can delete org teams" ON teams
  FOR DELETE USING (org_id = auth_org_id());

-- Team memberships: org-scoped via team
CREATE POLICY "Users can view team memberships in org" ON team_memberships
  FOR SELECT USING (
    team_id IN (SELECT id FROM teams WHERE org_id = auth_org_id())
  );
CREATE POLICY "Admins can add team members" ON team_memberships
  FOR INSERT WITH CHECK (
    team_id IN (SELECT id FROM teams WHERE org_id = auth_org_id())
  );
CREATE POLICY "Admins can remove team members" ON team_memberships
  FOR DELETE USING (
    team_id IN (SELECT id FROM teams WHERE org_id = auth_org_id())
  );

-- ============================================================
-- 7. REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE teams;
