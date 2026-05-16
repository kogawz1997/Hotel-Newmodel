-- Review Requests table for post-stay review solicitation
CREATE TABLE IF NOT EXISTS review_requests (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  hotel_id      UUID REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  guest_id      UUID REFERENCES guests(id) ON DELETE SET NULL,

  channel       TEXT NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'line', 'both')),
  email_sent    BOOLEAN DEFAULT false,
  line_sent     BOOLEAN DEFAULT false,
  review_link   TEXT,
  sent_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Outcome tracking
  opened_at     TIMESTAMPTZ,
  reviewed_at   TIMESTAMPTZ,
  review_id     UUID REFERENCES booking_reviews(id) ON DELETE SET NULL,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (reservation_id)
);

CREATE INDEX IF NOT EXISTS review_requests_hotel_idx ON review_requests(hotel_id, sent_at DESC);
CREATE INDEX IF NOT EXISTS review_requests_reservation_idx ON review_requests(reservation_id);

ALTER TABLE review_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hotel_data_isolation" ON review_requests
  FOR ALL USING (
    hotel_id IN (
      SELECT h.id FROM hotels h
      JOIN user_profiles up ON up.organization_id = h.organization_id
      WHERE up.id = auth.uid()
    )
  );
