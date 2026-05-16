export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { EnergyClient } from './energy-client';

export default async function EnergyPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const thisMonth = new Date().toISOString().slice(0, 7);
  const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

  const [logsRes, roomsRes] = await Promise.all([
    supabase.from('energy_logs')
      .select('id, room_id, category, kwh, cost, recorded_date, notes, rooms(room_number)')
      .eq('hotel_id', hotel.id)
      .gte('recorded_date', lastMonth + '-01')
      .order('recorded_date', { ascending: false }),
    supabase.from('rooms').select('id, room_number, floor').eq('hotel_id', hotel.id).order('room_number'),
  ]);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Energy Management" description="ติดตามค่าไฟและค่าสาธารณูปโภคต่อห้อง" />
      <EnergyClient hotelId={hotel.id} logs={(logsRes.data || []) as any[]} rooms={roomsRes.data || []} thisMonth={thisMonth} />
    </div>
  );
}
