-- ---------------------------------------------------------------------------
-- Notification Categories & Request Watchers
-- ---------------------------------------------------------------------------
-- 1. Adds 'approval_created' notification category for FYI-style notifications
-- 2. Creates request_watchers table for following request progress
-- ---------------------------------------------------------------------------

-- 1. New notification category: FYI when a request is created (no action needed)
ALTER TYPE notification_category ADD VALUE IF NOT EXISTS 'approval_created';

-- 2. Request watchers table
CREATE TABLE request_watchers (
  request_id UUID NOT NULL REFERENCES approval_requests(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (request_id, user_id)
);

-- Index for fast lookup of watchers per request
CREATE INDEX idx_request_watchers_request ON request_watchers(request_id);
-- Index for fast lookup of what a user is watching
CREATE INDEX idx_request_watchers_user ON request_watchers(user_id);

-- RLS
ALTER TABLE request_watchers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view watchers for org requests"
  ON request_watchers FOR SELECT
  USING (
    request_id IN (
      SELECT id FROM approval_requests WHERE org_id = auth_org_id()
    )
  );

CREATE POLICY "Users can watch org requests"
  ON request_watchers FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND request_id IN (
      SELECT id FROM approval_requests WHERE org_id = auth_org_id()
    )
  );

CREATE POLICY "Users can unwatch"
  ON request_watchers FOR DELETE
  USING (user_id = auth.uid());

-- Realtime
GRANT SELECT ON request_watchers TO supabase_realtime_admin;
ALTER PUBLICATION supabase_realtime ADD TABLE request_watchers;
ALTER TABLE request_watchers REPLICA IDENTITY FULL;
