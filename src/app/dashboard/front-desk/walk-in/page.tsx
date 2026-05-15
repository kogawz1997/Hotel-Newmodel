import { createClient } from '@/lib/supabase/server';
import { WalkInQuickClient } from '@/components/dashboard/walk-in-quick-client';

export default async function WalkInPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) return null;

  const { data: roomTypes } = await supabase.from('room_types').select('id, name, base_rate').eq('hotel_id', hotel.id).eq('is_active', true).order('name');
  return <WalkInQuickClient hotelId={hotel.id} roomTypes={roomTypes || []} />;
}
