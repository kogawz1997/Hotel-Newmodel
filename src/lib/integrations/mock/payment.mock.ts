import type { PaymentAdapter, PaymentResult, RefundResult, Transaction } from '../types';

export class MockPayment implements PaymentAdapter {
  async charge(amount: number, currency: string, _source: string): Promise<PaymentResult> {
    console.log(`[MockPayment] charge amount=${amount} currency=${currency}`);
    return { chargeId: `mock_${Date.now()}`, status: 'success', amount, currency };
  }
  async refund(chargeId: string, amount?: number): Promise<RefundResult> {
    console.log(`[MockPayment] refund chargeId=${chargeId} amount=${amount}`);
    return { refundId: `refund_${Date.now()}`, status: 'success', amount: amount ?? 0 };
  }
  async getTransaction(id: string): Promise<Transaction> {
    return { id, amount: 0, currency: 'THB', status: 'success', createdAt: new Date() };
  }
  async createQRPromptPay(amount: number, ref: string) {
    console.log(`[MockPayment] createQRPromptPay amount=${amount} ref=${ref}`);
    return { qrData: 'mock_qr_data', expiresAt: new Date(Date.now() + 15 * 60 * 1000) };
  }
  async testConnection(_config: Record<string, string>) {
    return true;
  }
}
