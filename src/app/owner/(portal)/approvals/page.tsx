export const dynamic = 'force-dynamic';
/**
 * /owner/approvals — Executive approval center for hotel_owner / general_manager.
 * Mirrors /dashboard/approvals but restricted to owner roles and shows all types.
 */
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckSquare, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';

const TYPE_LABEL: Record<string, string> = {
  refund: 'คืนเงิน', discount: 'ส่วนลด', void: 'ยกเลิกรายการ',
  compensation: 'ค่าชดเชย', out_of_order: 'ปิดซ่อม (OOO)', purchasing: 'จัดซื้อ',
  leave: 'ลางาน', late_checkout: 'Late Checkout', early_checkin: 'Early Check-in', other: 'อื่นๆ',
};

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  escalated: 'bg-orange-100 text-orange-800',
  expired:   'bg-gray-100 text-gray-600',
};

export default async function OwnerApprovalsPage() {
  const { hotelId } = await requireDashboardRole(['owner', 'hotel_owner', 'general_manager']);
  const admin = createAdminClient();

  const [pendingResult, resolvedResult] = await Promise.all([
    admin.from('approvals')
      .select('*, requester:requested_by(full_name, role), approver:approved_by(full_name)')
      .eq('hotel_id', hotelId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })
      .limit(50),
    admin.from('approvals')
      .select('*, requester:requested_by(full_name, role), approver:approved_by(full_name)')
      .eq('hotel_id', hotelId)
      .in('status', ['approved', 'rejected', 'escalated'])
      .order('resolved_at', { ascending: false })
      .limit(20),
  ]);

  const pending  = pendingResult.data  ?? [];
  const resolved = resolvedResult.data ?? [];

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><CheckSquare className="w-6 h-6" /> ศูนย์อนุมัติ (Executive)</h1>
        <p className="text-muted-foreground text-sm">รายการทั้งหมดที่รอการอนุมัติจากเจ้าของ / ผู้จัดการทั่วไป</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">รออนุมัติ</div>
            <div className="text-3xl font-bold text-orange-600">{pending.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">อนุมัติแล้ว (ล่าสุด)</div>
            <div className="text-3xl font-bold text-green-600">{resolved.filter((r: any) => r.status === 'approved').length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">รออนุมัติ</CardTitle></CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <EmptyState icon={CheckSquare} title="ไม่มีรายการรออนุมัติ" />
          ) : (
            <div className="space-y-4">
              {pending.map((approval: any) => (
                <div key={approval.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{TYPE_LABEL[approval.type] ?? approval.type}</div>
                      <div className="text-sm text-muted-foreground">
                        {(approval.requester as any)?.full_name ?? '-'} · {(approval.requester as any)?.role ?? ''}
                      </div>
                      {approval.note && <div className="text-sm mt-1">{approval.note}</div>}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(approval.requested_at), { addSuffix: true, locale: th })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <form action={`/api/approvals/${approval.id}/resolve`} method="POST">
                      <input type="hidden" name="decision" value="approved" />
                      <button type="submit" className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700">อนุมัติ</button>
                    </form>
                    <form action={`/api/approvals/${approval.id}/resolve`} method="POST">
                      <input type="hidden" name="decision" value="rejected" />
                      <button type="submit" className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">ปฏิเสธ</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">ประวัติการอนุมัติล่าสุด</CardTitle></CardHeader>
        <CardContent>
          {resolved.length === 0 ? (
            <p className="text-sm text-muted-foreground">ยังไม่มีประวัติ</p>
          ) : (
            <div className="space-y-2">
              {resolved.map((a: any) => (
                <div key={a.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div>
                    <span className="font-medium">{TYPE_LABEL[a.type] ?? a.type}</span>
                    <span className="text-muted-foreground ml-2">· {(a.requester as any)?.full_name ?? '-'}</span>
                  </div>
                  <Badge className={`text-xs ${STATUS_BADGE[a.status] ?? ''}`}>{a.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
