export const dynamic = 'force-dynamic';

import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BedDouble, TrendingUp, DollarSign, AlertTriangle, CheckSquare, Users } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

export default async function OwnerOverviewPage() {
  const { hotelId } = await requireDashboardRole(['owner', 'hotel_owner', 'general_manager']);
  const admin = createAdminClient();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = `${now.toISOString().slice(0, 7)}-01T00:00:00.000Z`;

  const [
    roomsTotal,
    roomsOccupied,
    roomsDirty,
    roomsOOO,
    arrivalsToday,
    departuresToday,
    revenueMonth,
    pendingApprovals,
    openWorkOrders,
    staffOnDuty,
  ] = await Promise.all([
    admin.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId),
    admin.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'occupied'),
    admin.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId).in('status', ['dirty', 'pending_inspection']),
    admin.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('status', 'out_of_order'),
    admin.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('check_in', today).in('status', ['confirmed', 'pending']),
    admin.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId).eq('check_out', today).eq('status', 'checked_in'),
    admin.from('payments').select('amount').eq('hotel_id', hotelId).eq('status', 'completed').gte('created_at', monthStart),
    admin.from('approvals').select('id, type, requested_at, requester:requested_by(full_name)').eq('hotel_id', hotelId).eq('status', 'pending').order('requested_at', { ascending: false }).limit(10),
    admin.from('work_orders').select('id, title, priority').eq('hotel_id', hotelId).in('status', ['open', 'in_progress']).order('created_at', { ascending: false }).limit(5),
    admin.from('attendance').select('id', { count: 'exact', head: true }).eq('hotel_id', hotelId).is('clock_out', null),
  ]);

  const total     = roomsTotal.count || 1;
  const occupied  = roomsOccupied.count || 0;
  const occupancy = Math.round((occupied / total) * 100);
  const revenue   = (revenueMonth.data || []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
  const adr       = occupied > 0 ? revenue / occupied : 0;

  const TYPE_LABEL: Record<string, string> = {
    refund: 'คืนเงิน', discount: 'ส่วนลด', void: 'ยกเลิก',
    compensation: 'ค่าชดเชย', out_of_order: 'OOO', purchasing: 'จัดซื้อ',
    leave: 'ลางาน', late_checkout: 'Late CO', early_checkin: 'Early CI', other: 'อื่นๆ',
  };

  const PRIORITY_COLOR: Record<string, string> = {
    urgent: 'bg-red-100 text-red-700',
    high:   'bg-orange-100 text-orange-700',
    normal: 'bg-blue-100 text-blue-700',
    low:    'bg-gray-100 text-gray-600',
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">ภาพรวมโรงแรม</h1>
        <p className="text-muted-foreground text-sm">{format(now, 'EEEE d MMMM yyyy')} • ข้อมูลล่าสุด</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><BedDouble className="w-4 h-4" /> Occupancy</div>
            <div className="text-3xl font-bold">{occupancy}%</div>
            <div className="text-xs text-muted-foreground">{occupied}/{total} ห้อง</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="w-4 h-4" /> รายได้เดือนนี้</div>
            <div className="text-3xl font-bold">{formatCurrency(revenue)}</div>
            <div className="text-xs text-muted-foreground">ADR {formatCurrency(adr)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><TrendingUp className="w-4 h-4" /> วันนี้</div>
            <div className="text-2xl font-bold">CI {arrivalsToday.count ?? 0} / CO {departuresToday.count ?? 0}</div>
            <div className="text-xs text-muted-foreground">เช็คอิน / เช็คเอาท์</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Users className="w-4 h-4" /> พนักงานออนดิวตี้</div>
            <div className="text-3xl font-bold">{staffOnDuty.count ?? 0}</div>
            <div className="text-xs text-muted-foreground">กำลังปฏิบัติงาน</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert row */}
      <div className="grid grid-cols-3 gap-4">
        <Card className={roomsDirty.count! > 0 ? 'border-yellow-300' : ''}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">ห้องรอทำความสะอาด</div>
            <div className="text-2xl font-semibold text-yellow-600">{roomsDirty.count ?? 0}</div>
          </CardContent>
        </Card>
        <Card className={roomsOOO.count! > 0 ? 'border-red-300' : ''}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">ห้อง OOO</div>
            <div className="text-2xl font-semibold text-red-600">{roomsOOO.count ?? 0}</div>
          </CardContent>
        </Card>
        <Card className={(pendingApprovals.data?.length ?? 0) > 0 ? 'border-orange-300' : ''}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground mb-1">รออนุมัติ</div>
            <div className="text-2xl font-semibold text-orange-600">{pendingApprovals.data?.length ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Pending Approvals */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckSquare className="w-4 h-4" /> รออนุมัติ
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(pendingApprovals.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีรายการรออนุมัติ</p>
            ) : (
              <div className="space-y-2">
                {(pendingApprovals.data ?? []).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <div>
                      <span className="font-medium">{TYPE_LABEL[a.type] ?? a.type}</span>
                      <span className="text-muted-foreground ml-2">· {(a.requester as any)?.full_name ?? '-'}</span>
                    </div>
                    <a href="/owner/approvals" className="text-xs text-blue-600 hover:underline">ดู</a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Work Orders */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> งานซ่อมบำรุงที่ยังเปิดอยู่
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(openWorkOrders.data?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">ไม่มีงานค้าง</p>
            ) : (
              <div className="space-y-2">
                {(openWorkOrders.data ?? []).map((w: any) => (
                  <div key={w.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                    <span className="font-medium truncate max-w-[200px]">{w.title}</span>
                    <Badge className={`text-xs ${PRIORITY_COLOR[w.priority] ?? PRIORITY_COLOR.normal}`}>{w.priority}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
