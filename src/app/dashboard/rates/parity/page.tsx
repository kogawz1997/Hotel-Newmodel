export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { ParityClient } from './parity-client';

export default async function RateParityPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager']);
  const { data: hotel } = await supabase.from('hotels').select('id,name').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const { data: roomTypes } = await supabase
    .from('room_types')
    .select('id, name, base_rate')
    .eq('hotel_id', hotel.id)
    .eq('is_active', true);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Rate Parity Checker" description="ตรวจสอบว่าราคาห้องพักบน OTA เท่ากับราคาตรงหรือไม่" />
      <ParityClient hotelName={hotel.name} roomTypes={roomTypes || []} />
    </div>
  );
}
