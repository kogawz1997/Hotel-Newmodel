import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GuestMergeClient } from '@/components/dashboard/guest-merge-client';

export default async function GuestMergePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const { data: guests } = await supabase.from('guests').select('id, first_name, last_name, email, phone, total_stays').eq('hotel_id', hotel.id).order('first_name').limit(300);
  return <GuestMergeClient hotelId={hotel.id} guests={guests || []} />;
}
