import { NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const ctx = await requireHotelAccess(searchParams.get('hotel_id') || searchParams.get('hotelId'));
  if (ctx.error) return ctx.error;

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to date params required (YYYY-MM-DD)' }, { status: 400 });
  }

  const fromISO = `${from}T00:00:00.000Z`;
  const toISO = `${to}T23:59:59.999Z`;

  const { data: reservations, error } = await ctx.supabase
    .from('reservations')
    .select('id, status, cancellation_reason, booking_source, channel, source, check_in, created_at, total_amount')
    .eq('hotel_id', ctx.hotelId)
    .gte('created_at', fromISO)
    .lte('created_at', toISO);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all = reservations || [];
  const total = all.length;
  const cancelled = all.filter(r => r.status === 'cancelled');
  const cancellation_rate = total > 0 ? Math.round((cancelled.length / total) * 1000) / 10 : 0;

  const by_reason: Record<string, number> = {};
  for (const r of cancelled) {
    const reason = r.cancellation_reason || 'unknown';
    by_reason[reason] = (by_reason[reason] || 0) + 1;
  }

  const by_lead_time = { '0_7': 0, '8_30': 0, '31_plus': 0 };
  for (const r of cancelled) {
    if (!r.check_in || !r.created_at) continue;
    const daysAhead = Math.floor(
      (new Date(r.check_in).getTime() - new Date(r.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysAhead <= 7) by_lead_time['0_7'] += 1;
    else if (daysAhead <= 30) by_lead_time['8_30'] += 1;
    else by_lead_time['31_plus'] += 1;
  }

  function getSource(r: any): string {
    return (r.booking_source || r.channel || r.source || 'direct').toLowerCase();
  }

  const channelStats: Record<string, { total: number; cancelled: number }> = {};
  for (const r of all) {
    const src = getSource(r);
    if (!channelStats[src]) channelStats[src] = { total: 0, cancelled: 0 };
    channelStats[src].total += 1;
    if (r.status === 'cancelled') channelStats[src].cancelled += 1;
  }

  const by_channel = Object.entries(channelStats).map(([channel, s]) => ({
    channel,
    total: s.total,
    cancelled: s.cancelled,
    rate: s.total > 0 ? Math.round((s.cancelled / s.total) * 1000) / 10 : 0,
  })).sort((a, b) => b.rate - a.rate);

  const revenue_lost = cancelled.reduce((s, r) => s + Number(r.total_amount || 0), 0);

  // Weekly cancellation trend
  const weeklyMap: Record<string, number> = {};
  for (const r of cancelled) {
    const d = new Date(r.created_at);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay());
    const key = weekStart.toISOString().slice(0, 10);
    weeklyMap[key] = (weeklyMap[key] || 0) + 1;
  }
  const trend = Object.entries(weeklyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, count]) => ({ week, count }));

  return NextResponse.json({
    total_bookings: total,
    total_cancelled: cancelled.length,
    cancellation_rate,
    by_reason,
    by_lead_time,
    by_channel,
    revenue_lost,
    trend,
  });
}
