import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { ResolveButton } from './resolve-button';

export const dynamic = 'force-dynamic';

export default async function OtaConflictsPage() {
  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager']);
  if (ctx.error) return <div className="p-6">Unauthorized</div>;

  const hotelId = ctx.hotelId!;
  const admin = createAdminClient();

  // Get failed/skipped OTA jobs for this hotel
  const { data: failedJobs } = await ctx.supabase
    .from('ota_sync_queue')
    .select('id, provider, type, status, attempts, error, payload, created_at, updated_at')
    .eq('hotel_id', hotelId)
    .in('status', ['failed', 'skipped'])
    .order('updated_at', { ascending: false })
    .limit(50);

  // Get DLQ entries linked to this hotel's failed jobs
  const failedJobIds = (failedJobs || []).map((j: any) => j.id);
  const { data: dlqItems } = failedJobIds.length > 0
    ? await admin
        .from('dead_letter_queue')
        .select('id, source_id, source_provider, failure_reason, attempts, payload, moved_at, resolved_at, resolution_note')
        .in('source_id', failedJobIds)
        .order('moved_at', { ascending: false })
        .limit(50)
    : { data: [] as any[] };

  const dlqById = new Map((dlqItems || []).map((d: any) => [d.source_id, d]));

  const unresolved = (dlqItems || []).filter((d: any) => !d.resolved_at);
  const resolved = (dlqItems || []).filter((d: any) => d.resolved_at);

  // Failed jobs not yet in DLQ (active failures)
  const pendingFailures = (failedJobs || []).filter((j: any) => !dlqById.has(j.id));

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <p className="text-sm text-muted-foreground">OTA / Conflicts</p>
        <h1 className="text-2xl font-semibold tracking-tight">Conflict Resolution</h1>
        <p className="text-sm text-muted-foreground">จัดการ OTA jobs ที่ล้มเหลว และ items ใน Dead Letter Queue</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Active Failures</p>
          <p className="text-2xl font-bold text-destructive">{pendingFailures.length}</p>
          <p className="text-xs text-muted-foreground">ยังไม่ถูก move ไป DLQ</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Dead Letter Queue</p>
          <p className="text-2xl font-bold text-amber-600">{unresolved.length}</p>
          <p className="text-xs text-muted-foreground">ยังไม่ถูก resolve</p>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Resolved</p>
          <p className="text-2xl font-bold text-green-600">{resolved.length}</p>
          <p className="text-xs text-muted-foreground">แก้ไขแล้ว</p>
        </div>
      </div>

      {pendingFailures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Active Failures
            </CardTitle>
            <CardDescription>OTA jobs ที่ล้มเหลว — ยังพอ retry ได้ก่อนถูก move ไป Dead Letter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingFailures.map((job: any) => (
                <div key={job.id} className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="destructive">{job.status}</Badge>
                        <span className="text-sm font-medium capitalize">{job.provider}</span>
                        <Badge variant="outline">{job.type}</Badge>
                      </div>
                      {job.error && <p className="text-xs text-muted-foreground mt-1 font-mono">{job.error}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.attempts} attempts · {new Date(job.updated_at).toLocaleString('th-TH')}
                      </p>
                    </div>
                    <ResolveButton dlqId={job.id} hotelId={hotelId} sourceId={job.id} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            Dead Letter Queue
          </CardTitle>
          <CardDescription>Jobs ที่ถูก move มา DLQ หลังจาก retry ครบแล้ว — ต้องแก้ปัญหา root cause ก่อน resolve</CardDescription>
        </CardHeader>
        <CardContent>
          {unresolved.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="ไม่มีรายการใน DLQ" description="ไม่มี OTA job ที่ค้างใน dead letter queue" />
          ) : (
            <div className="space-y-3">
              {unresolved.map((item: any) => (
                <div key={item.id} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="warning">{item.source_provider || 'unknown'}</Badge>
                        <span className="text-xs text-muted-foreground font-mono">{item.source_id?.slice(0, 8)}</span>
                      </div>
                      <p className="text-sm text-destructive">{item.failure_reason}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.attempts} attempts · moved {new Date(item.moved_at).toLocaleString('th-TH')}
                      </p>
                      {item.payload && Object.keys(item.payload).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Payload</summary>
                          <pre className="mt-1 text-xs bg-muted/50 rounded p-2 overflow-x-auto">{JSON.stringify(item.payload, null, 2)}</pre>
                        </details>
                      )}
                    </div>
                    <ResolveButton dlqId={item.id} hotelId={hotelId} sourceId={item.source_id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {resolved.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Resolved ({resolved.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolved.slice(0, 10).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl border bg-muted/30 p-3 text-sm">
                  <div>
                    <span className="font-medium capitalize">{item.source_provider || 'unknown'}</span>
                    <span className="ml-2 text-muted-foreground">· {item.failure_reason?.slice(0, 60)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{new Date(item.resolved_at).toLocaleDateString('th-TH')}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
