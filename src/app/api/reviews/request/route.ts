/**
 * POST /api/reviews/request
 * Send a post-stay review request to a guest after checkout.
 * Can be triggered manually or by automation rules.
 *
 * Channels: email (SendGrid), LINE (if configured)
 * Falls back to recording the request in DB even if send fails.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson } from '@/lib/http/validation';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { logger } from '@/lib/logger';

const schema = z.object({
  reservationId: z.string().uuid(),
  channel: z.enum(['email', 'line', 'both']).default('email'),
});

const REVIEW_LINK_BASE = process.env.NEXT_PUBLIC_APP_URL || 'https://app.maitripms.com';

export async function POST(request: Request) {
  const limited = await rateLimit(request, 'reviews.request', 20, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;
  const { reservationId, channel } = parsed.data;

  const admin = createAdminClient();

  const { data: reservation } = await admin
    .from('reservations')
    .select('id, hotel_id, reservation_code, status, check_out, guests(first_name, last_name, email, phone), hotels(name, email)')
    .eq('id', reservationId)
    .single();

  if (!reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

  const ctx = await requireHotelAccess(reservation.hotel_id, ['owner', 'admin', 'manager', 'front_desk']);
  if (ctx.error) return ctx.error;

  if (!['checked_out', 'completed'].includes(reservation.status)) {
    return NextResponse.json({ error: 'Can only send review request after checkout' }, { status: 409 });
  }

  // Check if request already sent
  const { data: existing } = await admin
    .from('review_requests')
    .select('id')
    .eq('reservation_id', reservationId)
    .single();

  if (existing) {
    return NextResponse.json({ error: 'Review request already sent for this reservation' }, { status: 409 });
  }

  const guest = reservation.guests as any;
  const hotel = reservation.hotels as any;
  const reviewLink = `${REVIEW_LINK_BASE}/review/${reservation.reservation_code}`;
  const guestName = `${guest?.first_name || ''} ${guest?.last_name || ''}`.trim() || 'แขกผู้เข้าพัก';

  let emailSent = false;
  let lineSent = false;

  // Send email via SendGrid if configured
  if ((channel === 'email' || channel === 'both') && guest?.email && process.env.SENDGRID_API_KEY) {
    try {
      const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: { email: process.env.SENDGRID_FROM_EMAIL || hotel?.email || 'noreply@maitripms.com', name: hotel?.name || 'Maitri PMS' },
          to: [{ email: guest.email, name: guestName }],
          subject: `ขอบคุณที่ใช้บริการ ${hotel?.name} — แบ่งปันประสบการณ์ของคุณ`,
          content: [{
            type: 'text/html',
            value: `
              <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 32px;">
                <h2 style="color: #2A2522;">ขอบคุณที่ใช้บริการ ${hotel?.name}</h2>
                <p>สวัสดีคุณ${guestName},</p>
                <p>ขอบคุณที่เลือกพักที่ ${hotel?.name} หวังว่าคุณจะประทับใจกับการพักครั้งนี้</p>
                <p>เราอยากได้รับความคิดเห็นของคุณ รีวิวของคุณจะช่วยให้เราพัฒนาบริการให้ดียิ่งขึ้น</p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${reviewLink}"
                     style="background: #2A2522; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                    ✍️ เขียนรีวิว
                  </a>
                </div>
                <p style="color: #888; font-size: 12px;">ใช้เวลาเพียง 2 นาที · รหัสจอง: ${reservation.reservation_code}</p>
              </div>
            `,
          }],
        }),
      });
      emailSent = emailRes.ok;
      if (!emailRes.ok) {
        const err = await emailRes.json().catch(() => ({}));
        logger.warn('Review request email failed', { error: err });
      }
    } catch (e) {
      logger.error('Review request email exception', { error: e });
    }
  }

  // Send LINE if configured (placeholder — uses conversation send API internally)
  if ((channel === 'line' || channel === 'both') && process.env.LINE_CHANNEL_ACCESS_TOKEN) {
    // TODO: implement LINE message send
    lineSent = false;
  }

  // Record the request
  const { data: reqRecord } = await admin.from('review_requests').insert({
    reservation_id: reservationId,
    hotel_id: reservation.hotel_id,
    guest_id: (reservation.guests as any)?.id || null,
    channel,
    email_sent: emailSent,
    line_sent: lineSent,
    review_link: reviewLink,
    sent_at: new Date().toISOString(),
  }).select('id').single().catch(() => ({ data: null }));

  await admin.from('audit_logs').insert({
    hotel_id: reservation.hotel_id,
    user_id: ctx.user?.id || null,
    action: 'review.request_sent',
    entity_type: 'reservation',
    entity_id: reservationId,
    changes: { channel, emailSent, lineSent, reservationCode: reservation.reservation_code },
  });

  return NextResponse.json({
    success: true,
    requestId: reqRecord?.id,
    emailSent,
    lineSent,
    reviewLink,
  });
}

/**
 * GET /api/reviews/request?hotelId=&limit=50
 * List recent review requests for a hotel
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotelId');
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 200);

  if (!hotelId) return NextResponse.json({ error: 'hotelId required' }, { status: 400 });

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const { data, error } = await ctx.supabase
    .from('review_requests')
    .select('*, reservations(reservation_code, check_out), guests(first_name, last_name, email)')
    .eq('hotel_id', hotelId)
    .order('sent_at', { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ requests: data || [] });
}
