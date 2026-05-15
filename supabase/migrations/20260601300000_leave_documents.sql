-- Leave Requests, Documents, Internal Requests, Announcements

CREATE TABLE IF NOT EXISTS leave_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL
                 CHECK (type IN ('sick','vacation','personal','maternity','paternity',
                                 'ordination','unpaid','other')),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  days         INT GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  reason       TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','rejected','cancelled')),
  approved_by  UUID REFERENCES user_profiles(id),
  approved_at  TIMESTAMPTZ,
  reject_note  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category     TEXT NOT NULL
                 CHECK (category IN ('policy','form','manual','sop','contract','other')),
  title        TEXT NOT NULL,
  description  TEXT,
  file_url     TEXT NOT NULL,
  file_type    TEXT,
  file_size    BIGINT,
  version      TEXT DEFAULT '1.0',
  target_roles TEXT[],              -- NULL = all roles
  uploaded_by  UUID REFERENCES user_profiles(id),
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS internal_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  dept         TEXT,
  type         TEXT NOT NULL
                 CHECK (type IN ('purchase','repair','resource','it','hr','other')),
  title        TEXT NOT NULL,
  details      JSONB DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','reviewing','approved','rejected','completed')),
  approved_by  UUID REFERENCES user_profiles(id),
  approved_at  TIMESTAMPTZ,
  reject_note  TEXT,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS announcements (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  body         TEXT NOT NULL,
  type         TEXT NOT NULL DEFAULT 'general'
                 CHECK (type IN ('general','urgent','policy','event','other')),
  target_roles TEXT[],              -- NULL = all roles
  created_by   UUID REFERENCES user_profiles(id),
  expires_at   TIMESTAMPTZ,
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS leave_requests_hotel_idx     ON leave_requests(hotel_id, status);
CREATE INDEX IF NOT EXISTS leave_requests_staff_idx     ON leave_requests(staff_id);
CREATE INDEX IF NOT EXISTS documents_hotel_idx          ON documents(hotel_id, category);
CREATE INDEX IF NOT EXISTS internal_requests_hotel_idx  ON internal_requests(hotel_id, status);
CREATE INDEX IF NOT EXISTS announcements_hotel_idx      ON announcements(hotel_id, is_active);

-- RLS
ALTER TABLE leave_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements     ENABLE ROW LEVEL SECURITY;

CREATE POLICY leave_org ON leave_requests
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY documents_org ON documents
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY internal_requests_org ON internal_requests
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY announcements_org ON announcements
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
