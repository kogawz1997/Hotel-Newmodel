-- Integration stub tables: ready to connect when API keys are available

-- Staff presence (online/offline/busy tracking)
CREATE TABLE IF NOT EXISTS staff_presence (
  user_id      UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'offline'
                 CHECK (status IN ('online','busy','break','offline')),
  floor        TEXT,
  zone         TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT now()
);

-- Integration config per hotel
CREATE TABLE IF NOT EXISTS channel_integrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL,
  enabled      BOOLEAN DEFAULT false,
  config       JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  sync_status  TEXT DEFAULT 'idle',
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, provider)
);

-- OTA reservations queue
CREATE TABLE IF NOT EXISTS ota_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  ota_platform    TEXT NOT NULL,
  ota_booking_id  TEXT NOT NULL UNIQUE,
  raw_payload     JSONB NOT NULL,
  mapped_data     JSONB,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','confirmed','rejected','cancelled')),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Rate push queue → channel manager
CREATE TABLE IF NOT EXISTS rate_push_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID,
  date_from    DATE NOT NULL,
  date_to      DATE NOT NULL,
  rate         NUMERIC(10,2),
  availability INT,
  provider     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','sent','failed')),
  attempts     INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- SMS / notification queue
CREATE TABLE IF NOT EXISTS notification_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL CHECK (channel IN ('sms','email','line','whatsapp','push')),
  recipient    TEXT NOT NULL,
  message      TEXT NOT NULL,
  template_id  TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','sent','failed')),
  provider     TEXT,
  sent_at      TIMESTAMPTZ,
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Key card issuance log
CREATE TABLE IF NOT EXISTS keycard_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  room_no        TEXT NOT NULL,
  guest_name     TEXT,
  card_uid       TEXT,
  digital_key    TEXT,
  valid_from     TIMESTAMPTZ,
  valid_until    TIMESTAMPTZ,
  issued_by      UUID REFERENCES user_profiles(id),
  revoked_at     TIMESTAMPTZ,
  provider       TEXT NOT NULL DEFAULT 'digital_qr',
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Bank transactions for reconciliation
CREATE TABLE IF NOT EXISTS bank_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  txn_date       DATE NOT NULL,
  description    TEXT,
  amount         NUMERIC(10,2) NOT NULL,
  type           TEXT CHECK (type IN ('credit','debit')),
  matched_folio  UUID,
  status         TEXT NOT NULL DEFAULT 'unmatched'
                   CHECK (status IN ('unmatched','matched','ignored')),
  source         TEXT NOT NULL DEFAULT 'manual'
                   CHECK (source IN ('manual','api')),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Market benchmarking data
CREATE TABLE IF NOT EXISTS market_rates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  rate_date    DATE NOT NULL,
  competitor   TEXT,
  room_type    TEXT,
  rate         NUMERIC(10,2),
  occ_pct      NUMERIC(5,2),
  source       TEXT NOT NULL DEFAULT 'manual',
  fetched_at   TIMESTAMPTZ DEFAULT now()
);

-- Automation runs log
CREATE TABLE IF NOT EXISTS automation_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id      UUID NOT NULL REFERENCES automation_rules(id) ON DELETE CASCADE,
  trigger_data JSONB,
  status       TEXT NOT NULL DEFAULT 'success'
                 CHECK (status IN ('success','failed','skipped')),
  error        TEXT,
  ran_at       TIMESTAMPTZ DEFAULT now()
);

-- Hotel content CMS
CREATE TABLE IF NOT EXISTS hotel_content (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  section      TEXT NOT NULL,
  slug         TEXT,
  title        JSONB DEFAULT '{}',
  body         JSONB DEFAULT '{}',
  media        JSONB DEFAULT '[]',
  seo          JSONB DEFAULT '{}',
  published    BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (hotel_id, section, slug)
);

-- Nearby experiences
CREATE TABLE IF NOT EXISTS nearby_experiences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type         TEXT NOT NULL
                 CHECK (type IN ('attraction','tour','restaurant','nightlife','family','other')),
  name         JSONB DEFAULT '{}',
  description  JSONB DEFAULT '{}',
  photo_url    TEXT,
  distance_km  NUMERIC(5,2),
  price_range  TEXT,
  maps_url     TEXT,
  sort_order   INT DEFAULT 0,
  active       BOOLEAN DEFAULT true
);

-- Custom domains
CREATE TABLE IF NOT EXISTS custom_domains (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  domain       TEXT NOT NULL UNIQUE,
  verified     BOOLEAN DEFAULT false,
  ssl_active   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Multi-role support
CREATE TABLE IF NOT EXISTS user_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,
  is_primary   BOOLEAN DEFAULT false,
  granted_by   UUID REFERENCES user_profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, hotel_id, role)
);

-- Active workspace per user
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS active_workspace TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS active_hotel_id  UUID REFERENCES hotels(id);

-- Claim lock columns on work_orders
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS claimed_at       TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS staff_presence_hotel_idx      ON staff_presence(hotel_id, status);
CREATE INDEX IF NOT EXISTS channel_integrations_hotel_idx ON channel_integrations(hotel_id);
CREATE INDEX IF NOT EXISTS notification_queue_status_idx  ON notification_queue(status, created_at);
CREATE INDEX IF NOT EXISTS ota_reservations_hotel_idx    ON ota_reservations(hotel_id, status);
CREATE INDEX IF NOT EXISTS hotel_content_hotel_idx       ON hotel_content(hotel_id, section);
CREATE INDEX IF NOT EXISTS automation_runs_rule_idx      ON automation_runs(rule_id, ran_at);

-- RLS
ALTER TABLE staff_presence        ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_integrations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE ota_reservations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_push_queue       ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue    ENABLE ROW LEVEL SECURITY;
ALTER TABLE keycard_log           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_rates          ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_content         ENABLE ROW LEVEL SECURITY;
ALTER TABLE nearby_experiences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_domains        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles            ENABLE ROW LEVEL SECURITY;

-- Shared org-based policy helper
DO $$ BEGIN
  CREATE POLICY staff_presence_org ON staff_presence
    USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY channel_integrations_org ON channel_integrations
    USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY hotel_content_org ON hotel_content
    USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY user_roles_org ON user_roles
    USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
      SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
