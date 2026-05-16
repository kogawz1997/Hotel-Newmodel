export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

export async function POST(req: NextRequest) {
  const access = await requirePlatformAdmin();
  if (access.error) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { orgId, amount, reason, expiresAt } = await req.json();
  if (!orgId || !amount) return NextResponse.json({ error: 'orgId and amount required' }, { status: 400 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  const { data, error } = await admin.from('billing_credits').insert({
    org_id: orgId, amount, reason, issued_by: user?.id, expires_at: expiresAt || null
  }).select().single();
  if (error) return apiError(error);
  return NextResponse.json(data);
}
