import type { ChannelManagerAdapter, RatePush, AvailabilityPush, OTAReservation } from '../types';

export class MockChannelManager implements ChannelManagerAdapter {
  async pushRates(hotelId: string, rates: RatePush[]) {
    console.log(`[MockChannelManager] pushRates hotelId=${hotelId} count=${rates.length}`);
  }
  async pushAvailability(hotelId: string, avail: AvailabilityPush[]) {
    console.log(`[MockChannelManager] pushAvailability hotelId=${hotelId} count=${avail.length}`);
  }
  async fetchReservations(_hotelId: string, _since: Date): Promise<OTAReservation[]> {
    return [];
  }
  async testConnection(_config: Record<string, string>) {
    return true;
  }
}
