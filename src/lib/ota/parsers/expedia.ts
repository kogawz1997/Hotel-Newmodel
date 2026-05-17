import type { ParsedOtaReservation } from './booking-com';

interface ExpediaEqcPayload {
  booking_id?: string | number;
  bookingId?: string | number;
  id?: string | number;
  hotel_id?: string | number;
  hotelId?: string | number;
  room_type_id?: string | number;
  roomTypeId?: string | number;
  check_in?: string;
  checkIn?: string;
  arrival?: string;
  check_out?: string;
  checkOut?: string;
  departure?: string;
  status?: string;
  bookingStatus?: string;
  booking_status?: string;
  currency?: string;
  currencyCode?: string;
  total_amount?: number | string;
  totalAmount?: number | string;
  amount?: number | string;
  rate_plan_id?: string | number;
  ratePlanId?: string | number;
  special_requests?: string;
  specialRequests?: string;
  remarks?: string;
  guest?: {
    first_name?: string;
    firstName?: string;
    last_name?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    adults?: number;
    num_adults?: number;
    children?: number;
    num_children?: number;
  };
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  adults?: number;
  num_adults?: number;
  children?: number;
  num_children?: number;
}

function attr(node: string, attrName: string): string {
  const m = new RegExp(`${attrName}="([^"]*)"`, 'i').exec(node);
  return m?.[1] ?? '';
}

function tagContent(xml: string, tag: string): string {
  const m = new RegExp(`<${tag}[^>]*>([^<]*)<\/${tag}>`, 'i').exec(xml);
  return m?.[1]?.trim() ?? '';
}

function findTag(xml: string, tag: string): string {
  const m = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i').exec(xml);
  return m?.[1] ?? '';
}

function mapStatus(raw?: string): ParsedOtaReservation['status'] {
  const s = (raw || '').toLowerCase();
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('modif') || s.includes('amend') || s.includes('change') || s.includes('pending_modification')) return 'modified';
  return 'new';
}

function parseExpediaXml(xml: string): ParsedOtaReservation | null {
  try {
    const resStatus = attr(xml, 'ResStatus') || tagContent(xml, 'Status') || 'New';
    const status = mapStatus(resStatus);

    const uniqueIdMatch =
      /<UniqueID[^>]*Type="14"[^>]*ID="([^"]+)"/.exec(xml) ??
      /<BookingID[^>]*>([^<]+)<\/BookingID>/i.exec(xml) ??
      /<UniqueID[^>]*ID="([^"]+)"/.exec(xml);
    const externalId = uniqueIdMatch?.[1] ?? `expedia-${Date.now()}`;

    const stayRange = findTag(xml, 'StayDateRange');
    const checkIn = attr(stayRange, 'Start') || tagContent(xml, 'ArrivalDate') || '';
    const checkOut = attr(stayRange, 'End') || tagContent(xml, 'DepartureDate') || '';
    if (!checkIn || !checkOut) return null;

    let numAdults = 1;
    let numChildren = 0;
    const guestCountBlocks = [...xml.matchAll(/<GuestCount[^>]*/gi)];
    for (const m of guestCountBlocks) {
      const block = m[0];
      const code = attr(block, 'AgeQualifyingCode');
      const count = parseInt(attr(block, 'Count') || '1', 10);
      if (code === '10') numAdults = count;
      else if (code === '8') numChildren = count;
    }

    const roomRateBlock = findTag(xml, 'RoomRate');
    const roomTypeCode = attr(roomRateBlock, 'RoomTypeCode') ||
      tagContent(xml, 'RoomTypeCode') || undefined;

    const ratePlanId = attr(roomRateBlock, 'RatePlanCode') ||
      tagContent(xml, 'RatePlanCode') || undefined;

    const rateBlock = findTag(xml, 'Rate');
    const totalAmount = parseFloat(
      attr(rateBlock, 'AmountAfterTax') ||
      attr(rateBlock, 'AmountBeforeTax') ||
      tagContent(xml, 'TotalAmount') ||
      '0'
    );
    const currency = attr(rateBlock, 'CurrencyCode') ||
      attr(xml, 'CurrencyCode') || 'USD';

    const personName = findTag(xml, 'PersonName');
    const firstName = tagContent(personName || xml, 'GivenName') || tagContent(xml, 'GivenName') || 'Expedia';
    const lastName = tagContent(personName || xml, 'Surname') || tagContent(xml, 'Surname') || 'Guest';
    const email = tagContent(xml, 'Email') || undefined;
    const phone = /<Telephone[^>]*PhoneNumber="([^"]+)"/.exec(xml)?.[1] || undefined;
    const specialRequests = tagContent(xml, 'SpecialRequests') ||
      tagContent(xml, 'Comment') || undefined;

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
      specialRequests,
      source: 'expedia',
      rawPayload: { xml: xml.slice(0, 4000), ratePlanId },
    };
  } catch {
    return null;
  }
}

function parseExpediaJson(payload: ExpediaEqcPayload): ParsedOtaReservation | null {
  try {
    const externalId = String(
      payload.booking_id ?? payload.bookingId ?? payload.id ?? `expedia-${Date.now()}`
    );
    const checkIn = payload.check_in ?? payload.checkIn ?? payload.arrival ?? '';
    const checkOut = payload.check_out ?? payload.checkOut ?? payload.departure ?? '';
    if (!checkIn || !checkOut) return null;

    const status = mapStatus(payload.status ?? payload.bookingStatus ?? payload.booking_status);

    const guest = payload.guest ?? {};
    const firstName = guest.first_name ?? guest.firstName ?? payload.first_name ?? payload.firstName ?? 'Expedia';
    const lastName = guest.last_name ?? guest.lastName ?? payload.last_name ?? payload.lastName ?? 'Guest';
    const email = guest.email ?? payload.email ?? undefined;
    const phone = guest.phone ?? payload.phone ?? undefined;
    const numAdults = guest.num_adults ?? guest.adults ?? payload.num_adults ?? payload.adults ?? 1;
    const numChildren = guest.num_children ?? guest.children ?? payload.num_children ?? payload.children ?? 0;
    const totalAmount = Number(payload.total_amount ?? payload.totalAmount ?? payload.amount ?? 0);
    const currency = payload.currency ?? payload.currencyCode ?? 'USD';
    const roomTypeCode = String(payload.room_type_id ?? payload.roomTypeId ?? '') || undefined;
    const ratePlanId = String(payload.rate_plan_id ?? payload.ratePlanId ?? '') || undefined;
    const specialRequests = payload.special_requests ?? payload.specialRequests ?? payload.remarks ?? undefined;

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
      specialRequests,
      source: 'expedia',
      rawPayload: { ...(payload as unknown as Record<string, unknown>), ratePlanId },
    };
  } catch {
    return null;
  }
}

export type NormalizedReservation = ParsedOtaReservation;

export function parseExpediaReservation(payload: unknown): NormalizedReservation | null {
  if (typeof payload === 'string') {
    const trimmed = payload.trim();
    if (trimmed.startsWith('<')) {
      return parseExpediaXml(trimmed);
    }
    try {
      return parseExpediaJson(JSON.parse(trimmed) as ExpediaEqcPayload);
    } catch {
      return null;
    }
  }

  if (payload && typeof payload === 'object') {
    const obj = payload as Record<string, unknown>;
    if (typeof obj.xml === 'string') return parseExpediaXml(obj.xml);
    if (typeof obj.body === 'string' && obj.body.trim().startsWith('<')) {
      return parseExpediaXml(obj.body);
    }
    return parseExpediaJson(obj as ExpediaEqcPayload);
  }

  return null;
}
