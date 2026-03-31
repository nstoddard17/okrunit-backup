-- Per-day quiet hours schedule
-- JSONB with day-of-week keys (0=Sun, 1=Mon, ..., 6=Sat)
-- Value: { start: "22:00", end: "08:00" } or null (no quiet hours that day)
ALTER TABLE notification_settings
  ADD COLUMN IF NOT EXISTS quiet_hours_schedule JSONB DEFAULT NULL;
