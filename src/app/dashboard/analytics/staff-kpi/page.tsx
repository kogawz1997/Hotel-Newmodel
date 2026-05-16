export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Users, CheckCircle2, Clock, Star } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export default async function StaffKPIPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager']);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const now = new Date();
  const mStart = startOfMonth(now).toISOString();
  const mEnd = endOfMonth(now).toISOString();

  const { data: staff } = await supabase
    .from('user_profiles')
    .select('id, first_name, last_name, role, avatar_url')
    .eq('organization_id', profile.organization_id)
    .neq('role', 'owner');

  const staffData = await Promise.all((staff || []).map(async s => {
    const [tasks, workOrders] = await Promise.all([
      supabase.from('tasks').select('id, status, completed_at').eq('assigned_to', s.id).gte('created_at', mStart).lte('created_at', mEnd),
      supabase.from('work_orders').select('id, status, created_at, resolved_at, sla_deadline').eq('assigned_to', s.id).gte('created_at', mStart).lte('created_at', mEnd),
    ]);
    const t = tasks.data || [];
    const w = workOrders.data || [];
    const done = t.filter(x => x.status === 'completed').length;
    const wDone = w.filter(x => x.status === 'resolved').length;
    const slaBreaches = w.filter(x => x.sla_deadline && x.resolved_at && x.resolved_at > x.sla_deadline).length;
    const totalTasks = t.length + w.length;
    const totalDone = done + wDone;
    const rate = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;
    return { ...s, totalTasks, totalDone, rate, slaBreaches };
  }));

  const sorted = staffData.sort((a, b) => b.rate - a.rate);

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="Staff Performance KPI" description={`ผลงานพนักงานเดือน ${format(now, 'MMMM yyyy')}`} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Users, label: 'จำนวนพนักงาน', value: String(staffData.length) + ' คน' },
          { icon: CheckCircle2, label: 'งานเสร็จเดือนนี้', value: String(staffData.reduce((s, x) => s + x.totalDone, 0)) + ' งาน' },
          { icon: Clock, label: 'SLA ล่าช้า', value: String(staffData.reduce((s, x) => s + x.slaBreaches, 0)) + ' งาน' },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}><CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><Icon className="h-3.5 w-3.5" />{label}</div>
            <div className="text-2xl font-display font-medium">{value}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4" />อันดับพนักงาน</CardTitle></CardHeader>
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">ยังไม่มีข้อมูลพนักงาน</p>
          ) : (
            <div className="divide-y divide-border">
              {sorted.map((s, i) => (
                <div key={s.id} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</div>
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium shrink-0">
                    {(s.first_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{s.first_name} {s.last_name || ''}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-2xs">{s.role}</Badge>
                      {s.slaBreaches > 0 && (
                        <span className="text-2xs text-red-600">SLA ล่าช้า {s.slaBreaches} งาน</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-medium">{s.totalDone}/{s.totalTasks} งาน</div>
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${s.rate >= 80 ? 'bg-emerald-500' : s.rate >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.rate}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{s.rate}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
