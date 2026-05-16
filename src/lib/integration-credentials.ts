import { createAdminClient } from '@/lib/supabase/server';

export type IntegrationProvider =
  | 'line' | 'whatsapp' | 'facebook' | 'wechat'
  | 'booking_com' | 'agoda' | 'airbnb' | 'expedia' | 'hotelrunner'
  | 'sentry' | 'vapid' | 'sendgrid' | 'flowaccount' | 'peak' | 'google_analytics';

// Read a single credential: env var takes priority, falls back to DB config
export async function getCredential(
  hotelId: string,
  provider: IntegrationProvider,
  key: string,
  envKey?: string
): Promise<string | null> {
  if (envKey && process.env[envKey]) return process.env[envKey]!;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('channel_integrations')
      .select('config')
      .eq('hotel_id', hotelId)
      .eq('provider', provider)
      .maybeSingle();

    return (data?.config as Record<string, string>)?.[key] || null;
  } catch {
    return null;
  }
}

// Read full config for a provider
export async function getIntegrationConfig(
  hotelId: string,
  provider: IntegrationProvider
): Promise<{ enabled: boolean; config: Record<string, string> } | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('channel_integrations')
      .select('enabled, config')
      .eq('hotel_id', hotelId)
      .eq('provider', provider)
      .maybeSingle();

    if (!data) return null;
    return { enabled: data.enabled, config: (data.config as Record<string, string>) || {} };
  } catch {
    return null;
  }
}

// Mask a credential value for client-side display
export function maskCredential(value: string | null): string {
  if (!value) return '';
  if (value.length <= 8) return '••••••••';
  return value.slice(0, 4) + '••••••••' + value.slice(-4);
}
