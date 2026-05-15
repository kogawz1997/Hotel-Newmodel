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
