-- Migration 06: Add real_email to user_profiles for hotel-scoped staff auth
--
-- Staff accounts created by hotel owners are stored in auth.users with a
-- UUID-based internal email ({uuid}@staff.internal) so the same real-world
-- email can be used across different hotels without conflicts.
-- real_email stores the actual email the staff member uses to log in.
-- NULL means the account was self-registered (owner) and uses the real email
-- directly in auth.users.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS real_email TEXT;

-- Index for fast login lookup by real_email
CREATE INDEX IF NOT EXISTS idx_user_profiles_real_email ON user_profiles (real_email)
  WHERE real_email IS NOT NULL;
