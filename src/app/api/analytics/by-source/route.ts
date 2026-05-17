import { NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM

  const ctx = await requireHotelAccess(searchParams.get('hotel_id') || searchParams.get('hotelId'));
  if (ctx.error) return ctx.error;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month param required (YYYY-MM)' }, { status: 400 });
  }

  const monthStart = `${month}-01T00:00:00.000Z`;
  const [year, mon] = month.split('-').map(Number);
  const nextMonth = mon === 12 ? `${year + 1}-01-01T00:00:00.000Z` : `${year}-${String(mon + 1).padStart(2, '0')}-01T00:00:00.000Z`;

  const { data: reservations, error } = await ctx.supabase
    .from('reservations')
    .select('id, total_amount, booking_source, channel, source, status')
    .eq('hotel_id', ctx.hotelId)
    .gte('created_at', monthStart)
    .lt('created_at', nextMonth)
    .neq('status', 'cancelled');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: payments } = await ctx.supabase
    .from('payments')
    .select('amount, reservation_id, status')
    .eq('hotel_id', ctx.hotelId)
    .eq('status', 'completed')
    .gte('created_at', monthStart)
    .lt('created_at', nextMonth);

  const paymentsByReservation: Record<string, number> = {};
  for (const p of payments || []) {
    if (p.reservation_id) {
      paymentsByReservation[p.reservation_id] = (paymentsByReservation[p.reservation_id] || 0) + Number(p.amount || 0);
    }
  }

  const KNOWN_SOURCES = ['direct', 'booking_com', 'agoda', 'airbnb', 'expedia', 'phone', 'walk_in', 'other'];

  function normalizeSource(r: any): string {
    const raw = (r.booking_source || r.channel || r.source || '').toLowerCase().replace(/[\s-]/g, '_');
    if (KNOWN_SOURCES.includes(raw)) return raw;
    if (raw.includes('booking')) return 'booking_com';
    if (raw.includes('agoda')) return 'agoda';
    if (raw.includes('airbnb')) return 'airbnb';
    if (raw.includes('expedia')) return 'expedia';
    if (raw === '' || raw === 'direct' || raw === 'web') return 'direct';
    return 'other';
  }

  const sourceTotals: Record<string, { revenue: number; bookings: number }> = {};
  for (const src of KNOWN_SOURCES) sourceTotals[src] = { revenue: 0, bookings: 0 };

  for (const r of reservations || []) {
    const src = normalizeSource(r);
    sourceTotals[src].bookings += 1;
    sourceTotals[src].revenue += paymentsByReservation[r.id] ?? Number(r.total_amount || 0);
  }

  const total = Object.values(sourceTotals).reduce((s, v) => s + v.revenue, 0);

  const sources = KNOWN_SOURCES.map(src => ({
    source: src,
    revenue: sourceTotals[src].revenue,
    bookings: sourceTotals[src].bookings,
    pct: total > 0 ? Math.round((sourceTotals[src].revenue / total) * 1000) / 10 : 0,
  })).sort((a, b) => b.revenue - a.revenue);

  return NextResponse.json({ sources, total });
}
