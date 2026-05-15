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
