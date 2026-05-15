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
