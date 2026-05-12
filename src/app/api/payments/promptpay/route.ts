/**
 * PromptPay QR Payment
 * สร้าง PromptPay charge ผ่าน Omise และคืน QR code image URL
 *
 * Flow:
 * 1. Guest/staff POST พร้อม reservationId + amount
 * 2. สร้าง Omise source type=promptpay
 * 3. สร้าง Omise charge → รับ QR URI
 * 4. บันทึก payment record (pending)
 * 5. คืน qrCodeUrl ให้ frontend แสดง
 * 6. เมื่อ guest scan+จ่าย → Omise webhook → /api/payments/omise/webhook → update status
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

  const limited = await rateLimit(request, 'payments.promptpay', 10, 60_000);
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

  // Verify reservation exists and get hotel context
  const { data: reservation } = await admin
    .from('reservations')
    .select('id, hotel_id, total_amount, paid_amount, status, reservation_code')
    .eq('id', reservationId)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  }

  if (!['pending_payment', 'confirmed'].includes(reservation.status)) {
    return NextResponse.json({ error: 'Reservation is not awaiting payment' }, { status: 409 });
  }

  // Check for existing pending PromptPay charge to avoid duplicate QR
  const { data: existingPayment } = await admin
    .from('payments')
    .select('id, transaction_id, metadata')
    .eq('reservation_id', reservationId)
    .eq('payment_method', 'promptpay')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingPayment?.metadata?.qr_code_url) {
    return NextResponse.json({
      paymentId: existingPayment.id,
      transactionId: existingPayment.transaction_id,
      qrCodeUrl: existingPayment.metadata.qr_code_url,
      amount,
      currency,
      reused: true,
    });
  }

  // Omise: Create PromptPay source
  const omiseAuth = Buffer.from(`${process.env.OMISE_SECRET_KEY}:`).toString('base64');

  const sourceRes = await fetch('https://api.omise.co/sources', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${omiseAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      type: 'promptpay',
      amount: String(Math.round(amount * 100)), // satang
      currency: currency.toLowerCase(),
    }),
  });

  if (!sourceRes.ok) {
    const err = await sourceRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.message || 'Failed to create PromptPay source' },
      { status: 502 }
    );
  }

  const source = await sourceRes.json();

  // Omise: Create charge linked to source
  const chargeBody: Record<string, string> = {
    amount: String(Math.round(amount * 100)),
    currency: currency.toLowerCase(),
    source: source.id,
    description: description || `จองห้องพัก #${reservation.reservation_code || reservationId.slice(0, 8)}`,
    'metadata[reservation_id]': reservationId,
    'metadata[hotel_id]': reservation.hotel_id,
  };

  const chargeRes = await fetch('https://api.omise.co/charges', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${omiseAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(chargeBody),
  });

  if (!chargeRes.ok) {
    const err = await chargeRes.json().catch(() => ({}));
    return NextResponse.json(
      { error: err?.message || 'Failed to create PromptPay charge' },
      { status: 502 }
    );
  }

  const charge = await chargeRes.json();
  const qrCodeUrl: string | null = charge.source?.scannable_code?.image?.download_uri ?? null;

  // Save payment record (pending)
  const { data: payment, error: payErr } = await admin
    .from('payments')
    .insert({
      reservation_id: reservationId,
      hotel_id: reservation.hotel_id,
      amount,
      currency,
      payment_method: 'promptpay',
      status: 'pending',
      transaction_id: charge.id,
      gateway: 'omise',
      metadata: {
        omise_charge_id: charge.id,
        omise_source_id: source.id,
        qr_code_url: qrCodeUrl,
        charge_status: charge.status,
      },
    })
    .select('id')
    .single();

  if (payErr) {
    logger.error('PromptPay save failed', { error: payErr.message });
  }

  await admin.from('audit_logs').insert({
    hotel_id: reservation.hotel_id,
    action: 'payment.promptpay.created',
    entity_type: 'payment',
    entity_id: payment?.id || charge.id,
    changes: { amount, chargeId: charge.id, reservationId },
  });

  return NextResponse.json({
    paymentId: payment?.id,
    transactionId: charge.id,
    qrCodeUrl,
    amount,
    currency,
    expiresAt: charge.expires_at,
  });
}
