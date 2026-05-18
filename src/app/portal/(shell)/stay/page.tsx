export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { StayHubClient } from './stay-hub-client';

export default async function StayHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/stay');

  const { data: reservation } = await supabase
    .from('reservations')
    .select(`
      id, reservation_code, check_in, check_out, status, num_adults,
      room_types(id, name, description, amenities),
      rooms(room_number, floor),
      hotels(id, name, slug, city, phone, email, check_in_time, check_out_time, hero_image_url, currency)
    `)
    .eq('guest_account_id', user.id)
    .eq('status', 'checked_in')
    .order('check_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  return <StayHubClient reservation={reservation ?? null} />;
}
