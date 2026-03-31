-- ---------------------------------------------------------------------------
-- Add source field to approval_comments.
-- Tracks where the comment originated (e.g. 'dashboard', 'zapier', 'api').
-- ---------------------------------------------------------------------------

ALTER TABLE approval_comments
  ADD COLUMN source TEXT DEFAULT 'dashboard';
