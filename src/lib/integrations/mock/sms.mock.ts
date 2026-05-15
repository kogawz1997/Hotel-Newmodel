import type { SMSAdapter, SMSResult } from '../types';

export class MockSMS implements SMSAdapter {
  async send(to: string, message: string): Promise<SMSResult> {
    console.log(`[MockSMS] send to=${to} message="${message.slice(0, 40)}..."`);
    return { messageId: `mock_sms_${Date.now()}`, status: 'sent', to };
  }
  async sendBulk(recipients: string[], message: string): Promise<SMSResult[]> {
    return recipients.map((to) => ({ messageId: `mock_sms_${Date.now()}`, status: 'sent' as const, to }));
  }
  async testConnection(_config: Record<string, string>) {
    return true;
  }
}
