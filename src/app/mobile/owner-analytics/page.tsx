import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function MobileOwnerAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (profile?.role && !['owner', 'admin', 'manager'].includes(profile.role)) {
    redirect('/dashboard');
  }

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name, currency')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const today = new Date().toISOString().slice(0, 10);
  const todayStart = `${today}T00:00:00.000Z`;
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStart = `${tomorrowDate.toISOString().slice(0, 10)}T00:00:00.000Z`;

  // 7-day window
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const weekStart = `${sevenDaysAgo.toISOString().slice(0, 10)}T00:00:00.000Z`;

  const [roomsRes, paymentsToday, paymentsWeek, checkInsToday, openInbox, hkPending] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, status')
      .eq('hotel_id', hotel.id),
    supabase
      .from('payments')
      .select('amount')
      .eq('hotel_id', hotel.id)
      .eq('status', 'completed')
      .gte('created_at', todayStart)
      .lt('created_at', tomorrowStart),
    supabase
      .from('payments')
      .select('amount')
      .eq('hotel_id', hotel.id)
      .eq('status', 'completed')
      .gte('created_at', weekStart)
      .lt('created_at', tomorrowStart),
    supabase
      .from('reservations')
      .select('id', { count: 'exact', head: true })
      .eq('hotel_id', hotel.id)
      .eq('check_in', today)
      .in('status', ['confirmed', 'pending']),
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('hotel_id', hotel.id)
      .eq('status', 'open'),
    supabase
      .from('housekeeping_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('hotel_id', hotel.id)
      .in('status', ['pending', 'in_progress']),
  ]);

  const rooms = roomsRes.data || [];
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter((r: any) => r.status === 'occupied').length;
  const occupancyRate = totalRooms ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  const revenueToday = (paymentsToday.data || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
  const revenueWeek = (paymentsWeek.data || []).reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

  const adr = occupiedRooms > 0 ? revenueToday / occupiedRooms : 0;
  const revpar = totalRooms > 0 ? revenueToday / totalRooms : 0;
  const currency = hotel.currency || 'THB';

  const alerts: { label: string; value: number; color: string }[] = [];
  if ((openInbox.count || 0) > 0) alerts.push({ label: `Inbox ค้างตอบ ${openInbox.count} รายการ`, value: openInbox.count || 0, color: 'text-amber-300' });
  if ((hkPending.count || 0) > 5) alerts.push({ label: `Housekeeping ค้าง ${hkPending.count} งาน`, value: hkPending.count || 0, color: 'text-rose-300' });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-50 pb-20">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/95 px-4 py-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.25em] text-violet-300">Maitri Mobile · Owner</p>
        <h1 className="text-2xl font-semibold">{hotel.name}</h1>
        <p className="text-sm text-zinc-400">{today}</p>
      </header>

      <div className="p-4 space-y-4">
        {alerts.length > 0 && (
          <section className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 space-y-1.5">
            <p className="text-xs font-semibold text-amber-300 uppercase tracking-wider">แจ้งเตือน</p>
            {alerts.map((a) => (
              <p key={a.label} className={`text-sm ${a.color}`}>⚠ {a.label}</p>
            ))}
          </section>
        )}

        <section>
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">วันนี้</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-zinc-400 mb-1">รายได้</p>
              <p className="text-xl font-bold text-emerald-300">{formatCurrency(revenueToday, currency)}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-zinc-400 mb-1">Occupancy</p>
              <p className="text-xl font-bold text-sky-300">{occupancyRate}%</p>
              <p className="text-xs text-zinc-500">{occupiedRooms}/{totalRooms} ห้อง</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-zinc-400 mb-1">ADR</p>
              <p className="text-xl font-bold">{formatCurrency(adr, currency)}</p>
              <p className="text-xs text-zinc-500">per occupied room</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <p className="text-xs text-zinc-400 mb-1">RevPAR</p>
              <p className="text-xl font-bold">{formatCurrency(revpar, currency)}</p>
              <p className="text-xs text-zinc-500">per available room</p>
            </div>
          </div>
        </section>

        <section>
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">7 วันล่าสุด</p>
          <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 mb-1">รายได้รวม 7 วัน</p>
              <p className="text-2xl font-bold text-violet-300">{formatCurrency(revenueWeek, currency)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-400 mb-1">เฉลี่ย/วัน</p>
              <p className="text-lg font-semibold">{formatCurrency(revenueWeek / 7, currency)}</p>
            </div>
          </div>
        </section>

        <section>
          <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">สถานะงาน</p>
          <div className="space-y-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 flex items-center justify-between">
              <span className="text-sm">Check-in วันนี้</span>
              <span className="font-semibold text-sky-300">{checkInsToday.count || 0}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 flex items-center justify-between">
              <span className="text-sm">Inbox ค้างตอบ</span>
              <span className={`font-semibold ${(openInbox.count || 0) > 0 ? 'text-amber-300' : 'text-zinc-400'}`}>{openInbox.count || 0}</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3 flex items-center justify-between">
              <span className="text-sm">Housekeeping ค้าง</span>
              <span className={`font-semibold ${(hkPending.count || 0) > 0 ? 'text-rose-300' : 'text-zinc-400'}`}>{hkPending.count || 0}</span>
            </div>
          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 grid grid-cols-2 gap-2 border-t border-white/10 bg-zinc-900/95 p-3 backdrop-blur">
        <Link href="/dashboard/reports" className="rounded-xl bg-white/10 px-3 py-3 text-center text-sm font-medium">รายงานเต็ม</Link>
        <Link href="/dashboard" className="rounded-xl bg-violet-600 px-3 py-3 text-center text-sm font-semibold text-white">Dashboard</Link>
      </div>
    </main>
  );
}
