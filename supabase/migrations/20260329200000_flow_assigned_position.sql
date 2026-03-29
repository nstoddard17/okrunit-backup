-- ============================================================
-- Migration: Add position-based approval filtering to flows
-- When set, only team members holding this position can approve.
-- ============================================================

ALTER TABLE approval_flows
  ADD COLUMN IF NOT EXISTS assigned_position_id UUID
    REFERENCES team_positions(id) ON DELETE SET NULL;
