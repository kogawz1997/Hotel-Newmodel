import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GroupBookingClient } from '@/components/dashboard/group-booking-client';

export default async function GroupBookingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const { data: reservations } = await supabase
    .from('reservations')
    .select('id, reservation_code, total_amount, status, guests(first_name,last_name), room_types(name)')
    .eq('hotel_id', hotel.id)
    .in('status', ['confirmed', 'pending'])
    .order('created_at', { ascending: false })
    .limit(200);

  return <GroupBookingClient hotelId={hotel.id} reservations={reservations || []} />;
}
