-- Add source_url column to approval_flows for deep linking back to the source workflow
ALTER TABLE approval_flows ADD COLUMN IF NOT EXISTS source_url TEXT;
