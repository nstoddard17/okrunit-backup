-- ---------------------------------------------------------------------------
-- Dashboard enhancements
-- ---------------------------------------------------------------------------
-- 1. Add skip_approval_confirmation to notification_settings
-- 2. Add source column to approval_requests for display purposes
-- ---------------------------------------------------------------------------

-- User preference: skip confirmation dialog when approving/rejecting
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS skip_approval_confirmation BOOLEAN NOT NULL DEFAULT false;

-- Source of the approval request (e.g. 'zapier', 'n8n', 'make', 'api')
ALTER TABLE approval_requests
  ADD COLUMN IF NOT EXISTS source TEXT;
