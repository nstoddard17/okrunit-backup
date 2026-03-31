-- Add rejection reason presets to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS rejection_presets TEXT[] DEFAULT '{}';
