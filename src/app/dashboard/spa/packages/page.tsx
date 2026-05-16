export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { SpaPackagesClient } from './spa-packages-client';

export default async function SpaPackagesPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'spa_manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const [packagesRes, servicesRes, roomTypesRes] = await Promise.all([
    supabase.from('spa_packages').select('*, spa_package_items(spa_service_id, spa_services(name, price, duration_min))').eq('hotel_id', hotel.id).order('name'),
    supabase.from('spa_services').select('id, name, price, duration_min').eq('hotel_id', hotel.id).eq('is_available', true),
    supabase.from('room_types').select('id, name, base_price').eq('hotel_id', hotel.id),
  ]);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Spa & Room Packages" description="แพ็กเกจรวม Spa + ห้องพักพร้อมส่วนลด" />
      <SpaPackagesClient hotelId={hotel.id} packages={packagesRes.data || []} services={servicesRes.data || []} roomTypes={roomTypesRes.data || []} />
    </div>
  );
}
