
-- ============================================================
-- Merged from: 20260701000000_hr_module.sql
-- ============================================================

-- HR Module: payroll, performance, onboarding, training

CREATE TABLE IF NOT EXISTS payroll_periods (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','processing','approved','paid')),
  approved_by  UUID REFERENCES user_profiles(id),
  approved_at  TIMESTAMPTZ,
  total_amount NUMERIC(12,2) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id        UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  staff_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  hotel_id         UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  base_salary      NUMERIC(12,2) NOT NULL DEFAULT 0,
  ot_hours         NUMERIC(6,2) DEFAULT 0,
  ot_amount        NUMERIC(12,2) DEFAULT 0,
  allowances       NUMERIC(12,2) DEFAULT 0,
  deductions       NUMERIC(12,2) DEFAULT 0,
  tax_amount       NUMERIC(12,2) DEFAULT 0,
  net_pay          NUMERIC(12,2) NOT NULL DEFAULT 0,
  attendance_days  INT DEFAULT 0,
  leave_days       INT DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reviewer_id  UUID REFERENCES user_profiles(id),
  period       TEXT NOT NULL,
  scores       JSONB DEFAULT '{}',
  overall      NUMERIC(3,1),
  strengths    TEXT,
  improvements TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','submitted','acknowledged')),
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  course_name  TEXT NOT NULL,
  category     TEXT DEFAULT 'general',
  trainer      TEXT,
  start_date   DATE,
  end_date     DATE,
  hours        NUMERIC(5,1),
  passed       BOOLEAN,
  certificate_url TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  category     TEXT DEFAULT 'general'
                 CHECK (category IN ('documents','training','it_setup','orientation','general')),
  due_date     DATE,
  completed    BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  assigned_to  UUID REFERENCES user_profiles(id),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payroll_periods_hotel_idx ON payroll_periods(hotel_id, status);
CREATE INDEX IF NOT EXISTS payroll_items_period_idx  ON payroll_items(period_id);
CREATE INDEX IF NOT EXISTS payroll_items_staff_idx   ON payroll_items(staff_id);
CREATE INDEX IF NOT EXISTS performance_reviews_staff_idx ON performance_reviews(hotel_id, staff_id);
CREATE INDEX IF NOT EXISTS training_records_staff_idx    ON training_records(hotel_id, staff_id);
CREATE INDEX IF NOT EXISTS onboarding_tasks_staff_idx    ON onboarding_tasks(hotel_id, staff_id);

ALTER TABLE payroll_periods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON payroll_periods    FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON payroll_items      FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON performance_reviews FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON training_records   FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON onboarding_tasks   FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));


-- ============================================================
-- Merged from: 20260701100000_accounting_full.sql
-- ============================================================

-- Accounting Full: cashier sessions, tax invoices, expense tracking
-- Note: folios, folio_items, invoices already exist

CREATE TABLE IF NOT EXISTS cashier_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id         UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  opened_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at        TIMESTAMPTZ,
  opening_balance  NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_balance  NUMERIC(12,2),
  total_cash       NUMERIC(12,2),
  total_card       NUMERIC(12,2),
  total_transfer   NUMERIC(12,2),
  total_room_charge NUMERIC(12,2),
  discrepancy      NUMERIC(12,2),
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','closed','reconciled'))
);

CREATE TABLE IF NOT EXISTS tax_invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  invoice_id    UUID REFERENCES invoices(id),
  folio_id      UUID REFERENCES folios(id),
  tax_number    TEXT,
  buyer_name    TEXT NOT NULL,
  buyer_tax_id  TEXT,
  buyer_address TEXT,
  amount        NUMERIC(12,2) NOT NULL,
  vat_rate      NUMERIC(5,2) DEFAULT 7.0,
  vat_amount    NUMERIC(12,2),
  total_amount  NUMERIC(12,2),
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_by     UUID REFERENCES user_profiles(id),
  pdf_url       TEXT,
  voided        BOOLEAN DEFAULT false,
  void_reason   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  code     TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS expense_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES expense_categories(id),
  title        TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  currency     TEXT DEFAULT 'THB',
  expense_date DATE NOT NULL,
  receipt_url  TEXT,
  submitted_by UUID REFERENCES user_profiles(id),
  approved_by  UUID REFERENCES user_profiles(id),
  approved_at  TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','reimbursed')),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  description TEXT NOT NULL,
  ref_type    TEXT,
  ref_id      UUID,
  lines       JSONB NOT NULL DEFAULT '[]',
  created_by  UUID REFERENCES user_profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cashier_sessions_hotel_idx ON cashier_sessions(hotel_id, status);
CREATE INDEX IF NOT EXISTS cashier_sessions_staff_idx ON cashier_sessions(staff_id);
CREATE INDEX IF NOT EXISTS tax_invoices_hotel_idx     ON tax_invoices(hotel_id);
CREATE INDEX IF NOT EXISTS expense_items_hotel_idx    ON expense_items(hotel_id, status);

ALTER TABLE cashier_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON cashier_sessions   FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON tax_invoices       FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON expense_categories FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON expense_items      FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON journal_entries    FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));


-- ============================================================
-- Merged from: 20260701200000_housekeeping_full.sql
-- ============================================================

-- Housekeeping Full: linen, lost & found, minibar templates, laundry

CREATE TABLE IF NOT EXISTS linen_inventory (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  item_name    TEXT NOT NULL,
  category     TEXT DEFAULT 'sheets'
                 CHECK (category IN ('sheets','pillowcases','towels','bathrobes','other')),
  total_qty    INT NOT NULL DEFAULT 0,
  in_use       INT DEFAULT 0,
  in_laundry   INT DEFAULT 0,
  damaged      INT DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lost_found (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_no      TEXT,
  description  TEXT NOT NULL,
  found_by     UUID REFERENCES user_profiles(id),
  found_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  location     TEXT,
  photo_url    TEXT,
  status       TEXT NOT NULL DEFAULT 'stored'
                 CHECK (status IN ('stored','claimed','donated','disposed')),
  claimed_by   TEXT,
  claimed_at   TIMESTAMPTZ,
  notes        TEXT
);

CREATE TABLE IF NOT EXISTS minibar_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID REFERENCES room_types(id),
  name         TEXT NOT NULL,
  items        JSONB NOT NULL DEFAULT '[]',
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS laundry_batches (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  batch_no     TEXT,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  returned_at  TIMESTAMPTZ,
  items_count  INT DEFAULT 0,
  items_detail JSONB DEFAULT '[]',
  assigned_to  UUID REFERENCES user_profiles(id),
  vendor       TEXT,
  status       TEXT NOT NULL DEFAULT 'collected'
                 CHECK (status IN ('collected','sent','returned','cancelled')),
  notes        TEXT
);

-- Add columns to housekeeping_tasks if not exist
ALTER TABLE housekeeping_tasks ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';
ALTER TABLE housekeeping_tasks ADD COLUMN IF NOT EXISTS minibar_items JSONB DEFAULT '{}';
ALTER TABLE housekeeping_tasks ADD COLUMN IF NOT EXISTS inspector_id UUID REFERENCES user_profiles(id);
ALTER TABLE housekeeping_tasks ADD COLUMN IF NOT EXISTS inspection_score INT;
ALTER TABLE housekeeping_tasks ADD COLUMN IF NOT EXISTS inspection_note TEXT;
ALTER TABLE housekeeping_tasks ADD COLUMN IF NOT EXISTS inspected_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS linen_inventory_hotel_idx ON linen_inventory(hotel_id);
CREATE INDEX IF NOT EXISTS lost_found_hotel_idx      ON lost_found(hotel_id, status);
CREATE INDEX IF NOT EXISTS laundry_batches_hotel_idx ON laundry_batches(hotel_id, status);

ALTER TABLE linen_inventory   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_found        ENABLE ROW LEVEL SECURITY;
ALTER TABLE minibar_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE laundry_batches   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON linen_inventory   FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON lost_found        FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON minibar_templates FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON laundry_batches   FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));


-- ============================================================
-- Merged from: 20260701300000_engineering_full.sql
-- ============================================================

-- Engineering Full: parts inventory, preventive maintenance, equipment

CREATE TABLE IF NOT EXISTS parts_inventory (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  sku          TEXT,
  unit         TEXT DEFAULT 'pcs',
  quantity     INT NOT NULL DEFAULT 0,
  min_stock    INT DEFAULT 1,
  cost         NUMERIC(10,2),
  location     TEXT,
  supplier     TEXT,
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS parts_usage_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  part_id        UUID NOT NULL REFERENCES parts_inventory(id) ON DELETE CASCADE,
  work_order_id  UUID REFERENCES work_orders(id),
  used_by        UUID REFERENCES user_profiles(id),
  quantity_used  INT NOT NULL DEFAULT 1,
  used_at        TIMESTAMPTZ DEFAULT now(),
  notes          TEXT
);

CREATE TABLE IF NOT EXISTS preventive_maintenance (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id         UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  equipment_type   TEXT,
  location         TEXT,
  frequency_days   INT NOT NULL DEFAULT 30,
  last_done_at     DATE,
  next_due_at      DATE,
  assigned_to      UUID REFERENCES user_profiles(id),
  checklist        JSONB DEFAULT '[]',
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS equipment_inventory (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  model        TEXT,
  serial_no    TEXT,
  location     TEXT,
  category     TEXT DEFAULT 'general',
  status       TEXT NOT NULL DEFAULT 'operational'
                 CHECK (status IN ('operational','maintenance','retired','faulty')),
  purchased_at DATE,
  warranty_until DATE,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Add columns to maintenance_requests if not exist
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS before_photos TEXT[] DEFAULT '{}';
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS after_photos  TEXT[] DEFAULT '{}';
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS parts_used    JSONB DEFAULT '[]';
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS started_at    TIMESTAMPTZ;
ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS completed_at  TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS parts_inventory_hotel_idx   ON parts_inventory(hotel_id);
CREATE INDEX IF NOT EXISTS preventive_maint_hotel_idx  ON preventive_maintenance(hotel_id, next_due_at);
CREATE INDEX IF NOT EXISTS equipment_hotel_idx         ON equipment_inventory(hotel_id, status);

ALTER TABLE parts_inventory        ENABLE ROW LEVEL SECURITY;
ALTER TABLE parts_usage_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventive_maintenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_inventory    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON parts_inventory        FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON parts_usage_log        FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON preventive_maintenance FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON equipment_inventory    FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));


-- ============================================================
-- Merged from: 20260701400000_fnb_full.sql
-- ============================================================

-- F&B Full: kitchen queue, restaurant tables & orders
-- Note: fb_menu_items, fb_orders, fb_outlets, spa_services, spa_bookings already exist

CREATE TABLE IF NOT EXISTS kitchen_queue (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  order_id       UUID REFERENCES fb_orders(id) ON DELETE CASCADE,
  outlet_id      UUID REFERENCES fb_outlets(id),
  items          JSONB NOT NULL DEFAULT '[]',
  priority       INT DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'new'
                   CHECK (status IN ('new','preparing','ready','delivered','cancelled')),
  started_at     TIMESTAMPTZ,
  ready_at       TIMESTAMPTZ,
  delivered_at   TIMESTAMPTZ,
  kitchen_note   TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurant_tables (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id   UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  outlet_id  UUID REFERENCES fb_outlets(id),
  table_no   TEXT NOT NULL,
  capacity   INT DEFAULT 2,
  status     TEXT NOT NULL DEFAULT 'available'
               CHECK (status IN ('available','occupied','reserved','cleaning')),
  floor      TEXT,
  section    TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS restaurant_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  table_id     UUID REFERENCES restaurant_tables(id),
  outlet_id    UUID REFERENCES fb_outlets(id),
  items        JSONB NOT NULL DEFAULT '[]',
  subtotal     NUMERIC(10,2) DEFAULT 0,
  discount     NUMERIC(10,2) DEFAULT 0,
  service_charge NUMERIC(10,2) DEFAULT 0,
  vat          NUMERIC(10,2) DEFAULT 0,
  total        NUMERIC(10,2) DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','billed','paid','cancelled')),
  payment_method TEXT,
  room_no      TEXT,
  reservation_id UUID REFERENCES reservations(id),
  server_id    UUID REFERENCES user_profiles(id),
  opened_at    TIMESTAMPTZ DEFAULT now(),
  closed_at    TIMESTAMPTZ,
  notes        TEXT
);

-- Add treatment_room_id to spa_bookings if not exist
ALTER TABLE spa_bookings ADD COLUMN IF NOT EXISTS treatment_room TEXT;
ALTER TABLE spa_bookings ADD COLUMN IF NOT EXISTS therapist_id UUID REFERENCES user_profiles(id);
ALTER TABLE spa_bookings ADD COLUMN IF NOT EXISTS guest_notes TEXT;

CREATE INDEX IF NOT EXISTS kitchen_queue_hotel_idx     ON kitchen_queue(hotel_id, status);
CREATE INDEX IF NOT EXISTS restaurant_tables_hotel_idx ON restaurant_tables(hotel_id);
CREATE INDEX IF NOT EXISTS restaurant_orders_hotel_idx ON restaurant_orders(hotel_id, status);

ALTER TABLE kitchen_queue       ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables   ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_orders   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON kitchen_queue     FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON restaurant_tables FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON restaurant_orders FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));


-- ============================================================
-- Merged from: 20260701500000_purchasing.sql
-- ============================================================

-- Purchasing: suppliers, purchase orders, inventory, stock transactions

CREATE TABLE IF NOT EXISTS suppliers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  contact_name TEXT,
  phone        TEXT,
  email        TEXT,
  address      TEXT,
  tax_id       TEXT,
  category     TEXT DEFAULT 'general',
  rating       INT CHECK (rating BETWEEN 1 AND 5),
  is_active    BOOLEAN DEFAULT true,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  supplier_id  UUID REFERENCES suppliers(id),
  po_number    TEXT,
  items        JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(12,2) DEFAULT 0,
  currency     TEXT DEFAULT 'THB',
  status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','submitted','approved','ordered','received','cancelled')),
  requested_by UUID REFERENCES user_profiles(id),
  approved_by  UUID REFERENCES user_profiles(id),
  approved_at  TIMESTAMPTZ,
  ordered_at   TIMESTAMPTZ,
  received_at  TIMESTAMPTZ,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inventory_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  sku          TEXT,
  category     TEXT DEFAULT 'general',
  unit         TEXT DEFAULT 'pcs',
  quantity     NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_stock    NUMERIC(10,2) DEFAULT 0,
  cost_per_unit NUMERIC(10,2),
  location     TEXT,
  supplier_id  UUID REFERENCES suppliers(id),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS stock_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  item_id        UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('in','out','adjustment','loss')),
  quantity       NUMERIC(10,2) NOT NULL,
  reference_type TEXT,
  reference_id   UUID,
  performed_by   UUID REFERENCES user_profiles(id),
  note           TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS suppliers_hotel_idx       ON suppliers(hotel_id);
CREATE INDEX IF NOT EXISTS purchase_orders_hotel_idx ON purchase_orders(hotel_id, status);
CREATE INDEX IF NOT EXISTS inventory_items_hotel_idx ON inventory_items(hotel_id);
CREATE INDEX IF NOT EXISTS stock_tx_item_idx         ON stock_transactions(item_id);

ALTER TABLE suppliers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders    ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON suppliers          FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON purchase_orders    FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON inventory_items    FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON stock_transactions FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));


-- ============================================================
-- Merged from: 20260701600000_transport_bellboy.sql
-- ============================================================

-- Transport & Bellboy: pickup/dropoff tasks, luggage handling

CREATE TABLE IF NOT EXISTS transport_tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type           TEXT NOT NULL
                   CHECK (type IN ('airport_pickup','airport_dropoff','local_transfer','tour','other')),
  guest_name     TEXT,
  guest_id       UUID REFERENCES guests(id),
  reservation_id UUID REFERENCES reservations(id),
  pickup_location TEXT,
  dropoff_location TEXT,
  pickup_time    TIMESTAMPTZ NOT NULL,
  vehicle        TEXT,
  driver_id      UUID REFERENCES user_profiles(id),
  passengers     INT DEFAULT 1,
  flight_no      TEXT,
  status         TEXT NOT NULL DEFAULT 'scheduled'
                   CHECK (status IN ('scheduled','confirmed','in_progress','completed','cancelled')),
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  notes          TEXT,
  created_by     UUID REFERENCES user_profiles(id),
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS luggage_tasks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type           TEXT NOT NULL
                   CHECK (type IN ('pickup','delivery','storage','airport')),
  room_no        TEXT,
  guest_name     TEXT,
  guest_id       UUID REFERENCES guests(id),
  reservation_id UUID REFERENCES reservations(id),
  item_count     INT DEFAULT 1,
  description    TEXT,
  from_location  TEXT,
  to_location    TEXT,
  assigned_to    UUID REFERENCES user_profiles(id),
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','claimed','in_progress','completed','cancelled')),
  claimed_at     TIMESTAMPTZ,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  photo_url      TEXT,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transport_tasks_hotel_idx ON transport_tasks(hotel_id, status);
CREATE INDEX IF NOT EXISTS transport_tasks_driver_idx ON transport_tasks(driver_id);
CREATE INDEX IF NOT EXISTS luggage_tasks_hotel_idx   ON luggage_tasks(hotel_id, status);
CREATE INDEX IF NOT EXISTS luggage_tasks_staff_idx   ON luggage_tasks(assigned_to);

ALTER TABLE transport_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE luggage_tasks   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON transport_tasks FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON luggage_tasks   FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));


-- ============================================================
-- Merged from: 20260701700000_revenue_marketing.sql
-- ============================================================

-- Revenue & Marketing: forecasting, channel rates, abandoned bookings
-- Note: rate_plans, promo_codes, marketing_campaigns already exist

CREATE TABLE IF NOT EXISTS occupancy_forecast (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_occ NUMERIC(5,2),
  recommended_rate NUMERIC(10,2),
  demand_level TEXT CHECK (demand_level IN ('low','normal','high','peak')),
  events       TEXT[],
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, forecast_date)
);

CREATE TABLE IF NOT EXISTS channel_rates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL,
  room_type_id UUID REFERENCES room_types(id),
  rate_date    DATE NOT NULL,
  rate         NUMERIC(10,2) NOT NULL,
  availability INT DEFAULT 0,
  pushed_at    TIMESTAMPTZ,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','pushed','failed')),
  UNIQUE (hotel_id, channel, room_type_id, rate_date)
);

CREATE TABLE IF NOT EXISTS abandoned_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  guest_email     TEXT NOT NULL,
  guest_name      TEXT,
  room_type_id    UUID REFERENCES room_types(id),
  check_in        DATE,
  check_out       DATE,
  last_step       TEXT,
  session_data    JSONB DEFAULT '{}',
  recovery_sent_at TIMESTAMPTZ,
  recovered       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competitor_rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  rate_date     DATE NOT NULL,
  room_type     TEXT,
  rate          NUMERIC(10,2),
  source        TEXT DEFAULT 'manual',
  recorded_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  condition    JSONB NOT NULL DEFAULT '{}',
  adjustment   JSONB NOT NULL DEFAULT '{}',
  is_active    BOOLEAN DEFAULT true,
  priority     INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS occupancy_forecast_hotel_idx ON occupancy_forecast(hotel_id, forecast_date);
CREATE INDEX IF NOT EXISTS channel_rates_hotel_idx      ON channel_rates(hotel_id, rate_date);
CREATE INDEX IF NOT EXISTS abandoned_bookings_hotel_idx ON abandoned_bookings(hotel_id);

ALTER TABLE occupancy_forecast    ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_rates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_rates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON occupancy_forecast    FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON channel_rates         FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON abandoned_bookings    FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON competitor_rates      FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON dynamic_pricing_rules FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));


-- ============================================================
-- Merged from: 20260701800000_it_support.sql
-- ============================================================

-- IT Support: internal tickets, device registry

CREATE TABLE IF NOT EXISTS support_tickets_internal (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  category     TEXT NOT NULL
                 CHECK (category IN ('hardware','software','network','printer','access','other')),
  title        TEXT NOT NULL,
  description  TEXT,
  priority     TEXT NOT NULL DEFAULT 'normal'
                 CHECK (priority IN ('low','normal','high','urgent')),
  status       TEXT NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open','in_progress','resolved','closed')),
  assigned_to  UUID REFERENCES user_profiles(id),
  resolved_by  UUID REFERENCES user_profiles(id),
  resolved_at  TIMESTAMPTZ,
  resolution   TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS device_registry (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL
                 CHECK (type IN ('pos','printer','tv','phone','router','camera','tablet','other')),
  model        TEXT,
  serial_no    TEXT,
  location     TEXT,
  ip_address   TEXT,
  mac_address  TEXT,
  status       TEXT NOT NULL DEFAULT 'online'
                 CHECK (status IN ('online','offline','faulty','maintenance')),
  last_ping    TIMESTAMPTZ,
  assigned_to  TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS support_tickets_hotel_idx ON support_tickets_internal(hotel_id, status);
CREATE INDEX IF NOT EXISTS device_registry_hotel_idx ON device_registry(hotel_id);

ALTER TABLE support_tickets_internal ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_registry          ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON support_tickets_internal FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON device_registry          FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
