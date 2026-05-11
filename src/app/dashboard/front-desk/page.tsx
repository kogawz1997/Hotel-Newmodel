import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { FrontDeskClient } from './front-desk-client';

export const dynamic = 'force-dynamic';

export default async function FrontDeskPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, name, check_in_time, check_out_time')
    .eq('organization_id', profile?.organization_id)
    .limit(1);

  if (!hotels?.[0]) return null;
  const hotelId = hotels[0].id;
  const today = new Date().toISOString().slice(0, 10);

  const [arrivalsRes, departuresRes, inHouseRes, roomsRes] = await Promise.all([
    supabase
      .from('reservations')
      .select('id, reservation_code, check_in, check_out, num_adults, status, room_id, guests(first_name, last_name, phone, email), rooms(room_number), room_types(name)')
      .eq('hotel_id', hotelId)
      .eq('check_in', today)
      .in('status', ['confirmed', 'pending_payment'])
      .order('created_at', { ascending: true })
      .limit(50),
    supabase
      .from('reservations')
      .select('id, reservation_code, check_in, check_out, num_adults, status, room_id, guests(first_name, last_name, phone, email), rooms(room_number), room_types(name)')
      .eq('hotel_id', hotelId)
      .eq('check_out', today)
      .eq('status', 'checked_in')
      .order('check_out', { ascending: true })
      .limit(50),
    supabase
      .from('reservations')
      .select('id, reservation_code, check_in, check_out, num_adults, status, room_id, guests(first_name, last_name), rooms(room_number), room_types(name)')
      .eq('hotel_id', hotelId)
      .eq('status', 'checked_in')
      .order('check_in', { ascending: false })
      .limit(100),
    supabase
      .from('rooms')
      .select('id, room_number, floor, status, room_type_id, room_types(name)')
      .eq('hotel_id', hotelId)
      .order('floor', { ascending: true })
      .order('room_number', { ascending: true }),
  ]);

  return (
    <FrontDeskClient
      hotelId={hotelId}
      hotel={hotels[0]}
      arrivals={arrivalsRes.data || []}
      departures={departuresRes.data || []}
      inHouse={inHouseRes.data || []}
      rooms={roomsRes.data || []}
      today={today}
    />
  );
}
