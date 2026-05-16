export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { RestaurantRecClient } from './restaurant-rec-client';

export default async function RestaurantRecPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'front_desk', 'concierge'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const [recsRes, reservationsRes] = await Promise.all([
    supabase.from('restaurant_recommendations').select('*').eq('hotel_id', hotel.id).eq('active', true).order('rating', { ascending: false }),
    supabase.from('reservations')
      .select('id, guest_name, room_id, rooms(room_number)')
      .eq('hotel_id', hotel.id)
      .eq('status', 'checked_in')
      .order('guest_name'),
  ]);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Restaurant Recommendations" description="แนะนำร้านอาหารและจองให้แขก" />
      <RestaurantRecClient hotelId={hotel.id} restaurants={recsRes.data || []} guests={(reservationsRes.data || []) as any[]} />
    </div>
  );
}
