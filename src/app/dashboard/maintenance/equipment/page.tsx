export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { EquipmentClient } from './equipment-client';

export default async function EquipmentPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'maintenance_manager', 'technician'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const [equipRes, historyRes] = await Promise.all([
    supabase.from('equipment').select('*').eq('hotel_id', hotel.id).order('name'),
    supabase.from('equipment_history').select('*').eq('hotel_id', hotel.id).order('created_at', { ascending: false }).limit(200),
  ]);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Equipment History" description="ประวัติการซ่อมบำรุงอุปกรณ์แต่ละชิ้น" />
      <EquipmentClient hotelId={hotel.id} equipment={equipRes.data || []} history={historyRes.data || []} />
    </div>
  );
}
