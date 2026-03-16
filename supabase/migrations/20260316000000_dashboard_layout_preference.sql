-- Add dashboard layout preference to notification_settings
-- Values: 'cards' (enhanced single column), 'grouped' (pending/resolved sections), 'split' (master-detail)

ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS dashboard_layout TEXT NOT NULL DEFAULT 'cards'
  CHECK (dashboard_layout IN ('cards', 'grouped', 'split'));
