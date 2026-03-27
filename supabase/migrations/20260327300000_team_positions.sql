-- ============================================================
-- Migration: Team positions system
-- Adds configurable positions per team and position assignment on memberships
-- ============================================================

-- Positions defined per team (e.g. "Lead", "Reviewer", "On-Call")
CREATE TABLE IF NOT EXISTS team_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, name)
);

-- Add position reference to team memberships
ALTER TABLE team_memberships
  ADD COLUMN IF NOT EXISTS position_id UUID REFERENCES team_positions(id) ON DELETE SET NULL;

-- RLS
ALTER TABLE team_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view positions for their org teams" ON team_positions
  FOR SELECT USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN org_memberships om ON om.org_id = t.org_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage positions" ON team_positions
  FOR ALL USING (
    team_id IN (
      SELECT t.id FROM teams t
      JOIN org_memberships om ON om.org_id = t.org_id
      WHERE om.user_id = auth.uid() AND om.role IN ('owner', 'admin')
    )
  );
