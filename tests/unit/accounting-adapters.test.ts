/**
 * Unit Tests: Accounting Adapters
 * Run: npx jest tests/unit/accounting-adapters.test.ts
 */
import {
  validateThaiInvoice,
  PeakAdapter,
  FlowAccountAdapter,
  retryWithBackoff,
  AccountingInvoice,
} from '@/lib/accounting/index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeValidInvoice(overrides: Partial<AccountingInvoice> = {}): AccountingInvoice {
  return {
    invoiceNumber: 'INV-001',
    issueDate: '2026-01-15',
    customerName: 'Test Company Ltd',
    customerTaxId: '1234567890123', // valid 13-digit Thai tax ID
    branchCode: '00000',
    items: [{ description: 'Room charge', amount: 3000, vatRate: 7 }],
    totalAmount: 3000,
    currency: 'THB',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// validateThaiInvoice
// ---------------------------------------------------------------------------

describe('validateThaiInvoice', () => {
  it('valid invoice with 13-digit tax_id and VAT 7 does not throw', () => {
    expect(() => validateThaiInvoice(makeValidInvoice())).not.toThrow();
  });

  it('throws when tax_id is 12 digits (too short)', () => {
    const invoice = makeValidInvoice({ customerTaxId: '123456789012' }); // 12 digits
    expect(() => validateThaiInvoice(invoice)).toThrow(/13/);
  });

  it('throws when VAT rate is 10 (only 0 or 7 allowed in Thailand)', () => {
    const invoice = makeValidInvoice({
      items: [{ description: 'Room charge', amount: 3000, vatRate: 10 }],
    });
    expect(() => validateThaiInvoice(invoice)).toThrow(/VAT/);
  });

  it('throws when customerTaxId is missing', () => {
    const invoice = makeValidInvoice({ customerTaxId: undefined });
    expect(() => validateThaiInvoice(invoice)).toThrow();
  });
});

// ---------------------------------------------------------------------------
// PeakAdapter — throws without API key
// ---------------------------------------------------------------------------

describe('PeakAdapter', () => {
  it('syncInvoice throws when PEAK_API_KEY is not set', async () => {
    const originalKey = process.env.PEAK_API_KEY;
    process.env.PEAK_API_KEY = '';

    const adapter = new PeakAdapter();
    const mockInvoice = makeValidInvoice();

    let threw = false;
    try {
      await adapter.syncInvoice(mockInvoice);
    } catch {
      threw = true;
    }

    // Restore environment
    if (originalKey !== undefined) {
      process.env.PEAK_API_KEY = originalKey;
    } else {
      delete process.env.PEAK_API_KEY;
    }

    expect(threw).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// FlowAccountAdapter — throws without API key
// ---------------------------------------------------------------------------

describe('FlowAccountAdapter', () => {
  it('syncInvoice throws when constructed with empty key', async () => {
    const originalKey = process.env.FLOWACCOUNT_API_KEY;
    process.env.FLOWACCOUNT_API_KEY = '';

    // FlowAccountAdapter takes apiKey as constructor arg; empty string mirrors
    // the getAccountingAdapter('flowaccount') fallback when env var is unset.
    const adapter = new FlowAccountAdapter('');
    const mockInvoice = makeValidInvoice();

    let threw = false;
    try {
      await adapter.syncInvoice(mockInvoice);
    } catch {
      threw = true;
    }

    // Restore environment
    if (originalKey !== undefined) {
      process.env.FLOWACCOUNT_API_KEY = originalKey;
    } else {
      delete process.env.FLOWACCOUNT_API_KEY;
    }

    expect(threw).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// retryWithBackoff
// ---------------------------------------------------------------------------

describe('retryWithBackoff', () => {
  /**
   * "Succeeds on third try" — verified via a mocked fetch that returns a 500
   * response twice (causing ApiError(500) inside fetchWithErrorHandling, which
   * retryWithBackoff recognises as retryable) then returns 200 on attempt 3.
   *
   * We drive it through PeakAdapter.syncInvoice so that the full
   * retryWithBackoff → fetchWithErrorHandling → ApiError path is exercised.
   * The 1-second inter-attempt delay is acceptable within the 15s timeout.
   */
  it('succeeds on the third try when the first two calls return a 500 error', async () => {
    const originalFetch = globalThis.fetch;
    let callCount = 0;

    globalThis.fetch = jest.fn().mockImplementation(async () => {
      callCount += 1;
      if (callCount < 3) {
        return {
          ok: false,
          status: 500,
          text: async () => 'Internal Server Error',
        } as unknown as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ id: 'inv-999' }),
        text: async () => '',
      } as unknown as Response;
    });

    const originalKey = process.env.PEAK_API_KEY;
    process.env.PEAK_API_KEY = 'test-key';

    try {
      const adapter = new PeakAdapter();
      const result = await adapter.syncInvoice(makeValidInvoice());
      expect(result.id).toBe('inv-999');
      expect(result.success).toBe(true);
      expect(callCount).toBe(3);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalKey !== undefined) {
        process.env.PEAK_API_KEY = originalKey;
      } else {
        delete process.env.PEAK_API_KEY;
      }
    }
  }, 15_000);

  /**
   * "Throws immediately on 400" — a plain Error is not an instance of ApiError
   * or NetworkTimeoutError, so retryWithBackoff treats it as non-retryable and
   * propagates it after the very first attempt.
   */
  it('throws immediately on a non-retryable error without retrying', async () => {
    let callCount = 0;
    const error = new Error('HTTP 400: Bad Request');

    await expect(
      retryWithBackoff(async () => {
        callCount += 1;
        throw error;
      }),
    ).rejects.toThrow('HTTP 400: Bad Request');

    // Must have been called exactly once — no retries for non-retryable errors
    expect(callCount).toBe(1);
  }, 10_000);
});
