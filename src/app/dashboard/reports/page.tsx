import { requireDashboardRole } from '@/lib/auth/page-guards';
import { ReportsClient } from '@/components/dashboard/reports-client';

export default async function ReportsPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager']);
  const { data: hotels } = await supabase
    .from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;
  return <ReportsClient hotelId={hotels[0].id} />;
}
