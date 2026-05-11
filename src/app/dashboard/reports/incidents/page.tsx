import { Activity, AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ReplayButton } from './replay-button';

export const dynamic = 'force-dynamic';

const SEVERITY_CONFIG: Record<string, { icon: React.ElementType; badge: string; label: string }> = {
  critical: { icon: XCircle,       badge: 'destructive', label: 'Critical' },
  error:    { icon: AlertTriangle,  badge: 'destructive', label: 'Error' },
  warning:  { icon: AlertTriangle,  badge: 'warning',     label: 'Warning' },
  info:     { icon: Info,           badge: 'info',        label: 'Info' },
};

export default async function IncidentTimelinePage({ searchParams }: { searchParams: Promise<{ severity?: string }> }) {
  const { supabase, profile } = await requireDashboardRole([
    'owner', 'admin', 'manager',
  ]);

  const { severity: filterSeverity } = await searchParams;

  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(10);

  const hotelIds = (hotels || []).map((h: any) => h.id);
  if (!hotelIds.length) return <div className="p-6 text-muted-foreground">ไม่พบ hotel</div>;

  const hotelId = hotelIds[0];

  let query = supabase
    .from('operational_events')
    .select('id, hotel_id, event_type, severity, title, details, source, resolved_at, created_at')
    .in('hotel_id', hotelIds)
    .order('created_at', { ascending: false })
    .limit(100);

  if (filterSeverity && filterSeverity !== 'all') {
    query = query.eq('severity', filterSeverity);
  }

  const { data: events } = await query;

  const counts = { critical: 0, error: 0, warning: 0, info: 0 };
  for (const e of events || []) {
    if (e.severity in counts) counts[e.severity as keyof typeof counts]++;
  }

  const severityOrder = ['critical', 'error', 'warning', 'info'];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <p className="text-sm text-muted-foreground">Reports / Incidents</p>
        <h1 className="text-2xl font-semibold tracking-tight">Incident Timeline</h1>
        <p className="text-sm text-muted-foreground">เหตุการณ์สำคัญและ ops alerts ย้อนหลัง — กด Replay เพื่อส่ง alert ซ้ำ</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {severityOrder.map((sev) => {
          const cfg = SEVERITY_CONFIG[sev];
          const Icon = cfg.icon;
          return (
            <a key={sev} href={`?severity=${sev}`} className={`rounded-xl border p-4 transition hover:-translate-y-0.5 hover:shadow-sm ${filterSeverity === sev ? 'ring-2 ring-primary' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4" />
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
              </div>
              <p className="text-2xl font-bold">{counts[sev as keyof typeof counts]}</p>
            </a>
          );
        })}
      </div>

      {filterSeverity && filterSeverity !== 'all' && (
        <a href="?" className="inline-block text-xs text-muted-foreground hover:text-foreground underline">← แสดงทั้งหมด</a>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Timeline
          </CardTitle>
          <CardDescription>100 events ล่าสุด · {(events || []).length} รายการ{filterSeverity && filterSeverity !== 'all' ? ` (filter: ${filterSeverity})` : ''}</CardDescription>
        </CardHeader>
        <CardContent>
          {!(events || []).length ? (
            <EmptyState icon={CheckCircle2} title="ไม่พบเหตุการณ์" description="ยังไม่มี operational events ในช่วงนี้" />
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <ol className="space-y-4 pl-10">
                {events!.map((event: any) => {
                  const cfg = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.info;
                  const Icon = cfg.icon;
                  const isResolved = !!event.resolved_at;
                  return (
                    <li key={event.id} className="relative">
                      <span className={`absolute -left-[1.625rem] flex h-5 w-5 items-center justify-center rounded-full border bg-background ${isResolved ? 'text-emerald-600' : ''}`}>
                        {isResolved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                      </span>
                      <div className="rounded-xl border p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <Badge variant={cfg.badge as any}>{event.severity}</Badge>
                              <code className="text-xs text-muted-foreground font-mono">{event.event_type}</code>
                              {isResolved && <Badge variant="success">resolved</Badge>}
                            </div>
                            <p className="text-sm font-medium">{event.title}</p>
                            {event.details && Object.keys(event.details).length > 0 && (
                              <details className="mt-2">
                                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Details</summary>
                                <pre className="mt-1 text-xs bg-muted/50 rounded p-2 overflow-x-auto max-h-32">{JSON.stringify(event.details, null, 2)}</pre>
                              </details>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <ReplayButton eventId={event.id} eventType={event.event_type} hotelId={hotelId} />
                            <time className="text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(event.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </time>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">source: {event.source}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
