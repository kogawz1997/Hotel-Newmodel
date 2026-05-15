export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requirePlatformAdmin } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  const access = await requirePlatformAdmin();
  if (access.error) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 });
  const admin = createAdminClient();
  const [
    { count: totalRooms },
    { count: activeReservations },
    { count: openTasks },
    { count: staffCount },
  ] = await Promise.all([
    admin.from('rooms').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    admin.from('reservations').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'checked_in'),
    admin.from('work_orders').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'open'),
    admin.from('user_profiles').select('*', { count: 'exact', head: true }).eq('hotel_id', hotelId),
  ]);
  return NextResponse.json({ totalRooms, activeReservations, openTasks, staffCount });
}
