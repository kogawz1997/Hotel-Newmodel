import { OmiseAdapter } from '@/lib/payments/index';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeOmiseAdapter() {
  return new OmiseAdapter('skey_test_mock');
}

function mockOmiseSource(sourceId: string) {
  return { id: sourceId, type: 'promptpay', scannable_code: { image: { download_uri: 'https://qr.example.com/qr.png' } } };
}

function mockOmiseCharge(overrides: Record<string, any> = {}) {
  return {
    id: 'chrg_test_001',
    status: 'pending',
    amount: 250000,
    currency: 'thb',
    source: mockOmiseSource('src_test_001'),
    ...overrides,
  };
}

function mockOmiseResponse(body: any, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  });
}

describe('Payment Methods', () => {

  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('TrueMoney / PromptPay amount validation', () => {
    it('rejects charge when amount is 0', async () => {
      const adapter = makeOmiseAdapter();
      await expect(
        adapter.charge({ amount: 0, currency: 'THB', description: 'Test', method: 'promptpay' })
      ).rejects.toThrow();
    });

    it('rejects charge when amount is negative', async () => {
      const adapter = makeOmiseAdapter();
      await expect(
        adapter.charge({ amount: -500, currency: 'THB', description: 'Test', method: 'promptpay' })
      ).rejects.toThrow();
    });
  });

  describe('PromptPay', () => {
    it('creates a PromptPay charge and returns QR code URL', async () => {
      const sourceBody = mockOmiseSource('src_promptpay_001');
      const chargeBody = mockOmiseCharge({
        id: 'chrg_promptpay_001',
        source: { ...sourceBody, scannable_code: { image: { download_uri: 'https://qr.omise.co/promptpay.png' } } },
      });

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(sourceBody) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(chargeBody) });

      const adapter = makeOmiseAdapter();
      const result = await adapter.charge({
        amount: 2500,
        currency: 'THB',
        description: 'Reservation RES-001',
        method: 'promptpay',
      });

      expect(result.transactionId).toBe('chrg_promptpay_001');
      expect(result.status).toBe('pending');
      expect(result.qrCode).toBe('https://qr.omise.co/promptpay.png');
      expect(result.amount).toBe(2500);
      expect(result.currency).toBe('THB');
    });

    it('sends amount in satang (amount * 100) to Omise', async () => {
      const sourceBody = mockOmiseSource('src_test_satang');
      const chargeBody = mockOmiseCharge();

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(sourceBody) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(chargeBody) });

      const adapter = makeOmiseAdapter();
      await adapter.charge({ amount: 1234, currency: 'THB', description: 'Test', method: 'promptpay' });

      const sourceCall = mockFetch.mock.calls[0];
      const sourceBody2 = sourceCall[1].body as string;
      expect(sourceBody2).toContain('amount=123400');
    });
  });

  describe('ShopeePay source type', () => {
    it('credit card charge uses card token not shopeepay source', async () => {
      const chargeBody = mockOmiseCharge({ status: 'successful', id: 'chrg_card_001' });
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(chargeBody) });

      const adapter = makeOmiseAdapter();
      const result = await adapter.charge({
        amount: 5000,
        currency: 'THB',
        description: 'Card payment',
        method: 'credit_card',
        metadata: { cardToken: 'tokn_test_visa_001' },
      });

      expect(result.status).toBe('completed');
      const cardCall = mockFetch.mock.calls[0];
      const cardBody = cardCall[1].body as string;
      expect(cardBody).toContain('card=tokn_test_visa_001');
      expect(cardBody).not.toContain('shopeepay');
      expect(cardBody).not.toContain('rabbit_linepay');
    });

    it('credit card charge requires card token or throws', async () => {
      const adapter = makeOmiseAdapter();
      await expect(
        adapter.charge({ amount: 1000, currency: 'THB', description: 'No token', method: 'credit_card' })
      ).rejects.toThrow('Missing card token');
    });

    it('unsupported method (shopeepay) throws not implemented error', async () => {
      const adapter = makeOmiseAdapter();
      await expect(
        adapter.charge({ amount: 1000, currency: 'THB', description: 'Shopeepay test', method: 'shopeepay' })
      ).rejects.toThrow(/not implemented/i);
    });

    it('unsupported method (truemoney) throws not implemented error', async () => {
      const adapter = makeOmiseAdapter();
      await expect(
        adapter.charge({ amount: 1000, currency: 'THB', description: 'TrueMoney test', method: 'truemoney' })
      ).rejects.toThrow(/not implemented/i);
    });
  });

  describe('Omise webhook parsing', () => {
    it('parses valid webhook payload', async () => {
      const adapter = makeOmiseAdapter();
      const webhookBody = {
        data: { id: 'chrg_webhook_001', status: 'successful', amount: 300000 },
      };
      const result = await adapter.parseWebhook(webhookBody);
      expect(result.transactionId).toBe('chrg_webhook_001');
      expect(result.status).toBe('successful');
      expect(result.amount).toBe(3000);
    });

    it('throws on invalid webhook payload', async () => {
      const adapter = makeOmiseAdapter();
      await expect(adapter.parseWebhook({ data: null })).rejects.toThrow();
    });
  });

  describe('Refund', () => {
    it('sends refund request to Omise and returns refund id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'rfnd_test_001', amount: 100000 }),
      });

      const adapter = makeOmiseAdapter();
      const result = await adapter.refund('chrg_test_001', 1000);
      expect(result.success).toBe(true);
      expect(result.refundId).toBe('rfnd_test_001');
    });
  });
});
