/**
 * GET /api/reservations/{id}/timeline
 * Returns chronological audit trail for a reservation:
 * audit_logs (status changes, payments, moves, extends) + payments
 */
import { NextResponse } from 'next/server';
import { assertReservationAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

const ACTION_LABEL: Record<string, string> = {
  'reservation.created': 'สร้างการจอง',
  'reservation.confirmed': 'ยืนยันการจอง',
  'reservation.check_in': 'เช็คอิน',
  'reservation.check_out': 'เช็คเอาท์',
  'reservation.cancelled': 'ยกเลิกการจอง',
  'reservation.no_show': 'No Show',
  'reservation.extended': 'ต่อวันพัก',
  'reservation.moved': 'ย้ายห้อง',
  'reservation.split': 'แยกการจอง',
  'reservation.merged': 'รวมการจอง',
  'payment.promptpay.created': 'สร้าง PromptPay',
  'payment.truemoney.created': 'สร้าง TrueMoney',
  'payment.shopeepay.created': 'สร้าง ShopeePay',
  'payment.completed': 'ชำระเงินสำเร็จ',
  'payment.failed': 'ชำระเงินล้มเหลว',
  'invoice.created': 'ออกใบกำกับ',
  'invoice.voided': 'ยกเลิกใบกำกับ',
};

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ctx = await assertReservationAccess(id);
  if (ctx.error) return ctx.error;
  if (!ctx.reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

  const admin = createAdminClient();
  const hotelId = ctx.reservation.hotel_id;

  const [{ data: auditLogs }, { data: payments }] = await Promise.all([
    admin
      .from('audit_logs')
      .select('id, action, changes, created_at, user_id, user_profiles(full_name, email)')
      .eq('hotel_id', hotelId)
      .eq('entity_id', id)
      .order('created_at', { ascending: true })
      .limit(100),
    admin
      .from('payments')
      .select('id, amount, currency, payment_method, status, created_at, transaction_id')
      .eq('reservation_id', id)
      .eq('hotel_id', hotelId)
      .order('created_at', { ascending: true })
      .limit(50),
  ]);

  const auditEvents = (auditLogs || []).map((log: any) => ({
    id: log.id,
    type: 'audit',
    action: log.action,
    label: ACTION_LABEL[log.action] || log.action,
    changes: log.changes,
    actor: log.user_profiles?.full_name || log.user_profiles?.email || 'ระบบ',
    createdAt: log.created_at,
  }));

  const paymentEvents = (payments || []).map((p: any) => ({
    id: p.id,
    type: 'payment',
    action: `payment.${p.status}`,
    label: `${p.payment_method?.toUpperCase() || 'ชำระเงิน'} — ${p.status}`,
    changes: { amount: p.amount, currency: p.currency, transactionId: p.transaction_id },
    actor: 'ระบบ',
    createdAt: p.created_at,
  }));

  const timeline = [...auditEvents, ...paymentEvents]
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return NextResponse.json({ timeline, reservationCode: ctx.reservation.reservation_code });
}
