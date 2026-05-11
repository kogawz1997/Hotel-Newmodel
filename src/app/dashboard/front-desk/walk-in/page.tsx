import { requireDashboardRole } from '@/lib/auth/page-guards';
import { WalkInQuickClient } from '@/components/dashboard/walk-in-quick-client';

export default async function WalkInPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'front_desk', 'receptionist']);

  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) return null;

  const { data: roomTypes } = await supabase.from('room_types').select('id, name, base_rate').eq('hotel_id', hotel.id).eq('is_active', true).order('name');
  return <WalkInQuickClient hotelId={hotel.id} roomTypes={roomTypes || []} />;
}
