-- Accounting Full: cashier sessions, tax invoices, expense tracking
-- Note: folios, folio_items, invoices already exist

CREATE TABLE IF NOT EXISTS cashier_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id         UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  opened_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at        TIMESTAMPTZ,
  opening_balance  NUMERIC(12,2) NOT NULL DEFAULT 0,
  closing_balance  NUMERIC(12,2),
  total_cash       NUMERIC(12,2),
  total_card       NUMERIC(12,2),
  total_transfer   NUMERIC(12,2),
  total_room_charge NUMERIC(12,2),
  discrepancy      NUMERIC(12,2),
  notes            TEXT,
  status           TEXT NOT NULL DEFAULT 'open'
                     CHECK (status IN ('open','closed','reconciled'))
);

CREATE TABLE IF NOT EXISTS tax_invoices (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  invoice_id    UUID REFERENCES invoices(id),
  folio_id      UUID REFERENCES folios(id),
  tax_number    TEXT,
  buyer_name    TEXT NOT NULL,
  buyer_tax_id  TEXT,
  buyer_address TEXT,
  amount        NUMERIC(12,2) NOT NULL,
  vat_rate      NUMERIC(5,2) DEFAULT 7.0,
  vat_amount    NUMERIC(12,2),
  total_amount  NUMERIC(12,2),
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  issued_by     UUID REFERENCES user_profiles(id),
  pdf_url       TEXT,
  voided        BOOLEAN DEFAULT false,
  void_reason   TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expense_categories (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name     TEXT NOT NULL,
  code     TEXT,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS expense_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category_id  UUID REFERENCES expense_categories(id),
  title        TEXT NOT NULL,
  amount       NUMERIC(12,2) NOT NULL,
  currency     TEXT DEFAULT 'THB',
  expense_date DATE NOT NULL,
  receipt_url  TEXT,
  submitted_by UUID REFERENCES user_profiles(id),
  approved_by  UUID REFERENCES user_profiles(id),
  approved_at  TIMESTAMPTZ,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','reimbursed')),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id    UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  description TEXT NOT NULL,
  ref_type    TEXT,
  ref_id      UUID,
  lines       JSONB NOT NULL DEFAULT '[]',
  created_by  UUID REFERENCES user_profiles(id),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cashier_sessions_hotel_idx ON cashier_sessions(hotel_id, status);
CREATE INDEX IF NOT EXISTS cashier_sessions_staff_idx ON cashier_sessions(staff_id);
CREATE INDEX IF NOT EXISTS tax_invoices_hotel_idx     ON tax_invoices(hotel_id);
CREATE INDEX IF NOT EXISTS expense_items_hotel_idx    ON expense_items(hotel_id, status);

ALTER TABLE cashier_sessions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_invoices        ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories  ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_items       ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON cashier_sessions   FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON tax_invoices       FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON expense_categories FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON expense_items      FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON journal_entries    FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
