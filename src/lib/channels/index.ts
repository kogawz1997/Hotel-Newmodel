import { lineAdapter } from './line';
import { whatsappAdapter } from './whatsapp';
import { emailAdapter } from './email';
import { wechatAdapter } from './wechat';
import type { ChannelAdapter, SendMessageOptions } from './types';

// Messenger (Facebook) — requires Facebook App review and Page token
const messengerAdapter: ChannelAdapter & { isConfigured(): boolean } = {
  channel: 'messenger',
  isConfigured(): boolean {
    return !!(process.env.MESSENGER_PAGE_ACCESS_TOKEN);
  },
  async sendMessage(_opts: SendMessageOptions) {
    throw new Error('Messenger requires Facebook App review and a Page Access Token from Meta for Developers');
  },
  async parseWebhook() { return []; },
  verifyWebhook() { return true; },
};

// Instagram — requires Instagram Business Account connected via Meta for Developers
const instagramAdapter: ChannelAdapter & { isConfigured(): boolean } = {
  channel: 'instagram',
  isConfigured(): boolean {
    return !!(process.env.INSTAGRAM_PAGE_ACCESS_TOKEN);
  },
  async sendMessage(_opts: SendMessageOptions) {
    throw new Error('Instagram messaging requires Instagram Business Account approval via Meta for Developers');
  },
  async parseWebhook() { return []; },
  verifyWebhook() { return true; },
};

// KakaoTalk — requires Kakao Business Channel registration at business.kakao.com
const kakaoAdapter: ChannelAdapter & { isConfigured(): boolean } = {
  channel: 'kakao',
  isConfigured(): boolean {
    return !!(process.env.KAKAO_ACCESS_TOKEN && process.env.KAKAO_SENDER_KEY);
  },
  async sendMessage(_opts: SendMessageOptions) {
    throw new Error('KakaoTalk requires Business Channel registration at business.kakao.com');
  },
  async parseWebhook() { return []; },
  verifyWebhook() { return true; },
};

// SMS — requires SMS provider credentials (Twilio, AWS SNS, or Thai provider such as Thaibulk)
const smsAdapter: ChannelAdapter & { isConfigured(): boolean } = {
  channel: 'sms',
  isConfigured(): boolean {
    return !!(process.env.SMS_API_KEY && process.env.SMS_SENDER_ID);
  },
  async sendMessage(_opts: SendMessageOptions) {
    throw new Error('SMS requires SMS provider credentials (set SMS_API_KEY and SMS_SENDER_ID)');
  },
  async parseWebhook() { return []; },
  verifyWebhook() { return true; },
};

export const channels: Record<string, ChannelAdapter> = {
  line: lineAdapter,
  whatsapp: whatsappAdapter,
  email: emailAdapter,
  wechat: wechatAdapter,
  messenger: messengerAdapter,
  instagram: instagramAdapter,
  kakao: kakaoAdapter,
  sms: smsAdapter,
};

export function getChannel(name: string): ChannelAdapter {
  const adapter = channels[name];
  if (!adapter) throw new Error(`Channel not supported: ${name}`);
  return adapter;
}

export * from './types';
