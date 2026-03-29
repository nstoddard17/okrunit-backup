-- ---------------------------------------------------------------------------
-- Add plan_override column to organizations.
-- When set, billing enforcement uses this plan instead of the subscription.
-- Used by app admins for testing and internal orgs.
-- ---------------------------------------------------------------------------

ALTER TABLE organizations
  ADD COLUMN plan_override TEXT
  REFERENCES plans(id)
  DEFAULT NULL;

COMMENT ON COLUMN organizations.plan_override IS
  'When set, overrides the subscription plan for billing enforcement. Used by app admins.';
