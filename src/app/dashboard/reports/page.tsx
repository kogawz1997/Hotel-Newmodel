export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ReportsClient } from '@/components/dashboard/reports-client';
import { requireDashboardRole } from '@/lib/auth/page-guards';

export default async function ReportsPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager']);
  const { data: hotels } = await supabase
    .from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) redirect('/dashboard/onboarding');
  return <ReportsClient hotelId={hotels[0].id} />;
}
