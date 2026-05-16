export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { ItineraryClient } from './itinerary-client';

export default async function ItineraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, check_in, check_out, guest_name, rooms(room_number)')
    .eq('guest_account_id', user.id)
    .in('status', ['confirmed', 'checked_in'])
    .order('check_in', { ascending: true })
    .limit(1)
    .single();

  if (!reservation) redirect('/portal');

  const { data: items } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('reservation_id', reservation.id)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  return (
    <div className="container max-w-2xl py-8 animate-fade-in">
      <TopBar title="My Itinerary" description="ตารางกิจกรรมและแผนการเดินทาง" />
      <ItineraryClient reservation={reservation as any} items={items || []} />
    </div>
  );
}
