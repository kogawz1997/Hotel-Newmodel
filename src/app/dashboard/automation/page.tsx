import { requireHotelAccess } from '@/lib/auth/guards';
import { AutomationClient } from '@/components/automation/automation-client';

export const dynamic = 'force-dynamic';

export default async function AutomationPage() {
  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager']);
  if (ctx.error) return <div className="p-6">Unauthorized</div>;

  const [{ data: rules }, { data: runs }] = await Promise.all([
    ctx.supabase
      .from('automation_rules')
      .select('*')
      .eq('hotel_id', ctx.hotelId)
      .order('created_at', { ascending: false }),
    ctx.supabase
      .from('automation_runs')
      .select('id, channel, status, created_at, payload')
      .eq('hotel_id', ctx.hotelId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const counts = {
    total: rules?.length || 0,
    enabled: rules?.filter((r: any) => r.enabled).length || 0,
    queued: runs?.filter((r: any) => r.status === 'queued').length || 0,
    sent: runs?.filter((r: any) => r.status === 'sent').length || 0,
  };

  return (
    <main className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto animate-fade-in">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Automation Center</h1>
        <p className="text-sm text-muted-foreground">ตั้ง rule อัตโนมัติสำหรับเช็กอิน ชำระเงิน เช็กเอาต์ และรีวิว</p>
      </section>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Rules ทั้งหมด', value: counts.total },
          { label: 'เปิดใช้งาน', value: counts.enabled, color: 'text-emerald-600' },
          { label: 'รอส่ง', value: counts.queued, color: 'text-amber-600' },
          { label: 'ส่งแล้ว (10 ล่าสุด)', value: counts.sent, color: 'text-blue-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border bg-card p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className={`text-2xl font-display font-medium ${color || ''}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Rules with test button */}
      <section className="space-y-3">
        <h2 className="font-semibold text-sm">Automation Rules</h2>
        <AutomationClient rules={rules || []} />
      </section>

      {/* Recent runs */}
      <section className="rounded-xl border bg-card p-4 space-y-3">
        <h2 className="font-semibold text-sm">Recent Queue</h2>
        {(runs || []).length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีงาน automation ถูก queue</p>
        ) : (
          <div className="space-y-2">
            {(runs || []).map((run: any) => (
              <div key={run.id} className="flex items-center justify-between rounded-lg border p-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    run.status === 'sent' ? 'bg-emerald-100 text-emerald-700' :
                    run.status === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{run.status}</span>
                  <span className="text-muted-foreground">{run.channel}</span>
                  {run.payload?.guest_name && (
                    <span className="text-foreground">{run.payload.guest_name}</span>
                  )}
                </div>
                <span className="text-muted-foreground">
                  {new Date(run.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
