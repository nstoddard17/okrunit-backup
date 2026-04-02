-- Add 'email' to the messaging_connections platform check constraint

ALTER TABLE messaging_connections DROP CONSTRAINT IF EXISTS messaging_connections_platform_check;
ALTER TABLE messaging_connections ADD CONSTRAINT messaging_connections_platform_check
  CHECK (platform IN ('discord', 'slack', 'teams', 'telegram', 'email'));
