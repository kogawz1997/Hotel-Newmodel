export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle, TrendingUp } from 'lucide-react';

const SLA_MINUTES: Record<string, number> = {
  emergency: 30,
  high: 120,
  normal: 480,
  low: 1440,
};

function diffMin(a: string, b: string) {
  return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 60000);
}

export default async function SLAPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'maintenance_manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: orders } = await supabase
    .from('work_orders')
    .select('id, title, priority, status, created_at, updated_at, sla_minutes, assigned_to, user_profiles(full_name)')
    .eq('hotel_id', hotel.id)
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  const now = new Date().toISOString();
  const rows = (orders || []).map((o: any) => {
    const sla = o.sla_minutes ?? SLA_MINUTES[o.priority] ?? 480;
    const elapsed = diffMin(o.created_at, o.status === 'completed' ? (o.updated_at || now) : now);
    const breached = elapsed > sla;
    const pct = Math.min(100, Math.round((elapsed / sla) * 100));
    return { ...o, sla, elapsed, breached, pct };
  });

  const breached = rows.filter(r => r.breached && r.status !== 'completed');
  const onTime = rows.filter(r => r.status === 'completed' && !r.breached);
  const total = rows.length;
  const slaRate = total > 0 ? Math.round((onTime.length / total) * 100) : 100;

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="SLA Tracking" description="ติดตาม SLA และงานที่เกินกำหนดเวลา" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><TrendingUp className="h-3.5 w-3.5" />SLA Rate (30 วัน)</div>
          <div className={`text-2xl font-display font-bold ${slaRate >= 80 ? 'text-emerald-600' : 'text-red-600'}`}>{slaRate}%</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><AlertTriangle className="h-3.5 w-3.5 text-red-500" />เกิน SLA ตอนนี้</div>
          <div className="text-2xl font-display font-bold text-red-600">{breached.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" />เสร็จทัน SLA</div>
          <div className="text-2xl font-display font-bold text-emerald-600">{onTime.length}</div>
        </CardContent></Card>
      </div>

      {breached.length > 0 && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 text-red-700 font-medium text-sm mb-3">
            <AlertTriangle className="h-4 w-4" />งาน Escalation — เกิน SLA ต้องดำเนินการด่วน
          </div>
          <div className="space-y-2">
            {breached.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between text-sm bg-white rounded-lg p-3 border border-red-100">
                <div>
                  <p className="font-medium text-foreground">{o.title}</p>
                  <p className="text-xs text-muted-foreground">{o.user_profiles?.full_name || 'ยังไม่มอบหมาย'}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-red-100 text-red-700 border-0 text-2xs">เกิน {o.elapsed - o.sla} นาที</Badge>
                  <p className="text-xs text-muted-foreground mt-0.5">SLA: {o.sla} นาที</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />รายการงาน 30 วันล่าสุด</CardTitle></CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border bg-secondary/40">
              {['หัวข้อ', 'Priority', 'SLA', 'ใช้เวลา', 'สถานะ SLA'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {rows.slice(0, 50).map((o: any) => (
                <tr key={o.id} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.title}</p>
                    <p className="text-xs text-muted-foreground">{o.status}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`border-0 text-2xs ${o.priority === 'emergency' ? 'bg-red-100 text-red-700' : o.priority === 'high' ? 'bg-amber-100 text-amber-700' : 'bg-secondary text-muted-foreground'}`}>
                      {o.priority || 'normal'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{o.sla} นาที</td>
                  <td className="px-4 py-3 text-xs">{o.elapsed} นาที
                    <div className="h-1.5 bg-secondary rounded-full mt-1 w-20 overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${o.pct >= 100 ? 'bg-red-500' : o.pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${o.pct}%` }} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {o.status === 'completed'
                      ? <Badge className={`border-0 text-2xs ${o.breached ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{o.breached ? 'เกิน SLA' : 'ทัน SLA'}</Badge>
                      : o.breached
                        ? <Badge className="border-0 text-2xs bg-red-100 text-red-700">⚠ กำลังเกิน</Badge>
                        : <Badge className="border-0 text-2xs bg-secondary text-muted-foreground">กำลังทำ</Badge>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
