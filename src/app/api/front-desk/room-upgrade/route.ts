import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';

export async function POST(req: NextRequest) {
  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager', 'front_desk']);
  if (ctx.error) return ctx.error;

  const body = await req.json();
  const { reservation_id, new_room_id, reason, upgrade_charge } = body;

  if (!reservation_id || !new_room_id || !reason) {
    return NextResponse.json(
      { error: 'กรุณาระบุ reservation_id, new_room_id และ reason' },
      { status: 422 }
    );
  }

  // Fetch current reservation with old room info
  const { data: reservation, error: resErr } = await ctx.supabase
    .from('reservations')
    .select('id, hotel_id, room_id, status, rooms(room_number)')
    .eq('id', reservation_id)
    .eq('hotel_id', ctx.hotelId)
    .single();

  if (resErr || !reservation) {
    return NextResponse.json({ error: 'ไม่พบการจองนี้ในโรงแรม' }, { status: 404 });
  }

  // Fetch new room info
  const { data: newRoom, error: newRoomErr } = await ctx.supabase
    .from('rooms')
    .select('id, room_number, status, hotel_id')
    .eq('id', new_room_id)
    .eq('hotel_id', ctx.hotelId)
    .single();

  if (newRoomErr || !newRoom) {
    return NextResponse.json({ error: 'ไม่พบห้องใหม่' }, { status: 404 });
  }

  if (newRoom.status !== 'available') {
    return NextResponse.json(
      { error: `ห้อง ${newRoom.room_number} ไม่ว่าง (สถานะ: ${newRoom.status})` },
      { status: 409 }
    );
  }

  const oldRoomId = reservation.room_id;
  const oldRoomNumber = Array.isArray(reservation.rooms)
    ? reservation.rooms[0]?.room_number
    : (reservation.rooms as any)?.room_number ?? 'ไม่ทราบ';

  // Run updates in parallel: update reservation room, update old room → available, update new room → occupied
  const updates: Promise<any>[] = [
    ctx.supabase
      .from('reservations')
      .update({ room_id: new_room_id })
      .eq('id', reservation_id),
    ctx.supabase
      .from('rooms')
      .update({ status: 'available' })
      .eq('id', oldRoomId)
      .eq('hotel_id', ctx.hotelId),
    ctx.supabase
      .from('rooms')
      .update({ status: 'occupied' })
      .eq('id', new_room_id)
      .eq('hotel_id', ctx.hotelId),
  ];

  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed) {
    return apiError(failed.error, 400);
  }

  // Log to work_orders
  const workOrderTitle = `Room upgrade: ${oldRoomNumber} → ${newRoom.room_number}`;
  const { data: workOrder, error: woErr } = await ctx.supabase
    .from('work_orders')
    .insert({
      hotel_id: ctx.hotelId,
      requested_by: ctx.user.id,
      type: 'other',
      title: workOrderTitle,
      description: `เหตุผล: ${reason}${upgrade_charge ? ` | ค่าอัปเกรด: ${upgrade_charge} บาท` : ''}`,
      room_no: newRoom.room_number,
      priority: 'normal',
      status: 'completed',
      source: 'manual',
      notes: `Reservation ID: ${reservation_id}`,
    })
    .select('id')
    .single();

  if (woErr) {
    // Log failure is non-fatal — upgrade already done
    console.error('work_order log error:', woErr.message);
  }

  return NextResponse.json({
    ok: true,
    upgrade: {
      reservation_id,
      old_room: { id: oldRoomId, room_number: oldRoomNumber },
      new_room: { id: new_room_id, room_number: newRoom.room_number },
      work_order_id: workOrder?.id ?? null,
    },
  });
}
