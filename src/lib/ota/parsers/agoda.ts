/**
 * Agoda YCS (Yield Control System) JSON Parser
 * Handles Agoda push notifications for new/modified/cancelled bookings
 */
import type { ParsedOtaReservation } from './booking-com';

interface AgodaPayload {
  booking_id?: string;
  bookingId?: string;
  reservation_id?: string;
  hotel_id?: string | number;
  check_in?: string;
  checkIn?: string;
  check_out?: string;
  checkOut?: string;
  status?: string;
  booking_status?: string;
  currency?: string;
  total_price?: number | string;
  total_amount?: number | string;
  selling_price?: number | string;
  room_type_code?: string;
  roomTypeCode?: string;
  room_name?: string;
  special_requests?: string;
  remarks?: string;
  guest?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    nationality?: string;
    num_adults?: number;
    num_children?: number;
  };
  // flat fields (some Agoda formats)
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  nationality?: string;
  num_adults?: number;
  adults?: number;
  num_children?: number;
  children?: number;
}

function mapStatus(raw?: string): ParsedOtaReservation['status'] {
  const s = (raw || '').toLowerCase();
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('modif') || s.includes('amend') || s.includes('change')) return 'modified';
  return 'new';
}

export function parseAgodaJson(payload: AgodaPayload): ParsedOtaReservation | null {
  try {
    const externalId = String(payload.booking_id ?? payload.bookingId ?? payload.reservation_id ?? `agoda-${Date.now()}`);
    const checkIn  = payload.check_in ?? payload.checkIn ?? '';
    const checkOut = payload.check_out ?? payload.checkOut ?? '';
    if (!checkIn || !checkOut) return null;

    const status = mapStatus(payload.status ?? payload.booking_status);
    const guest = payload.guest ?? {};
    const firstName   = guest.first_name ?? payload.first_name ?? 'Agoda';
    const lastName    = guest.last_name  ?? payload.last_name  ?? 'Guest';
    const email       = guest.email       ?? payload.email       ?? undefined;
    const phone       = guest.phone       ?? payload.phone       ?? undefined;
    const nationality = guest.nationality ?? payload.nationality ?? undefined;
    const numAdults   = guest.num_adults  ?? payload.num_adults  ?? payload.adults ?? 1;
    const numChildren = guest.num_children ?? payload.num_children ?? payload.children ?? 0;
    const totalAmount = Number(payload.total_price ?? payload.total_amount ?? payload.selling_price ?? 0);
    const currency = payload.currency ?? 'THB';
    const roomTypeCode = payload.room_type_code ?? payload.roomTypeCode ?? undefined;
    const specialRequests = payload.special_requests ?? payload.remarks ?? undefined;

    return {
      externalId,
      status,
      checkIn,
      checkOut,
      numAdults,
      numChildren,
      totalAmount,
      currency,
      roomTypeCode,
      firstName,
      lastName,
      email,
      phone,
      nationality,
      specialRequests,
      source: 'agoda',
      rawPayload: payload as unknown as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}
