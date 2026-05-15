-- P1: Atomic reservation creation RPC
-- Wraps guest upsert + reservation insert + idempotency key + folio + audit log
-- in a single transaction so partial failures leave no orphaned rows.

CREATE OR REPLACE FUNCTION create_reservation_atomic(
  p_hotel_id          UUID,
  p_room_type_id      UUID,
  p_room_id           UUID,
  p_check_in          DATE,
  p_check_out         DATE,
  p_num_adults        SMALLINT,
  p_num_children      SMALLINT,
  p_total_amount      NUMERIC,
  p_deposit_amount    NUMERIC,
  p_payment_method    TEXT,
  p_source            TEXT,
  p_status            TEXT,
  p_cancellation_policy JSONB,
  p_rate_plan_id      UUID,
  -- Guest fields
  p_first_name        TEXT,
  p_last_name         TEXT,
  p_email             TEXT,
  p_phone             TEXT,
  p_nationality       TEXT,
  p_special_requests  TEXT,
  -- Idempotency
  p_idempotency_key   TEXT,
  -- Actor
  p_actor_user_id     UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest_id          UUID;
  v_reservation_id    UUID;
  v_reservation_code  TEXT;
  v_folio_id          UUID;
  v_existing_res_id   UUID;
BEGIN
  -- Check idempotency first (before any writes)
  IF p_idempotency_key IS NOT NULL THEN
    SELECT reservation_id INTO v_existing_res_id
    FROM reservation_idempotency_keys
    WHERE hotel_id = p_hotel_id
      AND idempotency_key = p_idempotency_key;

    IF v_existing_res_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'reservation_id', v_existing_res_id,
        'idempotent_replay', true
      );
    END IF;
  END IF;

  -- Upsert guest (match on email or phone within hotel)
  IF p_email IS NOT NULL THEN
    SELECT id INTO v_guest_id FROM guests
    WHERE hotel_id = p_hotel_id AND email = p_email
    LIMIT 1;
  END IF;

  IF v_guest_id IS NULL AND p_phone IS NOT NULL THEN
    SELECT id INTO v_guest_id FROM guests
    WHERE hotel_id = p_hotel_id AND phone = p_phone
    LIMIT 1;
  END IF;

  IF v_guest_id IS NULL THEN
    INSERT INTO guests (hotel_id, first_name, last_name, email, phone, nationality)
    VALUES (p_hotel_id, p_first_name, p_last_name, p_email, p_phone, p_nationality)
    RETURNING id INTO v_guest_id;
  END IF;

  -- Create reservation
  INSERT INTO reservations (
    hotel_id, guest_id, room_id, room_type_id, rate_plan_id,
    check_in, check_out, num_adults, num_children,
    total_amount, deposit_amount, payment_method, payment_status,
    source, status, cancellation_policy, special_requests
  ) VALUES (
    p_hotel_id, v_guest_id, p_room_id, p_room_type_id, p_rate_plan_id,
    p_check_in, p_check_out, p_num_adults, p_num_children,
    p_total_amount, p_deposit_amount, p_payment_method,
    CASE WHEN p_status = 'confirmed' THEN 'unpaid' ELSE 'pending' END,
    p_source, p_status, p_cancellation_policy, p_special_requests
  )
  RETURNING id, reservation_code INTO v_reservation_id, v_reservation_code;

  -- Record idempotency key
  IF p_idempotency_key IS NOT NULL THEN
    INSERT INTO reservation_idempotency_keys (hotel_id, idempotency_key, reservation_id)
    VALUES (p_hotel_id, p_idempotency_key, v_reservation_id)
    ON CONFLICT (hotel_id, idempotency_key) DO NOTHING;
  END IF;

  -- Create folio
  INSERT INTO folios (reservation_id, hotel_id, status, total_charges, balance)
  VALUES (v_reservation_id, p_hotel_id, 'open', p_total_amount, p_total_amount)
  RETURNING id INTO v_folio_id;

  -- Audit log
  INSERT INTO audit_logs (hotel_id, user_id, action, entity_type, entity_id, changes)
  VALUES (
    p_hotel_id, p_actor_user_id,
    'reservation.created',
    'reservation', v_reservation_id,
    jsonb_build_object(
      'source', p_source,
      'totalAmount', p_total_amount,
      'via', 'rpc_atomic'
    )
  );

  RETURN jsonb_build_object(
    'reservation_id',   v_reservation_id,
    'reservation_code', v_reservation_code,
    'guest_id',         v_guest_id,
    'folio_id',         v_folio_id,
    'idempotent_replay', false
  );
END;
$$;

-- Grant to service role only (API uses admin/service client)
REVOKE ALL ON FUNCTION create_reservation_atomic FROM PUBLIC;
GRANT EXECUTE ON FUNCTION create_reservation_atomic TO service_role;
