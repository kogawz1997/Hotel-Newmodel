-- Platform Ops: audit logs, health logs, sales leads, feature flags, A/B tests, webhook events

CREATE TABLE IF NOT EXISTS platform_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id),
  hotel_id UUID REFERENCES hotels(id),
  user_id UUID REFERENCES user_profiles(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS system_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('healthy','degraded','down')),
  latency_ms INT,
  error_message TEXT,
  details JSONB DEFAULT '{}',
  checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS platform_sales_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  hotel_size TEXT CHECK (hotel_size IN ('small','medium','large','chain')),
  stage TEXT NOT NULL DEFAULT 'prospecting' CHECK (stage IN ('prospecting','demo_scheduled','trial','negotiation','closed_won','closed_lost')),
  assigned_to UUID REFERENCES user_profiles(id),
  notes TEXT,
  demo_date TIMESTAMPTZ,
  trial_started_at TIMESTAMPTZ,
  won_at TIMESTAMPTZ,
  lost_reason TEXT,
  source TEXT DEFAULT 'inbound',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  rollout_percent INT DEFAULT 0 CHECK (rollout_percent BETWEEN 0 AND 100),
  target_org_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','paused','completed')),
  variants JSONB NOT NULL DEFAULT '[]',
  traffic_split JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  winner_variant TEXT,
  results JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID REFERENCES hotels(id),
  org_id UUID REFERENCES organizations(id),
  platform TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processed','failed','replayed')),
  error_message TEXT,
  attempts INT DEFAULT 0,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_audit_logs_org_idx ON platform_audit_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS system_health_log_service_idx ON system_health_log(service, checked_at DESC);
CREATE INDEX IF NOT EXISTS platform_sales_leads_stage_idx ON platform_sales_leads(stage);
CREATE INDEX IF NOT EXISTS feature_flags_key_idx ON feature_flags(key);
CREATE INDEX IF NOT EXISTS webhook_events_hotel_idx ON webhook_events(hotel_id, status);
CREATE INDEX IF NOT EXISTS webhook_events_created_idx ON webhook_events(created_at DESC);
