import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function MobileFrontDeskPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name, check_in_time, check_out_time')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const today = new Date().toISOString().slice(0, 10);

  const [arrivalsRes, departuresRes, roomsRes] = await Promise.all([
    supabase
      .from('reservations')
      .select('id, reservation_code, check_in, check_out, status, num_adults, guests(first_name, last_name), rooms(room_number), room_types(name)')
      .eq('hotel_id', hotel.id)
      .eq('check_in', today)
      .in('status', ['confirmed', 'pending_payment', 'pending'])
      .order('created_at', { ascending: true })
      .limit(30),
    supabase
      .from('reservations')
      .select('id, reservation_code, check_in, check_out, status, guests(first_name, last_name), rooms(room_number)')
      .eq('hotel_id', hotel.id)
      .eq('check_out', today)
      .eq('status', 'checked_in')
      .order('check_out', { ascending: true })
      .limit(30),
    supabase
      .from('rooms')
      .select('id, room_number, floor, status, room_types(name)')
      .eq('hotel_id', hotel.id)
      .order('floor', { ascending: true })
      .order('room_number', { ascending: true })
      .limit(80),
  ]);

  const arrivals = arrivalsRes.data || [];
  const departures = departuresRes.data || [];
  const rooms = roomsRes.data || [];

  const availableRooms = rooms.filter((r: any) => r.status === 'available').length;
  const occupiedRooms = rooms.filter((r: any) => r.status === 'occupied').length;

  const roomStatusColor: Record<string, string> = {
    available: 'bg-emerald-400/20 border-emerald-400/30 text-emerald-200',
    occupied: 'bg-rose-400/20 border-rose-400/30 text-rose-200',
    cleaning: 'bg-amber-400/20 border-amber-400/30 text-amber-200',
    maintenance: 'bg-slate-400/20 border-slate-400/30 text-slate-300',
    out_of_order: 'bg-red-900/40 border-red-400/30 text-red-300',
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 pb-24">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-slate-950/95 px-4 py-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.25em] text-sky-300">Maitri Mobile</p>
        <h1 className="text-2xl font-semibold">Front Desk</h1>
        <p className="text-sm text-slate-400">{hotel.name} · {today}</p>
      </header>

      <div className="p-4 space-y-4">
        <section className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-xl border border-sky-300/30 bg-sky-300/10 px-2 py-3">
            <div className="text-slate-400 mb-1">เช็คอินวันนี้</div>
            <div className="text-xl font-bold text-sky-200">{arrivals.length}</div>
          </div>
          <div className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-2 py-3">
            <div className="text-slate-400 mb-1">เช็คเอาต์วันนี้</div>
            <div className="text-xl font-bold text-amber-200">{departures.length}</div>
          </div>
          <div className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 px-2 py-3">
            <div className="text-slate-400 mb-1">ห้องว่าง</div>
            <div className="text-xl font-bold text-emerald-200">{availableRooms}</div>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-sky-300 uppercase tracking-wider mb-2">เช็คอินวันนี้ ({arrivals.length})</h2>
          <div className="space-y-2">
            {arrivals.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">ไม่มี arrival วันนี้</div>
            ) : arrivals.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.guests?.first_name} {r.guests?.last_name || ''}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.reservation_code} · {r.room_types?.name}</p>
                    {r.rooms?.room_number && <p className="text-xs text-emerald-300 mt-0.5">ห้อง {r.rooms.room_number}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${r.status === 'confirmed' ? 'bg-emerald-400/15 text-emerald-200' : 'bg-amber-400/15 text-amber-200'}`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">{r.num_adults} ผู้ใหญ่ · {r.check_in} → {r.check_out}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-amber-300 uppercase tracking-wider mb-2">เช็คเอาต์วันนี้ ({departures.length})</h2>
          <div className="space-y-2">
            {departures.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-500">ไม่มี departure วันนี้</div>
            ) : departures.map((r: any) => (
              <div key={r.id} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{r.guests?.first_name} {r.guests?.last_name || ''}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{r.reservation_code} · ห้อง {r.rooms?.room_number || '—'}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-rose-400/15 px-2 py-0.5 text-xs font-medium text-rose-200">checked_in</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">เช็คเอาต์: {r.check_out}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">สถานะห้อง</h2>
          <div className="grid grid-cols-4 gap-1.5">
            {rooms.map((room: any) => (
              <div key={room.id} className={`rounded-lg border px-1 py-2 text-center text-xs ${roomStatusColor[room.status] || 'bg-white/5 border-white/10 text-slate-400'}`}>
                <div className="font-bold text-sm">{room.room_number}</div>
                <div className="text-[10px] opacity-70 truncate">{room.status}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-500 text-center">{occupiedRooms} occupied · {availableRooms} available · {rooms.length} total</p>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 grid grid-cols-2 gap-2 border-t border-white/10 bg-slate-900/95 p-3 backdrop-blur">
        <Link href="/dashboard/front-desk" className="rounded-xl bg-white/10 px-3 py-3 text-center text-sm font-medium">เปิดหน้าเต็ม</Link>
        <Link href="/dashboard/front-desk/walk-in" className="rounded-xl bg-sky-500 px-3 py-3 text-center text-sm font-semibold text-white">Walk-in</Link>
      </div>
    </main>
  );
}
