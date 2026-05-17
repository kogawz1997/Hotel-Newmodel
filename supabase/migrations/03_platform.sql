-- ============================================================
-- SCHEMA 03 · Platform & Workflow
-- SaaS billing, feature flags, webhook events, workflow engine,
-- approvals, SLA rules, shift handovers, incident management
-- ============================================================


-- ============================================================
-- Merged from: 20260801000000_platform_core.sql
-- ============================================================

-- Platform Core: billing subscriptions, invoices, credits, add-ons

CREATE TABLE IF NOT EXISTS billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('starter','standard','pro','enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','trialing','past_due','cancelled','paused')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (org_id)
);

CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'THB',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('draft','open','paid','void','uncollectible')),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  stripe_invoice_id TEXT,
  description TEXT,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS billing_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  reason TEXT,
  issued_by UUID REFERENCES user_profiles(id),
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  addon_type TEXT NOT NULL CHECK (addon_type IN ('extra_hotels','extra_seats','ai_boost','sms_pack','white_label','api_access')),
  quantity INT DEFAULT 1,
  price_per_unit NUMERIC(10,2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS billing_invoices_org_idx ON billing_invoices(org_id, status);
CREATE INDEX IF NOT EXISTS billing_credits_org_idx ON billing_credits(org_id);
CREATE INDEX IF NOT EXISTS platform_addons_org_idx ON platform_addons(org_id);


-- ============================================================
-- Merged from: 20260801100000_platform_ops.sql
-- ============================================================

-- Platform Ops: audit logs, health logs, sales leads, feature flags, A/B tests, webhook events

CREATE TABLE IF NOT EXISTS platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  hotel_id UUID REFERENCES hotels(id),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy','degraded','down')),
  latency_ms INT,
  error_message TEXT,
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  hotel_size TEXT CHECK (hotel_size IN ('small','medium','large','chain')),
  stage TEXT NOT NULL DEFAULT 'prospecting' CHECK (stage IN ('prospecting','demo_scheduled','trial','negotiation','closed_won','closed_lost')),
  assigned_to UUID REFERENCES user_profiles(id),
  notes TEXT,
  demo_date TIMESTAMPTZ,
  trial_started_at TIMESTAMPTZ,
  won_at TIMESTAMPTZ,
  lost_reason TEXT,
  source TEXT DEFAULT 'inbound',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percent INT DEFAULT 0 CHECK (rollout_percent BETWEEN 0 AND 100),
  target_org_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','paused','completed')),
  variants JSONB NOT NULL DEFAULT '[]',
  traffic_split JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  winner_variant TEXT,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id),
  org_id UUID REFERENCES organizations(id),
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','failed','replayed')),
  error_message TEXT,
  attempts INT DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_audit_logs_org_idx ON platform_audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS system_health_log_service_idx ON system_health_log(service, checked_at DESC);
CREATE INDEX IF NOT EXISTS platform_sales_leads_stage_idx ON platform_sales_leads(stage);
CREATE INDEX IF NOT EXISTS feature_flags_key_idx ON feature_flags(key);
CREATE INDEX IF NOT EXISTS webhook_events_hotel_idx ON webhook_events(hotel_id, status);
CREATE INDEX IF NOT EXISTS webhook_events_created_idx ON webhook_events(created_at DESC);


-- ─── Workflow Engine ───────────────────────────────────────────────────────

-- ============================================================
-- P1.4 Workflow Engine Foundation
-- Missing tables: approvals, approval_logs, department_sla_rules,
-- guest_request_routes, room_status_events, workflow_templates,
-- task_comments, task_attachments, operational_incidents, shift_handovers
-- ============================================================

-- ─── Approvals ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
                    'refund', 'discount', 'void', 'compensation',
                    'out_of_order', 'purchasing', 'leave',
                    'late_checkout', 'early_checkin', 'other'
                  )),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected', 'escalated', 'expired')),
  title           TEXT NOT NULL,
  description     TEXT,
  amount          NUMERIC(12,2),
  currency        TEXT DEFAULT 'THB',
  requested_by    UUID NOT NULL REFERENCES user_profiles(id),
  approved_by     UUID REFERENCES user_profiles(id),
  reference_type  TEXT,                               -- 'reservation', 'work_order', 'leave_request', etc.
  reference_id    UUID,
  sla_minutes     INT DEFAULT 60,
  escalate_after  INT DEFAULT 120,
  due_at          TIMESTAMPTZ,
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approvals_hotel ON approvals(hotel_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_approvals_requested_by ON approvals(requested_by);

-- ─── Approval Logs ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approval_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id   UUID NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  actor_id      UUID REFERENCES user_profiles(id),
  action        TEXT NOT NULL CHECK (action IN ('created','approved','rejected','escalated','commented','expired')),
  note          TEXT,
  metadata      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_approval_logs_approval ON approval_logs(approval_id);

-- ─── Department SLA Rules ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS department_sla_rules (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  department      TEXT NOT NULL,                      -- 'housekeeping', 'maintenance', etc.
  task_type       TEXT,                               -- NULL = applies to all tasks in dept
  priority        TEXT DEFAULT 'normal',
  response_minutes INT NOT NULL DEFAULT 15,           -- time to acknowledge
  resolve_minutes  INT NOT NULL DEFAULT 60,           -- time to complete
  escalate_to     UUID REFERENCES user_profiles(id),
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, department, task_type, priority)
);

CREATE INDEX IF NOT EXISTS idx_sla_rules_hotel ON department_sla_rules(hotel_id);

-- ─── Guest Request Routes ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS guest_request_routes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  request_type    TEXT NOT NULL,                      -- 'towels', 'maintenance', 'food', etc.
  department      TEXT NOT NULL,
  assigned_role   TEXT,                               -- default role to assign
  sla_minutes     INT DEFAULT 30,
  auto_assign     BOOLEAN DEFAULT false,
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, request_type)
);

-- ─── Room Status Events ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS room_status_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_id         UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  from_status     TEXT,
  to_status       TEXT NOT NULL,
  triggered_by    TEXT NOT NULL CHECK (triggered_by IN (
                    'check_in', 'checkout', 'housekeeping_start', 'housekeeping_done',
                    'inspection_pass', 'inspection_fail', 'maintenance_ooo', 'maintenance_fixed',
                    'manual', 'system'
                  )),
  actor_id        UUID REFERENCES user_profiles(id),
  reservation_id  UUID REFERENCES reservations(id) ON DELETE SET NULL,
  work_order_id   UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_room_status_events_room ON room_status_events(room_id);
CREATE INDEX IF NOT EXISTS idx_room_status_events_hotel ON room_status_events(hotel_id);
CREATE INDEX IF NOT EXISTS idx_room_status_events_created ON room_status_events(created_at DESC);

-- ─── Workflow Templates ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS workflow_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID REFERENCES hotels(id) ON DELETE CASCADE, -- NULL = platform default
  name            TEXT NOT NULL,
  trigger_event   TEXT NOT NULL,                      -- 'checkout', 'checkin', 'ooo_request', etc.
  department      TEXT NOT NULL,
  steps           JSONB NOT NULL DEFAULT '[]',        -- [{action, role, sla_minutes, notify}]
  active          BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ─── Task Comments ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_comments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES user_profiles(id),
  body          TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_comments_work_order ON task_comments(work_order_id);

-- ─── Task Attachments ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS task_attachments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  uploaded_by   UUID NOT NULL REFERENCES user_profiles(id),
  storage_path  TEXT NOT NULL,
  file_name     TEXT NOT NULL,
  mime_type     TEXT,
  size_bytes    INT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_attachments_work_order ON task_attachments(work_order_id);

-- ─── Operational Incidents ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS operational_incidents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  severity        TEXT NOT NULL DEFAULT 'low'
                    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status          TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  department      TEXT,
  reported_by     UUID REFERENCES user_profiles(id),
  assigned_to     UUID REFERENCES user_profiles(id),
  resolved_by     UUID REFERENCES user_profiles(id),
  room_id         UUID REFERENCES rooms(id) ON DELETE SET NULL,
  work_order_id   UUID REFERENCES work_orders(id) ON DELETE SET NULL,
  resolved_at     TIMESTAMPTZ,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_hotel ON operational_incidents(hotel_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON operational_incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON operational_incidents(severity);

-- ─── Shift Handovers ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS shift_handovers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  shift_id        UUID REFERENCES shifts(id) ON DELETE SET NULL,
  department      TEXT NOT NULL,
  handed_by       UUID NOT NULL REFERENCES user_profiles(id),
  received_by     UUID REFERENCES user_profiles(id),
  summary         TEXT NOT NULL,
  open_items      JSONB DEFAULT '[]',                 -- [{title, priority, assigned_to}]
  vip_notes       TEXT,
  incidents       JSONB DEFAULT '[]',
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_handovers_hotel ON shift_handovers(hotel_id);
CREATE INDEX IF NOT EXISTS idx_handovers_department ON shift_handovers(department);

-- ─── RLS Policies ─────────────────────────────────────────────────────────────

ALTER TABLE approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_sla_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_request_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_status_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_handovers ENABLE ROW LEVEL SECURITY;

-- Approvals: staff in same org can view; only approvers can update
CREATE POLICY approvals_select ON approvals FOR SELECT
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid() AND p.active = true
  ));

CREATE POLICY approvals_insert ON approvals FOR INSERT
  WITH CHECK (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid() AND p.active = true
  ));

-- Approval logs follow the approval's hotel
CREATE POLICY approval_logs_select ON approval_logs FOR SELECT
  USING (approval_id IN (SELECT id FROM approvals));

CREATE POLICY approval_logs_insert ON approval_logs FOR INSERT
  WITH CHECK (approval_id IN (SELECT id FROM approvals));

-- SLA rules: management only
CREATE POLICY sla_rules_select ON department_sla_rules FOR SELECT
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

-- Room status events: hotel-scoped
CREATE POLICY room_status_events_select ON room_status_events FOR SELECT
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY room_status_events_insert ON room_status_events FOR INSERT
  WITH CHECK (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

-- Task comments/attachments: scoped to work order's hotel
CREATE POLICY task_comments_select ON task_comments FOR SELECT
  USING (work_order_id IN (
    SELECT wo.id FROM work_orders wo
    JOIN hotels h ON h.id = wo.hotel_id
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY task_comments_insert ON task_comments FOR INSERT
  WITH CHECK (work_order_id IN (
    SELECT wo.id FROM work_orders wo
    JOIN hotels h ON h.id = wo.hotel_id
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY task_attachments_select ON task_attachments FOR SELECT
  USING (work_order_id IN (
    SELECT wo.id FROM work_orders wo
    JOIN hotels h ON h.id = wo.hotel_id
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY task_attachments_insert ON task_attachments FOR INSERT
  WITH CHECK (work_order_id IN (
    SELECT wo.id FROM work_orders wo
    JOIN hotels h ON h.id = wo.hotel_id
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

-- Incidents: hotel-scoped
CREATE POLICY incidents_select ON operational_incidents FOR SELECT
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY incidents_insert ON operational_incidents FOR INSERT
  WITH CHECK (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

-- Shift handovers: hotel-scoped
CREATE POLICY handovers_select ON shift_handovers FOR SELECT
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

CREATE POLICY handovers_insert ON shift_handovers FOR INSERT
  WITH CHECK (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

-- Guest request routes: hotel-scoped read
CREATE POLICY guest_request_routes_select ON guest_request_routes FOR SELECT
  USING (hotel_id IN (
    SELECT h.id FROM hotels h
    JOIN user_profiles p ON p.organization_id = h.organization_id
    WHERE p.id = auth.uid()
  ));

-- Workflow templates: hotel-scoped or platform (hotel_id IS NULL)
CREATE POLICY workflow_templates_select ON workflow_templates FOR SELECT
  USING (
    hotel_id IS NULL OR
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN user_profiles p ON p.organization_id = h.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- ─── Staff Notifications (In-App) ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staff_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  actor_id    UUID REFERENCES user_profiles(id),
  type        TEXT NOT NULL,
  priority    TEXT NOT NULL DEFAULT 'normal'
                CHECK (priority IN ('critical', 'high', 'normal', 'low')),
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  deep_link   TEXT,
  metadata    JSONB DEFAULT '{}',
  is_read     BOOLEAN DEFAULT false,
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_notif_user ON staff_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_staff_notif_hotel ON staff_notifications(hotel_id);
CREATE INDEX IF NOT EXISTS idx_staff_notif_created ON staff_notifications(created_at DESC);

ALTER TABLE staff_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY staff_notif_select ON staff_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY staff_notif_update ON staff_notifications FOR UPDATE
  USING (user_id = auth.uid());
