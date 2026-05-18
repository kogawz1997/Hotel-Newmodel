-- Allow authenticated guests to read and update their own guest_accounts record.
-- Without these policies, RLS blocks all client-side reads → portal redirect loop.

ALTER TABLE guest_accounts ENABLE ROW LEVEL SECURITY;

-- Drop first so this script is safe to re-run
DROP POLICY IF EXISTS "guests_select_own" ON guest_accounts;
DROP POLICY IF EXISTS "guests_update_own" ON guest_accounts;

-- Guests can read their own account
CREATE POLICY "guests_select_own"
  ON guest_accounts FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Guests can update their own account (profile page)
CREATE POLICY "guests_update_own"
  ON guest_accounts FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role retains full access (admin client bypasses RLS anyway)
