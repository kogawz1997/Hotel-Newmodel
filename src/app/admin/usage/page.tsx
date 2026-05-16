export const dynamic = 'force-dynamic';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Hotel, MessageSquare, Wifi, HardDrive } from 'lucide-react';

const METRIC_ICONS: Record<string, any> = {
  hotels: Hotel, staff: Users, ai_messages: MessageSquare, ota_channels: Wifi, rooms: HardDrive,
};

const PLAN_COLOR: Record<string, string> = {
  starter: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
  standard: 'bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300',
  pro: 'bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-300',
  enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
};

export default async function AdminUsagePage() {
  const ctx = await requirePlatformAdmin();
  if (ctx.error) redirect('/admin/login');

  const admin = createAdminClient();

  const { data: orgs } = await admin
    .from('organizations')
    .select('id, name, subscription_plan, subscription_status, created_at')
    .order('created_at', { ascending: false });

  const orgList = orgs || [];
  const hotelCounts = await Promise.all(orgList.map(async (o) => {
    const [{ count: hotels }, { count: staff }, { count: rooms }] = await Promise.all([
      admin.from('hotels').select('*', { count: 'exact', head: true }).eq('organization_id', o.id),
      admin.from('user_profiles').select('*', { count: 'exact', head: true }).eq('organization_id', o.id),
      admin.from('rooms').select('*', { count: 'exact', head: true }).in('hotel_id',
        (await admin.from('hotels').select('id').eq('organization_id', o.id)).data?.map((h: any) => h.id) || []
      ),
    ] as any);
    return { orgId: o.id, hotels: hotels || 0, staff: staff || 0, rooms: rooms || 0 };
  }));

  const usageMap = Object.fromEntries(hotelCounts.map(c => [c.orgId, c]));

  const totals = {
    orgs: orgList.length,
    active: orgList.filter(o => ['active', 'trialing'].includes(o.subscription_status)).length,
    hotels: hotelCounts.reduce((s, c) => s + c.hotels, 0),
    staff: hotelCounts.reduce((s, c) => s + c.staff, 0),
    rooms: hotelCounts.reduce((s, c) => s + c.rooms, 0),
  };

  const byPlan = ['starter', 'standard', 'pro', 'enterprise'].map(p => ({
    plan: p, count: orgList.filter(o => o.subscription_plan === p).length,
  }));

  return (
    <main className="container max-w-7xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Per-Tenant Usage Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">AI calls, rooms, staff และการใช้งานต่อ organization</p>
      </div>

      {/* Platform totals */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Organizations', value: totals.orgs, icon: Users },
          { label: 'Active', value: totals.active, icon: Wifi },
          { label: 'Hotels', value: totals.hotels, icon: Hotel },
          { label: 'Staff', value: totals.staff, icon: Users },
          { label: 'Rooms', value: totals.rooms, icon: HardDrive },
        ].map(m => (
          <Card key={m.label}><CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><m.icon className="h-3.5 w-3.5" />{m.label}</div>
            <div className="text-2xl font-bold">{m.value.toLocaleString()}</div>
          </CardContent></Card>
        ))}
      </div>

      {/* Plan distribution */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Distribution by Plan</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-3 flex-wrap">
            {byPlan.map(p => (
              <div key={p.plan} className="flex items-center gap-2">
                <Badge className={`${PLAN_COLOR[p.plan]} border-0 capitalize`}>{p.plan}</Badge>
                <span className="font-bold text-sm">{p.count}</span>
                <span className="text-xs text-muted-foreground">({totals.orgs > 0 ? Math.round((p.count / totals.orgs) * 100) : 0}%)</span>
              </div>
            ))}
          </div>
          <div className="h-4 rounded-full overflow-hidden flex mt-3 gap-0.5">
            {byPlan.filter(p => p.count > 0).map(p => (
              <div key={p.plan} className={`${PLAN_COLOR[p.plan]} transition-all`} style={{ flex: p.count }} title={`${p.plan}: ${p.count}`} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Per-org table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">All Organizations ({orgList.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/40">
                {['Organization', 'Plan', 'Status', 'Hotels', 'Rooms', 'Staff', 'Joined'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {orgList.map(o => {
                  const u = usageMap[o.id] || { hotels: 0, staff: 0, rooms: 0 };
                  return (
                    <tr key={o.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-2.5 font-medium">
                        <a href={`/admin/orgs/${o.id}`} className="hover:text-primary transition-colors">{o.name}</a>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge className={`${PLAN_COLOR[o.subscription_plan] || ''} border-0 text-2xs capitalize`}>{o.subscription_plan || '—'}</Badge>
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge className={`border-0 text-2xs ${o.subscription_status === 'active' ? 'bg-emerald-100 text-emerald-700' : o.subscription_status === 'trialing' ? 'bg-sky-100 text-sky-700' : 'bg-red-100 text-red-600'}`}>
                          {o.subscription_status || '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-2.5">{u.hotels}</td>
                      <td className="px-4 py-2.5">{u.rooms}</td>
                      <td className="px-4 py-2.5">{u.staff}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleDateString('th-TH', { dateStyle: 'short' })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
