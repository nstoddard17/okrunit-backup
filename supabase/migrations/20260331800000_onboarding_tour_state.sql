-- Store onboarding tour progress per user in the database
-- so it persists across browsers and devices
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS onboarding_tour_step INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_tour_completed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_tour_dismissed BOOLEAN DEFAULT false;
