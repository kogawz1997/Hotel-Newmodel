import type { POSAdapter, POSOrder } from '../types';

export class MockPOS implements POSAdapter {
  async fetchOrders(_hotelId: string, _since: Date): Promise<POSOrder[]> {
    return [];
  }
  async postRoomCharge(roomNo: string, amount: number, description: string, reference: string) {
    console.log(`[MockPOS] postRoomCharge room=${roomNo} amount=${amount} desc="${description}" ref=${reference}`);
  }
  async testConnection(_config: Record<string, string>) {
    return true;
  }
}
