export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { VendorsClient } from './vendors-client';

export default async function VendorsPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'maintenance_manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .eq('hotel_id', hotel.id)
    .order('name');

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="Vendor Management" description="จัดการผู้จัดจำหน่ายและซัพพลายเออร์" />
      <VendorsClient hotelId={hotel.id} initial={vendors || []} />
    </div>
  );
}
