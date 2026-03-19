-- ============================================================================
-- Migration: Add apply_for_next to approval_flows
-- Allows users to set flow configuration to expire after N requests.
-- NULL = permanent (forever), 0 = expired (config no longer applies),
-- positive integer = decremented on each new request until it hits 0.
-- ============================================================================

ALTER TABLE approval_flows
  ADD COLUMN IF NOT EXISTS apply_for_next INTEGER DEFAULT NULL
  CHECK (apply_for_next IS NULL OR apply_for_next >= 0);

COMMENT ON COLUMN approval_flows.apply_for_next IS
  'Number of remaining requests this flow config applies to. NULL = forever, 0 = expired.';
