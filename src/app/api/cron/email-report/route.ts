/**
 * GET /api/cron/email-report
 * Weekly occupancy + revenue summary email to hotel owners.
 * Schedule: every Monday 07:00 ICT (00:00 UTC)
 * Requires: CRON_SECRET, SENDGRID_API_KEY, SENDGRID_FROM_EMAIL
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireCronSecret } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

function fmt(n: number) {
  return '฿' + n.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function pct(n: number, d: number) {
  return d === 0 ? '0%' : Math.round((n / d) * 100) + '%';
}

export async function GET(request: NextRequest) {
  const err = requireCronSecret(request);
  if (err) return err;

  if (!process.env.SENDGRID_API_KEY) {
    logger.warn('email-report cron: SENDGRID_API_KEY not set, skipping');
    return NextResponse.json({ skipped: true, reason: 'SENDGRID_API_KEY not configured' });
  }

  const admin = createAdminClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400_000);
  const today = now.toISOString().slice(0, 10);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  const { data: hotels } = await admin
    .from('hotels')
    .select('id, name, email, organization_id');

  const results: Array<{ hotelId: string; sent: boolean; error?: string }> = [];

  for (const hotel of hotels || []) {
    try {
      // Get owner email
      const { data: ownerProfile } = await admin
        .from('user_profiles')
        .select('id, full_name, auth_users:id(email)')
        .eq('organization_id', hotel.organization_id)
        .in('role', ['owner', 'admin'])
        .limit(1)
        .single();

      // @ts-ignore — auth_users join shape
      const ownerEmail = (ownerProfile as any)?.auth_users?.email || hotel.email;
      if (!ownerEmail) {
        results.push({ hotelId: hotel.id, sent: false, error: 'No owner email' });
        continue;
      }

      // Aggregate weekly stats
      const [
        { data: reservations },
        { data: payments },
        { data: rooms },
      ] = await Promise.all([
        admin.from('reservations')
          .select('id, status, check_in, check_out')
          .eq('hotel_id', hotel.id)
          .gte('check_in', weekAgoStr)
          .lte('check_in', today),

        admin.from('payments')
          .select('amount, status')
          .eq('hotel_id', hotel.id)
          .gte('created_at', weekAgo.toISOString())
          .eq('status', 'completed'),

        admin.from('rooms')
          .select('id, status')
          .eq('hotel_id', hotel.id),
      ]);

      const totalRooms = rooms?.length || 0;
      const newBookings = reservations?.length || 0;
      const checkins = reservations?.filter((r: any) => r.status === 'checked_in' || r.status === 'checked_out').length || 0;
      const cancellations = reservations?.filter((r: any) => r.status === 'cancelled').length || 0;
      const revenue = (payments || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      const occupancyPct = pct(checkins, Math.max(totalRooms * 7, 1));

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.maitripms.com';

      const html = `
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f8f7;">
  <div style="background: #2A2522; color: white; padding: 24px 28px; border-radius: 12px 12px 0 0;">
    <h1 style="margin: 0; font-size: 20px;">${hotel.name}</h1>
    <p style="margin: 4px 0 0; opacity: 0.7; font-size: 13px;">Weekly Report · ${weekAgoStr} – ${today}</p>
  </div>

  <div style="background: white; padding: 28px; border-radius: 0 0 12px 12px; border: 1px solid #e5e3e1;">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px;">
      <div style="background: #f0fdf4; border-radius: 8px; padding: 16px;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">รายได้สัปดาห์นี้</p>
        <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700; color: #16a34a;">${fmt(revenue)}</p>
      </div>
      <div style="background: #eff6ff; border-radius: 8px; padding: 16px;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">Occupancy</p>
        <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700; color: #2563eb;">${occupancyPct}</p>
      </div>
      <div style="background: #f9fafb; border-radius: 8px; padding: 16px;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">การจองใหม่</p>
        <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700;">${newBookings}</p>
      </div>
      <div style="background: #fef2f2; border-radius: 8px; padding: 16px;">
        <p style="margin: 0; font-size: 12px; color: #6b7280;">ยกเลิก</p>
        <p style="margin: 4px 0 0; font-size: 24px; font-weight: 700; color: #dc2626;">${cancellations}</p>
      </div>
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="${appUrl}/dashboard"
         style="background: #2A2522; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        ดู Dashboard
      </a>
    </div>

    <p style="margin-top: 24px; font-size: 11px; color: #9ca3af; text-align: center;">
      Maitri PMS · รายงานประจำสัปดาห์อัตโนมัติ
    </p>
  </div>
</div>`;

      const sendRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: {
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@maitripms.com',
            name: 'Maitri PMS',
          },
          to: [{ email: ownerEmail }],
          subject: `📊 Weekly Report: ${hotel.name} · ${weekAgoStr}`,
          content: [{ type: 'text/html', value: html }],
        }),
      });

      if (sendRes.ok) {
        results.push({ hotelId: hotel.id, sent: true });
        logger.info('email-report sent', { hotelId: hotel.id, to: ownerEmail });
      } else {
        const errBody = await sendRes.json().catch(() => ({}));
        results.push({ hotelId: hotel.id, sent: false, error: JSON.stringify(errBody) });
        logger.warn('email-report send failed', { hotelId: hotel.id, status: sendRes.status });
      }
    } catch (e: any) {
      results.push({ hotelId: hotel.id, sent: false, error: e.message });
      logger.error('email-report exception', { hotelId: hotel.id, error: e });
    }
  }

  const sent = results.filter((r) => r.sent).length;
  return NextResponse.json({ ok: true, sent, total: results.length, results });
}
