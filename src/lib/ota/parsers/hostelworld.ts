import type { ParsedOtaReservation } from './booking-com';

interface HostelworldPayload {
  booking_id?: string | number;
  property_id?: string | number;
  bed_type_id?: string | number;
  room_id?: string | number;
  arrival_date?: string;
  departure_date?: string;
  customer?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  };
  num_guests?: number;
  guest_count?: number;
  total_sell_price?: number | string;
  total?: number | string;
  currency_code?: string;
  status?: string;
  special_requirements?: string;
}

function mapStatus(raw?: string): ParsedOtaReservation['status'] {
  const s = (raw || '').toLowerCase();
  if (s.includes('cancel')) return 'cancelled';
  return 'new';
}

export function parseHostelworldReservation(payload: unknown): ParsedOtaReservation | null {
  try {
    if (!payload || typeof payload !== 'object') return null;
    const p = payload as HostelworldPayload;

    const externalId = String(p.booking_id ?? `hw-${Date.now()}`);
    const hotelExternalId = String(p.property_id ?? '');
    const roomTypeCode = String(p.bed_type_id ?? p.room_id ?? '') || undefined;

    const checkIn = p.arrival_date ?? '';
    const checkOut = p.departure_date ?? '';
    if (!checkIn || !checkOut) return null;

    const status = mapStatus(p.status);

    const customer = p.customer ?? {};
    const firstName = customer.first_name ?? 'Hostelworld';
    const lastName = customer.last_name ?? 'Guest';
    const email = customer.email ?? undefined;
    const phone = customer.phone ?? undefined;

    const numAdults = p.num_guests ?? p.guest_count ?? 1;
    const totalAmount = Number(p.total_sell_price ?? p.total ?? 0);
    const currency = p.currency_code ?? 'THB';
    const specialRequests = p.special_requirements ?? undefined;

    return {
      externalId,
      status,
      checkIn,
      checkOut,
      numAdults,
      numChildren: 0,
      totalAmount,
      currency,
      roomTypeCode,
      firstName: firstName || 'Hostelworld',
      lastName: lastName || 'Guest',
      email,
      phone,
      specialRequests,
      source: 'hostelworld',
      rawPayload: { ...(p as unknown as Record<string, unknown>), hotelExternalId },
    };
  } catch {
    return null;
  }
}
