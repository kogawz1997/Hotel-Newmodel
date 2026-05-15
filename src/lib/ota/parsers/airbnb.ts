/**
 * Airbnb iCal Parser
 * Parses .ics calendar export from Airbnb hosting calendar
 * Used for availability blocking + basic reservation data
 */
import type { ParsedOtaReservation } from './booking-com';

interface ICalEvent {
  uid: string;
  summary: string;
  dtstart: string;
  dtend: string;
  description: string;
  status?: string;
}

function parseICalDate(val: string): string {
  // DATE format: 20240115 → 2024-01-15
  // DATETIME format: 20240115T140000Z → 2024-01-15
  const clean = val.replace(/T.*/, '').replace(/;VALUE=DATE/, '');
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
  }
  return clean;
}

function parseICalEvents(ical: string): ICalEvent[] {
  if (!ical.includes('VCALENDAR') && !ical.includes('VEVENT')) return [];
  const events: ICalEvent[] = [];
  const blocks = ical.split('BEGIN:VEVENT');
  for (const block of blocks.slice(1)) {
    const get = (key: string) => {
      const m = new RegExp(`^${key}[^:]*:(.*)$`, 'm').exec(block);
      return m?.[1]?.replace(/\\n/g, '\n').replace(/\\,/g, ',').trim() ?? '';
    };
    const uid     = get('UID');
    const summary = get('SUMMARY');
    const dtstart = parseICalDate(get('DTSTART'));
    const dtend   = parseICalDate(get('DTEND'));
    const description = get('DESCRIPTION');
    const status  = get('STATUS') || undefined;
    if (dtstart && dtend) {
      events.push({ uid, summary, dtstart, dtend, description, status });
    }
  }
  return events;
}

function extractDescField(description: string, key: string): string {
  const m = new RegExp(`${key}:\\s*([^\n\\\\]+)`, 'i').exec(description);
  return m?.[1]?.trim() ?? '';
}

export function parseAirbnbIcal(icalText: string): ParsedOtaReservation[] {
  const events = parseICalEvents(icalText);
  const results: ParsedOtaReservation[] = [];

  for (const ev of events) {
    // Skip "Airbnb (Not available)" blocks that aren't real reservations
    const summaryLower = ev.summary.toLowerCase();
    if (summaryLower.includes('not available') || summaryLower.includes('blocked')) {
      continue;
    }

    const isCancelled = (ev.status?.toLowerCase() === 'cancelled') ||
      summaryLower.includes('cancel');

    // Extract booking code from UID: airbnb_reserv_HMABCDE@airbnb.com
    const uidMatch = /([A-Z0-9]{6,12})@airbnb\.com/i.exec(ev.uid);
    const externalId = uidMatch?.[1] ?? ev.uid;

    // Extract from DESCRIPTION
    const desc = ev.description;
    const bookingCode   = extractDescField(desc, 'BOOKING CODE') || externalId;
    const firstName     = extractDescField(desc, 'FIRST NAME') || 'Airbnb';
    const lastName      = extractDescField(desc, 'LAST NAME')  || 'Guest';
    const email         = extractDescField(desc, 'EMAIL')  || undefined;
    const guestsStr     = extractDescField(desc, 'GUESTS');
    const nightsStr     = extractDescField(desc, 'NIGHTS');
    const numAdults     = Math.max(1, parseInt(guestsStr || '1', 10));
    const totalAmountStr = extractDescField(desc, 'TOTAL PRICE') || extractDescField(desc, 'AMOUNT');
    const totalAmount   = parseFloat(totalAmountStr.replace(/[^\d.]/g, '') || '0');

    results.push({
      externalId: bookingCode,
      status: isCancelled ? 'cancelled' : 'new',
      checkIn:  ev.dtstart,
      checkOut: ev.dtend,
      numAdults,
      numChildren: 0,
      totalAmount,
      currency: 'THB',
      firstName,
      lastName,
      email: email || undefined,
      phone: undefined,
      specialRequests: undefined,
      source: 'airbnb',
      rawPayload: { uid: ev.uid, summary: ev.summary, description: desc.slice(0, 1000) },
    });
  }

  return results;
}

export function parseAirbnbPayload(payload: Record<string, unknown>): ParsedOtaReservation | null {
  // Airbnb also sends JSON webhooks for some event types
  try {
    const type = String(payload.type ?? payload.event_type ?? '');
    const data = (payload.data ?? payload.reservation ?? payload) as any;
    const status: ParsedOtaReservation['status'] =
      type.includes('cancel') || String(data.status ?? '').includes('cancel') ? 'cancelled' :
      type.includes('alter') || String(data.status ?? '').includes('alter') ? 'modified' : 'new';

    const externalId = String(data.confirmation_code ?? data.booking_id ?? data.id ?? `airbnb-${Date.now()}`);
    const checkIn    = String(data.start_date ?? data.check_in ?? '');
    const checkOut   = String(data.end_date   ?? data.check_out ?? '');
    if (!checkIn || !checkOut) return null;

    const guest = data.guest ?? data.primary_guest ?? {};
    return {
      externalId,
      status,
      checkIn,
      checkOut,
      numAdults:  Number(data.number_of_guests ?? data.num_adults ?? guest.num_adults ?? 1),
      numChildren: 0,
      totalAmount: Number(data.total_price?.amount ?? data.payout_price_details?.host_payout_amount ?? 0),
      currency:    String(data.total_price?.currency ?? 'THB'),
      firstName:   String(guest.first_name ?? data.guest_first_name ?? 'Airbnb'),
      lastName:    String(guest.last_name  ?? data.guest_last_name  ?? 'Guest'),
      email: guest.email ?? undefined,
      phone: undefined,
      source: 'airbnb',
      rawPayload: payload,
    };
  } catch {
    return null;
  }
}
