export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/guards';

export async function POST(req: NextRequest) {
  const access = await requirePlatformAdmin();
  if (access.error) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { orgId } = await req.json();
  if (!orgId) return NextResponse.json({ error: 'orgId required' }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from('billing_subscriptions')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('org_id', orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
