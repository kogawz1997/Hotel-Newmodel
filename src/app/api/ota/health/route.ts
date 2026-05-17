import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { getClientIp, rateLimitCheck, rateLimitHeaders } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';

interface ProviderConfig {
  tokenVar: string;
  secretVar?: string;
  apiKeyVar?: string;
}

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  booking_com: {
    tokenVar: 'BOOKING_COM_WEBHOOK_TOKEN',
    secretVar: 'BOOKING_COM_WEBHOOK_SECRET',
    apiKeyVar: 'BOOKING_COM_API_KEY',
  },
  agoda: {
    tokenVar: 'AGODA_WEBHOOK_TOKEN',
    secretVar: 'AGODA_WEBHOOK_SECRET',
    apiKeyVar: 'AGODA_API_KEY',
  },
  airbnb: {
    tokenVar: 'AIRBNB_WEBHOOK_TOKEN',
    secretVar: 'AIRBNB_WEBHOOK_SECRET',
    apiKeyVar: 'AIRBNB_API_KEY',
  },
  expedia: {
    tokenVar: 'EXPEDIA_WEBHOOK_TOKEN',
    secretVar: 'EXPEDIA_WEBHOOK_SECRET',
    apiKeyVar: 'EXPEDIA_API_KEY',
  },
};

export async function GET(request: Request) {
  const rl = await rateLimitCheck(`ota-health:${getClientIp(request)}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: rateLimitHeaders(rl) });
  }

  const admin = createAdminClient();
  const providers: Record<string, { configured: boolean; last_sync: string | null; missing_vars: string[] }> = {};

  const lastSyncByProvider = new Map<string, string | null>();

  try {
    const { data: syncLogs } = await admin
      .from('ota_sync_logs')
      .select('provider, created_at')
      .eq('status', 'success')
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(100);

    for (const log of syncLogs ?? []) {
      const p = String(log.provider ?? '');
      if (p && !lastSyncByProvider.has(p)) {
        lastSyncByProvider.set(p, log.created_at ?? null);
      }
    }
  } catch {
    // Non-fatal: missing sync data won't block health response
  }

  for (const [providerKey, cfg] of Object.entries(PROVIDER_CONFIGS)) {
    const missingVars: string[] = [];

    if (!process.env[cfg.tokenVar]) missingVars.push(cfg.tokenVar);
    if (cfg.secretVar && !process.env[cfg.secretVar]) missingVars.push(cfg.secretVar);
    if (cfg.apiKeyVar && !process.env[cfg.apiKeyVar]) missingVars.push(cfg.apiKeyVar);

    providers[providerKey] = {
      configured: missingVars.length === 0,
      last_sync: lastSyncByProvider.get(providerKey) ?? null,
      missing_vars: missingVars,
    };
  }

  const allConfigured = Object.values(providers).every((p) => p.configured);

  return NextResponse.json(
    {
      status: allConfigured ? 'ok' : 'degraded',
      generatedAt: new Date().toISOString(),
      providers,
    },
    {
      status: 200,
      headers: { ...rateLimitHeaders(rl), 'Cache-Control': 'no-store' },
    },
  );
}
