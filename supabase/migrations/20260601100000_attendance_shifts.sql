-- Attendance & Shift Management tables

CREATE TABLE IF NOT EXISTS shifts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,                          -- e.g. "Morning", "Evening", "Night"
  dept          TEXT,                                   -- NULL = all depts
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  color         TEXT DEFAULT '#6366f1',
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS shift_assignments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  shift_id      UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
  work_date     DATE NOT NULL,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (staff_id, work_date)                          -- one shift per staff per day
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id      UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  staff_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  shift_id      UUID REFERENCES shifts(id),
  work_date     DATE NOT NULL DEFAULT CURRENT_DATE,
  clock_in_at   TIMESTAMPTZ,
  clock_out_at  TIMESTAMPTZ,
  break_start   TIMESTAMPTZ,
  break_end     TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','clocked_in','on_break','clocked_out','absent','late')),
  late_minutes  INT DEFAULT 0,
  overtime_mins INT DEFAULT 0,
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (staff_id, work_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS attendance_records_hotel_date_idx ON attendance_records(hotel_id, work_date);
CREATE INDEX IF NOT EXISTS attendance_records_staff_idx      ON attendance_records(staff_id);
CREATE INDEX IF NOT EXISTS shift_assignments_hotel_date_idx  ON shift_assignments(hotel_id, work_date);

-- RLS
ALTER TABLE shifts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_assignments  ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY shifts_org ON shifts
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY shift_assignments_org ON shift_assignments
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));

CREATE POLICY attendance_org ON attendance_records
  USING (hotel_id IN (SELECT id FROM hotels WHERE organization_id = (
    SELECT organization_id FROM user_profiles WHERE id = auth.uid())));
