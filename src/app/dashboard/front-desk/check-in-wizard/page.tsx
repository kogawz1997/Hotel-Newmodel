import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CheckInWizardClient } from '@/components/dashboard/check-in-wizard-client';

export default async function CheckInWizardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id, name').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const today = new Date().toISOString().slice(0,10);
  const { data: reservations } = await supabase
    .from('reservations')
    .select('id, reservation_code, status, total_amount, guests(first_name,last_name), room_types(name)')
    .eq('hotel_id', hotel.id)
    .eq('check_in', today)
    .in('status', ['confirmed', 'pending'])
    .order('created_at', { ascending: true })
    .limit(100);
  const { data: rooms } = await supabase.from('rooms').select('id, room_number, status').eq('hotel_id', hotel.id).in('status', ['available','cleaning']).order('room_number');

  return <CheckInWizardClient hotelId={hotel.id} hotelName={hotel.name} reservations={reservations || []} rooms={rooms || []} />;
}
