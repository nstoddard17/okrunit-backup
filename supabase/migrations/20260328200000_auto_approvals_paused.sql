-- Add auto_approvals_paused column to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS auto_approvals_paused BOOLEAN NOT NULL DEFAULT FALSE;
