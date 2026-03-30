-- ---------------------------------------------------------------------------
-- In-App Notifications
-- ---------------------------------------------------------------------------
-- Stores user-targeted notifications for the notification panel.
-- Each row is a notification for a specific user about something relevant
-- to them (approval awaiting review, decision on their request, team invite, etc.)
-- ---------------------------------------------------------------------------

CREATE TYPE notification_category AS ENUM (
  'approval_awaiting',       -- a request needs your approval
  'approval_decided',        -- a request you submitted was approved/rejected
  'flow_step_decided',       -- a step in a flow you own was decided
  'approval_expiring',       -- a request assigned to you is about to expire
  'team_invite',             -- you were invited to an organization
  'team_added',              -- you were added to a team
  'flow_assigned',           -- you were assigned as approver on a flow
  'welcome'                  -- welcome notification on first sign-in
);

CREATE TABLE in_app_notifications (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  category      notification_category NOT NULL,

  -- Display fields
  title         text NOT NULL,
  body          text,                       -- optional longer description
  icon_url      text,                       -- optional avatar/logo URL

  -- Actor: who triggered this notification (nullable for system notifications)
  actor_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name    text,                       -- denormalized for display without joins

  -- Linked resource
  resource_type text,                       -- 'approval_request', 'team', 'org_invite', 'flow', etc.
  resource_id   uuid,                       -- ID of the linked resource

  -- Read state
  is_read       boolean NOT NULL DEFAULT false,
  read_at       timestamptz,

  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Indexes for fast queries
CREATE INDEX idx_in_app_notifications_user_unread
  ON in_app_notifications (user_id, is_read, created_at DESC)
  WHERE is_read = false;

CREATE INDEX idx_in_app_notifications_user_feed
  ON in_app_notifications (user_id, created_at DESC);

-- RLS
ALTER TABLE in_app_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
  ON in_app_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update (mark read) their own notifications
CREATE POLICY "Users can update own notifications"
  ON in_app_notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Only the service role inserts notifications (via admin client)
-- No INSERT policy needed for regular users.
