-- ---------------------------------------------------------------------------
-- Add Discord notification channel support
-- ---------------------------------------------------------------------------

-- Add discord fields to notification_settings
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS discord_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS discord_webhook_url text;

-- Update decision_source CHECK constraint to include 'discord'
ALTER TABLE approval_requests DROP CONSTRAINT IF EXISTS approval_requests_decision_source_check;
ALTER TABLE approval_requests ADD CONSTRAINT approval_requests_decision_source_check
  CHECK (decision_source IN ('dashboard', 'email', 'slack', 'discord', 'teams', 'telegram', 'push', 'api', 'auto_rule', 'batch'));

-- Update vote source CHECK constraint to include 'discord'
ALTER TABLE approval_votes DROP CONSTRAINT IF EXISTS approval_votes_source_check;
ALTER TABLE approval_votes ADD CONSTRAINT approval_votes_source_check
  CHECK (source IN ('dashboard', 'email', 'slack', 'discord', 'teams', 'telegram', 'push', 'api'));
