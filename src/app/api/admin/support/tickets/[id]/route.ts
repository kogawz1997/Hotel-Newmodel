export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/guards';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePlatformAdmin();
  if (access.error) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const admin = createAdminClient();
  const { data } = await admin.from('support_tickets_internal')
    .select('*, hotels(name,id,organization_id), user_profiles!requester_id(full_name,email)')
    .eq('id', id).single();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requirePlatformAdmin();
  if (access.error) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const body = await req.json();
  const admin = createAdminClient();
  const { data, error } = await admin.from('support_tickets_internal')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
