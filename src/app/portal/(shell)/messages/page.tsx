export const dynamic = 'force-dynamic';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MessagesClient } from './messages-client';

export default async function MessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/messages');

  const admin = createAdminClient();
  const { data: guestAccount } = await admin
    .from('guest_accounts').select('first_name').eq('id', user.id).single();

  const { data: reservations } = await supabase
    .from('reservations')
    .select('id, reservation_code, check_in, check_out, status, total_amount, hotels(id, name, hero_image_url)')
    .eq('guest_account_id', user.id)
    .order('check_in', { ascending: false })
    .limit(30);

  return (
    <MessagesClient
      firstName={guestAccount?.first_name || ''}
      reservations={reservations || []}
    />
  );
}
