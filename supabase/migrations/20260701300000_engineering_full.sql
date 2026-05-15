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
