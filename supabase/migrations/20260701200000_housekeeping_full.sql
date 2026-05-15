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
