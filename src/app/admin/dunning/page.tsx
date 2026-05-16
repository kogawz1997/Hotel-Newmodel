export const dynamic = 'force-dynamic';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import { DunningClient } from './dunning-client';
import { createAdminClient } from '@/lib/supabase/server';

export default async function AdminDunningPage() {
  const ctx = await requirePlatformAdmin();
  if (ctx.error) redirect('/admin/login');

  const admin = createAdminClient();
  const { data: orgs } = await admin
    .from('organizations')
    .select('id, name, subscription_plan, subscription_status, trial_ends_at, updated_at, stripe_customer_id')
    .in('subscription_status', ['past_due', 'unpaid', 'canceled', 'trialing'])
    .order('updated_at', { ascending: false });

  return (
    <main className="text-white p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dunning Management</h1>
        <p className="text-white/50 text-sm mt-1">บัญชีที่มีปัญหาการชำระเงิน — retry, suspend, cancel</p>
      </div>
      <DunningClient orgs={orgs || []} />
    </main>
  );
}
