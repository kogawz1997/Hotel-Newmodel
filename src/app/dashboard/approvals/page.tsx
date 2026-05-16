export const dynamic = 'force-dynamic';

import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { CheckSquare, Clock, DollarSign, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { th } from 'date-fns/locale';
import { APPROVAL_PERMISSIONS, MGMT_ROLES } from '@/lib/auth/roles';
import type { StaffRole } from '@/lib/auth/roles';

const TYPE_LABEL: Record<string, string> = {
  refund:        'คืนเงิน',
  discount:      'ส่วนลด',
  void:          'ยกเลิกรายการ',
  compensation:  'ค่าชดเชย',
  out_of_order:  'ปิดซ่อม (OOO)',
  purchasing:    'จัดซื้อ',
  leave:         'ลางาน',
  late_checkout: 'Late Checkout',
  early_checkin: 'Early Check-in',
  other:         'อื่นๆ',
};

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  escalated: 'bg-orange-100 text-orange-800',
  expired:   'bg-gray-100 text-gray-600',
};

export default async function ApprovalsPage() {
  const { profile, hotelId } = await requireDashboardRole([
    ...MGMT_ROLES,
    'front_office_manager', 'accounting_manager', 'hr_manager',
    'maintenance_manager', 'purchasing_manager',
  ] as StaffRole[]);

  const admin = createAdminClient();
  const role = profile.role as StaffRole;
  const isManager = MGMT_ROLES.includes(role);

  let query = admin
    .from('approvals')
    .select('*, requester:requested_by(full_name, role), approver:approved_by(full_name)')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (!isManager) {
    query = query.eq('requested_by', profile.id).eq('status', 'pending');
  }

  const { data: approvals } = await query;

  const pending   = (approvals ?? []).filter(a => a.status === 'pending');
  const escalated = (approvals ?? []).filter(a => a.status === 'escalated');
  const resolved  = (approvals ?? []).filter(a => ['approved','rejected'].includes(a.status));

  return (
    <div className="container max-w-5xl py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <CheckSquare className="h-6 w-6" /> ศูนย์อนุมัติ
        </h1>
        <p className="text-sm text-muted-foreground mt-1">อนุมัติ / ปฏิเสธ คำขอต่างๆ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-yellow-500" />
          <div>
            <p className="text-2xl font-bold">{pending.length}</p>
            <p className="text-xs text-muted-foreground">รอดำเนินการ</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          <div>
            <p className="text-2xl font-bold">{escalated.length}</p>
            <p className="text-xs text-muted-foreground">เกินเวลา (escalated)</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-green-500" />
          <div>
            <p className="text-2xl font-bold">{resolved.length}</p>
            <p className="text-xs text-muted-foreground">จัดการแล้ว</p>
          </div>
        </Card>
      </div>

      {/* Pending List */}
      <div>
        <h2 className="text-base font-semibold mb-3">รอการอนุมัติ {pending.length > 0 && `(${pending.length})`}</h2>
        <Card className="overflow-hidden divide-y divide-border">
          {pending.length === 0 ? (
            <EmptyState icon={CheckSquare} title="ไม่มีรายการรอ" description="ขณะนี้ไม่มีคำขออนุมัติที่รอดำเนินการ" />
          ) : pending.map(approval => (
            <div key={approval.id} className="p-4 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{approval.title}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[approval.status]}`}>
                    {TYPE_LABEL[approval.type] ?? approval.type}
                  </span>
                </div>
                {approval.description && (
                  <p className="text-xs text-muted-foreground mt-1">{approval.description}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  ขอโดย: {(approval.requester as any)?.full_name ?? '—'} •{' '}
                  {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true, locale: th })}
                </p>
                {approval.amount && (
                  <p className="text-sm font-semibold text-primary mt-1">
                    {approval.amount.toLocaleString()} {approval.currency}
                  </p>
                )}
              </div>
              {isManager && (
                <div className="flex gap-2 shrink-0">
                  <form action={`/api/approvals/${approval.id}/resolve`} method="POST">
                    <input type="hidden" name="decision" value="approved" />
                    <button type="submit" className="px-3 py-1.5 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors">
                      อนุมัติ
                    </button>
                  </form>
                  <form action={`/api/approvals/${approval.id}/resolve`} method="POST">
                    <input type="hidden" name="decision" value="rejected" />
                    <button type="submit" className="px-3 py-1.5 rounded-md bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200 transition-colors">
                      ปฏิเสธ
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </Card>
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h2 className="text-base font-semibold mb-3">จัดการแล้ว</h2>
          <Card className="overflow-hidden divide-y divide-border">
            {resolved.map(approval => (
              <div key={approval.id} className="p-4 flex items-center gap-3 opacity-70">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[approval.status]}`}>
                  {approval.status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}
                </span>
                <span className="text-sm">{approval.title}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {formatDistanceToNow(new Date(approval.created_at), { addSuffix: true, locale: th })}
                </span>
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}
