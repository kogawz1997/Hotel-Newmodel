export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/guards';

export async function GET() {
  const access = await requirePlatformAdmin();
  if (access.error) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const admin = createAdminClient();
  const { data: invoices } = await admin
    .from('billing_invoices')
    .select('*, organizations(name, subscription_plan)')
    .order('created_at', { ascending: false })
    .limit(200);
  const { data: subscriptions } = await admin
    .from('billing_subscriptions')
    .select('*, organizations(name)')
    .eq('status', 'past_due');
  return NextResponse.json({ invoices: invoices || [], failedPayments: subscriptions || [] });
}
