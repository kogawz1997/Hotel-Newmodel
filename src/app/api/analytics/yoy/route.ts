import { NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

interface Metrics {
  occupancy_rate: number;
  revenue: number;
  adr: number;
  revpar: number;
  bookings_count: number;
  cancellation_rate: number;
}

async function fetchMetrics(supabase: any, hotelId: string, monthStart: string, nextMonth: string): Promise<Metrics> {
  const [roomsTotal, reservations, payments] = await Promise.all([
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    supabase.from('reservations')
      .select('id, total_amount, status, check_in')
      .eq('hotel_id', hotelId)
      .gte('created_at', monthStart)
      .lt('created_at', nextMonth),
    supabase.from('payments')
      .select('amount, status')
      .eq('hotel_id', hotelId)
      .eq('status', 'completed')
      .gte('created_at', monthStart)
      .lt('created_at', nextMonth),
  ]);

  const totalRooms = roomsTotal.count || 0;
  const allReservations = reservations.data || [];
  const allPayments = payments.data || [];

  const active = allReservations.filter((r: any) => r.status !== 'cancelled');
  const cancelled = allReservations.filter((r: any) => r.status === 'cancelled');
  const cancellation_rate = allReservations.length > 0
    ? Math.round((cancelled.length / allReservations.length) * 1000) / 10
    : 0;

  const revenue = allPayments.reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

  // Occupied room nights = unique days across active reservations
  let occupiedRoomNights = 0;
  const start = new Date(monthStart);
  const end = new Date(nextMonth);
  const daysInMonth = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  for (const r of active) {
    if (!r.check_in) continue;
    occupiedRoomNights += 1;
  }

  const adr = occupiedRoomNights > 0 ? Math.round(revenue / occupiedRoomNights) : 0;
  const occupancy_rate = totalRooms > 0 && daysInMonth > 0
    ? Math.round((occupiedRoomNights / (totalRooms * daysInMonth)) * 1000) / 10
    : 0;
  const revpar = totalRooms > 0 && daysInMonth > 0
    ? Math.round(revenue / (totalRooms * daysInMonth))
    : 0;

  return {
    occupancy_rate,
    revenue,
    adr,
    revpar,
    bookings_count: active.length,
    cancellation_rate,
  };
}

function monthRange(month: string): [string, string] {
  const [year, mon] = month.split('-').map(Number);
  const start = `${month}-01T00:00:00.000Z`;
  const next = mon === 12
    ? `${year + 1}-01-01T00:00:00.000Z`
    : `${year}-${String(mon + 1).padStart(2, '0')}-01T00:00:00.000Z`;
  return [start, next];
}

function priorYearMonth(month: string): string {
  const [year, mon] = month.split('-').map(Number);
  return `${year - 1}-${String(mon).padStart(2, '0')}`;
}

function compare(current: number, previous: number): { value: number; pct: number; direction: 'up' | 'down' | 'same' } {
  const diff = current - previous;
  const pct = previous !== 0 ? Math.round((diff / previous) * 1000) / 10 : 0;
  return {
    value: diff,
    pct,
    direction: diff > 0 ? 'up' : diff < 0 ? 'down' : 'same',
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM

  const ctx = await requireHotelAccess(searchParams.get('hotel_id') || searchParams.get('hotelId'));
  if (ctx.error) return ctx.error;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month param required (YYYY-MM)' }, { status: 400 });
  }

  const [currentStart, currentEnd] = monthRange(month);
  const prevMonth = priorYearMonth(month);
  const [prevStart, prevEnd] = monthRange(prevMonth);

  const [current, previous] = await Promise.all([
    fetchMetrics(ctx.supabase, ctx.hotelId, currentStart, currentEnd),
    fetchMetrics(ctx.supabase, ctx.hotelId, prevStart, prevEnd),
  ]);

  const metricKeys: (keyof Metrics)[] = ['occupancy_rate', 'revenue', 'adr', 'revpar', 'bookings_count', 'cancellation_rate'];
  const changes: Record<string, { value: number; pct: number; direction: 'up' | 'down' | 'same' }> = {};
  for (const key of metricKeys) {
    changes[key] = compare(current[key], previous[key]);
  }

  return NextResponse.json({ current, previous, changes, month, prior_year_month: prevMonth });
}
