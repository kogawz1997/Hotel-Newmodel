/**
 * Split a multi-room booking into two separate reservations.
 * Typical use: group booking arrives, one guest wants a different room/rate.
 * POST /api/reservations/{id}/split
 * Body: { splitDate: "YYYY-MM-DD", newRoomId?: string, reason?: string }
 * - splitDate: the date the split takes effect (new check-in for 2nd reservation)
 * - newRoomId: optional different room for the 2nd stay (defaults to same room)
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson } from '@/lib/http/validation';
import { assertReservationAccess, requireHotelAccess } from '@/lib/auth/guards';
import { assertRoomAvailable } from '@/lib/pms/availability';
import { rateLimit } from '@/lib/security/rate-limit';
import { createAdminClient } from '@/lib/supabase/server';

const schema = z.object({
  splitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'YYYY-MM-DD'),
  newRoomId: z.string().uuid().optional().nullable(),
  reason: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimit(request, 'reservations.split', 10, 60_000);
  if (limited) return limited;

  const { id } = await params;

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;

  const { splitDate, newRoomId, reason } = parsed.data;

  const ctx = await assertReservationAccess(id);
  if (ctx.error) return ctx.error;
  if (!ctx.reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

  const role = await requireHotelAccess(ctx.reservation.hotel_id, ['owner', 'admin', 'manager', 'front_desk']);
  if (role.error) return role.error;

  const resv = ctx.reservation;

  if (!['confirmed', 'checked_in'].includes(resv.status)) {
    return NextResponse.json({ error: 'Only confirmed or checked-in reservations can be split' }, { status: 409 });
  }

  if (splitDate <= resv.check_in || splitDate >= resv.check_out) {
    return NextResponse.json({ error: 'splitDate must be between check_in and check_out' }, { status: 400 });
  }

  const targetRoomId = newRoomId || resv.room_id;

  // If splitting to a different room, check availability for the 2nd leg
  if (targetRoomId !== resv.room_id) {
    const avail = await assertRoomAvailable({
      supabase: ctx.supabase,
      hotelId: resv.hotel_id,
      roomId: targetRoomId,
      roomTypeId: resv.room_type_id,
      checkIn: splitDate,
      checkOut: resv.check_out,
      excludeReservationId: resv.id,
    });
    if (!avail.ok) {
      const err = 'error' in avail ? avail.error : 'Room not available for the split period';
      return NextResponse.json({ error: err }, { status: 409 });
    }
  }

  const admin = createAdminClient();

  // Shorten the original reservation to end at splitDate
  const { error: updateErr } = await admin
    .from('reservations')
    .update({
      check_out: splitDate,
      internal_notes: [resv.internal_notes, reason ? `Split: ${reason}` : 'Split reservation'].filter(Boolean).join('\n') || null,
    })
    .eq('id', id);

  if (updateErr) return NextResponse.json({ error: 'Failed to update original reservation' }, { status: 500 });

  // Create the 2nd reservation (splitDate → original checkout)
  const { data: newResv, error: createErr } = await admin
    .from('reservations')
    .insert({
      hotel_id: resv.hotel_id,
      guest_id: resv.guest_id,
      room_id: targetRoomId,
      room_type_id: resv.room_type_id,
      check_in: splitDate,
      check_out: resv.check_out,
      status: resv.status === 'checked_in' ? 'confirmed' : resv.status,
      num_adults: resv.num_adults,
      num_children: resv.num_children,
      total_amount: 0,
      paid_amount: 0,
      balance_amount: 0,
      source: resv.source,
      internal_notes: `Split from reservation ${resv.reservation_code}${reason ? ` — ${reason}` : ''}`,
    })
    .select()
    .single();

  if (createErr || !newResv) {
    // Attempt to roll back original reservation update
    await admin.from('reservations').update({ check_out: resv.check_out }).eq('id', id);
    return NextResponse.json({ error: 'Failed to create split reservation' }, { status: 500 });
  }

  await admin.from('audit_logs').insert({
    hotel_id: resv.hotel_id,
    user_id: ctx.user?.id || null,
    action: 'reservation.split',
    entity_type: 'reservation',
    entity_id: id,
    changes: { originalCheckOut: resv.check_out, splitDate, newRoomId: targetRoomId, newReservationId: newResv.id, reason },
  });

  return NextResponse.json({
    success: true,
    originalReservationId: id,
    newReservationId: newResv.id,
    newReservationCode: newResv.reservation_code,
    splitDate,
  });
}
