// Channel Manager for OTA sync (Booking.com, Agoda, Airbnb, Expedia)
//
// SETUP NOTES:
// Direct integration with each OTA requires:
// - Booking.com Connectivity Partner (4-12 weeks approval) - https://connect.booking.com
// - Agoda YCS API (6-16 weeks) - https://partners.agoda.com
// - Airbnb Software Partner - https://partners.airbnb.com
// - Expedia Partner Central - https://expediapartnercentral.com
//
// FAST ALTERNATIVE: Use a Channel Manager aggregator
// - HotelRunner (https://hotelrunner.com) - launches in days
// - MyAllocator (https://myallocator.com)
// - Cubilis by Stardekk
// 
// We support both direct and aggregator approaches below.

export interface OTAReservation {
  externalId: string;
  channel: string;
  guestName: string;
  guestEmail?: string;
  guestPhone?: string;
  guestNationality?: string;
  checkIn: string;
  checkOut: string;
  numAdults: number;
  numChildren: number;
  roomTypeCode: string;
  ratePlanCode?: string;
  totalAmount: number;
  currency: string;
  commission?: number;
  paidByOTA: boolean;
  specialRequests?: string;
  raw: any;
}

export interface InventoryUpdate {
  roomTypeCode: string;
  date: string; // YYYY-MM-DD
  available: number;
  rate?: number;
  minStay?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
}

export interface ChannelManagerAdapter {
  name: string;
  pullReservations(since?: Date): Promise<OTAReservation[]>;
  pushInventory(updates: InventoryUpdate[]): Promise<{ success: boolean; errors?: string[] }>;
  acknowledgeReservation(externalId: string): Promise<void>;
  cancelReservation(externalId: string, reason: string): Promise<void>;
}

// HotelRunner adapter (recommended for fast launch)
export class HotelRunnerAdapter implements ChannelManagerAdapter {
  name = 'hotelrunner';
  private apiKey: string;
  private hotelId: string;
  private baseUrl = 'https://app.hotelrunner.com/api/v2';

  constructor(apiKey: string, hotelId: string) {
    this.apiKey = apiKey;
    this.hotelId = hotelId;
  }

  private headers() {
    return {
      'X-Api-Token': this.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async pullReservations(since?: Date): Promise<OTAReservation[]> {
    if (!this.apiKey || !this.hotelId) return [];

    const params = new URLSearchParams({ hotel_id: this.hotelId, per_page: '100' });
    if (since) params.set('updated_at_after', since.toISOString());

    const res = await fetch(`${this.baseUrl}/reservations?${params}`, { headers: this.headers() });
    if (!res.ok) throw new Error(`HotelRunner pullReservations: ${res.status} ${await res.text()}`);

    const data = await res.json();
    return (data.reservations || []).map((r: any): OTAReservation => ({
      externalId: String(r.id),
      channel: r.source || 'hotelrunner',
      guestName: `${r.customer?.name || ''} ${r.customer?.surname || ''}`.trim(),
      guestEmail: r.customer?.email,
      guestPhone: r.customer?.phone,
      guestNationality: r.customer?.nationality_code,
      checkIn: r.check_in,
      checkOut: r.check_out,
      numAdults: r.adults || 1,
      numChildren: r.children || 0,
      roomTypeCode: String(r.room_type_id || ''),
      ratePlanCode: String(r.rate_plan_id || ''),
      totalAmount: Number(r.total || 0),
      currency: r.currency || 'THB',
      commission: Number(r.commission || 0),
      paidByOTA: r.payment_type === 'ota',
      specialRequests: r.special_requests,
      raw: r,
    }));
  }

  async pushInventory(updates: InventoryUpdate[]): Promise<{ success: boolean }> {
    if (!this.apiKey || !this.hotelId) return { success: false };

    const payload = {
      hotel_id: this.hotelId,
      availabilities: updates.map((u) => ({
        room_type_id: u.roomTypeCode,
        date: u.date,
        available: u.available,
        ...(u.rate ? { price: u.rate } : {}),
        ...(u.minStay ? { min_stay: u.minStay } : {}),
        ...(u.closedToArrival !== undefined ? { stop_sell: u.closedToArrival } : {}),
      })),
    };

    const res = await fetch(`${this.baseUrl}/availabilities`, {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(payload),
    });

    return { success: res.ok };
  }

  async acknowledgeReservation(externalId: string): Promise<void> {
    if (!this.apiKey) return;
    await fetch(`${this.baseUrl}/reservations/${externalId}/confirm`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ hotel_id: this.hotelId }),
    });
  }

  async cancelReservation(externalId: string, reason: string): Promise<void> {
    if (!this.apiKey) return;
    await fetch(`${this.baseUrl}/reservations/${externalId}/cancel`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ hotel_id: this.hotelId, reason }),
    });
  }
}

// Direct Booking.com adapter (after partner approval)
export class BookingComAdapter implements ChannelManagerAdapter {
  name = 'booking_com';
  // SETUP: After approval, you'll get:
  // - XML API endpoints
  // - Property ID
  // - Username/password
  // Documentation: https://developers.booking.com

  async pullReservations(): Promise<OTAReservation[]> {
    // Booking.com uses OTA_HotelResNotifRQ XML format
    // Implement XML SOAP client here
    console.warn('[Booking.com] Direct integration - awaiting partner approval');
    return [];
  }

  async pushInventory(): Promise<{ success: boolean }> {
    return { success: false };
  }

  async acknowledgeReservation(): Promise<void> {}
  async cancelReservation(): Promise<void> {}
}

export function getChannelManager(provider: string, config: any): ChannelManagerAdapter {
  switch (provider) {
    case 'hotelrunner':
      return new HotelRunnerAdapter(config.apiKey, config.hotelId);
    case 'booking_com':
      return new BookingComAdapter();
    default:
      throw new Error(`Unsupported channel manager: ${provider}`);
  }
}
