export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { BillingClient } from '../billing-client';

export default async function BillingCreditsPage() {
  const admin = createAdminClient();
  const [
    { data: invoices },
    { data: failedSubs },
    { data: credits },
  ] = await Promise.all([
    admin.from('billing_invoices').select('*, organizations(name, subscription_plan)')
      .order('created_at', { ascending: false }).limit(100),
    admin.from('billing_subscriptions').select('*, organizations(name)')
      .eq('status', 'past_due'),
    admin.from('billing_credits').select('*, organizations(name)')
      .is('used_at', null).order('created_at', { ascending: false }).limit(50),
  ]);
  return <BillingClient invoices={invoices || []} failedSubs={failedSubs || []} credits={credits || []} defaultTab="credits" />;
}
