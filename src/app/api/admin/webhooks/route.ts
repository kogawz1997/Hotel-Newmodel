export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  const access = await requirePlatformAdmin();
  if (access.error) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const platform = searchParams.get('platform');
  const admin = createAdminClient();
  let query = admin.from('webhook_events')
    .select('*, hotels(name)')
    .order('created_at', { ascending: false }).limit(200);
  if (status) query = query.eq('status', status);
  if (platform) query = query.eq('platform', platform);
  const { data } = await query;
  return NextResponse.json(data || []);
}
