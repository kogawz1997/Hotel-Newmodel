/**
 * PromptPay Payment Status Poll
 * Frontend polls นี้ทุก 3-5 วินาทีเพื่อเช็คว่า guest จ่ายแล้วหรือยัง
 */
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, 'payments.promptpay.status', 30, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const transactionId = searchParams.get('transactionId');
  const reservationId = searchParams.get('reservationId');

  if (!transactionId && !reservationId) {
    return NextResponse.json({ error: 'Missing transactionId or reservationId' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Check DB first (webhook may have already updated it)
  let query = admin.from('payments').select('id, status, amount, transaction_id, updated_at');
  if (transactionId) query = query.eq('transaction_id', transactionId);
  else if (reservationId) query = query.eq('reservation_id', reservationId).eq('payment_method', 'promptpay');

  const { data: payment } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (payment?.status === 'completed') {
    return NextResponse.json({ status: 'completed', paymentId: payment.id });
  }

  // If still pending and we have Omise configured, check live
  if (payment?.transaction_id && process.env.OMISE_SECRET_KEY) {
    const omiseAuth = Buffer.from(`${process.env.OMISE_SECRET_KEY}:`).toString('base64');
    const chargeRes = await fetch(`https://api.omise.co/charges/${payment.transaction_id}`, {
      headers: { Authorization: `Basic ${omiseAuth}` },
    }).catch(() => null);

    if (chargeRes?.ok) {
      const charge = await chargeRes.json().catch(() => null);
      if (charge?.status === 'successful') {
        // Update payment in DB (webhook may have been delayed)
        await admin
          .from('payments')
          .update({ status: 'completed', paid_at: new Date().toISOString() })
          .eq('id', payment.id);

        return NextResponse.json({ status: 'completed', paymentId: payment.id });
      }
      return NextResponse.json({ status: charge?.status ?? 'pending' });
    }
  }

  return NextResponse.json({ status: payment?.status ?? 'pending' });
}
