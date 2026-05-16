/**
 * Merge two consecutive reservations for the same guest into one.
 * POST /api/reservations/{id}/merge
 * Body: { targetReservationId: string, reason?: string }
 * - The source reservation ({id}) must check out on the same day the target checks in
 * - Both must be in the same room (or we just combine them ignoring room continuity)
 * - Target reservation is deleted; source is extended to target's checkout
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson } from '@/lib/http/validation';
import { assertReservationAccess, requireHotelAccess } from '@/lib/auth/guards';
import { rateLimit } from '@/lib/security/rate-limit';
import { createAdminClient } from '@/lib/supabase/server';

const schema = z.object({
  targetReservationId: z.string().uuid(),
  reason: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimit(request, 'reservations.merge', 10, 60_000);
  if (limited) return limited;

  const { id } = await params;

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;

  const { targetReservationId, reason } = parsed.data;

  if (id === targetReservationId) {
    return NextResponse.json({ error: 'Cannot merge a reservation with itself' }, { status: 400 });
  }

  const ctx = await assertReservationAccess(id);
  if (ctx.error) return ctx.error;
  if (!ctx.reservation) return NextResponse.json({ error: 'Source reservation not found' }, { status: 404 });

  const role = await requireHotelAccess(ctx.reservation.hotel_id, ['owner', 'admin', 'manager', 'front_desk']);
  if (role.error) return role.error;

  const source = ctx.reservation;
  const admin = createAdminClient();

  const { data: target } = await admin
    .from('reservations')
    .select('id, reservation_code, hotel_id, guest_id, room_id, check_in, check_out, status, total_amount, paid_amount, balance_amount')
    .eq('id', targetReservationId)
    .single();

  if (!target) return NextResponse.json({ error: 'Target reservation not found' }, { status: 404 });

  if (target.hotel_id !== source.hotel_id) {
    return NextResponse.json({ error: 'Both reservations must be in the same hotel' }, { status: 400 });
  }

  if (target.guest_id !== source.guest_id) {
    return NextResponse.json({ error: 'Both reservations must be for the same guest' }, { status: 400 });
  }

  // Source checkout must equal target check-in (consecutive stays)
  if (source.check_out !== target.check_in) {
    return NextResponse.json({
      error: `Reservations must be consecutive: source checkout (${source.check_out}) must equal target check-in (${target.check_in})`,
    }, { status: 400 });
  }

  if (['cancelled', 'no_show', 'checked_out'].includes(source.status)) {
    return NextResponse.json({ error: 'Source reservation must be active' }, { status: 409 });
  }

  // Extend source to cover target's period
  const mergedTotal = Number(source.total_amount || 0) + Number(target.total_amount || 0);
  const mergedPaid = Number(source.paid_amount || 0) + Number(target.paid_amount || 0);
  const mergedBalance = mergedTotal - mergedPaid;

  const { error: updateErr } = await admin
    .from('reservations')
    .update({
      check_out: target.check_out,
      total_amount: mergedTotal,
      paid_amount: mergedPaid,
      balance_amount: mergedBalance,
      internal_notes: [source.internal_notes, `Merged with ${target.reservation_code}${reason ? ` — ${reason}` : ''}`].filter(Boolean).join('\n') || null,
    })
    .eq('id', id);

  if (updateErr) return NextResponse.json({ error: 'Failed to update source reservation' }, { status: 500 });

  // Move target's folio items to source's folio (if any)
  const { data: sourceFolio } = await admin
    .from('folios').select('id').eq('reservation_id', id).eq('hotel_id', source.hotel_id).limit(1).maybeSingle();
  const { data: targetFolio } = await admin
    .from('folios').select('id').eq('reservation_id', targetReservationId).eq('hotel_id', source.hotel_id).limit(1).maybeSingle();

  if (sourceFolio?.id && targetFolio?.id) {
    await admin.from('folio_items').update({ folio_id: sourceFolio.id }).eq('folio_id', targetFolio.id);
    await admin.rpc('recalculate_folio_totals', { p_folio_id: sourceFolio.id }).catch(() => null);
  }

  // Cancel the target reservation (keep as record)
  await admin.from('reservations').update({
    status: 'cancelled',
    internal_notes: `Merged into ${source.reservation_code}`,
  }).eq('id', targetReservationId);

  await admin.from('audit_logs').insert({
    hotel_id: source.hotel_id,
    user_id: ctx.user?.id || null,
    action: 'reservation.merged',
    entity_type: 'reservation',
    entity_id: id,
    changes: { targetReservationId, targetCode: target.reservation_code, newCheckOut: target.check_out, mergedTotal, reason },
  });

  return NextResponse.json({
    success: true,
    reservationId: id,
    mergedFromId: targetReservationId,
    newCheckOut: target.check_out,
    mergedTotal,
  });
}
