// Accounting integration for Thai bookkeeping software
//
// Setup links:
// - PEAK: https://peakaccount.com/api (need API access from PEAK support)
// - FlowAccount: https://flowaccount.com - has open API
// - Express: https://www.esg.co.th - older, may need custom integration
// - Xero: https://developer.xero.com (international)

export interface AccountingInvoice {
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  customerName: string;
  customerAddress?: string;
  customerTaxId?: string;
  branchCode?: string;
  items: Array<{ description: string; amount: number; vatRate: number; qty?: number; unitPrice?: number }>;
  totalAmount: number;
  currency?: string;
}

export interface AccountingPayment {
  paymentDate: string;
  amount: number;
  invoiceNumber?: string;
  method: string;
}

export interface AccountingContact {
  name: string;
  taxId?: string;
  email?: string;
  address?: string;
  branchCode?: string;
}

export interface BatchSyncResult {
  success: AccountingInvoice[];
  failed: Array<{ invoice: AccountingInvoice; error: string }>;
}

export interface AccountingAdapter {
  name: string;
  syncInvoice(invoice: AccountingInvoice): Promise<{ id: string; success: boolean }>;
  syncPayment(payment: AccountingPayment): Promise<{ id: string; success: boolean }>;
  syncContact(contact: AccountingContact): Promise<{ id: string }>;
  syncInvoices(invoices: AccountingInvoice[]): Promise<BatchSyncResult>;
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const isRetryable =
        err instanceof NetworkTimeoutError ||
        (err instanceof ApiError && err.statusCode >= 500);
      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }
      const delayMs = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class NetworkTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkTimeoutError';
  }
}

async function fetchWithErrorHandling(url: string, options: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, options);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('timeout') || msg.includes('ETIMEDOUT') || msg.includes('network')) {
      throw new NetworkTimeoutError(msg);
    }
    throw err;
  }
  if (!response.ok) {
    let body = '';
    try {
      body = await response.text();
    } catch {
      // ignore
    }
    if (response.status >= 400 && response.status < 500) {
      throw new ApiError(response.status, `HTTP ${response.status}: ${body}`);
    }
    if (response.status >= 500) {
      throw new ApiError(response.status, `HTTP ${response.status}: ${body}`);
    }
  }
  return response;
}

export function validateThaiInvoice(invoice: AccountingInvoice): void {
  if (!invoice.customerTaxId) {
    throw new Error('Thai e-Tax requires customerTaxId');
  }
  if (!/^\d{13}$/.test(invoice.customerTaxId)) {
    throw new Error(`Invalid tax_id format: must be 13 digits, got "${invoice.customerTaxId}"`);
  }
  if (!invoice.branchCode) {
    throw new Error('branchCode (สาขา) is required when customerTaxId is present');
  }
  const hasInvalidVat = invoice.items.some((item) => item.vatRate !== 0 && item.vatRate !== 7);
  if (hasInvalidVat) {
    throw new Error('VAT rate must be 0 or 7 for Thailand');
  }
}

// PEAK adapter
export class PeakAdapter implements AccountingAdapter {
  name = 'peak';
  private readonly baseUrl = 'https://api.peak.th/v1';

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${process.env.PEAK_API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  async syncInvoice(invoice: AccountingInvoice): Promise<{ id: string; success: boolean }> {
    if (!process.env.PEAK_API_KEY) {
      console.warn('[PEAK] Not configured');
      return { id: '', success: false };
    }
    validateThaiInvoice(invoice);

    const payload = {
      invoice_number: invoice.invoiceNumber,
      date: invoice.issueDate,
      due_date: invoice.dueDate ?? invoice.issueDate,
      customer: {
        tax_id: invoice.customerTaxId,
        name: invoice.customerName,
        address: invoice.customerAddress ?? '',
        branch_code: invoice.branchCode,
      },
      line_items: invoice.items.map((item) => ({
        description: item.description,
        qty: item.qty ?? 1,
        unit_price: item.unitPrice ?? item.amount,
        tax_rate: item.vatRate,
      })),
      total: invoice.totalAmount,
      currency: invoice.currency ?? 'THB',
    };

    const response = await retryWithBackoff(() =>
      fetchWithErrorHandling(`${this.baseUrl}/invoices`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      }),
    );
    const data = await response.json();
    return { id: String(data.id ?? ''), success: true };
  }

  async syncPayment(payment: AccountingPayment): Promise<{ id: string; success: boolean }> {
    if (!process.env.PEAK_API_KEY) {
      console.warn('[PEAK] Not configured');
      return { id: '', success: false };
    }

    const payload = {
      date: payment.paymentDate,
      amount: payment.amount,
      invoice_number: payment.invoiceNumber,
      payment_method: payment.method,
    };

    const response = await retryWithBackoff(() =>
      fetchWithErrorHandling(`${this.baseUrl}/receipts`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      }),
    );
    const data = await response.json();
    return { id: String(data.id ?? ''), success: true };
  }

  async syncContact(contact: AccountingContact): Promise<{ id: string }> {
    if (!process.env.PEAK_API_KEY) {
      console.warn('[PEAK] Not configured');
      return { id: '' };
    }

    const payload = {
      name: contact.name,
      tax_id: contact.taxId,
      email: contact.email,
      address: contact.address,
      branch_code: contact.branchCode,
    };

    const response = await retryWithBackoff(() =>
      fetchWithErrorHandling(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload),
      }),
    );
    const data = await response.json();
    return { id: String(data.id ?? '') };
  }

  async syncInvoices(invoices: AccountingInvoice[]): Promise<BatchSyncResult> {
    const result: BatchSyncResult = { success: [], failed: [] };
    for (const invoice of invoices) {
      try {
        await this.syncInvoice(invoice);
        result.success.push(invoice);
      } catch (err: unknown) {
        result.failed.push({
          invoice,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return result;
  }
}

// FlowAccount adapter (has public API)
export class FlowAccountAdapter implements AccountingAdapter {
  name = 'flowaccount';
  private apiKey: string;
  private baseUrl = 'https://api.flowaccount.com/v2';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async syncInvoice(invoice: AccountingInvoice): Promise<{ id: string; success: boolean }> {
    if (!this.apiKey) return { id: '', success: false };
    validateThaiInvoice(invoice);

    const response = await retryWithBackoff(() =>
      fetchWithErrorHandling(`${this.baseUrl}/invoices`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          documentNumber: invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          customerName: invoice.customerName,
          customerTaxId: invoice.customerTaxId,
          branchCode: invoice.branchCode,
          customerAddress: invoice.customerAddress,
          items: invoice.items.map((item) => ({
            description: item.description,
            qty: item.qty ?? 1,
            unitPrice: item.unitPrice ?? item.amount,
            vatRate: item.vatRate,
          })),
          totalAmount: invoice.totalAmount,
          currency: invoice.currency ?? 'THB',
        }),
      }),
    );
    const data = await response.json();
    return { id: String(data.id ?? ''), success: true };
  }

  async syncPayment(payment: AccountingPayment): Promise<{ id: string; success: boolean }> {
    if (!this.apiKey) return { id: '', success: false };

    const response = await retryWithBackoff(() =>
      fetchWithErrorHandling(`${this.baseUrl}/received-vouchers`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          paymentDate: payment.paymentDate,
          amount: payment.amount,
          documentNumber: payment.invoiceNumber,
          paymentMethod: payment.method,
        }),
      }),
    );
    const data = await response.json();
    return { id: String(data.id ?? ''), success: true };
  }

  async syncContact(contact: AccountingContact): Promise<{ id: string }> {
    if (!this.apiKey) return { id: '' };

    const searchResponse = await retryWithBackoff(() =>
      fetchWithErrorHandling(
        `${this.baseUrl}/contacts?taxId=${encodeURIComponent(contact.taxId ?? contact.name)}`,
        { method: 'GET', headers: this.headers },
      ),
    );
    const searchData = await searchResponse.json();
    const existing = Array.isArray(searchData.data) ? searchData.data[0] : null;

    if (existing?.id) {
      const updateResponse = await retryWithBackoff(() =>
        fetchWithErrorHandling(`${this.baseUrl}/contacts/${existing.id}`, {
          method: 'PUT',
          headers: this.headers,
          body: JSON.stringify({
            name: contact.name,
            taxId: contact.taxId,
            email: contact.email,
            address: contact.address,
            branchCode: contact.branchCode,
          }),
        }),
      );
      const updateData = await updateResponse.json();
      return { id: String(updateData.id ?? existing.id) };
    }

    const createResponse = await retryWithBackoff(() =>
      fetchWithErrorHandling(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          name: contact.name,
          taxId: contact.taxId,
          email: contact.email,
          address: contact.address,
          branchCode: contact.branchCode,
        }),
      }),
    );
    const createData = await createResponse.json();
    return { id: String(createData.id ?? '') };
  }

  async syncInvoices(invoices: AccountingInvoice[]): Promise<BatchSyncResult> {
    const result: BatchSyncResult = { success: [], failed: [] };
    for (const invoice of invoices) {
      try {
        await this.syncInvoice(invoice);
        result.success.push(invoice);
      } catch (err: unknown) {
        result.failed.push({
          invoice,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
    return result;
  }
}

export function getAccountingAdapter(provider: string): AccountingAdapter {
  switch (provider) {
    case 'peak':
      return new PeakAdapter();
    case 'flowaccount':
      return new FlowAccountAdapter(process.env.FLOWACCOUNT_API_KEY || '');
    default:
      throw new Error(`Unsupported accounting provider: ${provider}`);
  }
}
