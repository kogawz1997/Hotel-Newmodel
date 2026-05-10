-- P1 booking integrity: idempotency key ledger for reservation creation
CREATE TABLE IF NOT EXISTS reservation_idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  idempotency_key TEXT NOT NULL,
  reservation_id UUID REFERENCES reservations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hotel_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS reservation_idempotency_keys_hotel_created_idx
  ON reservation_idempotency_keys(hotel_id, created_at DESC);

CREATE OR REPLACE FUNCTION touch_reservation_idempotency_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_reservation_idempotency_keys ON reservation_idempotency_keys;
CREATE TRIGGER trg_touch_reservation_idempotency_keys
BEFORE UPDATE ON reservation_idempotency_keys
FOR EACH ROW EXECUTE FUNCTION touch_reservation_idempotency_keys_updated_at();
