export const dynamic = 'force-dynamic';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HomeClient } from './home-client';

export default async function PortalHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/home');

  const admin = createAdminClient();

  const [{ data: guestAccount }, { data: hotels }, { data: reservation }] = await Promise.all([
    admin.from('guest_accounts').select('first_name, email').eq('id', user.id).single(),
    supabase
      .from('hotels')
      .select('id, name, slug, city, hero_image_url, description, country')
      .limit(20),
    supabase
      .from('reservations')
      .select(`id, reservation_code, check_in, check_out, status, hotels(id, name, slug, city, hero_image_url), room_types(name), rooms(room_number)`)
      .eq('guest_account_id', user.id)
      .eq('status', 'checked_in')
      .order('check_in', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  let loyaltyPoints = 0;
  if (guestAccount?.email) {
    const { data: guests } = await supabase
      .from('guests')
      .select('loyalty_points')
      .eq('email', guestAccount.email);
    loyaltyPoints = (guests || []).reduce((s: number, g: any) => s + (g.loyalty_points || 0), 0);
  }

  return (
    <HomeClient
      firstName={guestAccount?.first_name || ''}
      hotels={hotels || []}
      activeStay={reservation ?? null}
      loyaltyPoints={loyaltyPoints}
    />
  );
}
