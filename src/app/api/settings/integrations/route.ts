import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { maskCredential } from '@/lib/integration-credentials';

async function getHotel(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single();

  if (!profile?.organization_id || !['owner', 'admin'].includes(profile.role || '')) return null;

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  return hotel?.id ? { hotelId: hotel.id } : null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getHotel(supabase, user.id);
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: rows } = await supabase
    .from('channel_integrations')
    .select('provider, enabled, config, last_sync_at, sync_status')
    .eq('hotel_id', ctx.hotelId);

  // Return masked credentials
  const integrations: Record<string, { enabled: boolean; configured: boolean; maskedConfig: Record<string, string>; lastSyncAt: string | null; syncStatus: string }> = {};
  for (const row of rows || []) {
    const cfg = (row.config as Record<string, string>) || {};
    const maskedConfig: Record<string, string> = {};
    for (const [k, v] of Object.entries(cfg)) {
      maskedConfig[k] = maskCredential(v);
    }
    integrations[row.provider] = {
      enabled: row.enabled,
      configured: Object.keys(cfg).length > 0,
      maskedConfig,
      lastSyncAt: row.last_sync_at,
      syncStatus: row.sync_status || 'idle',
    };
  }

  return NextResponse.json({ integrations });
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getHotel(supabase, user.id);
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await request.json();
  const { provider, enabled, config } = body as {
    provider: string;
    enabled: boolean;
    config: Record<string, string>;
  };

  if (!provider) return NextResponse.json({ error: 'Missing provider' }, { status: 400 });

  // Fetch existing config to merge (so partial updates don't wipe fields)
  const { data: existing } = await supabase
    .from('channel_integrations')
    .select('config')
    .eq('hotel_id', ctx.hotelId)
    .eq('provider', provider)
    .maybeSingle();

  const existingConfig = (existing?.config as Record<string, string>) || {};

  // Only update fields that are non-empty (skip masked "••••" values)
  const mergedConfig: Record<string, string> = { ...existingConfig };
  for (const [k, v] of Object.entries(config || {})) {
    if (v && !v.includes('••')) {
      mergedConfig[k] = v;
    }
  }

  const { error } = await supabase
    .from('channel_integrations')
    .upsert(
      { hotel_id: ctx.hotelId, provider, enabled, config: mergedConfig },
      { onConflict: 'hotel_id,provider' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = await getHotel(supabase, user.id);
  if (!ctx) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  if (!provider) return NextResponse.json({ error: 'Missing provider' }, { status: 400 });

  await supabase
    .from('channel_integrations')
    .update({ config: {}, enabled: false })
    .eq('hotel_id', ctx.hotelId)
    .eq('provider', provider);

  return NextResponse.json({ ok: true });
}
