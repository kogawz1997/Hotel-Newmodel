import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ reservation: null });

  const { data: reservation } = await supabase
    .from('reservations')
    .select(`
      id, reservation_code, check_in, check_out, status, num_adults,
      room_types(name),
      rooms(room_number, floor),
      hotels(id, name, slug, city, phone, email, check_in_time, check_out_time, hero_image_url, currency)
    `)
    .eq('guest_account_id', user.id)
    .eq('status', 'checked_in')
    .order('check_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ reservation: reservation ?? null });
}
