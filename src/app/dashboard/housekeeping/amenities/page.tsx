export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { AmenitiesClient } from './amenities-client';

export default async function AmenitiesPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'housekeeping_manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const [roomsRes, inventoryRes] = await Promise.all([
    supabase.from('rooms').select('id, room_number, floor, status').eq('hotel_id', hotel.id).order('room_number'),
    supabase.from('room_amenity_inventory').select('*').eq('hotel_id', hotel.id),
  ]);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Room Amenity Inventory" description="ติดตามสบู่ ผ้าเช็ดตัว และอุปกรณ์ต่อห้อง" />
      <AmenitiesClient hotelId={hotel.id} rooms={roomsRes.data || []} inventory={inventoryRes.data || []} />
    </div>
  );
}
