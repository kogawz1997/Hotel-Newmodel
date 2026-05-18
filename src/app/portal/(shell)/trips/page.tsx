export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TripsClient } from './trips-client';

export default async function TripsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/trips');

  const [{ data: reservations }, { data: hotels }] = await Promise.all([
    supabase
      .from('reservations')
      .select('id, reservation_code, check_in, check_out, status, total_amount, hotels(id, name, slug, city, hero_image_url), room_types(name), rooms(room_number)')
      .eq('guest_account_id', user.id)
      .order('check_in', { ascending: false })
      .limit(50),
    supabase
      .from('hotels')
      .select('id, name, slug, city, hero_image_url')
      .limit(20),
  ]);

  return <TripsClient reservations={reservations || []} hotels={hotels || []} />;
}
