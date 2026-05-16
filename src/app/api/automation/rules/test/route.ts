/**
 * POST /api/automation/rules/test
 * Dry-run an automation rule against the most recent reservation.
 * Returns the message payload that would have been sent — does NOT actually send.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireHotelAccess } from '@/lib/auth/guards';
import { getHotelCopy } from '@/lib/i18n/hotel-copy';
import { rateLimit } from '@/lib/security/rate-limit';

const schema = z.object({ ruleId: z.string().uuid() });

function mapTemplate(trigger: string) {
  if (trigger === 'checkin_minus_1_day') return 'checkInReminder';
  if (trigger === 'checkout_day') return 'checkoutReminder';
  if (trigger === 'payment_overdue') return 'paymentReminder';
  if (trigger === 'post_checkout_review') return 'reviewRequest';
  return 'checkInReminder';
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, 'automation.test', 10, 60_000);
  if (limited) return limited;

  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager']);
  if (ctx.error) return ctx.error;

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { ruleId } = parsed.data;

  const { data: rule } = await ctx.supabase
    .from('automation_rules')
    .select('*')
    .eq('id', ruleId)
    .eq('hotel_id', ctx.hotelId)
    .single();

  if (!rule) return NextResponse.json({ error: 'Rule not found' }, { status: 404 });

  // Find a recent reservation to use as test context
  const { data: reservation } = await ctx.supabase
    .from('reservations')
    .select('id, reservation_code, guest_name, guest_email, guest_phone, check_in, check_out, balance_due, preferred_language')
    .eq('hotel_id', ctx.hotelId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const templateKey = (rule.template_key || mapTemplate(rule.trigger)) as any;
  const language = reservation?.preferred_language || 'en';
  const message = getHotelCopy(language, templateKey);

  const testPayload = {
    trigger: rule.trigger,
    channel: rule.channel,
    template_key: templateKey,
    message,
    wouldSendTo: {
      guestName: reservation?.guest_name || 'ทดสอบ / Test Guest',
      email: reservation?.guest_email || 'test@example.com',
      phone: reservation?.guest_phone || null,
      reservationCode: reservation?.reservation_code || 'TEST-001',
      checkIn: reservation?.check_in || new Date().toISOString().slice(0, 10),
      checkOut: reservation?.check_out || new Date().toISOString().slice(0, 10),
    },
    dryRun: true,
    testedAt: new Date().toISOString(),
  };

  // Log the test run
  await ctx.supabase.from('audit_logs').insert({
    hotel_id: ctx.hotelId,
    user_id: ctx.user.id,
    action: 'automation.rule_tested',
    entity_type: 'automation_rule',
    entity_id: ruleId,
    changes: { trigger: rule.trigger, channel: rule.channel, dryRun: true },
  });

  return NextResponse.json({ success: true, preview: testPayload });
}
