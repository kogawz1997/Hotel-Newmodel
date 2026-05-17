/**
 * AI Dynamic Pricing Engine
 * Analyzes demand signals and suggests optimal room rates
 *
 * Factors:
 * - Historical occupancy by day-of-week
 * - Current booking pace vs same period last year
 * - Local events / holidays
 * - Lead time bucketing (1-7, 8-30, 31+ days)
 * - Length of stay patterns
 * - Thai public holidays and long weekends
 * - Min/max rate constraints from pricing rules
 * - Auto-apply or pending-approval workflow
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { checkFeatureGate } from '@/lib/billing/feature-gate';
import { createAdminClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { format, addDays, subDays, eachDayOfInterval } from 'date-fns';
import { apiError } from '@/lib/http/errors';
import { getUpcomingHolidays } from '@/lib/pms/thai-holidays';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const { hotelId, roomTypeId, daysAhead = 60, auto_apply = false } = await request.json();

  const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager']);
  if (ctx.error) return ctx.error;

  const gate = await checkFeatureGate(ctx.profile.organization_id, 'dynamic_pricing');
  if (!gate.allowed) return NextResponse.json({ error: gate.reason, upgrade: gate.upgrade }, { status: 402 });

  const admin = createAdminClient();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const [
    { data: roomType },
    { data: reservations },
    { data: rateCalendar },
    { data: pricingRules },
  ] = await Promise.all([
    admin.from('room_types').select('name, base_rate, max_occupancy').eq('id', roomTypeId).single(),
    admin.from('reservations')
      .select('check_in, check_out, total_amount, source, created_at, nights')
      .eq('hotel_id', hotelId)
      .gte('check_in', format(subDays(today, 365), 'yyyy-MM-dd'))
      .lte('check_in', format(addDays(today, daysAhead), 'yyyy-MM-dd'))
      .neq('status', 'cancelled'),
    admin.from('rate_calendar')
      .select('date, rate')
      .eq('hotel_id', hotelId)
      .eq('room_type_id', roomTypeId)
      .gte('date', todayStr)
      .lte('date', format(addDays(today, daysAhead), 'yyyy-MM-dd')),
    admin.from('dynamic_pricing_rules')
      .select('condition, adjustment, min_rate, max_rate')
      .eq('hotel_id', hotelId)
      .eq('is_active', true),
  ]);

  // Derive min/max constraints from rules (take the most permissive range across all active rules)
  let minRate: number = 0;
  let maxRate: number = Infinity;
  if (pricingRules && pricingRules.length > 0) {
    const mins = pricingRules.map((r: any) => r.min_rate).filter((v: any) => v != null);
    const maxes = pricingRules.map((r: any) => r.max_rate).filter((v: any) => v != null);
    if (mins.length > 0) minRate = Math.min(...mins);
    if (maxes.length > 0) maxRate = Math.max(...maxes);
  }

  // Day-of-week occupancy (last 90 days)
  const dowOccupancy: Record<number, { total: number; booked: number }> = {};
  for (let dow = 0; dow < 7; dow++) dowOccupancy[dow] = { total: 0, booked: 0 };

  const last90 = eachDayOfInterval({ start: subDays(today, 90), end: subDays(today, 1) });
  last90.forEach(day => {
    const dow = day.getDay();
    const dateStr = format(day, 'yyyy-MM-dd');
    dowOccupancy[dow].total++;
    const isBooked = reservations?.some(r => r.check_in <= dateStr && r.check_out > dateStr);
    if (isBooked) dowOccupancy[dow].booked++;
  });

  // Recent booking pace (last 30 days, for upcoming dates)
  const recentBookings = reservations?.filter(r => {
    const created = new Date(r.created_at);
    return created >= subDays(today, 30) && new Date(r.check_in) >= today;
  }) || [];

  // Lead time bucketing for upcoming bookings
  const leadBuckets = { lead_1_7: 0, lead_8_30: 0, lead_31_plus: 0 };
  recentBookings.forEach(r => {
    const created = new Date(r.created_at);
    const checkIn = new Date(r.check_in);
    const leadDays = Math.max(0, Math.round((checkIn.getTime() - created.getTime()) / 86400000));
    if (leadDays <= 7) leadBuckets.lead_1_7++;
    else if (leadDays <= 30) leadBuckets.lead_8_30++;
    else leadBuckets.lead_31_plus++;
  });

  // Length-of-stay segmentation across all historical reservations
  const losSegments: Record<string, { count: number; totalAmount: number }> = {
    '1 night': { count: 0, totalAmount: 0 },
    '2-3 nights': { count: 0, totalAmount: 0 },
    '4-7 nights': { count: 0, totalAmount: 0 },
    '7+ nights': { count: 0, totalAmount: 0 },
  };
  (reservations || []).forEach(r => {
    const nights = r.nights ?? 0;
    const amount = r.total_amount ?? 0;
    let seg: string;
    if (nights <= 1) seg = '1 night';
    else if (nights <= 3) seg = '2-3 nights';
    else if (nights <= 7) seg = '4-7 nights';
    else seg = '7+ nights';
    losSegments[seg].count++;
    losSegments[seg].totalAmount += amount;
  });

  // Upcoming Thai holidays in the pricing window
  const upcomingHolidays = getUpcomingHolidays(todayStr, daysAhead);

  // Build AI prompt
  const dowNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dowStats = Object.entries(dowOccupancy).map(([dow, stats]) => ({
    day: dowNames[Number(dow)],
    occupancyPct: stats.total > 0 ? Math.round((stats.booked / stats.total) * 100) : 0,
  }));

  const losLines = Object.entries(losSegments)
    .map(([seg, data]) => {
      const avgRate = data.count > 0 ? Math.round(data.totalAmount / data.count) : 0;
      return `  ${seg}: ${data.count} bookings, avg total ${avgRate} THB`;
    })
    .join('\n');

  const holidayLines = upcomingHolidays.length > 0
    ? upcomingHolidays.map(h => `  ${h.date}: ${h.name}`).join('\n')
    : '  None in this window';

  const constraintNote = minRate > 0 || maxRate < Infinity
    ? `Rate constraints: min ${minRate > 0 ? minRate + ' THB' : 'none'}, max ${maxRate < Infinity ? maxRate + ' THB' : 'none'}`
    : 'No hard rate constraints configured.';

  const prompt = `You are a hotel revenue management AI for "${roomType?.name}" at a Thai hotel.

Base rate: ${roomType?.base_rate} THB/night
${constraintNote}

Recent booking pace: ${recentBookings.length} bookings in last 30 days for upcoming ${daysAhead} days

Lead time breakdown (of recent bookings):
  1-7 days before arrival: ${leadBuckets.lead_1_7} bookings (last-minute, high urgency)
  8-30 days before arrival: ${leadBuckets.lead_8_30} bookings (standard)
  31+ days before arrival: ${leadBuckets.lead_31_plus} bookings (early planners)

Historical occupancy by day of week:
${dowStats.map(d => `  ${d.day}: ${d.occupancyPct}%`).join('\n')}

Length-of-stay segmentation:
${losLines}

Upcoming Thai holidays in next ${daysAhead} days:
${holidayLines}

Analyze demand and suggest pricing for the next ${daysAhead} days. Consider:
1. Weekend vs weekday patterns
2. Lead time: high last-minute share means demand is strong — price up; low last-minute share means fill earlier
3. Thai holidays and long weekends warrant premium pricing (typically +15% to +40%)
4. Length of stay: suggest differential pricing — longer stays can get modest discounts to improve occupancy
5. Revenue optimization: don't leave money on the table but don't price out guests

Respond ONLY with a JSON array of pricing suggestions (no markdown, no explanation):
[
  {
    "date": "YYYY-MM-DD",
    "suggested_rate": number,
    "reason": "short reason max 10 words",
    "confidence": "low|medium|high"
  }
]
Only include dates where you suggest a DIFFERENT rate from base (skip dates where base rate is optimal).
Maximum 30 suggestions for the most impactful dates.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';
    let suggestions: any[] = [];
    try {
      suggestions = JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      suggestions = [];
    }

    // Apply min/max constraints
    suggestions = suggestions.map((s: any) => {
      const clamped = Math.min(
        maxRate < Infinity ? maxRate : s.suggested_rate,
        Math.max(minRate > 0 ? minRate : s.suggested_rate, s.suggested_rate)
      );
      return { ...s, suggested_rate: Math.round(clamped) };
    });

    if (auto_apply) {
      const rows = suggestions.map((s: any) => ({
        hotel_id: hotelId,
        room_type_id: roomTypeId,
        date: s.date,
        rate: s.suggested_rate,
        min_stay: 1,
        status: 'active',
      }));
      await admin.from('rate_calendar').upsert(rows, {
        onConflict: 'hotel_id,room_type_id,date',
        ignoreDuplicates: false,
      });
    } else {
      const rows = suggestions.map((s: any) => ({
        hotel_id: hotelId,
        room_type_id: roomTypeId,
        date: s.date,
        rate: s.suggested_rate,
        min_stay: 1,
        status: 'pending_approval',
      }));
      await admin.from('rate_calendar').upsert(rows, {
        onConflict: 'hotel_id,room_type_id,date',
        ignoreDuplicates: false,
      });
    }

    return NextResponse.json({
      roomTypeName: roomType?.name,
      baseRate: roomType?.base_rate,
      suggestions,
      auto_applied: auto_apply,
      constraints: { minRate: minRate > 0 ? minRate : null, maxRate: maxRate < Infinity ? maxRate : null },
      stats: {
        dowStats,
        recentBookingPace: recentBookings.length,
        leadBuckets,
        losSegments: Object.fromEntries(
          Object.entries(losSegments).map(([seg, data]) => [
            seg,
            { count: data.count, avgRate: data.count > 0 ? Math.round(data.totalAmount / data.count) : 0 },
          ])
        ),
        upcomingHolidays,
      },
    });
  } catch (err: any) {
    return apiError(err);
  }
}

// Apply AI suggestions to rate_calendar (manual apply for pending suggestions)
export async function PUT(request: NextRequest) {
  const { hotelId, roomTypeId, suggestions } = await request.json();

  const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager']);
  if (ctx.error) return ctx.error;

  const gate = await checkFeatureGate(ctx.profile.organization_id, 'dynamic_pricing');
  if (!gate.allowed) return NextResponse.json({ error: gate.reason, upgrade: gate.upgrade }, { status: 402 });

  const admin = createAdminClient();
  const rows = suggestions.map((s: any) => ({
    hotel_id: hotelId,
    room_type_id: roomTypeId,
    date: s.date,
    rate: Math.round(s.suggested_rate),
    min_stay: 1,
    status: 'active',
  }));

  const { error } = await admin.from('rate_calendar')
    .upsert(rows, { onConflict: 'hotel_id,room_type_id,date', ignoreDuplicates: false });

  if (error) return apiError(error);
  return NextResponse.json({ success: true, applied: rows.length });
}

// Fetch pending approval suggestions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotelId');
  const roomTypeId = searchParams.get('roomTypeId');

  const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager']);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  let query = admin.from('rate_calendar')
    .select('date, rate, room_type_id, status')
    .eq('hotel_id', hotelId)
    .eq('status', 'pending_approval')
    .order('date', { ascending: true });

  if (roomTypeId) query = query.eq('room_type_id', roomTypeId);

  const { data, error } = await query;
  if (error) return apiError(error);
  return NextResponse.json({ data });
}
