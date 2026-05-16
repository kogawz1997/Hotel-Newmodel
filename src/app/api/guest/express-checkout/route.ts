import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  reservationId: z.string().uuid(),
  paymentMethod: z.enum(['card_on_file', 'promptpay', 'at_hotel']).default('card_on_file'),
  acknowledgedAmount: z.number().nonnegative(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed' }, { status: 422 });
  const { reservationId, paymentMethod, acknowledgedAmount } = parsed.data;

  // Verify ownership and status
  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, status, guest_account_id, hotel_id, total_amount, paid_amount, check_out')
    .eq('id', reservationId)
    .single();

  if (!reservation || reservation.guest_account_id !== user.id) {
    return NextResponse.json({ error: 'ไม่พบการจอง' }, { status: 404 });
  }
  if (reservation.status !== 'checked_in') {
    return NextResponse.json({ error: 'ไม่สามารถ express checkout ได้ในสถานะปัจจุบัน' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Get folio items total
  const { data: folioItems } = await admin
    .from('folio_items')
    .select('amount')
    .eq('reservation_id', reservationId);

  const folioTotal = (folioItems || []).reduce((s, i) => s + Number(i.amount), 0);
  const totalOwed = Number(reservation.total_amount || 0) + folioTotal - Number(reservation.paid_amount || 0);

  // Mark checkout
  const now = new Date().toISOString();
  const { error: updateError } = await admin
    .from('reservations')
    .update({
      status: 'checked_out',
      actual_checkout_time: now,
      payment_status: paymentMethod === 'at_hotel' ? 'pending' : 'completed',
      checkout_method: 'express_checkout',
      updated_at: now,
    })
    .eq('id', reservationId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Record payment if not at_hotel
  if (paymentMethod !== 'at_hotel' && totalOwed > 0) {
    await admin.from('payments').insert({
      hotel_id: reservation.hotel_id,
      reservation_id: reservationId,
      amount: totalOwed,
      method: paymentMethod,
      status: 'completed',
      description: 'Express checkout payment',
      created_at: now,
    });
  }

  // Audit log
  await admin.from('audit_logs').insert({
    user_id: user.id,
    hotel_id: reservation.hotel_id,
    action: 'guest.express_checkout',
    entity_type: 'reservation',
    entity_id: reservationId,
    changes: { paymentMethod, acknowledgedAmount, totalOwed },
  });

  return NextResponse.json({
    success: true,
    message: 'เช็คเอาท์สำเร็จ ใบเสร็จจะถูกส่งทางอีเมล',
    totalCharged: paymentMethod !== 'at_hotel' ? totalOwed : 0,
  });
}
