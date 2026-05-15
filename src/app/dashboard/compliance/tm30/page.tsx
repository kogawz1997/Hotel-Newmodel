export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function TM30Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('user_profiles').select('id, organization_id, role').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id, name').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard');
  // Get foreign guest reservations from last 30 days
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const { data: reservations } = await supabase.from('reservations')
    .select('id, guest_name, check_in_date, check_out_date, status, room_number')
    .eq('hotel_id', hotel.id)
    .gte('check_in_date', since)
    .order('check_in_date', { ascending: false })
    .limit(100);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold">TM30 — รายงานผู้เข้าพักต่างชาติ</h1>
        <p className="text-sm text-muted-foreground">รายชื่อผู้เข้าพัก 30 วันล่าสุด</p>
      </div>
      <div className="flex-1 p-4 md:p-6 space-y-3">
        {(reservations ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">ไม่มีรายการ</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  {['ชื่อ guest','ห้อง','เช็คอิน','เช็คเอาท์','สถานะ','TM30'].map(h => (
                    <th key={h} className="text-left px-4 py-2 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reservations!.map((r: any) => (
                  <tr key={r.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-2">{r.guest_name}</td>
                    <td className="px-4 py-2">{r.room_number ?? '—'}</td>
                    <td className="px-4 py-2">{r.check_in_date}</td>
                    <td className="px-4 py-2">{r.check_out_date}</td>
                    <td className="px-4 py-2"><span className="text-xs bg-muted rounded px-1.5 py-0.5">{r.status}</span></td>
                    <td className="px-4 py-2">
                      <button onClick={async () => {
                        const res = await fetch('/api/compliance/tm30', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reservationId: r.id }) });
                        if (res.ok) alert('สร้าง TM30 แล้ว'); else alert('ไม่สำเร็จ');
                      }} className="text-xs text-primary hover:underline">สร้าง TM30</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
