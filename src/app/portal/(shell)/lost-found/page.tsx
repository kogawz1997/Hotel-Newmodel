export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LostFoundClient } from './lost-found-client';

export default async function LostFoundPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/lost-found');

  const { data: res } = await supabase
    .from('reservations')
    .select('id, reservation_code, hotels(id, name)')
    .eq('guest_account_id', user.id)
    .in('status', ['checked_in', 'checked_out', 'confirmed'])
    .order('check_out', { ascending: false })
    .limit(5);

  return <LostFoundClient reservations={res || []} />;
}
