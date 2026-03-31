-- ---------------------------------------------------------------------------
-- Enable Realtime for approval_comments so comments appear instantly.
-- ---------------------------------------------------------------------------

ALTER TABLE approval_comments REPLICA IDENTITY FULL;

-- Add to the supabase_realtime publication so Realtime picks up changes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'approval_comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE approval_comments;
  END IF;
END $$;
