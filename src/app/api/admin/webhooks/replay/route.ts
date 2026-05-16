export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';

export async function POST(req: NextRequest) {
  const access = await requirePlatformAdmin();
  if (access.error) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { eventId } = await req.json();
  if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.from('webhook_events')
    .update({ status: 'replayed', attempts: 1, processed_at: new Date().toISOString() })
    .eq('id', eventId).select().single();
  if (error) return apiError(error);
  return NextResponse.json(data);
}
