
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
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "fb_categories_via_outlet" ON fb_menu_categories;
CREATE POLICY "fb_categories_via_outlet" ON fb_menu_categories FOR ALL
  USING (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));

DROP POLICY IF EXISTS "fb_items_via_outlet" ON fb_menu_items;
CREATE POLICY "fb_items_via_outlet" ON fb_menu_items FOR ALL
  USING (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (outlet_id IN (SELECT id FROM fb_outlets WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));

DROP POLICY IF EXISTS "hotel_data_isolation" ON fb_orders;
CREATE POLICY "hotel_data_isolation" ON fb_orders FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "fb_order_items_via_order" ON fb_order_items;
CREATE POLICY "fb_order_items_via_order" ON fb_order_items FOR ALL
  USING (order_id IN (SELECT id FROM fb_orders WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())))
  WITH CHECK (order_id IN (SELECT id FROM fb_orders WHERE hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())));

DROP POLICY IF EXISTS "hotel_data_isolation" ON spa_services;
CREATE POLICY "hotel_data_isolation" ON spa_services FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON spa_therapists;
CREATE POLICY "hotel_data_isolation" ON spa_therapists FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON spa_bookings;
CREATE POLICY "hotel_data_isolation" ON spa_bookings FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));


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
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON automation_runs;
CREATE POLICY "hotel_data_isolation" ON automation_runs FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON ai_concierge_knowledge;
CREATE POLICY "hotel_data_isolation" ON ai_concierge_knowledge FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON ai_concierge_logs;
CREATE POLICY "hotel_data_isolation" ON ai_concierge_logs FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON hotel_localization_settings;
CREATE POLICY "hotel_data_isolation" ON hotel_localization_settings FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON ota_connections;
CREATE POLICY "hotel_data_isolation" ON ota_connections FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));

DROP POLICY IF EXISTS "hotel_data_isolation" ON ota_sync_logs;
CREATE POLICY "hotel_data_isolation" ON ota_sync_logs FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));


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
CREATE POLICY "hotel_data_isolation" ON ota_sync_queue FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id())) WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));
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

CREATE OR REPLACE FUNCTION auth.is_platform_admin()
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
CREATE POLICY platform_admin_all ON admin_impersonation_sessions FOR ALL USING (auth.is_platform_admin()) WITH CHECK (auth.is_platform_admin());

DROP POLICY IF EXISTS platform_admin_subscription_events ON subscription_events;
CREATE POLICY platform_admin_subscription_events ON subscription_events FOR ALL USING (auth.is_platform_admin()) WITH CHECK (auth.is_platform_admin());

DROP POLICY IF EXISTS hotel_data_isolation ON ota_reservation_events;
CREATE POLICY hotel_data_isolation ON ota_reservation_events FOR ALL
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()))
  WITH CHECK (hotel_id IN (SELECT id FROM hotels WHERE organization_id = auth.user_organization_id()));


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
FOR ALL USING (organization_id = auth.user_organization_id())
WITH CHECK (organization_id = auth.user_organization_id());

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
  count(h.id) FILTER (WHERE h.active = true) AS active_hotels_count
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
