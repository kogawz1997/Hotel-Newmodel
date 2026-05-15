import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

/**
 * Treatment rooms are derived from spa_bookings.treatment_room.
 * No separate table — we aggregate unique room names and overlay current booking status.
 *
 * GET  — list treatment rooms with their current status
 * PATCH — mark a room as cleaned/available by creating a work_order note
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ctx = await requireHotelAccess(searchParams.get('hotelId'));
  if (ctx.error) return ctx.error;

  const now = new Date().toISOString();

  // Fetch all distinct treatment rooms from spa_bookings
  const { data: bookings, error } = await ctx.supabase
    .from('spa_bookings')
    .select(
      'id, treatment_room, status, start_time, end_time, guest_name, guests(first_name, last_name), spa_services(name)'
    )
    .eq('hotel_id', ctx.hotelId)
    .not('treatment_room', 'is', null)
    .order('start_time', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Build unique room map with current status
  const roomMap = new Map<
    string,
    {
      name: string;
      status: 'occupied' | 'available';
      current_booking: any | null;
    }
  >();

  for (const b of bookings ?? []) {
    const roomName = b.treatment_room as string;
    if (!roomMap.has(roomName)) {
      roomMap.set(roomName, { name: roomName, status: 'available', current_booking: null });
    }

    // If booking is active right now, mark room occupied
    const isActive =
      b.status === 'in_progress' ||
      (b.status !== 'cancelled' &&
        b.status !== 'completed' &&
        b.start_time <= now &&
        b.end_time >= now);

    if (isActive) {
      const room = roomMap.get(roomName)!;
      room.status = 'occupied';
      room.current_booking = b;
    }
  }

  const rooms = Array.from(roomMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name, 'th')
  );

  return NextResponse.json(rooms);
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager', 'staff']);
  if (ctx.error) return ctx.error;

  const body = await req.json();
  const { room_name, action } = body; // action: 'cleaned' | 'available'

  if (!room_name || !action) {
    return NextResponse.json({ error: 'กรุณาระบุ room_name และ action' }, { status: 422 });
  }

  const validActions = ['cleaned', 'available'];
  if (!validActions.includes(action)) {
    return NextResponse.json(
      { error: `action ต้องเป็น: ${validActions.join(', ')}` },
      { status: 422 }
    );
  }

  const actionLabel = action === 'cleaned' ? 'ทำความสะอาดแล้ว' : 'พร้อมให้บริการ';

  const { data, error } = await ctx.supabase
    .from('work_orders')
    .insert({
      hotel_id: ctx.hotelId,
      requested_by: ctx.user.id,
      type: 'housekeeping',
      title: `ห้องบำบัด ${room_name} — ${actionLabel}`,
      description: `สถานะห้องบำบัด ${room_name} อัปเดตเป็น: ${actionLabel}`,
      room_no: room_name,
      priority: 'normal',
      status: 'completed',
      source: 'manual',
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, work_order_id: data.id, room_name, action });
}
