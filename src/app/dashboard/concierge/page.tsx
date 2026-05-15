export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConciergeClient } from './concierge-client';

export default async function ConciergePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, organization_id, role, full_name')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name, currency')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: requests },
    { data: conversations },
    { data: arrivals },
  ] = await Promise.all([
    supabase
      .from('concierge_requests')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('conversations')
      .select('id, guest_name, channel, status, unread_count, last_message, updated_at')
      .eq('hotel_id', hotel.id)
      .eq('status', 'open')
      .order('updated_at', { ascending: false })
      .limit(20),
    supabase
      .from('reservations')
      .select('id, reservation_code, check_in, check_out, status, special_requests, guests(first_name, last_name, phone), room_types(name)')
      .eq('hotel_id', hotel.id)
      .eq('check_in', today)
      .in('status', ['confirmed', 'pending'])
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return (
    <ConciergeClient
      hotel={hotel}
      profile={profile}
      initialRequests={requests || []}
      conversations={conversations || []}
      arrivals={arrivals || []}
    />
  );
}
