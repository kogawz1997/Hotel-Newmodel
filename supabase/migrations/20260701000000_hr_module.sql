-- HR Module: payroll, performance, onboarding, training

CREATE TABLE IF NOT EXISTS payroll_periods (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end   DATE NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft','processing','approved','paid')),
  approved_by  UUID REFERENCES user_profiles(id),
  approved_at  TIMESTAMPTZ,
  total_amount NUMERIC(12,2) DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payroll_items (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id        UUID NOT NULL REFERENCES payroll_periods(id) ON DELETE CASCADE,
  staff_id         UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  hotel_id         UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  base_salary      NUMERIC(12,2) NOT NULL DEFAULT 0,
  ot_hours         NUMERIC(6,2) DEFAULT 0,
  ot_amount        NUMERIC(12,2) DEFAULT 0,
  allowances       NUMERIC(12,2) DEFAULT 0,
  deductions       NUMERIC(12,2) DEFAULT 0,
  tax_amount       NUMERIC(12,2) DEFAULT 0,
  net_pay          NUMERIC(12,2) NOT NULL DEFAULT 0,
  attendance_days  INT DEFAULT 0,
  leave_days       INT DEFAULT 0,
  notes            TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS performance_reviews (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reviewer_id  UUID REFERENCES user_profiles(id),
  period       TEXT NOT NULL,
  scores       JSONB DEFAULT '{}',
  overall      NUMERIC(3,1),
  strengths    TEXT,
  improvements TEXT,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','submitted','acknowledged')),
  submitted_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_records (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  course_name  TEXT NOT NULL,
  category     TEXT DEFAULT 'general',
  trainer      TEXT,
  start_date   DATE,
  end_date     DATE,
  hours        NUMERIC(5,1),
  passed       BOOLEAN,
  certificate_url TEXT,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS onboarding_tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id     UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  category     TEXT DEFAULT 'general'
                 CHECK (category IN ('documents','training','it_setup','orientation','general')),
  due_date     DATE,
  completed    BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  assigned_to  UUID REFERENCES user_profiles(id),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payroll_periods_hotel_idx ON payroll_periods(hotel_id, status);
CREATE INDEX IF NOT EXISTS payroll_items_period_idx  ON payroll_items(period_id);
CREATE INDEX IF NOT EXISTS payroll_items_staff_idx   ON payroll_items(staff_id);
CREATE INDEX IF NOT EXISTS performance_reviews_staff_idx ON performance_reviews(hotel_id, staff_id);
CREATE INDEX IF NOT EXISTS training_records_staff_idx    ON training_records(hotel_id, staff_id);
CREATE INDEX IF NOT EXISTS onboarding_tasks_staff_idx    ON onboarding_tasks(hotel_id, staff_id);

ALTER TABLE payroll_periods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_tasks   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_access" ON payroll_periods    FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON payroll_items      FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON performance_reviews FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON training_records   FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
CREATE POLICY "hotel_access" ON onboarding_tasks   FOR ALL USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
