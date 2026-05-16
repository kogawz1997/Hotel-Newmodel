export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { ReorderClient } from './reorder-client';

export default async function ReorderPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'maintenance_manager', 'technician'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const { data: parts } = await supabase
    .from('parts_inventory')
    .select('*')
    .eq('hotel_id', hotel.id)
    .order('name');

  const lowStock = (parts || []).filter((p: any) => p.quantity <= p.min_stock);

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="Auto-Reorder Alerts" description="รายการอะไหล่ที่ต้องสั่งซื้อเพิ่ม" />
      <ReorderClient hotelId={hotel.id} parts={parts || []} lowStock={lowStock} />
    </div>
  );
}
