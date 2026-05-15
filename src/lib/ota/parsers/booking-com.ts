/**
 * Booking.com OTA XML Parser
 * Handles OTA_HotelResNotifRQ (OpenTravel Alliance 2003B standard)
 * Used by Booking.com to push new/modified/cancelled reservations
 */

export interface ParsedOtaReservation {
  externalId: string;
  status: 'new' | 'modified' | 'cancelled';
  checkIn: string;       // YYYY-MM-DD
  checkOut: string;      // YYYY-MM-DD
  numAdults: number;
  numChildren: number;
  totalAmount: number;
  currency: string;
  roomTypeCode?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  nationality?: string;
  specialRequests?: string;
  source: string;
  rawPayload: Record<string, unknown>;
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

export function parseBookingComXml(xml: string): ParsedOtaReservation | null {
  try {
    const resStatus = attr(xml, 'ResStatus') || 'New';
    const status: ParsedOtaReservation['status'] =
      resStatus.toLowerCase().includes('cancel') ? 'cancelled' :
      resStatus.toLowerCase().includes('modif') ? 'modified' : 'new';

    // External booking ID
    const uniqueIdMatch = /<UniqueID[^>]*Type="14"[^>]*ID="([^"]+)"/.exec(xml)
      ?? /<UniqueID[^>]*ID="([^"]+)"/.exec(xml);
    const externalId = uniqueIdMatch?.[1] ?? `bcom-${Date.now()}`;

    // Stay dates
    const stayRange = findTag(xml, 'StayDateRange');
    const checkIn  = attr(stayRange, 'Start') || '';
    const checkOut = attr(stayRange, 'End')   || '';

    // Guest count — AgeQualifyingCode 10 = adult, 8 = child
    let numAdults = 1;
    let numChildren = 0;
    const guestCountBlocks = [...xml.matchAll(/<GuestCount[^>]*/gi)];
    for (const m of guestCountBlocks) {
      const block = m[0];
      const code  = attr(block, 'AgeQualifyingCode');
      const count = parseInt(attr(block, 'Count') || '1', 10);
      if (code === '10') numAdults = count;
      else if (code === '8') numChildren = count;
    }

    // Room type
    const roomRateBlock = findTag(xml, 'RoomRate');
    const roomTypeCode  = attr(roomRateBlock, 'RoomTypeCode') || undefined;

    // Amount — AmountAfterTax preferred
    const rateBlock = findTag(xml, 'Rate');
    const totalAmount =
      parseFloat(attr(rateBlock, 'AmountAfterTax') || attr(rateBlock, 'AmountBeforeTax') || '0');
    const currency = attr(rateBlock, 'CurrencyCode') || 'THB';

    // Guest info
    const personName  = findTag(xml, 'PersonName');
    const firstName   = tagContent(personName || xml, 'GivenName') || tagContent(xml, 'GivenName');
    const lastName    = tagContent(personName || xml, 'Surname') || tagContent(xml, 'Surname');
    const email       = tagContent(xml, 'Email') || undefined;
    const phoneFull   = /<Telephone[^>]*PhoneNumber="([^"]+)"/.exec(xml)?.[1] || undefined;
    const nationality = /<CountryName[^>]*Code="([^"]+)"/.exec(xml)?.[1] || undefined;
    const specialRequests = tagContent(xml, 'SpecialRequests') ||
      tagContent(xml, 'Comment') || undefined;

    if (!checkIn || !checkOut) return null;

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
      firstName: firstName || 'Booking.com',
      lastName:  lastName  || 'Guest',
      email,
      phone: phoneFull,
      nationality,
      specialRequests,
      source: 'booking_com',
      rawPayload: { xml: xml.slice(0, 4000) },
    };
  } catch {
    return null;
  }
}
