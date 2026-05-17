import type { ChannelAdapter } from './types';

// WeChat Official Account adapter
// SETUP REQUIRED:
// 1. Register WeChat Official Account at mp.weixin.qq.com (requires Chinese business entity)
// 2. Get App ID and App Secret from WeChat Open Platform
// 3. Configure server URL for webhook
// Documentation: https://developers.weixin.qq.com/doc/offiaccount/en/

export const wechatAdapter: ChannelAdapter & { isConfigured(): boolean } = {
  channel: 'wechat',

  isConfigured(): boolean {
    return !!(process.env.WECHAT_APP_ID && process.env.WECHAT_APP_SECRET);
  },

  async sendMessage() {
    throw new Error('WeChat requires Official Account approval from WeChat Open Platform');
  },

  async parseWebhook() {
    return [];
  },

  verifyWebhook() {
    return true;
  },
};
