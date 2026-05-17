-- ============================================================
-- 0007 · Missing tables reconciliation
-- Tables referenced in application code but absent from
-- prior migrations (0001–0006).
-- ============================================================

-- ─── STAFF ────────────────────────────────────────────────────────────────────
-- Lightweight staff directory (complements user_profiles for non-auth staff)
CREATE TABLE IF NOT EXISTS staff (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_profile_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'staff'
                    CHECK (role IN (
                      'housekeeper','maintenance','front_desk','manager',
                      'chef','server','driver','security','other'
                    )),
  department      TEXT,
  phone           TEXT,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_staff_hotel ON staff(hotel_id);
CREATE INDEX IF NOT EXISTS idx_staff_role  ON staff(hotel_id, role);
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_hotel_isolation" ON staff
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── TASKS ────────────────────────────────────────────────────────────────────
-- Generic task/work item (distinct from housekeeping_tasks & work_orders)
CREATE TABLE IF NOT EXISTS tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  assigned_to   UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','in_progress','completed','cancelled')),
  priority      TEXT DEFAULT 'medium'
                  CHECK (priority IN ('low','medium','high','urgent')),
  due_at        TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tasks_hotel       ON tasks(hotel_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status      ON tasks(hotel_id, status);
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tasks_hotel_isolation" ON tasks
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── ATTENDANCE ───────────────────────────────────────────────────────────────
-- Real-time clock-in/out log (attendance_records = HR history aggregate)
CREATE TABLE IF NOT EXISTS attendance (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  shift_id     UUID REFERENCES shifts(id) ON DELETE SET NULL,
  work_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in_at  TIMESTAMPTZ,
  clock_out_at TIMESTAMPTZ,
  break_start  TIMESTAMPTZ,
  break_end    TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN (
                   'pending','clocked_in','on_break','clocked_out','absent','late'
                 )),
  late_minutes INT DEFAULT 0,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, staff_id, work_date)
);
CREATE INDEX IF NOT EXISTS idx_attendance_hotel      ON attendance(hotel_id);
CREATE INDEX IF NOT EXISTS idx_attendance_staff_date ON attendance(staff_id, work_date);
CREATE INDEX IF NOT EXISTS idx_attendance_date       ON attendance(hotel_id, work_date);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendance_hotel_isolation" ON attendance
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
-- Quick-lookup subscription state (billing_subscriptions = full Stripe data)
CREATE TABLE IF NOT EXISTS subscriptions (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan                 TEXT NOT NULL DEFAULT 'starter'
                         CHECK (plan IN ('starter','standard','pro','enterprise')),
  status               TEXT NOT NULL DEFAULT 'trialing'
                         CHECK (status IN ('active','trialing','past_due','cancelled','paused')),
  stripe_sub_id        TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now(),
  updated_at           TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subscriptions_org    ON subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_org_isolation" ON subscriptions
  USING (organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid()
  ));

-- ─── BLACKOUT DATES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blackout_dates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  date_from    DATE NOT NULL,
  date_to      DATE NOT NULL,
  reason       TEXT,
  all_channels BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now(),
  CHECK (date_to >= date_from)
);
CREATE INDEX IF NOT EXISTS idx_blackout_hotel ON blackout_dates(hotel_id);
CREATE INDEX IF NOT EXISTS idx_blackout_dates ON blackout_dates(hotel_id, date_from, date_to);
ALTER TABLE blackout_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "blackout_hotel_isolation" ON blackout_dates
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── CONCIERGE BOOKINGS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS concierge_bookings (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id         UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id         UUID REFERENCES guests(id) ON DELETE SET NULL,
  reservation_id   UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_name       TEXT NOT NULL,
  phone            TEXT,
  activity_type    TEXT NOT NULL,
  activity_date    DATE NOT NULL,
  activity_time    TIME,
  pax              INT DEFAULT 1,
  price            NUMERIC(12,2),
  location         TEXT,
  notes            TEXT,
  supplier_contact TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending','confirmed','completed','cancelled')),
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_concierge_hotel ON concierge_bookings(hotel_id);
CREATE INDEX IF NOT EXISTS idx_concierge_date  ON concierge_bookings(hotel_id, activity_date);
ALTER TABLE concierge_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "concierge_hotel_isolation" ON concierge_bookings
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── EQUIPMENT ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  category       TEXT,
  serial_number  TEXT,
  location       TEXT,
  status         TEXT DEFAULT 'operational'
                   CHECK (status IN ('operational','under_repair','decommissioned')),
  purchase_date  DATE,
  warranty_until DATE,
  next_service   DATE,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equipment_hotel ON equipment(hotel_id);
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equipment_hotel_isolation" ON equipment
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── EQUIPMENT HISTORY ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment_history (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  action       TEXT NOT NULL,  -- 'service','repair','inspection','moved','status_change'
  description  TEXT,
  performed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  cost         NUMERIC(12,2),
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_equip_history_hotel     ON equipment_history(hotel_id);
CREATE INDEX IF NOT EXISTS idx_equip_history_equipment ON equipment_history(equipment_id, created_at DESC);
ALTER TABLE equipment_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "equip_history_hotel_isolation" ON equipment_history
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── EXPENSES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category     TEXT NOT NULL DEFAULT 'general',
  description  TEXT,
  amount       NUMERIC(12,2) NOT NULL,
  currency     TEXT DEFAULT 'THB',
  vendor_name  TEXT,
  receipt_url  TEXT,
  submitted_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  approved_by  UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  status       TEXT DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','paid')),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_expenses_hotel ON expenses(hotel_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date  ON expenses(hotel_id, expense_date DESC);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "expenses_hotel_isolation" ON expenses
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── F&B INGREDIENTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fb_ingredients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  unit          TEXT NOT NULL DEFAULT 'กรัม',
  cost_per_unit NUMERIC(12,4) NOT NULL DEFAULT 0,
  quantity      NUMERIC(12,2) DEFAULT 0,
  min_stock     NUMERIC(12,2) DEFAULT 0,
  supplier      TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_fb_ingredients_hotel ON fb_ingredients(hotel_id);
ALTER TABLE fb_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fb_ingredients_hotel_isolation" ON fb_ingredients
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── F&B RECIPES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fb_recipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  menu_item_id  UUID NOT NULL REFERENCES fb_menu_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES fb_ingredients(id) ON DELETE CASCADE,
  quantity      NUMERIC(12,4) NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (menu_item_id, ingredient_id)
);
CREATE INDEX IF NOT EXISTS idx_fb_recipes_hotel      ON fb_recipes(hotel_id);
CREATE INDEX IF NOT EXISTS idx_fb_recipes_menu       ON fb_recipes(menu_item_id);
CREATE INDEX IF NOT EXISTS idx_fb_recipes_ingredient ON fb_recipes(ingredient_id);
ALTER TABLE fb_recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fb_recipes_hotel_isolation" ON fb_recipes
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── GUEST LOYALTY ────────────────────────────────────────────────────────────
-- Per-hotel loyalty balance (loyalty_members = programme enrollment)
CREATE TABLE IF NOT EXISTS guest_loyalty (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID REFERENCES hotels(id) ON DELETE CASCADE,
  guest_id    UUID NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
  points      INT NOT NULL DEFAULT 0,
  tier        TEXT DEFAULT 'bronze'
                CHECK (tier IN ('bronze','silver','gold','platinum')),
  total_spent NUMERIC(12,2) DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (guest_id, hotel_id)
);
CREATE INDEX IF NOT EXISTS idx_guest_loyalty_guest ON guest_loyalty(guest_id);
CREATE INDEX IF NOT EXISTS idx_guest_loyalty_hotel ON guest_loyalty(hotel_id);
ALTER TABLE guest_loyalty ENABLE ROW LEVEL SECURITY;
CREATE POLICY "guest_loyalty_hotel_isolation" ON guest_loyalty
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── MAINTENANCE RECORDS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id      UUID REFERENCES rooms(id) ON DELETE SET NULL,
  equipment_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
  description  TEXT NOT NULL,
  performed_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  cost         NUMERIC(12,2),
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_maint_records_hotel ON maintenance_records(hotel_id);
CREATE INDEX IF NOT EXISTS idx_maint_records_room  ON maintenance_records(room_id);
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maint_records_hotel_isolation" ON maintenance_records
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── OTA SYNC LEDGER ──────────────────────────────────────────────────────────
-- Detailed per-message OTA sync log (ota_sync_logs = summary; this = per-entity)
CREATE TABLE IF NOT EXISTS ota_sync_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID REFERENCES hotels(id) ON DELETE CASCADE,
  channel       TEXT NOT NULL,
  direction     TEXT DEFAULT 'push' CHECK (direction IN ('push','pull')),
  entity_type   TEXT,   -- 'availability', 'rate', 'reservation'
  entity_id     UUID,
  status        TEXT NOT NULL DEFAULT 'success'
                  CHECK (status IN ('success','failed','conflict','pending')),
  error_message TEXT,
  payload       JSONB,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ota_ledger_hotel   ON ota_sync_ledger(hotel_id);
CREATE INDEX IF NOT EXISTS idx_ota_ledger_status  ON ota_sync_ledger(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ota_ledger_channel ON ota_sync_ledger(channel, created_at DESC);
ALTER TABLE ota_sync_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ota_ledger_hotel_isolation" ON ota_sync_ledger
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── PLATFORM CONFIG ──────────────────────────────────────────────────────────
-- Key-value store for platform-wide settings (managed by platform admins)
CREATE TABLE IF NOT EXISTS platform_config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE platform_config ENABLE ROW LEVEL SECURITY;
-- Authenticated users may read specific non-sensitive keys
CREATE POLICY "platform_config_public_read" ON platform_config
  FOR SELECT USING (key IN ('general', 'site_content', 'ranking_weights'));

-- ─── PUSH SUBSCRIPTIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  endpoint    TEXT NOT NULL,
  p256dh      TEXT,
  auth_key    TEXT,
  device_type TEXT DEFAULT 'web',
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, endpoint)
);
CREATE INDEX IF NOT EXISTS idx_push_subs_user ON push_subscriptions(user_id);
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "push_subs_own" ON push_subscriptions
  USING (user_id = auth.uid());

-- ─── WAITLIST ENTRIES ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS waitlist_entries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES room_types(id) ON DELETE SET NULL,
  email        TEXT NOT NULL,
  guest_name   TEXT,
  phone        TEXT,
  check_in     DATE NOT NULL,
  check_out    DATE,
  num_adults   INT DEFAULT 1,
  status       TEXT NOT NULL DEFAULT 'waiting'
                 CHECK (status IN ('waiting','notified','booked','cancelled')),
  notified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, room_type_id, check_in, email)
);
CREATE INDEX IF NOT EXISTS idx_waitlist_hotel    ON waitlist_entries(hotel_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_check_in ON waitlist_entries(hotel_id, check_in);
CREATE INDEX IF NOT EXISTS idx_waitlist_status   ON waitlist_entries(hotel_id, status);
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "waitlist_hotel_isolation" ON waitlist_entries
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── WEBHOOK LOGS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID REFERENCES hotels(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL,
  url         TEXT NOT NULL,
  payload     JSONB DEFAULT '{}',
  status_code INT,
  response    TEXT,
  success     BOOLEAN NOT NULL DEFAULT false,
  duration_ms INT,
  created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_hotel ON webhook_logs(hotel_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_date  ON webhook_logs(hotel_id, created_at DESC);
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_logs_hotel_isolation" ON webhook_logs
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── ENERGY LOGS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS energy_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id       UUID REFERENCES rooms(id) ON DELETE SET NULL,
  category      TEXT NOT NULL DEFAULT 'electricity',  -- 'electricity','water','gas'
  kwh           NUMERIC(12,4),
  units         NUMERIC(12,4),
  cost          NUMERIC(12,2),
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_energy_hotel ON energy_logs(hotel_id);
CREATE INDEX IF NOT EXISTS idx_energy_date  ON energy_logs(hotel_id, recorded_date DESC);
ALTER TABLE energy_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "energy_hotel_isolation" ON energy_logs
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── EOD REPORTS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS eod_reports (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  report_date    DATE NOT NULL,
  revenue        NUMERIC(12,2) DEFAULT 0,
  room_revenue   NUMERIC(12,2) DEFAULT 0,
  fb_revenue     NUMERIC(12,2) DEFAULT 0,
  other_revenue  NUMERIC(12,2) DEFAULT 0,
  occupancy_rate NUMERIC(5,2),
  rooms_sold     INT,
  adr            NUMERIC(12,2),
  revpar         NUMERIC(12,2),
  closed_by      UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, report_date)
);
CREATE INDEX IF NOT EXISTS idx_eod_hotel ON eod_reports(hotel_id);
CREATE INDEX IF NOT EXISTS idx_eod_date  ON eod_reports(hotel_id, report_date DESC);
ALTER TABLE eod_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "eod_hotel_isolation" ON eod_reports
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── FX RATES ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fx_rates (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency  TEXT NOT NULL,
  to_currency    TEXT NOT NULL,
  rate           NUMERIC(12,6) NOT NULL,
  effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source         TEXT DEFAULT 'manual',
  created_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE (from_currency, to_currency, effective_date)
);
CREATE INDEX IF NOT EXISTS idx_fx_rates_pair ON fx_rates(from_currency, to_currency, effective_date DESC);
ALTER TABLE fx_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fx_rates_read" ON fx_rates
  FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY "fx_rates_write" ON fx_rates
  FOR INSERT WITH CHECK (auth.role() IN ('authenticated', 'service_role'));
CREATE POLICY "fx_rates_update" ON fx_rates
  FOR UPDATE USING (auth.role() IN ('authenticated', 'service_role'));

-- ─── ICAL FEEDS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ical_feeds (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  url          TEXT NOT NULL,
  direction    TEXT NOT NULL DEFAULT 'import'
                 CHECK (direction IN ('import','export')),
  room_id      UUID REFERENCES rooms(id) ON DELETE SET NULL,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','inactive','error')),
  last_sync_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ical_hotel ON ical_feeds(hotel_id);
ALTER TABLE ical_feeds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ical_hotel_isolation" ON ical_feeds
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── ITINERARY ITEMS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS itinerary_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  time           TIME,
  title          TEXT NOT NULL,
  description    TEXT,
  location       TEXT,
  confirmed      BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_itinerary_reservation ON itinerary_items(reservation_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_date        ON itinerary_items(reservation_id, date);
ALTER TABLE itinerary_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "itinerary_hotel_isolation" ON itinerary_items
  USING (
    reservation_id IN (
      SELECT id FROM reservations WHERE hotel_id IN (
        SELECT id FROM hotels WHERE organization_id = (
          SELECT organization_id FROM user_profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- ─── PARTNER INTEGRATIONS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS partner_integrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','active','error','disabled')),
  config       JSONB DEFAULT '{}',
  webhook_url  TEXT,
  last_sync_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, provider)
);
CREATE INDEX IF NOT EXISTS idx_partner_hotel ON partner_integrations(hotel_id);
ALTER TABLE partner_integrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partner_hotel_isolation" ON partner_integrations
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── PLATFORM ANNOUNCEMENTS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS platform_announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  type       TEXT DEFAULT 'info'
               CHECK (type IN ('info','warning','critical','maintenance')),
  target     TEXT DEFAULT 'all',  -- 'all', plan name, or hotel slug
  active     BOOLEAN DEFAULT true,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_platform_ann_active ON platform_announcements(active, created_at DESC);
ALTER TABLE platform_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_ann_read" ON platform_announcements
  FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));

-- ─── REFERRAL CODES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_codes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT NOT NULL UNIQUE,
  owner_guest_id UUID REFERENCES guest_accounts(id) ON DELETE CASCADE,
  hotel_id       UUID REFERENCES hotels(id) ON DELETE CASCADE,
  reward_type    TEXT NOT NULL DEFAULT 'discount'
                   CHECK (reward_type IN ('discount','points','credit','free_night')),
  reward_value   NUMERIC(12,2) NOT NULL DEFAULT 0,
  uses_count     INT DEFAULT 0,
  max_uses       INT,
  active         BOOLEAN DEFAULT true,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_referral_code  ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_guest ON referral_codes(owner_guest_id);
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referral_guest_own" ON referral_codes
  USING (
    owner_guest_id IN (
      SELECT id FROM guest_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- ─── RESTAURANT RECOMMENDATIONS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS restaurant_recommendations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  cuisine       TEXT,
  distance_km   NUMERIC(6,2),
  price_range   TEXT,  -- '฿', '฿฿', '฿฿฿', '฿฿฿฿'
  rating        NUMERIC(3,1) CHECK (rating BETWEEN 0 AND 5),
  phone         TEXT,
  address       TEXT,
  opening_hours TEXT,
  booking_url   TEXT,
  notes         TEXT,
  active        BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_restaurant_hotel ON restaurant_recommendations(hotel_id);
ALTER TABLE restaurant_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "restaurant_hotel_isolation" ON restaurant_recommendations
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── ROOM AMENITY INVENTORY ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS room_amenity_inventory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id     UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  amenity_key TEXT NOT NULL,
  quantity    INT NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE (room_id, amenity_key)
);
CREATE INDEX IF NOT EXISTS idx_amenity_hotel ON room_amenity_inventory(hotel_id);
CREATE INDEX IF NOT EXISTS idx_amenity_room  ON room_amenity_inventory(room_id);
ALTER TABLE room_amenity_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "amenity_hotel_isolation" ON room_amenity_inventory
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── SPA PACKAGES ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spa_packages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  description  TEXT,
  price        NUMERIC(12,2),
  duration_min INT,
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_spa_packages_hotel ON spa_packages(hotel_id);
ALTER TABLE spa_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spa_packages_hotel_isolation" ON spa_packages
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── SPA PACKAGE ITEMS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS spa_package_items (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  package_id     UUID NOT NULL REFERENCES spa_packages(id) ON DELETE CASCADE,
  spa_service_id UUID NOT NULL REFERENCES spa_services(id) ON DELETE CASCADE,
  quantity       INT DEFAULT 1,
  UNIQUE (package_id, spa_service_id)
);
CREATE INDEX IF NOT EXISTS idx_spa_pkg_items_hotel   ON spa_package_items(hotel_id);
CREATE INDEX IF NOT EXISTS idx_spa_pkg_items_package ON spa_package_items(package_id);
ALTER TABLE spa_package_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "spa_pkg_items_hotel_isolation" ON spa_package_items
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── STAFF SHIFTS ─────────────────────────────────────────────────────────────
-- Assignment of a shift to a staff member on a specific date
CREATE TABLE IF NOT EXISTS staff_shifts (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id  UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id  UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  shift_id  UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  date      DATE NOT NULL,
  notes     TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, staff_id, date)
);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_hotel ON staff_shifts(hotel_id);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_date  ON staff_shifts(hotel_id, date);
CREATE INDEX IF NOT EXISTS idx_staff_shifts_staff ON staff_shifts(staff_id);
ALTER TABLE staff_shifts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "staff_shifts_hotel_isolation" ON staff_shifts
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── TABLE RESERVATIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS table_reservations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  outlet_id      UUID REFERENCES fb_outlets(id) ON DELETE SET NULL,
  table_number   TEXT,
  guest_name     TEXT NOT NULL,
  phone          TEXT,
  pax            INT NOT NULL DEFAULT 2,
  reservation_dt TIMESTAMPTZ NOT NULL,
  duration_min   INT DEFAULT 90,
  status         TEXT NOT NULL DEFAULT 'confirmed'
                   CHECK (status IN ('confirmed','seated','completed','cancelled','no_show')),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_table_res_hotel ON table_reservations(hotel_id);
CREATE INDEX IF NOT EXISTS idx_table_res_dt    ON table_reservations(hotel_id, reservation_dt);
ALTER TABLE table_reservations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "table_res_hotel_isolation" ON table_reservations
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── VENDORS ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendors (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT,
  contact_name TEXT,
  phone        TEXT,
  email        TEXT,
  address      TEXT,
  notes        TEXT,
  active       BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_vendors_hotel ON vendors(hotel_id);
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors_hotel_isolation" ON vendors
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── WEBHOOK QUEUE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS webhook_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID REFERENCES hotels(id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}',
  url             TEXT NOT NULL,
  attempts        INT DEFAULT 0,
  max_attempts    INT DEFAULT 5,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','success','failed','dead_letter')),
  last_error      TEXT,
  next_attempt_at TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wh_queue_status ON webhook_queue(status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_wh_queue_hotel  ON webhook_queue(hotel_id);
ALTER TABLE webhook_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wh_queue_hotel_isolation" ON webhook_queue
  USING (hotel_id IN (
    SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid()
    )
  ));

-- ─── WISHLISTS ────────────────────────────────────────────────────────────────
-- Simplified guest wishlist used by account deletion flow
-- (full-featured table is guest_wishlists in 0001_core_schema)
CREATE TABLE IF NOT EXISTS wishlists (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_account_id UUID NOT NULL REFERENCES guest_accounts(id) ON DELETE CASCADE,
  hotel_id         UUID REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id     UUID REFERENCES room_types(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wishlists_guest ON wishlists(guest_account_id);
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wishlists_guest_own" ON wishlists
  USING (
    guest_account_id IN (
      SELECT id FROM guest_accounts WHERE auth_user_id = auth.uid()
    )
  );

-- ─── MULTI-PROPERTY VIEWS ─────────────────────────────────────────────────────

-- org_central_inventory — live room inventory summary across all hotels in org
CREATE OR REPLACE VIEW org_central_inventory AS
SELECT
  o.id                                                                   AS organization_id,
  h.id                                                                   AS hotel_id,
  h.name                                                                 AS hotel_name,
  COUNT(r.id)                                                            AS total_rooms,
  COUNT(r.id) FILTER (WHERE r.status = 'available')                     AS available_rooms,
  COUNT(r.id) FILTER (WHERE r.status = 'occupied')                      AS occupied_rooms,
  COUNT(r.id) FILTER (WHERE r.status IN ('maintenance','out_of_order')) AS maintenance_rooms,
  COUNT(r.id) FILTER (WHERE r.status = 'blocked')                       AS blocked_rooms
FROM organizations o
JOIN  hotels h ON h.organization_id = o.id
LEFT JOIN rooms r ON r.hotel_id = h.id
GROUP BY o.id, h.id, h.name;

-- org_chain_directory — high-level chain summary per organization
CREATE OR REPLACE VIEW org_chain_directory AS
SELECT
  o.id                AS organization_id,
  o.name              AS organization_name,
  COUNT(h.id)         AS hotels_count,
  COUNT(h.id)         AS active_hotels_count  -- refine with hotel.active flag if added
FROM organizations o
LEFT JOIN hotels h ON h.organization_id = o.id
GROUP BY o.id, o.name;
