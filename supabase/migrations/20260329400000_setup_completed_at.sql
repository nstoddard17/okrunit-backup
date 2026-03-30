-- Add setup_completed_at to user_profiles to track onboarding completion.
-- NULL means the user has not completed the setup wizard yet.
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS setup_completed_at timestamptz;

-- Backfill existing users as having completed setup so they aren't
-- forced through the wizard retroactively.
UPDATE user_profiles
  SET setup_completed_at = created_at
  WHERE setup_completed_at IS NULL;
