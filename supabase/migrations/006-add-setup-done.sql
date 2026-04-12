-- Add setup_done column to members table for onboarding flow
ALTER TABLE members ADD COLUMN IF NOT EXISTS setup_done BOOLEAN DEFAULT false;

-- Mark existing users as already set up (they have a display_name)
UPDATE members SET setup_done = true WHERE display_name IS NOT NULL AND display_name != '';
