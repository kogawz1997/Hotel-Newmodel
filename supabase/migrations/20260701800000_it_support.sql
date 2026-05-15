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
