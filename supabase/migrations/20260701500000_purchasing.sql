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
