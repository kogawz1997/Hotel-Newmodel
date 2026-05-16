/**
 * POST /api/reservations/[id]/late-checkout
 * Creates an approval request for late check-out (after official check-out time).
 * Body: { requestedTime: "HH:MM", note?: string }
 * If approved, updates the reservation's expected_checkout_time field.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertReservationAccess } from '@/lib/auth/guards';
import { createApproval } from '@/lib/approvals';
import { writeAuditLog } from '@/lib/audit';

const schema = z.object({
  requestedTime: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM format required'),
  note:          z.string().max(300).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await assertReservationAccess(id);
  if (ctx.error) return ctx.error;
  if (!ctx.reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

  if (!['confirmed', 'checked_in'].includes(ctx.reservation.status)) {
    return NextResponse.json({ error: 'Late checkout only valid for confirmed or checked-in reservations' }, { status: 409 });
  }

  const body = schema.safeParse(await request.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: body.error.flatten() }, { status: 422 });

  const { requestedTime, note } = body.data;
  const checkOutDate = ctx.reservation.check_out;

  const result = await createApproval({
    hotelId:      ctx.reservation.hotel_id,
    requestedBy:  ctx.user.id,
    type:         'late_checkout',
    title:        `Late Check-out — ${ctx.reservation.reservation_code ?? id}`,
    description:  `Requested until: ${requestedTime} on ${checkOutDate}. ${note ?? ''}`.trim(),
    referenceType: 'reservation',
    referenceId:  id,
  });

  await writeAuditLog({
    hotelId:    ctx.reservation.hotel_id,
    actorId:    ctx.user.id,
    action:     'late_checkout_requested',
    entityType: 'reservation',
    entityId:   id,
    metadata:   { requested_time: requestedTime },
  });

  return NextResponse.json({ ok: true, approval: result }, { status: 202 });
}
