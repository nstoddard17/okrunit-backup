-- ---------------------------------------------------------------------------
-- Add can_connect permission to org_memberships
-- ---------------------------------------------------------------------------
-- Controls which members can create API connections and OAuth apps.
-- Defaults to true for owner/admin, false for others.
-- Follows the same pattern as can_approve.
-- ---------------------------------------------------------------------------

-- 1. Add column
ALTER TABLE org_memberships ADD COLUMN IF NOT EXISTS can_connect BOOLEAN NOT NULL DEFAULT false;

-- 2. Set to true for existing owners and admins
UPDATE org_memberships SET can_connect = true WHERE role IN ('owner', 'admin');

-- 3. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_org_memberships_can_connect ON org_memberships(org_id, can_connect);

-- 4. Also add to custom_roles
ALTER TABLE custom_roles ADD COLUMN IF NOT EXISTS can_connect BOOLEAN NOT NULL DEFAULT false;

-- 5. Trigger: owner/admin role always has can_connect = true
CREATE OR REPLACE FUNCTION enforce_admin_can_connect()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('owner', 'admin') THEN
    NEW.can_connect := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_admin_can_connect
  BEFORE INSERT OR UPDATE ON org_memberships
  FOR EACH ROW EXECUTE FUNCTION enforce_admin_can_connect();
