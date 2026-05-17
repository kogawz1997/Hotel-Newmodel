-- ============================================================
-- 0008_multi_role_support.sql
-- Allow 1 staff member to hold multiple roles within the same hotel.
-- Primary role stays in user_profiles.role (for sidebar/navigation).
-- Additional roles live in user_additional_roles.
-- Permission checks union all roles together.
-- ============================================================

-- ─── Table ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_additional_roles (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        NOT NULL REFERENCES user_profiles(id)  ON DELETE CASCADE,
  hotel_id   UUID        NOT NULL REFERENCES hotels(id)         ON DELETE CASCADE,
  role       TEXT        NOT NULL,
  granted_by UUID        REFERENCES user_profiles(id)           ON DELETE SET NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT user_additional_roles_unique UNIQUE (user_id, hotel_id, role),
  CONSTRAINT user_additional_roles_role_check CHECK (
    role IN (
      'hotel_owner', 'owner', 'general_manager', 'operations_manager',
      'admin', 'manager',
      'front_office_manager', 'front_desk', 'receptionist',
      'reservation_agent', 'night_auditor',
      'chat_admin', 'guest_relations',
      'housekeeping_manager', 'housekeeping', 'housekeeper', 'room_inspector',
      'maintenance_manager', 'maintenance', 'technician', 'engineering',
      'fnb_manager', 'kitchen_staff', 'room_service_staff', 'restaurant_staff',
      'concierge', 'bellboy', 'transport_driver',
      'revenue_manager', 'marketing_staff', 'sales',
      'accounting_manager', 'accounting', 'accounting_staff',
      'purchasing_manager', 'purchasing_staff', 'purchasing',
      'hr_manager', 'hr_staff',
      'spa_manager', 'spa_staff',
      'security_manager', 'security', 'security_staff',
      'it_admin', 'it_support',
      'dept_head', 'shift_supervisor', 'staff', 'viewer'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_user_additional_roles_user
  ON user_additional_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_additional_roles_hotel
  ON user_additional_roles(hotel_id);

CREATE INDEX IF NOT EXISTS idx_user_additional_roles_user_hotel
  ON user_additional_roles(user_id, hotel_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE user_additional_roles ENABLE ROW LEVEL SECURITY;

-- Staff can see their own additional roles
CREATE POLICY user_additional_roles_self_select
  ON user_additional_roles FOR SELECT
  USING (user_id = auth.uid());

-- Managers can see additional roles for staff in their hotel
CREATE POLICY user_additional_roles_manager_select
  ON user_additional_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      JOIN hotels h ON h.organization_id = p.organization_id
      WHERE p.id = auth.uid()
        AND p.role IN ('owner','admin','manager','general_manager',
                       'hotel_owner','operations_manager','hr_manager')
        AND h.id = user_additional_roles.hotel_id
    )
  );

-- Managers can grant additional roles
CREATE POLICY user_additional_roles_manager_insert
  ON user_additional_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles p
      JOIN hotels h ON h.organization_id = p.organization_id
      WHERE p.id = auth.uid()
        AND p.role IN ('owner','admin','manager','general_manager',
                       'hotel_owner','operations_manager','hr_manager')
        AND h.id = user_additional_roles.hotel_id
    )
  );

-- Managers can revoke additional roles
CREATE POLICY user_additional_roles_manager_delete
  ON user_additional_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles p
      JOIN hotels h ON h.organization_id = p.organization_id
      WHERE p.id = auth.uid()
        AND p.role IN ('owner','admin','manager','general_manager',
                       'hotel_owner','operations_manager','hr_manager')
        AND h.id = user_additional_roles.hotel_id
    )
  );

-- Service role has full access
CREATE POLICY user_additional_roles_service_role
  ON user_additional_roles FOR ALL
  USING (auth.role() = 'service_role');

-- ─── Helper function ──────────────────────────────────────────────────────────
-- Returns all roles (primary + additional) for a user in a hotel as a text array.
-- Used by API layer to compute union permissions.

CREATE OR REPLACE FUNCTION get_user_all_roles(p_user_id UUID, p_hotel_id UUID)
RETURNS TEXT[]
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT ARRAY(
    SELECT DISTINCT role FROM (
      -- primary role from user_profiles
      SELECT role FROM user_profiles WHERE id = p_user_id
      UNION ALL
      -- additional roles for this hotel
      SELECT role FROM user_additional_roles
      WHERE user_id = p_user_id AND hotel_id = p_hotel_id
    ) combined
    WHERE role IS NOT NULL
  );
$$;

GRANT EXECUTE ON FUNCTION get_user_all_roles TO authenticated, service_role;

-- ─── Audit log trigger ────────────────────────────────────────────────────────
-- Write to audit_logs whenever a role is granted or revoked.

CREATE OR REPLACE FUNCTION audit_user_additional_role_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (hotel_id, user_id, action, entity_type, entity_id, changes)
    VALUES (
      NEW.hotel_id,
      auth.uid(),
      'role_granted',
      'user_additional_roles',
      NEW.id,
      jsonb_build_object(
        'target_user_id', NEW.user_id,
        'role', NEW.role,
        'granted_by', NEW.granted_by
      )
    );
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (hotel_id, user_id, action, entity_type, entity_id, changes)
    VALUES (
      OLD.hotel_id,
      auth.uid(),
      'role_revoked',
      'user_additional_roles',
      OLD.id,
      jsonb_build_object(
        'target_user_id', OLD.user_id,
        'role', OLD.role
      )
    );
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_audit_user_additional_role
  AFTER INSERT OR DELETE ON user_additional_roles
  FOR EACH ROW EXECUTE FUNCTION audit_user_additional_role_change();
