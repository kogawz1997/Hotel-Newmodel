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
