import type { KeyCardAdapter, KeyIssueParams } from '../types';

export class MockKeyCard implements KeyCardAdapter {
  async issueKey(params: KeyIssueParams) {
    console.log(`[MockKeyCard] issueKey room=${params.roomNo}`);
    const token = `key_${params.roomNo}_${Date.now()}`;
    return { keyToken: token, qrData: `MAITRI:${token}` };
  }
  async revokeKey(keyToken: string) {
    console.log(`[MockKeyCard] revokeKey token=${keyToken}`);
  }
  async extendKey(keyToken: string, until: Date) {
    console.log(`[MockKeyCard] extendKey token=${keyToken} until=${until.toISOString()}`);
  }
  async testConnection(_config: Record<string, string>) {
    return true;
  }
}
