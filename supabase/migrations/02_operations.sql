-- ============================================================
-- SCHEMA 02 · Operations
-- Phase 2 buildout, staff/HR, departments, concierge,
-- F&B, spa, maintenance, scheduling, and all missing tables
-- from code-reconciliation audit (0007)
-- ============================================================


-- ============================================================
-- Merged from: 20260505053000_phase3_operations_events.sql
-- ============================================================

-- Phase 3 operational UX/observability ledger.
-- Used by dashboard error boundary and lightweight production operations checks.

CREATE TABLE IF NOT EXISTS operational_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid REFERENCES hotels(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  title text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL DEFAULT 'web',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS operational_events_hotel_created_idx
  ON operational_events(hotel_id, created_at DESC);

CREATE INDEX IF NOT EXISTS operational_events_type_severity_idx
  ON operational_events(event_type, severity, created_at DESC);

ALTER TABLE operational_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS operational_events_hotel_members_read ON operational_events;
CREATE POLICY operational_events_hotel_members_read ON operational_events
  FOR SELECT USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN user_profiles p ON p.organization_id = h.organization_id
      WHERE p.id = auth.uid() AND p.active IS TRUE
    )
  );

DROP POLICY IF EXISTS operational_events_hotel_members_insert ON operational_events;
CREATE POLICY operational_events_hotel_members_insert ON operational_events
  FOR INSERT WITH CHECK (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN user_profiles p ON p.organization_id = h.organization_id
      WHERE p.id = auth.uid() AND p.active IS TRUE
    )
  );


-- ============================================================
-- Merged from: 20260505070000_phase4_revenue_features.sql
-- ============================================================

-- ============================================
-- Phase 4 Revenue Features: F&B POS, Spa, Analytics indexes, invoice hardening
-- ============================================

ALTER TABLE fb_orders
  ADD COLUMN IF NOT EXISTS posted_to_folio_at TIMESTAMPTZ;

ALTER TABLE spa_bookings
  ADD COLUMN IF NOT EXISTS posted_to_folio_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS fb_orders_hotel_status_created_idx
  ON fb_orders(hotel_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS fb_orders_reservation_idx
  ON fb_orders(reservation_id);

CREATE INDEX IF NOT EXISTS fb_order_items_order_idx
  ON fb_order_items(order_id);

CREATE INDEX IF NOT EXISTS fb_menu_items_outlet_available_idx
  ON fb_menu_items(outlet_id, available);

CREATE INDEX IF NOT EXISTS spa_bookings_hotel_time_idx
  ON spa_bookings(hotel_id, start_time, end_time);

CREATE INDEX IF NOT EXISTS spa_bookings_therapist_time_idx
  ON spa_bookings(therapist_id, start_time, end_time)
  WHERE therapist_id IS NOT NULL AND status NOT IN ('cancelled', 'no_show');

CREATE INDEX IF NOT EXISTS spa_services_hotel_active_idx
  ON spa_services(hotel_id, active);

CREATE INDEX IF NOT EXISTS payments_hotel_created_status_idx
  ON payments(hotel_id, created_at DESC, status);

CREATE INDEX IF NOT EXISTS invoices_payment_lookup_idx
  ON invoices(hotel_id, reservation_id, created_at DESC);

-- RLS policies for phase-4 tables were already enabled in base schema.
-- This patch makes WITH CHECK explicit so writes cannot cross tenant borders.
DROP POLICY IF EXISTS "hotel_data_isolation" ON fb_outlets;
CREATE POLICY "hotel_data_isolation" ON fb_outlets FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "fb_categories_via_outlet" ON fb_menu_categories;
CREATE POLICY "fb_categories_via_outlet" ON fb_menu_categories FOR ALL
  USING (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())))
  WITH CHECK (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));

DROP POLICY IF EXISTS "fb_items_via_outlet" ON fb_menu_items;
CREATE POLICY "fb_items_via_outlet" ON fb_menu_items FOR ALL
  USING (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())))
  WITH CHECK (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));

DROP POLICY IF EXISTS "hotel_data_isolation" ON fb_orders;
CREATE POLICY "hotel_data_isolation" ON fb_orders FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "fb_order_items_via_order" ON fb_order_items;
CREATE POLICY "fb_order_items_via_order" ON fb_order_items FOR ALL
  USING (order_id IN (SELECT id FROM fb_orders WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())))
  WITH CHECK (order_id IN (SELECT id FROM fb_orders WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())));

DROP POLICY IF EXISTS "hotel_data_isolation" ON spa_services;
CREATE POLICY "hotel_data_isolation" ON spa_services FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON spa_therapists;
CREATE POLICY "hotel_data_isolation" ON spa_therapists FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON spa_bookings;
CREATE POLICY "hotel_data_isolation" ON spa_bookings FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));


-- ============================================================
-- Merged from: 20260505070000_phase7_go_live.sql
-- ============================================================

-- Phase 7: Go-live operational hardening

create table if not exists public.go_live_checks (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references public.hotels(id) on delete cascade,
  check_key text not null,
  status text not null default 'pending' check (status in ('pending', 'passed', 'failed', 'waived')),
  notes text,
  checked_by uuid,
  checked_at timestamptz default now(),
  created_at timestamptz default now(),
  unique (hotel_id, check_key)
);

create index if not exists go_live_checks_hotel_status_idx on public.go_live_checks(hotel_id, status);
create index if not exists operational_events_type_created_idx on public.operational_events(event_type, created_at desc);

alter table public.go_live_checks enable row level security;

do $$ begin
  create policy go_live_checks_hotel_access on public.go_live_checks
    for all using (
      hotel_id in (
        select h.id
        from public.hotels h
        join public.user_profiles up on up.organization_id = h.organization_id
        where up.id = auth.uid()
      )
    )
    with check (
      hotel_id in (
        select h.id
        from public.hotels h
        join public.user_profiles up on up.organization_id = h.organization_id
        where up.id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;


-- ============================================================
-- Merged from: 20260505080000_phase5_automation_ai_ota.sql
-- ============================================================

-- ============================================
-- Phase 5: Automation, AI Concierge, Localization, OTA-ready foundation
-- ============================================

CREATE TABLE IF NOT EXISTS automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trigger TEXT NOT NULL CHECK (trigger IN ('checkin_minus_1_day', 'checkout_day', 'payment_overdue', 'booking_created', 'post_checkout_review')),
  channel TEXT NOT NULL DEFAULT 'inbox' CHECK (channel IN ('email', 'line', 'whatsapp', 'inbox')),
  template_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  delay_minutes INT NOT NULL DEFAULT 0 CHECK (delay_minutes >= 0),
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS automation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'skipped', 'failed')),
  dedupe_key TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS automation_runs_dedupe_unique ON automation_runs(dedupe_key);
CREATE INDEX IF NOT EXISTS automation_rules_hotel_enabled_trigger_idx ON automation_rules(hotel_id, enabled, trigger);
CREATE INDEX IF NOT EXISTS automation_runs_hotel_status_created_idx ON automation_runs(hotel_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_concierge_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_concierge_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  confidence NUMERIC NOT NULL DEFAULT 0,
  needs_human BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_knowledge_hotel_enabled_idx ON ai_concierge_knowledge(hotel_id, enabled, created_at DESC);
CREATE INDEX IF NOT EXISTS ai_logs_hotel_created_idx ON ai_concierge_logs(hotel_id, created_at DESC);

CREATE TABLE IF NOT EXISTS hotel_localization_settings (
  hotel_id UUID PRIMARY KEY REFERENCES hotels(id) ON DELETE CASCADE,
  default_locale TEXT NOT NULL DEFAULT 'th',
  enabled_locales TEXT[] NOT NULL DEFAULT ARRAY['th', 'en'],
  auto_detect_guest_language BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE reservations ADD COLUMN IF NOT EXISTS preferred_language TEXT;
ALTER TABLE guests ADD COLUMN IF NOT EXISTS preferred_language TEXT;

CREATE TABLE IF NOT EXISTS ota_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('booking_com', 'agoda', 'expedia', 'airbnb', 'direct')),
  external_property_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'error')),
  sync_rates BOOLEAN NOT NULL DEFAULT true,
  sync_inventory BOOLEAN NOT NULL DEFAULT true,
  sync_reservations BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, provider, external_property_id)
);

CREATE TABLE IF NOT EXISTS ota_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES ota_connections(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('push', 'pull')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'success', 'failed', 'skipped')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ota_connections_hotel_provider_status_idx ON ota_connections(hotel_id, provider, status);
CREATE INDEX IF NOT EXISTS ota_sync_logs_hotel_created_idx ON ota_sync_logs(hotel_id, created_at DESC);

ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_concierge_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_concierge_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_localization_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ota_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE ota_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hotel_data_isolation" ON automation_rules;
CREATE POLICY "hotel_data_isolation" ON automation_rules FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON automation_runs;
CREATE POLICY "hotel_data_isolation" ON automation_runs FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON ai_concierge_knowledge;
CREATE POLICY "hotel_data_isolation" ON ai_concierge_knowledge FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON ai_concierge_logs;
CREATE POLICY "hotel_data_isolation" ON ai_concierge_logs FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON hotel_localization_settings;
CREATE POLICY "hotel_data_isolation" ON hotel_localization_settings FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON ota_connections;
CREATE POLICY "hotel_data_isolation" ON ota_connections FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON ota_sync_logs;
CREATE POLICY "hotel_data_isolation" ON ota_sync_logs FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));


-- ============================================================
-- Merged from: 20260505090000_phase6_launch_hardening.sql
-- ============================================================

-- Phase 6: Launch readiness / operational hardening

create table if not exists public.launch_check_runs (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid references public.hotels(id) on delete cascade,
  status text not null default 'pending',
  checks jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists launch_check_runs_hotel_created_idx
  on public.launch_check_runs(hotel_id, created_at desc);

alter table public.launch_check_runs enable row level security;

do $$ begin
  create policy launch_check_runs_isolation on public.launch_check_runs
    for all using (
      hotel_id in (
        select h.id from public.hotels h
        join public.user_profiles up on up.organization_id = h.organization_id
        where up.id = auth.uid()
      )
    )
    with check (
      hotel_id in (
        select h.id from public.hotels h
        join public.user_profiles up on up.organization_id = h.organization_id
        where up.id = auth.uid()
      )
    );
exception when duplicate_object then null;
end $$;

create index if not exists operational_events_hotel_severity_created_idx
  on public.operational_events(hotel_id, severity, created_at desc);

create index if not exists audit_logs_hotel_created_idx
  on public.audit_logs(hotel_id, created_at desc);


-- ============================================================
-- Merged from: 20260505093000_phase8_growth_scale_closure.sql
-- ============================================================

-- ============================================
-- Phase 8: Growth / Scale / AI / OTA Closure
-- ============================================
CREATE TABLE IF NOT EXISTS ota_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES ota_connections(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('push', 'pull')),
  type TEXT NOT NULL DEFAULT 'full' CHECK (type IN ('rates', 'inventory', 'reservations', 'full')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed', 'skipped')),
  attempts INT NOT NULL DEFAULT 0,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error TEXT,
  created_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ota_sync_queue_hotel_status_created_idx ON ota_sync_queue(hotel_id, status, created_at ASC);
CREATE INDEX IF NOT EXISTS ota_sync_queue_pending_idx ON ota_sync_queue(status, created_at ASC) WHERE status IN ('pending', 'processing');
ALTER TABLE ota_sync_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "hotel_data_isolation" ON ota_sync_queue;
CREATE POLICY "hotel_data_isolation" ON ota_sync_queue FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id())) WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));
ALTER TABLE ai_concierge_logs ADD COLUMN IF NOT EXISTS intent TEXT;
ALTER TABLE ai_concierge_logs ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE INDEX IF NOT EXISTS ai_logs_hotel_intent_created_idx ON ai_concierge_logs(hotel_id, intent, created_at DESC);
CREATE INDEX IF NOT EXISTS reservations_hotel_status_dates_idx ON reservations(hotel_id, status, check_in, check_out);
CREATE INDEX IF NOT EXISTS payments_hotel_status_created_amount_idx ON payments(hotel_id, status, created_at DESC, amount);
CREATE INDEX IF NOT EXISTS fb_orders_hotel_status_created_idx ON fb_orders(hotel_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS spa_bookings_hotel_status_created_idx ON spa_bookings(hotel_id, status, created_at DESC);


-- ============================================================
-- Merged from: 20260506000000_phase11_pms_core_ops.sql
-- ============================================================

-- ============================================
-- Phase 11 — PMS Core Operations Closure
-- Deposit/partial payments, cancellation policy, no-show metadata,
-- folio split/merge, housekeeping mobile support, and overbooking guard.
-- ============================================

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reservations
  ADD COLUMN IF NOT EXISTS deposit_amount DECIMAL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cancellation_policy JSONB,
  ADD COLUMN IF NOT EXISTS cancellation_quote JSONB,
  ADD COLUMN IF NOT EXISTS no_show_marked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS extended_from_checkout DATE;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS payment_purpose TEXT DEFAULT 'partial'
    CHECK (payment_purpose IN ('deposit', 'partial', 'balance', 'refund'));

ALTER TABLE folios
  ADD COLUMN IF NOT EXISTS split_from_folio_id UUID REFERENCES folios(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS merged_into_folio_id UUID REFERENCES folios(id) ON DELETE SET NULL;

ALTER TABLE housekeeping_tasks
  ADD COLUMN IF NOT EXISTS source_reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS completed_by UUID REFERENCES user_profiles(id),
  ADD COLUMN IF NOT EXISTS mobile_notes JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS photo_urls TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS reservations_active_room_overlap_idx
  ON reservations USING gist (hotel_id, room_id, daterange(check_in, check_out, '[)'))
  WHERE room_id IS NOT NULL AND status IN ('pending', 'confirmed', 'checked_in', 'on_hold');

CREATE INDEX IF NOT EXISTS reservations_active_room_type_overlap_idx
  ON reservations(hotel_id, room_type_id, check_in, check_out, status)
  WHERE status IN ('pending', 'confirmed', 'checked_in', 'on_hold');

CREATE INDEX IF NOT EXISTS housekeeping_tasks_mobile_idx
  ON housekeeping_tasks(hotel_id, status, due_date, priority);

CREATE UNIQUE INDEX IF NOT EXISTS housekeeping_turnover_once_per_reservation_idx
  ON housekeeping_tasks(source_reservation_id, task_type)
  WHERE source_reservation_id IS NOT NULL AND task_type = 'turnover';

CREATE OR REPLACE FUNCTION prevent_reservation_overbooking()
RETURNS TRIGGER AS $$
DECLARE
  room_capacity INT;
  overlapping_count INT;
BEGIN
  IF NEW.status NOT IN ('pending', 'confirmed', 'checked_in', 'on_hold') THEN
    RETURN NEW;
  END IF;

  IF NEW.check_out <= NEW.check_in THEN
    RAISE EXCEPTION 'Invalid stay dates: check_out must be after check_in';
  END IF;

  -- Exact room lock: one room cannot have overlapping active reservations.
  IF NEW.room_id IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext(NEW.hotel_id::text || ':' || NEW.room_id::text));

    IF EXISTS (
      SELECT 1 FROM reservations r
      WHERE r.hotel_id = NEW.hotel_id
        AND r.room_id = NEW.room_id
        AND r.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        AND r.status IN ('pending', 'confirmed', 'checked_in', 'on_hold')
        AND daterange(r.check_in, r.check_out, '[)') && daterange(NEW.check_in, NEW.check_out, '[)')
    ) THEN
      RAISE EXCEPTION 'Room is already booked for these dates';
    END IF;
  END IF;

  -- Room type inventory lock for unassigned bookings.
  PERFORM pg_advisory_xact_lock(hashtext(NEW.hotel_id::text || ':' || NEW.room_type_id::text));

  SELECT COUNT(*) INTO room_capacity
  FROM rooms
  WHERE hotel_id = NEW.hotel_id
    AND room_type_id = NEW.room_type_id
    AND status NOT IN ('maintenance', 'blocked', 'out_of_order');

  SELECT COUNT(*) INTO overlapping_count
  FROM reservations r
  WHERE r.hotel_id = NEW.hotel_id
    AND r.room_type_id = NEW.room_type_id
    AND r.id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND r.status IN ('pending', 'confirmed', 'checked_in', 'on_hold')
    AND daterange(r.check_in, r.check_out, '[)') && daterange(NEW.check_in, NEW.check_out, '[)');

  IF overlapping_count >= room_capacity THEN
    RAISE EXCEPTION 'No rooms available for these dates';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_reservation_overbooking ON reservations;
CREATE TRIGGER trg_prevent_reservation_overbooking
BEFORE INSERT OR UPDATE OF room_id, room_type_id, check_in, check_out, status
ON reservations
FOR EACH ROW
EXECUTE FUNCTION prevent_reservation_overbooking();

CREATE OR REPLACE FUNCTION recalculate_folio_totals(p_folio_id UUID)
RETURNS VOID AS $$
DECLARE
  charges NUMERIC;
  payments NUMERIC;
BEGIN
  SELECT
    COALESCE(SUM(CASE WHEN type IN ('payment', 'refund') THEN 0 ELSE amount * quantity END), 0),
    COALESCE(SUM(CASE WHEN type IN ('payment', 'refund') THEN ABS(amount * quantity) ELSE 0 END), 0)
  INTO charges, payments
  FROM folio_items
  WHERE folio_id = p_folio_id;

  UPDATE folios
  SET total_charges = charges,
      total_payments = payments,
      balance = charges - payments
  WHERE id = p_folio_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION auto_create_checkout_housekeeping()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'checked_out' AND OLD.status IS DISTINCT FROM 'checked_out' AND NEW.room_id IS NOT NULL THEN
    INSERT INTO housekeeping_tasks(hotel_id, room_id, source_reservation_id, task_type, priority, status, notes, due_date)
    VALUES(NEW.hotel_id, NEW.room_id, NEW.id, 'turnover', 'high', 'pending', 'Auto-created after checkout', CURRENT_DATE)
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_create_checkout_housekeeping ON reservations;
CREATE TRIGGER trg_auto_create_checkout_housekeeping
AFTER UPDATE OF status ON reservations
FOR EACH ROW
EXECUTE FUNCTION auto_create_checkout_housekeeping();


-- ============================================================
-- Merged from: 20260506010000_phase12_saas_control_integrations.sql
-- ============================================================

-- Phase 12: SaaS control + integrations hardening.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspension_reason text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS owner_email text;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_platform_admin boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE((SELECT is_platform_admin FROM public.user_profiles WHERE id = auth.uid()), false);
$$;

CREATE TABLE IF NOT EXISTS subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  provider_event_id text,
  event_type text NOT NULL,
  status text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subscription_events_org_created_idx ON subscription_events(organization_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS subscription_events_provider_event_unique ON subscription_events(provider_event_id) WHERE provider_event_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS admin_impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  admin_user_id uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'expired')),
  expires_at timestamptz NOT NULL,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_impersonation_org_created_idx ON admin_impersonation_sessions(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ota_reservation_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id uuid NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  provider text NOT NULL,
  external_reservation_id text NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'duplicate', 'conflict', 'accepted', 'rejected')),
  duplicate_count int NOT NULL DEFAULT 0,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  conflict_reason text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, provider, external_reservation_id)
);
CREATE INDEX IF NOT EXISTS ota_reservation_events_hotel_created_idx ON ota_reservation_events(hotel_id, created_at DESC);

ALTER TABLE ota_sync_queue DROP CONSTRAINT IF EXISTS ota_sync_queue_status_check;
ALTER TABLE ota_sync_queue ADD CONSTRAINT ota_sync_queue_status_check CHECK (status IN ('pending', 'processing', 'retry', 'done', 'failed', 'skipped'));
ALTER TABLE ota_sync_queue ADD COLUMN IF NOT EXISTS last_error text;
ALTER TABLE ota_sync_logs DROP CONSTRAINT IF EXISTS ota_sync_logs_status_check;
ALTER TABLE ota_sync_logs ADD CONSTRAINT ota_sync_logs_status_check CHECK (status IN ('queued', 'success', 'failed', 'skipped', 'retry', 'duplicate_ignored'));
ALTER TABLE ota_sync_logs ADD COLUMN IF NOT EXISTS errors jsonb;
ALTER TABLE ota_sync_logs ADD COLUMN IF NOT EXISTS duration_ms int;

ALTER TABLE admin_impersonation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ota_reservation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS platform_admin_all ON admin_impersonation_sessions;
CREATE POLICY platform_admin_all ON admin_impersonation_sessions FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS platform_admin_subscription_events ON subscription_events;
CREATE POLICY platform_admin_subscription_events ON subscription_events FOR ALL USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());

DROP POLICY IF EXISTS hotel_data_isolation ON ota_reservation_events;
CREATE POLICY hotel_data_isolation ON ota_reservation_events FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = public.user_organization_id()));


-- ============================================================
-- Merged from: 20260508090000_p3_reliability_dlq.sql
-- ============================================================

-- P3 Reliability: dead-letter queue + reliability events
CREATE TABLE IF NOT EXISTS dead_letter_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_table text NOT NULL,
  source_id uuid,
  source_provider text,
  failure_reason text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  attempts int NOT NULL DEFAULT 0,
  moved_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolution_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS dead_letter_queue_source_idx ON dead_letter_queue(source_table, source_provider, moved_at DESC);
CREATE INDEX IF NOT EXISTS dead_letter_queue_unresolved_idx ON dead_letter_queue(moved_at DESC) WHERE resolved_at IS NULL;

ALTER TABLE dead_letter_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "platform_admin_dead_letter_queue" ON dead_letter_queue;
CREATE POLICY "platform_admin_dead_letter_queue" ON dead_letter_queue
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');


-- ============================================================
-- Merged from: 20260508100000_p3_multi_property_foundation.sql
-- ============================================================

-- P3 Multi-property foundation
CREATE TABLE IF NOT EXISTS guest_identity_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  canonical_guest_id uuid REFERENCES guests(id) ON DELETE SET NULL,
  identity_key text NOT NULL,
  identity_type text NOT NULL CHECK (identity_type IN ('email','phone','passport','external')),
  confidence_score numeric(5,2) NOT NULL DEFAULT 1.0,
  source_hotel_id uuid REFERENCES hotels(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, identity_key, identity_type)
);

CREATE INDEX IF NOT EXISTS guest_identity_org_idx ON guest_identity_map(organization_id, created_at DESC);

ALTER TABLE guest_identity_map ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "guest_identity_org_isolation" ON guest_identity_map;
CREATE POLICY "guest_identity_org_isolation" ON guest_identity_map
FOR ALL USING (organization_id = public.user_organization_id())
WITH CHECK (organization_id = public.user_organization_id());

CREATE OR REPLACE VIEW org_central_revenue_daily AS
SELECT
  h.organization_id,
  date_trunc('day', r.created_at)::date AS revenue_date,
  count(*) AS reservations_count,
  coalesce(sum(r.total_amount), 0) AS total_revenue
FROM reservations r
JOIN hotels h ON h.id = r.hotel_id
GROUP BY h.organization_id, date_trunc('day', r.created_at)::date;


-- ============================================================
-- Merged from: 20260508103000_p3_chain_inventory_views.sql
-- ============================================================

-- P3 Multi-property: chain directory + central inventory view
CREATE OR REPLACE VIEW org_chain_directory AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  count(h.id) AS hotels_count,
  count(h.id) AS active_hotels_count
FROM organizations o
LEFT JOIN hotels h ON h.organization_id = o.id
GROUP BY o.id, o.name;

CREATE OR REPLACE VIEW org_central_inventory AS
SELECT
  h.organization_id,
  h.id AS hotel_id,
  h.name AS hotel_name,
  count(r.id) AS total_rooms,
  count(r.id) FILTER (WHERE r.status = 'available') AS available_rooms,
  count(r.id) FILTER (WHERE r.status = 'occupied') AS occupied_rooms,
  count(r.id) FILTER (WHERE r.status = 'maintenance') AS maintenance_rooms,
  count(r.id) FILTER (WHERE r.status = 'blocked') AS blocked_rooms
FROM hotels h
LEFT JOIN rooms r ON r.hotel_id = h.id
GROUP BY h.organization_id, h.id, h.name;


-- ============================================================
-- Merged from: 20260509090000_master_4p_completion.sql
-- ============================================================

-- Master 4P production completion migration
-- Safe additive schema for the final 36 checklist items.

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  user_id uuid not null,
  role text not null default 'staff',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table if not exists public.setup_checklists (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  section text not null,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (hotel_id, section)
);

create table if not exists public.cms_articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  type text not null check (type in ('blog','knowledge_base')),
  title text not null,
  excerpt text,
  body text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_addons (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  code text not null,
  name text not null,
  price numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hotel_id, code)
);

create table if not exists public.reservation_timeline_events (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null,
  hotel_id uuid not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists reservation_timeline_events_reservation_idx on public.reservation_timeline_events(reservation_id, created_at desc);

create table if not exists public.waitlist_entries (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  room_type_id uuid,
  guest_id uuid,
  check_in date not null,
  check_out date not null,
  status text not null default 'open',
  priority int not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  room_id uuid,
  equipment_id uuid,
  vendor_id uuid,
  title text not null,
  description text,
  priority text not null default 'normal',
  status text not null default 'open',
  sla_due_at timestamptz,
  escalated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ota_channel_mappings (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid not null,
  provider text not null,
  external_property_id text,
  external_room_type_id text,
  external_rate_plan_id text,
  room_type_id uuid,
  rate_plan_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (hotel_id, provider, external_room_type_id, external_rate_plan_id)
);

create table if not exists public.ota_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  hotel_id uuid,
  provider text not null,
  job_type text not null,
  status text not null default 'queued',
  attempts int not null default 0,
  payload jsonb not null default '{}'::jsonb,
  last_error text,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ota_sync_jobs_queue_idx on public.ota_sync_jobs(status, next_attempt_at);

create table if not exists public.enterprise_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  name text not null,
  key_hash text not null unique,
  scopes text[] not null default '{}',
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.webhook_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  url text not null,
  events text[] not null default '{}',
  secret_hint text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.restore_drill_results (
  id uuid primary key default gen_random_uuid(),
  environment text not null,
  backup_id text,
  rpo_minutes int,
  rto_minutes int,
  status text not null default 'planned',
  evidence_url text,
  created_at timestamptz not null default now()
);


-- ============================================================
-- Merged from: 20260509113000_p1_reservation_idempotency.sql
-- ============================================================

-- P1 booking integrity: idempotency key ledger for reservation creation
CREATE TABLE IF NOT EXISTS reservation_idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS reservation_idempotency_keys_hotel_created_idx
  ON reservation_idempotency_keys(hotel_id, created_at DESC);

CREATE OR REPLACE FUNCTION touch_reservation_idempotency_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_reservation_idempotency_keys ON reservation_idempotency_keys;
CREATE TRIGGER trg_touch_reservation_idempotency_keys
BEFORE UPDATE ON reservation_idempotency_keys
FOR EACH ROW EXECUTE FUNCTION touch_reservation_idempotency_keys_updated_at();


-- ============================================================
-- Merged from: 20260509120000_p1_active_reservation_uniqueness.sql
-- ============================================================

-- P1 booking integrity: DB-level duplicate booking prevention for active reservations
-- Prevents two active reservations for the same guest/room type/date window in one hotel.
CREATE UNIQUE INDEX IF NOT EXISTS reservations_active_unique_guest_room_dates_idx
  ON reservations(hotel_id, guest_id, room_type_id, check_in, check_out)
  WHERE status IN ('pending_payment', 'confirmed');


-- ─── Staff & HR ────────────────────────────────────────────────────────────


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
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
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
CREATE INDEX IF NOT EXISTS automation_runs_rule_idx      ON automation_runs(rule_id, created_at);

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


-- ─── Departments & Inventory ───────────────────────────────────────────────


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


-- ─── Missing Tables Reconciliation ────────────────────────────────────────

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
