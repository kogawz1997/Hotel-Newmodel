import type { MarketDataAdapter, MarketRate } from '../types';

export class MockMarketData implements MarketDataAdapter {
  async fetchCompetitorRates(_hotelId: string, _dates: string[]): Promise<MarketRate[]> {
    return [];
  }
  async testConnection(_config: Record<string, string>) {
    return true;
  }
}
