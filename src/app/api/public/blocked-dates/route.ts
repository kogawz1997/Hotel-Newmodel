import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { format, addDays, parseISO } from 'date-fns';
import { rateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, 'public.blocked-dates', 30, 60_000);
  if (limited) return limited;

  const url = new URL(request.url);
  const hotelId = url.searchParams.get('hotelId');
  const from    = url.searchParams.get('from');
  const to      = url.searchParams.get('to');

  if (!hotelId || !from || !to) {
    return NextResponse.json({ error: 'hotelId, from, to required' }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: roomTypes }, { data: reservations }] = await Promise.all([
    admin.from('room_types').select('id, total_rooms').eq('hotel_id', hotelId).eq('is_active', true),
    admin.from('reservations')
      .select('check_in, check_out, room_type_id')
      .eq('hotel_id', hotelId)
      .in('status', ['confirmed', 'checked_in', 'pending_payment'])
      .lte('check_in', to)
      .gt('check_out', from),
  ]);

  if (!roomTypes?.length) return NextResponse.json({ blocked: [] });

  const blocked: string[] = [];
  let current = parseISO(from);
  const toDate = parseISO(to);

  while (current <= toDate) {
    const ds = format(current, 'yyyy-MM-dd');
    const allFull = roomTypes.every(rt => {
      const booked = (reservations || []).filter(
        r => r.room_type_id === rt.id && r.check_in <= ds && r.check_out > ds
      ).length;
      return booked >= (rt.total_rooms || 1);
    });
    if (allFull) blocked.push(ds);
    current = addDays(current, 1);
  }

  return NextResponse.json({ blocked });
}
