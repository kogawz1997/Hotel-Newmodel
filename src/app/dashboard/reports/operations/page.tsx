import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

export default async function OperationsReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id, name, currency').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const today = new Date().toISOString().slice(0, 10);
  const [arrivals, departures, payments] = await Promise.all([
    supabase.from('reservations').select('reservation_code, status, guests(first_name,last_name), room_types(name)').eq('hotel_id', hotel.id).eq('check_in', today).in('status', ['confirmed', 'pending']),
    supabase.from('reservations').select('reservation_code, status, guests(first_name,last_name), room_types(name)').eq('hotel_id', hotel.id).eq('check_out', today).in('status', ['checked_in', 'checked_out']),
    supabase.from('payments').select('amount, method').eq('hotel_id', hotel.id).eq('status', 'completed').gte('created_at', `${today}T00:00:00.000Z`).lt('created_at', `${today}T23:59:59.999Z`),
  ]);

  const totalsByMethod = (payments.data || []).reduce((acc: Record<string, number>, row: any) => {
    const key = row.method || 'unknown';
    acc[key] = (acc[key] || 0) + Number(row.amount || 0);
    return acc;
  }, {});
  const cashierTotal = Object.values(totalsByMethod).reduce((s, v) => s + v, 0);

  return (
    <main className="space-y-6 p-6 md:p-8">
      <section>
        <h1 className="text-2xl font-semibold">Daily Operational Reports</h1>
        <p className="mt-1 text-sm text-muted-foreground">{hotel.name} · {today}</p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Arrivals</p><p className="text-2xl font-semibold">{arrivals.data?.length || 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Departures</p><p className="text-2xl font-semibold">{departures.data?.length || 0}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Cashier close-of-day</p><p className="text-2xl font-semibold">{formatCurrency(cashierTotal, hotel.currency || 'THB')}</p></CardContent></Card>
      </section>
      <section className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Arrival List</CardTitle><CardDescription>แขกที่ควรเตรียมห้องรับวันนี้</CardDescription></CardHeader><CardContent className="space-y-3">{(arrivals.data || []).length === 0 ? <p className="text-sm text-muted-foreground">ไม่มี arrivals วันนี้</p> : (arrivals.data || []).map((r: any) => <div key={r.reservation_code} className="rounded-xl border p-3 text-sm"><div className="font-medium">{r.guests?.first_name} {r.guests?.last_name || ''}</div><div className="text-muted-foreground">{r.reservation_code} · {r.room_types?.name || '-'}</div></div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Departure List</CardTitle><CardDescription>แขกที่ต้องติดตาม check-out วันนี้</CardDescription></CardHeader><CardContent className="space-y-3">{(departures.data || []).length === 0 ? <p className="text-sm text-muted-foreground">ไม่มี departures วันนี้</p> : (departures.data || []).map((r: any) => <div key={r.reservation_code} className="rounded-xl border p-3 text-sm"><div className="font-medium">{r.guests?.first_name} {r.guests?.last_name || ''}</div><div className="text-muted-foreground">{r.reservation_code} · {r.room_types?.name || '-'}</div></div>)}</CardContent></Card>
      </section>
      <Card><CardHeader><CardTitle>Cashier Close Detail</CardTitle><CardDescription>สรุปยอดแยกตามช่องทางรับชำระ</CardDescription></CardHeader><CardContent className="space-y-2">{Object.entries(totalsByMethod).length === 0 ? <p className="text-sm text-muted-foreground">ยังไม่มียอด completed วันนี้</p> : Object.entries(totalsByMethod).map(([method, amount]) => <div key={method} className="flex items-center justify-between rounded-lg border p-3 text-sm"><span className="capitalize">{method.replace('_', ' ')}</span><Badge variant="outline">{formatCurrency(amount as number, hotel.currency || 'THB')}</Badge></div>)}</CardContent></Card>
    </main>
  );
}
