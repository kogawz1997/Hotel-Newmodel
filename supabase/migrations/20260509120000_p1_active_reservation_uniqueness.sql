-- P1 booking integrity: DB-level duplicate booking prevention for active reservations
-- Prevents two active reservations for the same guest/room type/date window in one hotel.
CREATE UNIQUE INDEX IF NOT EXISTS reservations_active_unique_guest_room_dates_idx
  ON reservations(hotel_id, guest_id, room_type_id, check_in, check_out)
  WHERE status IN ('pending_payment', 'confirmed');
