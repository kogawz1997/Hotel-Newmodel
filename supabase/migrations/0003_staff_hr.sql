
-- ============================================================
-- Merged from: 20260511041344_p1_create_reservation_rpc.sql
-- ============================================================

-- P1: Atomic reservation creation RPC
-- Wraps guest upsert + reservation insert + idempotency key + folio + audit log
-- in a single transaction so partial failures leave no orphaned rows.

CREATE OR REPLACE FUNCTION create_reservation_atomic(
  p_hotel_id          UUID,
  p_room_type_id      UUID,
  p_room_id           UUID,
  p_check_in          DATE,
  p_check_out         DATE,
  p_num_adults        SMALLINT,
  p_num_children      SMALLINT,
  p_total_amount      NUMERIC,
  p_deposit_amount    NUMERIC,
  p_payment_method    TEXT,
  p_source            TEXT,
  p_status            TEXT,
  p_cancellation_policy JSONB,
  p_rate_plan_id      UUID,
  -- Guest fields
  p_first_name        TEXT,
  p_last_name         TEXT,
  p_email             TEXT,
  p_phone             TEXT,
  p_nationality       TEXT,
  p_special_requests  TEXT,
  -- Idempotency
  p_idempotency_key   TEXT,
  -- Actor
  p_actor_user_id     UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_id          UUID;
  v_reservation_id    UUID;
  v_reservation_code  TEXT;
  v_folio_id          UUID;
  v_existing_res_id   UUID;
BEGIN
  -- Check idempotency first (before any writes)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT reservation_id INTO v_existing_res_id
    FROM reservation_idempotency_keys
    WHERE hotel_id = p_hotel_id
      AND idempotency_key = p_idempotency_key;

    IF v_existing_res_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'reservation_id', v_existing_res_id,
        'idempotent_replay', true
      );
    END IF;
  END IF;

  -- Upsert guest (match on email or phone within hotel)
  IF p_email IS NOT NULL THEN
    SELECT id INTO v_guest_id FROM guests
    WHERE hotel_id = p_hotel_id AND email = p_email
    LIMIT 1;
  END IF;

  IF v_guest_id IS NULL AND p_phone IS NOT NULL THEN
    SELECT id INTO v_guest_id FROM guests
    WHERE hotel_id = p_hotel_id AND phone = p_phone
    LIMIT 1;
  END IF;

  IF v_guest_id IS NULL THEN
    INSERT INTO guests (hotel_id, first_name, last_name, email, phone, nationality)
    VALUES (p_hotel_id, p_first_name, p_last_name, p_email, p_phone, p_nationality)
    RETURNING id INTO v_guest_id;
  END IF;

  -- Create reservation
  INSERT INTO reservations (
    hotel_id, guest_id, room_id, room_type_id, rate_plan_id,
    check_in, check_out, num_adults, num_children,
    total_amount, deposit_amount, payment_method, payment_status,
    source, status, cancellation_policy, special_requests
  ) VALUES (
    p_hotel_id, v_guest_id, p_room_id, p_room_type_id, p_rate_plan_id,
    p_check_in, p_check_out, p_num_adults, p_num_children,
    p_total_amount, p_deposit_amount, p_payment_method,
    CASE WHEN p_status = 'confirmed' THEN 'unpaid' ELSE 'pending' END,
    p_source, p_status, p_cancellation_policy, p_special_requests
  )
  RETURNING id, reservation_code INTO v_reservation_id, v_reservation_code;

  -- Record idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO reservation_idempotency_keys (hotel_id, idempotency_key, reservation_id)
    VALUES (p_hotel_id, p_idempotency_key, v_reservation_id)
    ON CONFLICT (hotel_id, idempotency_key) DO NOTHING;
  END IF;

  -- Create folio
  INSERT INTO folios (reservation_id, hotel_id, status, total_charges, balance)
  VALUES (v_reservation_id, p_hotel_id, 'open', p_total_amount, p_total_amount)
  RETURNING id INTO v_folio_id;

  -- Audit log
  INSERT INTO audit_logs (hotel_id, user_id, action, entity_type, entity_id, changes)
  VALUES (
    p_hotel_id, p_actor_user_id,
    'reservation.created',
    'reservation', v_reservation_id,
    jsonb_build_object(
      'source', p_source,
      'totalAmount', p_total_amount,
      'via', 'rpc_atomic'
    )
  );

  RETURN jsonb_build_object(
    'reservation_id',   v_reservation_id,
    'reservation_code', v_reservation_code,
    'guest_id',         v_guest_id,
    'folio_id',         v_folio_id,
    'idempotent_replay', false
  );
END;
$$;

-- Grant to service role only (API uses admin/service client)
REVOKE ALL ON FUNCTION create_reservation_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_reservation_atomic TO service_role;


-- ============================================================
-- Merged from: 20260512000000_f5_merge_receptionist_to_front_desk.sql
-- ============================================================

-- F.5: Merge receptionist role into front_desk
-- receptionist and front_desk had identical permissions; consolidate to one role.
UPDATE user_profiles SET role = 'front_desk' WHERE role = 'receptionist';


-- ============================================================
-- Merged from: 20260514000000_staff_profile_extended.sql
-- ============================================================

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


-- ============================================================
-- Merged from: 20260514100000_department_work_tables.sql
-- ============================================================

-- ============================================================
-- Department Work Tables
-- Adds concierge_requests, security_incidents, visitor_log
-- to support the full department work pages.
-- ============================================================

-- Concierge: guest service requests
CREATE TABLE IF NOT EXISTS concierge_requests (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id      UUID        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID       REFERENCES reservations(id),
  guest_id      UUID        REFERENCES guests(id),
  category      TEXT        NOT NULL DEFAULT 'other',
  -- 'transportation', 'dining', 'activity', 'room_service', 'laundry', 'tour', 'other'
  title         TEXT        NOT NULL,
  description   TEXT,
  status        TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  priority      TEXT        NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to   UUID        REFERENCES user_profiles(id),
  scheduled_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS concierge_requests_hotel_status_idx
  ON concierge_requests (hotel_id, status, created_at DESC);

-- Security: incident log
CREATE TABLE IF NOT EXISTS security_incidents (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id      UUID        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL DEFAULT 'other',
  -- 'theft', 'disturbance', 'medical', 'fire', 'access', 'damage', 'other'
  title         TEXT        NOT NULL,
  description   TEXT,
  location      TEXT,
  severity      TEXT        NOT NULL DEFAULT 'low'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status        TEXT        NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  reported_by   UUID        REFERENCES user_profiles(id),
  resolved_by   UUID        REFERENCES user_profiles(id),
  resolved_at   TIMESTAMPTZ,
  action_taken  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS security_incidents_hotel_status_idx
  ON security_incidents (hotel_id, status, created_at DESC);

-- Security: visitor check-in/out log
CREATE TABLE IF NOT EXISTS visitor_log (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id        UUID        NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  visitor_name    TEXT        NOT NULL,
  visiting_room   TEXT,
  visiting_guest  TEXT,
  purpose         TEXT,
  id_type         TEXT        DEFAULT 'id_card',
  -- 'id_card', 'passport', 'driving_license'
  id_number       TEXT,
  vehicle_plate   TEXT,
  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checked_out_at  TIMESTAMPTZ,
  logged_by       UUID        REFERENCES user_profiles(id),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS visitor_log_hotel_checkout_idx
  ON visitor_log (hotel_id, checked_out_at, checked_in_at DESC);

-- RLS: same-hotel access for operations staff
ALTER TABLE concierge_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_incidents  ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitor_log         ENABLE ROW LEVEL SECURITY;

-- Allow same-org hotel users full access (simplified for now)
CREATE POLICY concierge_requests_hotel_access ON concierge_requests
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN user_profiles up ON up.organization_id = h.organization_id
      WHERE up.id = auth.uid()
    )
  );

CREATE POLICY security_incidents_hotel_access ON security_incidents
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN user_profiles up ON up.organization_id = h.organization_id
      WHERE up.id = auth.uid()
    )
  );

CREATE POLICY visitor_log_hotel_access ON visitor_log
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN user_profiles up ON up.organization_id = h.organization_id
      WHERE up.id = auth.uid()
    )
  );


-- ============================================================
-- Merged from: 20260601000000_expanded_roles.sql
-- ============================================================

-- Expand role constraint to all 35 hotel + platform roles
ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check CHECK (
    role IN (
      -- Management
      'hotel_owner', 'owner', 'general_manager', 'operations_manager',
      'admin', 'manager',
      -- Front of House
      'front_office_manager', 'front_desk', 'receptionist',
      'reservation_agent', 'night_auditor',
      -- Communications
      'chat_admin', 'guest_relations',
      -- Housekeeping
      'housekeeping_manager', 'housekeeping', 'housekeeper', 'room_inspector',
      -- Engineering
      'maintenance_manager', 'maintenance', 'technician', 'engineering',
      -- F&B
      'fnb_manager', 'kitchen_staff', 'room_service_staff', 'restaurant_staff',
      -- Guest Services
      'concierge', 'bellboy', 'transport_driver',
      -- Revenue & Marketing
      'revenue_manager', 'marketing_staff', 'sales',
      -- Back of House
      'accounting_manager', 'accounting', 'accounting_staff',
      'purchasing_manager', 'purchasing_staff', 'purchasing',
      -- HR
      'hr_manager', 'hr_staff',
      -- Spa
      'spa_manager', 'spa_staff',
      -- Security
      'security_manager', 'security', 'security_staff',
      -- IT
      'it_admin', 'it_support',
      -- Platform (SaaS)
      'platform_owner', 'billing_admin', 'support_admin',
      'platform_ops', 'security_admin', 'sales_admin',
      'product_admin', 'dev_admin',
      -- Generic
      'dept_head', 'shift_supervisor', 'staff', 'viewer'
    )
  );


-- ============================================================
-- Merged from: 20260601100000_attendance_shifts.sql
-- ============================================================

-- Attendance & Shift Management tables

CREATE TABLE IF NOT EXISTS shifts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                          -- e.g. "Morning", "Evening", "Night"
  dept          TEXT,                                   -- NULL = all depts
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  color         TEXT DEFAULT '#6366f1',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shift_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  shift_id      UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  work_date     DATE NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (staff_id, work_date)                          -- one shift per staff per day
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  shift_id      UUID REFERENCES shifts(id),
  work_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in_at   TIMESTAMPTZ,
  clock_out_at  TIMESTAMPTZ,
  break_start   TIMESTAMPTZ,
  break_end     TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','clocked_in','on_break','clocked_out','absent','late')),
  late_minutes  INT DEFAULT 0,
  overtime_mins INT DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (staff_id, work_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS attendance_records_hotel_date_idx ON attendance_records(hotel_id, work_date);
CREATE INDEX IF NOT EXISTS attendance_records_staff_idx      ON attendance_records(staff_id);
CREATE INDEX IF NOT EXISTS shift_assignments_hotel_date_idx  ON shift_assignments(hotel_id, work_date);

-- RLS
ALTER TABLE shifts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY shifts_org ON shifts
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY shift_assignments_org ON shift_assignments
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY attendance_org ON attendance_records
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));


-- ============================================================
-- Merged from: 20260601200000_work_orders.sql
-- ============================================================

-- Work Orders + Task Auto-Router tables

CREATE TABLE IF NOT EXISTS work_orders (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type           TEXT NOT NULL
                   CHECK (type IN ('housekeeping','maintenance','room_service','concierge',
                                   'security','transport','bellboy','fnb','spa','other')),
  title          TEXT NOT NULL,
  description    TEXT,
  room_no        TEXT,
  priority       TEXT NOT NULL DEFAULT 'normal'
                   CHECK (priority IN ('low','normal','high','urgent')),
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','assigned','in_progress','done','cancelled')),
  assigned_to    UUID REFERENCES user_profiles(id),
  requested_by   UUID REFERENCES user_profiles(id),  -- staff who created it, or NULL if from guest
  guest_name     TEXT,                                -- if from guest request
  queue_position INT DEFAULT 0,
  auto_routed    BOOLEAN DEFAULT false,
  source         TEXT DEFAULT 'manual'
                   CHECK (source IN ('manual','guest_request','inbox','room_qr','ota','auto')),
  sla_minutes    INT DEFAULT 30,
  sla_deadline   TIMESTAMPTZ,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS task_assignments (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id  UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  staff_id       UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  assigned_at    TIMESTAMPTZ DEFAULT now(),
  accepted_at    TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  rejected_at    TIMESTAMPTZ,
  reject_reason  TEXT
);

CREATE TABLE IF NOT EXISTS task_photos (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id  UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  uploaded_by    UUID REFERENCES user_profiles(id),
  photo_url      TEXT NOT NULL,
  photo_type     TEXT DEFAULT 'proof'
                   CHECK (photo_type IN ('before','after','proof','inspection')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Staff availability (updated when work_order status changes)
CREATE TABLE IF NOT EXISTS staff_availability (
  staff_id       UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  is_available   BOOLEAN DEFAULT true,
  current_task_id UUID REFERENCES work_orders(id),
  active_tasks   INT DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS work_orders_hotel_status_idx ON work_orders(hotel_id, status);
CREATE INDEX IF NOT EXISTS work_orders_hotel_type_idx   ON work_orders(hotel_id, type);
CREATE INDEX IF NOT EXISTS work_orders_assigned_idx     ON work_orders(assigned_to);
CREATE INDEX IF NOT EXISTS task_assignments_order_idx   ON task_assignments(work_order_id);

-- RLS
ALTER TABLE work_orders       ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_photos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY work_orders_org ON work_orders
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY task_assignments_org ON task_assignments
  USING (work_order_id IN (
    SELECT id FROM work_orders WHERE hotel_id IN (
      SELECT id FROM hotels WHERE organization_id = (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()))));

CREATE POLICY task_photos_org ON task_photos
  USING (work_order_id IN (
    SELECT id FROM work_orders WHERE hotel_id IN (
      SELECT id FROM hotels WHERE organization_id = (
        SELECT organization_id FROM user_profiles WHERE id = auth.uid()))));

CREATE POLICY staff_availability_org ON staff_availability
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));


-- ============================================================
-- Merged from: 20260601300000_leave_documents.sql
-- ============================================================

-- Leave Requests, Documents, Internal Requests, Announcements

CREATE TABLE IF NOT EXISTS leave_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL
                 CHECK (type IN ('sick','vacation','personal','maternity','paternity',
                                 'ordination','unpaid','other')),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  days         INT GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by  UUID REFERENCES user_profiles(id),
  approved_at  TIMESTAMPTZ,
  reject_note  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category     TEXT NOT NULL
                 CHECK (category IN ('policy','form','manual','sop','contract','other')),
  title        TEXT NOT NULL,
  description  TEXT,
  file_url     TEXT NOT NULL,
  file_type    TEXT,
  file_size    BIGINT,
  version      TEXT DEFAULT '1.0',
  target_roles TEXT[],              -- NULL = all roles
  uploaded_by  UUID REFERENCES user_profiles(id),
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS internal_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  dept         TEXT,
  type         TEXT NOT NULL
                 CHECK (type IN ('purchase','repair','resource','it','hr','other')),
  title        TEXT NOT NULL,
  details      JSONB DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','reviewing','approved','rejected','completed')),
  approved_by  UUID REFERENCES user_profiles(id),
  approved_at  TIMESTAMPTZ,
  reject_note  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'general'
                 CHECK (type IN ('general','urgent','policy','event','other')),
  target_roles TEXT[],              -- NULL = all roles
  created_by   UUID REFERENCES user_profiles(id),
  expires_at   TIMESTAMPTZ,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS leave_requests_hotel_idx     ON leave_requests(hotel_id, status);
CREATE INDEX IF NOT EXISTS leave_requests_staff_idx     ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS documents_hotel_idx          ON documents(hotel_id, category);
CREATE INDEX IF NOT EXISTS internal_requests_hotel_idx  ON internal_requests(hotel_id, status);
CREATE INDEX IF NOT EXISTS announcements_hotel_idx      ON announcements(hotel_id, is_active);

-- RLS
ALTER TABLE leave_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements     ENABLE ROW LEVEL SECURITY;

CREATE POLICY leave_org ON leave_requests
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY documents_org ON documents
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY internal_requests_org ON internal_requests
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY announcements_org ON announcements
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));


-- ============================================================
-- Merged from: 20260601400000_roles_expanded.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS hotel_roles (
  role TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  category TEXT NOT NULL,
  is_platform BOOLEAN DEFAULT false
);
INSERT INTO hotel_roles (role, label, category) VALUES
  ('hotel_owner','เจ้าของโรงแรม','management'),
  ('general_manager','General Manager','management'),
  ('operations_manager','Operations Manager','management'),
  ('front_office_manager','Front Office Manager','front_office'),
  ('front_desk','Receptionist','front_office'),
  ('reservation_agent','Reservation Agent','front_office'),
  ('night_auditor','Night Auditor','front_office'),
  ('chat_admin','Chat Admin','communications'),
  ('guest_relations','Guest Relations','communications'),
  ('housekeeping_manager','Housekeeping Manager','housekeeping'),
  ('housekeeper','Housekeeper','housekeeping'),
  ('room_inspector','Room Inspector','housekeeping'),
  ('maintenance_manager','Maintenance Manager','engineering'),
  ('technician','Technician','engineering'),
  ('fnb_manager','F&B Manager','fnb'),
  ('kitchen_staff','Kitchen Staff','fnb'),
  ('room_service_staff','Room Service Staff','fnb'),
  ('restaurant_staff','Restaurant Staff','fnb'),
  ('concierge','Concierge','guest_services'),
  ('bellboy','Bellboy','guest_services'),
  ('transport_driver','Transport Driver','guest_services'),
  ('revenue_manager','Revenue Manager','revenue'),
  ('marketing_staff','Marketing Staff','revenue'),
  ('accounting_manager','Accounting Manager','accounting'),
  ('accounting_staff','Accounting Staff','accounting'),
  ('purchasing_manager','Purchasing Manager','purchasing'),
  ('purchasing_staff','Purchasing Staff','purchasing'),
  ('hr_manager','HR Manager','hr'),
  ('hr_staff','HR Staff','hr'),
  ('spa_manager','Spa Manager','spa'),
  ('spa_staff','Spa Staff','spa'),
  ('security_manager','Security Manager','security'),
  ('security_staff','Security Staff','security'),
  ('it_admin','IT Admin','it'),
  ('it_support','IT Support','it')
ON CONFLICT (role) DO NOTHING;

INSERT INTO hotel_roles (role, label, category, is_platform) VALUES
  ('platform_owner','Platform Owner','platform',true),
  ('billing_admin','Billing Admin','platform',true),
  ('support_admin','Support Admin','platform',true),
  ('platform_ops','Platform Ops','platform',true),
  ('security_admin','Security Admin','platform',true),
  ('sales_admin','Sales Admin','platform',true),
  ('product_admin','Product Admin','platform',true),
  ('dev_admin','Dev Admin','platform',true)
ON CONFLICT (role) DO NOTHING;

ALTER TABLE hotel_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY hotel_roles_read ON hotel_roles FOR SELECT USING (true);


-- ============================================================
-- Merged from: 20260601500000_integration_stubs.sql
-- ============================================================

-- Integration stub tables: ready to connect when API keys are available

-- Staff presence (online/offline/busy tracking)
CREATE TABLE IF NOT EXISTS staff_presence (
  user_id      UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'offline'
                 CHECK (status IN ('online','busy','break','offline')),
  floor        TEXT,
  zone         TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

-- Integration config per hotel
CREATE TABLE IF NOT EXISTS channel_integrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL,
  enabled      BOOLEAN DEFAULT false,
  config       JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  sync_status  TEXT DEFAULT 'idle',
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, provider)
);

-- OTA reservations queue
CREATE TABLE IF NOT EXISTS ota_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  ota_platform    TEXT NOT NULL,
  ota_booking_id  TEXT NOT NULL UNIQUE,
  raw_payload     JSONB NOT NULL,
  mapped_data     JSONB,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','rejected','cancelled')),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Rate push queue → channel manager
CREATE TABLE IF NOT EXISTS rate_push_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID,
  date_from    DATE NOT NULL,
  date_to      DATE NOT NULL,
  rate         NUMERIC(10,2),
  availability INT,
  provider     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','sent','failed')),
  attempts     INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- SMS / notification queue
CREATE TABLE IF NOT EXISTS notification_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL CHECK (channel IN ('sms','email','line','whatsapp','push')),
  recipient    TEXT NOT NULL,
  message      TEXT NOT NULL,
  template_id  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','sent','failed')),
  provider     TEXT,
  sent_at      TIMESTAMPTZ,
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Key card issuance log
CREATE TABLE IF NOT EXISTS keycard_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  room_no        TEXT NOT NULL,
  guest_name     TEXT,
  card_uid       TEXT,
  digital_key    TEXT,
  valid_from     TIMESTAMPTZ,
  valid_until    TIMESTAMPTZ,
  issued_by      UUID REFERENCES user_profiles(id),
  revoked_at     TIMESTAMPTZ,
  provider       TEXT NOT NULL DEFAULT 'digital_qr',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Bank transactions for reconciliation
CREATE TABLE IF NOT EXISTS bank_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  txn_date       DATE NOT NULL,
  description    TEXT,
  amount         NUMERIC(10,2) NOT NULL,
  type           TEXT CHECK (type IN ('credit','debit')),
  matched_folio  UUID,
  status         TEXT NOT NULL DEFAULT 'unmatched'
                   CHECK (status IN ('unmatched','matched','ignored')),
  source         TEXT NOT NULL DEFAULT 'manual'
                   CHECK (source IN ('manual','api')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Market benchmarking data
CREATE TABLE IF NOT EXISTS market_rates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  rate_date    DATE NOT NULL,
  competitor   TEXT,
  room_type    TEXT,
  rate         NUMERIC(10,2),
  occ_pct      NUMERIC(5,2),
  source       TEXT NOT NULL DEFAULT 'manual',
  fetched_at   TIMESTAMPTZ DEFAULT now()
);

-- Automation runs log
CREATE TABLE IF NOT EXISTS automation_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id      UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  trigger_data JSONB,
  status       TEXT NOT NULL DEFAULT 'success'
                 CHECK (status IN ('success','failed','skipped')),
  error        TEXT,
  ran_at       TIMESTAMPTZ DEFAULT now()
);

-- Hotel content CMS
CREATE TABLE IF NOT EXISTS hotel_content (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  section      TEXT NOT NULL,
  slug         TEXT,
  title        JSONB DEFAULT '{}',
  body         JSONB DEFAULT '{}',
  media        JSONB DEFAULT '[]',
  seo          JSONB DEFAULT '{}',
  published    BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, section, slug)
);

-- Nearby experiences
CREATE TABLE IF NOT EXISTS nearby_experiences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type         TEXT NOT NULL
                 CHECK (type IN ('attraction','tour','restaurant','nightlife','family','other')),
  name         JSONB DEFAULT '{}',
  description  JSONB DEFAULT '{}',
  photo_url    TEXT,
  distance_km  NUMERIC(5,2),
  price_range  TEXT,
  maps_url     TEXT,
  sort_order   INT DEFAULT 0,
  active       BOOLEAN DEFAULT true
);

-- Custom domains
CREATE TABLE IF NOT EXISTS custom_domains (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  domain       TEXT NOT NULL UNIQUE,
  verified     BOOLEAN DEFAULT false,
  ssl_active   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Multi-role support
CREATE TABLE IF NOT EXISTS user_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,
  is_primary   BOOLEAN DEFAULT false,
  granted_by   UUID REFERENCES user_profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, hotel_id, role)
);

-- Active workspace per user
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS active_workspace TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS active_hotel_id  UUID REFERENCES hotels(id);

-- Claim lock columns on work_orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS claimed_at       TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS staff_presence_hotel_idx      ON staff_presence(hotel_id, status);
CREATE INDEX IF NOT EXISTS channel_integrations_hotel_idx ON channel_integrations(hotel_id);
CREATE INDEX IF NOT EXISTS notification_queue_status_idx  ON notification_queue(status, created_at);
CREATE INDEX IF NOT EXISTS ota_reservations_hotel_idx    ON ota_reservations(hotel_id, status);
CREATE INDEX IF NOT EXISTS hotel_content_hotel_idx       ON hotel_content(hotel_id, section);
CREATE INDEX IF NOT EXISTS automation_runs_rule_idx      ON automation_runs(rule_id, ran_at);

-- RLS
ALTER TABLE staff_presence        ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_integrations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ota_reservations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_push_queue       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue    ENABLE ROW LEVEL SECURITY;
ALTER TABLE keycard_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_rates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_content         ENABLE ROW LEVEL SECURITY;
ALTER TABLE nearby_experiences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles            ENABLE ROW LEVEL SECURITY;

-- Shared org-based policy helper
DO $$ BEGIN
  CREATE POLICY staff_presence_org ON staff_presence
    USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY channel_integrations_org ON channel_integrations
    USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hotel_content_org ON hotel_content
    USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY user_roles_org ON user_roles
    USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
