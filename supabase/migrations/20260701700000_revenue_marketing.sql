-- Revenue & Marketing: forecasting, channel rates, abandoned bookings
-- Note: rate_plans, promo_codes, marketing_campaigns already exist

CREATE TABLE IF NOT EXISTS occupancy_forecast (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  predicted_occ NUMERIC(5,2),
  recommended_rate NUMERIC(10,2),
  demand_level TEXT CHECK (demand_level IN ('low','normal','high','peak')),
  events       TEXT[],
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, forecast_date)
);

CREATE TABLE IF NOT EXISTS channel_rates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL,
  room_type_id UUID REFERENCES room_types(id),
  rate_date    DATE NOT NULL,
  rate         NUMERIC(10,2) NOT NULL,
  availability INT DEFAULT 0,
  pushed_at    TIMESTAMPTZ,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','pushed','failed')),
  UNIQUE (hotel_id, channel, room_type_id, rate_date)
);

CREATE TABLE IF NOT EXISTS abandoned_bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  guest_email     TEXT NOT NULL,
  guest_name      TEXT,
  room_type_id    UUID REFERENCES room_types(id),
  check_in        DATE,
  check_out       DATE,
  last_step       TEXT,
  session_data    JSONB DEFAULT '{}',
  recovery_sent_at TIMESTAMPTZ,
  recovered       BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS competitor_rates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  rate_date     DATE NOT NULL,
  room_type     TEXT,
  rate          NUMERIC(10,2),
  source        TEXT DEFAULT 'manual',
  recorded_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  condition    JSONB NOT NULL DEFAULT '{}',
  adjustment   JSONB NOT NULL DEFAULT '{}',
  is_active    BOOLEAN DEFAULT true,
  priority     INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS occupancy_forecast_hotel_idx ON occupancy_forecast(hotel_id, forecast_date);
CREATE INDEX IF NOT EXISTS channel_rates_hotel_idx      ON channel_rates(hotel_id, rate_date);
CREATE INDEX IF NOT EXISTS abandoned_bookings_hotel_idx ON abandoned_bookings(hotel_id);

ALTER TABLE occupancy_forecast    ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_rates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE abandoned_bookings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_rates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON occupancy_forecast    FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON channel_rates         FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON abandoned_bookings    FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON competitor_rates      FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON dynamic_pricing_rules FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
