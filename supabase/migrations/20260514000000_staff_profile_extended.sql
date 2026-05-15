-- ============================================================
-- Staff Profile Extended Fields
-- Adds JSONB preference columns and splits full_name into
-- first_name / last_name for the /dashboard/profile page.
-- Also expands the role CHECK to match all roles used in code.
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS first_name       TEXT,
  ADD COLUMN IF NOT EXISTS last_name        TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url       TEXT,
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS dept_prefs        JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS appearance_prefs  JSONB DEFAULT '{}'::jsonb;

-- Backfill first_name / last_name from existing full_name
UPDATE user_profiles
SET
  first_name = TRIM(SPLIT_PART(full_name, ' ', 1)),
  last_name  = TRIM(SUBSTRING(full_name FROM POSITION(' ' IN full_name) + 1))
WHERE full_name IS NOT NULL AND full_name <> '';

-- Expand role constraint to include all roles referenced in the codebase
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check CHECK (
    role IN (
      'owner', 'admin', 'manager',
      'front_desk', 'receptionist',
      'housekeeping', 'concierge',
      'accounting', 'maintenance',
      'security', 'staff', 'viewer'
    )
  );

-- Index for prefs lookups (GIN for JSONB)
CREATE INDEX IF NOT EXISTS user_profiles_notification_prefs_idx ON user_profiles USING GIN (notification_prefs);
CREATE INDEX IF NOT EXISTS user_profiles_dept_prefs_idx         ON user_profiles USING GIN (dept_prefs);
