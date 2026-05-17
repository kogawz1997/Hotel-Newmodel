import type { ParsedOtaReservation } from './booking-com';

interface TripComPayload {
  order_id?: string | number;
  booking_id?: string | number;
  hotel_id?: string | number;
  property_id?: string | number;
  room_type_id?: string | number;
  room_info?: { type_id?: string | number };
  check_in_date?: string;
  checkin_date?: string;
  check_out_date?: string;
  checkout_date?: string;
  guest?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  guest_info?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    mobile?: string;
  };
  adult_count?: number;
  adults?: number;
  child_count?: number;
  children?: number;
  total_price?: number | string;
  order_amount?: number | string;
  currency?: string;
  order_status?: string;
  special_requests?: string;
  remarks?: string;
}

function mapStatus(raw?: string): ParsedOtaReservation['status'] {
  const s = (raw || '').toLowerCase();
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('modif') || s.includes('amend') || s.includes('change')) return 'modified';
  if (s.includes('no_show') || s.includes('noshow')) return 'modified';
  return 'new';
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

export function parseTripComReservation(payload: unknown): ParsedOtaReservation | null {
  try {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as TripComPayload;

    const externalId = String(p.order_id ?? p.booking_id ?? `trip-${Date.now()}`);
    const hotelExternalId = String(p.hotel_id ?? p.property_id ?? '');
    const roomTypeCode = String(p.room_type_id ?? p.room_info?.type_id ?? '') || undefined;

    const checkIn = p.check_in_date ?? p.checkin_date ?? '';
    const checkOut = p.check_out_date ?? p.checkout_date ?? '';
    if (!checkIn || !checkOut) return null;

    const status = mapStatus(p.order_status);

    let firstName: string;
    let lastName: string;
    let email: string | undefined;
    let phone: string | undefined;

    if (p.guest?.name) {
      const split = splitName(p.guest.name);
      firstName = split.firstName;
      lastName = split.lastName;
      email = p.guest.email;
      phone = p.guest.phone;
    } else if (p.guest_info) {
      firstName = p.guest_info.first_name ?? 'Trip.com';
      lastName = p.guest_info.last_name ?? 'Guest';
      email = p.guest_info.email;
      phone = p.guest_info.mobile;
    } else {
      firstName = 'Trip.com';
      lastName = 'Guest';
    }

    const numAdults = p.adult_count ?? p.adults ?? 1;
    const numChildren = p.child_count ?? p.children ?? 0;
    const totalAmount = Number(p.total_price ?? p.order_amount ?? 0);
    const currency = p.currency ?? 'THB';
    const specialRequests = p.special_requests ?? p.remarks ?? undefined;

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
      firstName: firstName || 'Trip.com',
      lastName: lastName || 'Guest',
      email,
      phone,
      specialRequests,
      source: 'trip_com',
      rawPayload: { ...(p as unknown as Record<string, unknown>), hotelExternalId },
    };
  } catch {
    return null;
  }
}
