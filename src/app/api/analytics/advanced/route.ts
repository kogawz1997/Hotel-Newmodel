import { NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { cached } from '@/lib/performance/cache';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ctx = await requireHotelAccess(searchParams.get('hotelId'));
  if (ctx.error) return ctx.error;

  const data = await cached(`advanced-analytics:${ctx.hotelId}`, 60_000, async () => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const monthStart = `${now.toISOString().slice(0, 7)}-01T00:00:00.000Z`;

    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysElapsed = dayOfMonth;
    const daysRemaining = daysInMonth - dayOfMonth;

    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 14);

    const [roomsTotal, checkedInReservations, reservationsMonth, paymentsMonth, fbMonth, spaMonth, paymentsLast7, paymentsPrior7] = await Promise.all([
      ctx.supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', ctx.hotelId),
      ctx.supabase.from('reservations').select('id').eq('hotel_id', ctx.hotelId).eq('status', 'checked_in'),
      ctx.supabase.from('reservations').select('id,total_amount,status,created_at,check_in,check_out').eq('hotel_id', ctx.hotelId).gte('created_at', monthStart),
      ctx.supabase.from('payments').select('amount,status,created_at').eq('hotel_id', ctx.hotelId).gte('created_at', monthStart),
      ctx.supabase.from('fb_orders').select('total,status,created_at').eq('hotel_id', ctx.hotelId).gte('created_at', monthStart),
      ctx.supabase.from('spa_bookings').select('amount,status,created_at').eq('hotel_id', ctx.hotelId).gte('created_at', monthStart),
      ctx.supabase.from('payments').select('amount,status').eq('hotel_id', ctx.hotelId).eq('status', 'completed').gte('created_at', sevenDaysAgo.toISOString()).lte('created_at', now.toISOString()),
      ctx.supabase.from('payments').select('amount,status').eq('hotel_id', ctx.hotelId).eq('status', 'completed').gte('created_at', fourteenDaysAgo.toISOString()).lt('created_at', sevenDaysAgo.toISOString()),
    ]);

    const totalRooms = roomsTotal.count || 0;
    const occupiedRooms = checkedInReservations.data?.length || 0;
    const reservations = reservationsMonth.data || [];
    const payments = paymentsMonth.data || [];
    const fb = fbMonth.data || [];
    const spa = spaMonth.data || [];

    const revenueMonth = payments.filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const revenueToday = payments.filter((p: any) => p.status === 'completed' && String(p.created_at).slice(0, 10) === today).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const ancillaryRevenue = fb.filter((o: any) => o.status === 'paid').reduce((s: number, o: any) => s + Number(o.total || 0), 0)
      + spa.filter((b: any) => b.status !== 'cancelled').reduce((s: number, b: any) => s + Number(b.amount || 0), 0);
    const activeReservations = reservations.filter((r: any) => r.status !== 'cancelled');

    // Booking pace forecast: project daily rate forward, adjusted by recent occupancy trend
    const revenueL7 = (paymentsLast7.data || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const revenueP7 = (paymentsPrior7.data || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const trendFactor = revenueP7 > 0 ? revenueL7 / revenueP7 : 1;
    const currentDailyRate = daysElapsed > 0 ? revenueMonth / daysElapsed : 0;
    const forecastRevenue = Math.round(revenueMonth + currentDailyRate * daysRemaining * Math.min(Math.max(trendFactor, 0.5), 2));

    return {
      date: today,
      occupancyRate: totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0,
      adr: occupiedRooms ? Math.round(revenueToday / occupiedRooms) : 0,
      revpar: totalRooms ? Math.round(revenueToday / totalRooms) : 0,
      rooms: { total: totalRooms, occupied: occupiedRooms },
      bookingsMonth: activeReservations.length,
      revenueToday,
      revenueMonth,
      ancillaryRevenue,
      forecastRevenue,
    };
  });

  return NextResponse.json(data);
}
