export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';

export async function GET() {
  const access = await requirePlatformAdmin();
  if (access.error) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = createAdminClient();
  const { data } = await admin.from('feature_flags').select('*').order('key');
  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const access = await requirePlatformAdmin();
  if (access.error) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const body = await req.json();
  const admin = createAdminClient();
  const { data, error } = await admin.from('feature_flags').insert(body).select().single();
  if (error) return apiError(error);
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const access = await requirePlatformAdmin();
  if (access.error) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id, ...updates } = await req.json();
  const admin = createAdminClient();
  const { data, error } = await admin.from('feature_flags')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) return apiError(error);
  return NextResponse.json(data);
}
