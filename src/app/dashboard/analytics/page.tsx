import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { BedDouble, CalendarCheck, CircleDollarSign, UtensilsCrossed, Heart, TrendingUp } from 'lucide-react';
import { AnalyticsChartsClient } from './analytics-charts-client';
import { format, subDays } from 'date-fns';
import { th } from 'date-fns/locale';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user!.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id,currency').eq('organization_id', profile?.organization_id).limit(1).single();

  if (!hotel) return null;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = `${now.toISOString().slice(0, 7)}-01T00:00:00.000Z`;
  const thirtyDaysAgo = subDays(now, 29).toISOString().slice(0, 10);

  const [roomsTotal, roomsOccupied, arrivalsToday, departuresToday, reservationsMonth, paymentRows, fbRows, spaRows, trend30Payments, trend30Reservations, trend30Rooms] = await Promise.all([
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'occupied'),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_in', today).in('status', ['confirmed', 'pending']),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_out', today).eq('status', 'checked_in'),
    supabase.from('reservations').select('id,total_amount,status').eq('hotel_id', hotel.id).gte('created_at', monthStart),
    supabase.from('payments').select('amount,status,created_at').eq('hotel_id', hotel.id).gte('created_at', monthStart),
    supabase.from('fb_orders').select('total,status').eq('hotel_id', hotel.id).gte('created_at', monthStart),
    supabase.from('spa_bookings').select('amount,status').eq('hotel_id', hotel.id).gte('created_at', monthStart),
    // 30-day trend data
    supabase.from('payments').select('amount,status,created_at').eq('hotel_id', hotel.id).gte('created_at', thirtyDaysAgo + 'T00:00:00Z').eq('status', 'completed'),
    supabase.from('reservations').select('id,created_at,status').eq('hotel_id', hotel.id).gte('created_at', thirtyDaysAgo + 'T00:00:00Z').neq('status', 'cancelled'),
    supabase.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id),
  ]);

  const payments = paymentRows.data || [];
  const fb = fbRows.data || [];
  const spa = spaRows.data || [];
  const reservations = reservationsMonth.data || [];
  const revenueMonth = payments.filter((p: any) => p.status === 'completed').reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const revenueToday = payments.filter((p: any) => p.status === 'completed' && String(p.created_at).slice(0, 10) === today).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const fbRevenue = fb.filter((o: any) => o.status === 'paid').reduce((s: number, o: any) => s + Number(o.total || 0), 0);
  const spaRevenue = spa.filter((b: any) => b.status !== 'cancelled').reduce((s: number, b: any) => s + Number(b.amount || 0), 0);
  const reservationValue = reservations.filter((r: any) => r.status !== 'cancelled').reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);
  const totalRooms = roomsTotal.count || 1;
  const occupiedRooms = roomsOccupied.count || 0;
  const occupancyRate = Math.round((occupiedRooms / totalRooms) * 100);

  // Build 30-day trend array
  const payByDay = new Map<string, number>();
  for (const p of trend30Payments.data || []) {
    const d = String(p.created_at).slice(0, 10);
    payByDay.set(d, (payByDay.get(d) || 0) + Number(p.amount || 0));
  }
  const resByDay = new Map<string, number>();
  for (const r of trend30Reservations.data || []) {
    const d = String(r.created_at).slice(0, 10);
    resByDay.set(d, (resByDay.get(d) || 0) + 1);
  }

  const trend = Array.from({ length: 30 }, (_, i) => {
    const d = subDays(now, 29 - i);
    const date = d.toISOString().slice(0, 10);
    const label = format(d, 'd MMM', { locale: th });
    return {
      date,
      label,
      revenue: payByDay.get(date) || 0,
      reservations: resByDay.get(date) || 0,
      occupancy: date === today ? occupancyRate : 0,
    };
  });

  const cards = [
    { label: 'Occupancy', value: `${occupancyRate}%`, sub: `${occupiedRooms}/${totalRooms} ห้อง`, icon: BedDouble },
    { label: 'Arrivals วันนี้', value: String(arrivalsToday.count || 0), sub: today, icon: CalendarCheck },
    { label: 'Departures วันนี้', value: String(departuresToday.count || 0), sub: today, icon: CalendarCheck },
    { label: 'Revenue วันนี้', value: formatCurrency(revenueToday, hotel.currency || 'THB'), sub: 'payment completed', icon: CircleDollarSign },
    { label: 'Revenue เดือนนี้', value: formatCurrency(revenueMonth, hotel.currency || 'THB'), sub: `${reservations.length} reservations`, icon: TrendingUp },
    { label: 'Booking value', value: formatCurrency(reservationValue, hotel.currency || 'THB'), sub: 'ยอดจองเดือนนี้', icon: CalendarCheck },
    { label: 'F&B revenue', value: formatCurrency(fbRevenue, hotel.currency || 'THB'), sub: 'posted/paid orders', icon: UtensilsCrossed },
    { label: 'Spa revenue', value: formatCurrency(spaRevenue, hotel.currency || 'THB'), sub: 'booked services', icon: Heart },
  ];

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar title="Analytics" description="ตัวเลขธุรกิจจาก booking, payment, F&B และ spa" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((item) => (
          <Card key={item.label}>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-2xl font-semibold tracking-tight">{item.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{item.sub}</p>
              </div>
              <div className="rounded-xl border bg-muted/50 p-2"><item.icon className="h-5 w-5" /></div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AnalyticsChartsClient trend={trend} currency={hotel.currency || 'THB'} />
    </div>
  );
}
