/**
 * ShopeePay Payment via Omise
 * Guest สแกน QR ShopeePay → Omise รับ callback → update status
 *
 * Flow:
 * 1. POST พร้อม reservationId + amount
 * 2. สร้าง Omise source type=shopeepay
 * 3. สร้าง Omise charge → ได้ authorize_uri (QR deep-link)
 * 4. บันทึก payment record (pending)
 * 5. Omise webhook → /api/payments/omise/webhook → update status
 */
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { parseJson } from '@/lib/http/validation';
import { rateLimit } from '@/lib/security/rate-limit';
import { validateCsrfOrigin } from '@/lib/security/csrf';

const schema = z.object({
  reservationId: z.string().uuid(),
  amount: z.coerce.number().positive().max(10_000_000),
  currency: z.string().length(3).default('THB'),
  description: z.string().max(255).optional(),
});

export async function POST(request: NextRequest) {
  const csrf = validateCsrfOrigin(request);
  if (csrf.ok === false) {
    return NextResponse.json({ error: `CSRF: ${csrf.reason}` }, { status: 403 });
  }

  const limited = await rateLimit(request, 'payments.shopeepay', 10, 60_000);
  if (limited) return limited;

  if (!process.env.OMISE_SECRET_KEY || process.env.OMISE_SECRET_KEY.includes('demo')) {
    return NextResponse.json(
      { error: 'Payment service not configured', code: 'PAYMENT_NOT_CONFIGURED' },
      { status: 503 }
    );
  }

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;

  const { reservationId, amount, currency, description } = parsed.data;

  const admin = createAdminClient();

  const { data: reservation } = await admin
    .from('reservations')
    .select('id, hotel_id, total_amount, paid_amount, status, reservation_code')
    .eq('id', reservationId)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  if (!['pending_payment', 'confirmed', 'pending'].includes(reservation.status)) {
    return NextResponse.json({ error: 'Reservation is not awaiting payment' }, { status: 409 });
  }

  const omiseAuth = Buffer.from(`${process.env.OMISE_SECRET_KEY}:`).toString('base64');

  const sourceRes = await fetch('https://api.omise.co/sources', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${omiseAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      type: 'shopeepay',
      amount: String(Math.round(amount * 100)),
      currency: currency.toLowerCase(),
    }),
  });

  if (!sourceRes.ok) {
    const err = await sourceRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as any)?.message || 'ไม่สามารถสร้าง ShopeePay source ได้' },
      { status: 502 }
    );
  }

  const source = await sourceRes.json();

  const chargeRes = await fetch('https://api.omise.co/charges', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${omiseAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      amount: String(Math.round(amount * 100)),
      currency: currency.toLowerCase(),
      source: source.id,
      description: description || `จองห้องพัก #${reservation.reservation_code || reservationId.slice(0, 8)}`,
      'metadata[reservation_id]': reservationId,
      'metadata[hotel_id]': reservation.hotel_id,
    }),
  });

  if (!chargeRes.ok) {
    const err = await chargeRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: (err as any)?.message || 'ไม่สามารถสร้าง ShopeePay charge ได้' },
      { status: 502 }
    );
  }

  const charge = await chargeRes.json();

  const { data: payment, error: payErr } = await admin
    .from('payments')
    .insert({
      reservation_id: reservationId,
      hotel_id: reservation.hotel_id,
      amount,
      currency,
      payment_method: 'shopeepay',
      status: 'pending',
      transaction_id: charge.id,
      gateway: 'omise',
      metadata: {
        omise_charge_id: charge.id,
        omise_source_id: source.id,
        charge_status: charge.status,
        authorize_uri: charge.authorize_uri ?? null,
      },
    })
    .select('id')
    .single();

  if (payErr) {
    logger.error('ShopeePay payment save failed', { error: payErr.message });
  }

  await admin.from('audit_logs').insert({
    hotel_id: reservation.hotel_id,
    action: 'payment.shopeepay.created',
    entity_type: 'payment',
    entity_id: payment?.id || charge.id,
    changes: { amount, chargeId: charge.id, reservationId },
  });

  return NextResponse.json({
    paymentId: payment?.id,
    transactionId: charge.id,
    authorizeUri: charge.authorize_uri ?? null,
    status: charge.status,
    amount,
    currency,
    expiresAt: charge.expires_at ?? null,
  });
}
