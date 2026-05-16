import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const LATE_CHECKOUT_FEE = Number(process.env.LATE_CHECKOUT_FEE_THB || 700);

const schema = z.object({
  hotelId: z.string().uuid(),
  reservationId: z.string().uuid(),
  newCheckoutTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM').optional(),
  fee: z.number().nonnegative().optional(),
  waiveFee: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });

  const { hotelId, reservationId, newCheckoutTime, waiveFee } = parsed.data;
  const feeAmount = parsed.data.fee ?? LATE_CHECKOUT_FEE;

  const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager', 'front_desk']);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();

  const { data: reservation } = await admin
    .from('reservations')
    .select('id, status, hotel_id, check_out, guest_account_id')
    .eq('id', reservationId)
    .eq('hotel_id', hotelId)
    .single();

  if (!reservation) return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 });
  if (!['checked_in', 'confirmed'].includes(reservation.status)) {
    return NextResponse.json({ error: 'ไม่สามารถอนุมัติ late checkout ได้ในสถานะนี้' }, { status: 400 });
  }

  const now = new Date().toISOString();

  // Add folio charge if not waived
  if (!waiveFee && feeAmount > 0) {
    const { error: chargeError } = await admin.from('folio_items').insert({
      reservation_id: reservationId,
      hotel_id: hotelId,
      description: `Late Checkout${newCheckoutTime ? ` (เช็คเอาท์ ${newCheckoutTime})` : ''}`,
      amount: feeAmount,
      quantity: 1,
      unit_price: feeAmount,
      item_type: 'other',
      created_at: now,
    });
    if (chargeError) return NextResponse.json({ error: chargeError.message }, { status: 500 });
  }

  // Update reservation notes and checkout time
  const { data: res } = await admin.from('reservations').select('internal_notes').eq('id', reservationId).single();
  const existingNotes = res?.internal_notes || '';
  const lateCheckoutNote = `[Late Checkout Approved by staff at ${new Date().toLocaleString('th-TH')}${newCheckoutTime ? ` → ${newCheckoutTime}` : ''}${waiveFee ? ' — fee waived' : ` — ฿${feeAmount}`}]`;
  await admin.from('reservations').update({
    internal_notes: existingNotes ? `${existingNotes}\n${lateCheckoutNote}` : lateCheckoutNote,
    updated_at: now,
  }).eq('id', reservationId);

  await admin.from('audit_logs').insert({
    hotel_id: hotelId,
    user_id: (ctx as any).user?.id || null,
    action: 'reservation.late_checkout_approved',
    entity_type: 'reservation',
    entity_id: reservationId,
    changes: { newCheckoutTime, feeAmount: waiveFee ? 0 : feeAmount, waiveFee },
  });

  return NextResponse.json({
    success: true,
    charged: !waiveFee,
    feeAmount: waiveFee ? 0 : feeAmount,
    message: waiveFee
      ? 'อนุมัติ late checkout โดยไม่คิดค่าธรรมเนียม'
      : `อนุมัติ late checkout และเพิ่มค่าธรรมเนียม ฿${feeAmount} ใน folio`,
  });
}
