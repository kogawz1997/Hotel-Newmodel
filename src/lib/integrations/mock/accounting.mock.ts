import type { AccountingAdapter, JournalEntry } from '../types';

export class MockAccounting implements AccountingAdapter {
  async exportJournalEntries(_from: Date, _to: Date, entries: JournalEntry[]) {
    console.log(`[MockAccounting] exportJournalEntries count=${entries.length}`);
    return {};
  }
  async syncInvoice(invoiceId: string, _data: Record<string, unknown>) {
    console.log(`[MockAccounting] syncInvoice id=${invoiceId}`);
  }
  async testConnection(_config: Record<string, string>) {
    return true;
  }
}
