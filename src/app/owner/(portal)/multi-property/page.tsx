export const dynamic = 'force-dynamic';

import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BedDouble, DollarSign, Users, AlertTriangle, TrendingUp, Building2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface HotelKPI {
  id: string;
  name: string;
  total_rooms: number;
  occupied: number;
  revenue_month: number;
  arrivals_today: number;
  pending_approvals: number;
  open_issues: number;
}

export default async function MultiPropertyPage() {
  const { profile } = await requireDashboardRole(['owner', 'hotel_owner', 'general_manager']);

  const admin = createAdminClient();
  const now   = new Date();
  const today = now.toISOString().slice(0, 10);
  const monthStart = `${now.toISOString().slice(0, 7)}-01T00:00:00.000Z`;

  // Fetch all hotels in this owner's organization
  const { data: hotels } = await admin
    .from('hotels')
    .select('id, name, city, country')
    .eq('organization_id', (profile as any).organization_id)
    .order('name');

  if (!hotels || hotels.length === 0) {
    return (
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6" /> Multi-Property Dashboard
          </h1>
        </div>
        <Card>
          <CardContent className="py-16 text-center text-muted-foreground">
            ไม่พบโรงแรมในองค์กรนี้
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch KPIs for all hotels in parallel
  const kpis: HotelKPI[] = await Promise.all(
    hotels.map(async (hotel) => {
      const [
        roomsTotal,
        roomsOccupied,
        arrivalsToday,
        revenueMonth,
        pendingApprovals,
        openIssues,
      ] = await Promise.all([
        admin.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id),
        admin.from('rooms').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'occupied'),
        admin.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_in', today).in('status', ['confirmed', 'pending']),
        admin.from('payments').select('amount').eq('hotel_id', hotel.id).eq('status', 'completed').gte('created_at', monthStart),
        admin.from('approvals').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('status', 'pending'),
        admin.from('work_orders').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).in('status', ['open', 'in_progress']),
      ]);

      const revenue = (revenueMonth.data ?? []).reduce((s: number, p: any) => s + Number(p.amount || 0), 0);

      return {
        id:                hotel.id,
        name:              hotel.name,
        total_rooms:       roomsTotal.count ?? 0,
        occupied:          roomsOccupied.count ?? 0,
        revenue_month:     revenue,
        arrivals_today:    arrivalsToday.count ?? 0,
        pending_approvals: pendingApprovals.count ?? 0,
        open_issues:       openIssues.count ?? 0,
      };
    })
  );

  const totalRevenue   = kpis.reduce((s, k) => s + k.revenue_month, 0);
  const totalOccupied  = kpis.reduce((s, k) => s + k.occupied, 0);
  const totalRooms     = kpis.reduce((s, k) => s + k.total_rooms, 0);
  const avgOccupancy   = totalRooms > 0 ? Math.round((totalOccupied / totalRooms) * 100) : 0;
  const totalPending   = kpis.reduce((s, k) => s + k.pending_approvals, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Building2 className="w-6 h-6" /> Multi-Property Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          {format(now, 'EEEE d MMMM yyyy', { locale: th })} • {hotels.length} โรงแรม
        </p>
      </div>

      {/* Portfolio summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <Building2 className="w-3 h-3" /> จำนวนโรงแรม
            </div>
            <div className="text-3xl font-bold">{hotels.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <BedDouble className="w-3 h-3" /> Occupancy รวม
            </div>
            <div className="text-3xl font-bold">{avgOccupancy}%</div>
            <div className="text-xs text-muted-foreground">{totalOccupied}/{totalRooms} ห้อง</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <DollarSign className="w-3 h-3" /> รายได้เดือนนี้ (รวม)
            </div>
            <div className="text-3xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card className={totalPending > 0 ? 'border-yellow-400' : ''}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
              <AlertTriangle className="w-3 h-3 text-yellow-500" /> รออนุมัติ
            </div>
            <div className="text-3xl font-bold text-yellow-600">{totalPending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Per-hotel cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const occupancyPct = kpi.total_rooms > 0 ? Math.round((kpi.occupied / kpi.total_rooms) * 100) : 0;
          const occupancyColor = occupancyPct >= 80 ? 'text-green-600' : occupancyPct >= 50 ? 'text-yellow-600' : 'text-red-500';

          return (
            <Card key={kpi.id} className="flex flex-col">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span className="truncate">{kpi.name}</span>
                  {kpi.pending_approvals > 0 && (
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs shrink-0 ml-2">
                      {kpi.pending_approvals} รออนุมัติ
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 flex-1">
                {/* Occupancy bar */}
                <div>
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Occupancy</span>
                    <span className={`font-medium ${occupancyColor}`}>{occupancyPct}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        occupancyPct >= 80 ? 'bg-green-500' : occupancyPct >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                      }`}
                      style={{ width: `${occupancyPct}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {kpi.occupied} / {kpi.total_rooms} ห้อง
                  </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">รายได้เดือนนี้</div>
                    <div className="font-semibold text-sm">{formatCurrency(kpi.revenue_month)}</div>
                  </div>
                  <div className="text-center border-x">
                    <div className="text-xs text-muted-foreground">เช็คอินวันนี้</div>
                    <div className="font-semibold text-sm flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" />{kpi.arrivals_today}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Work Orders</div>
                    <div className={`font-semibold text-sm ${kpi.open_issues > 0 ? 'text-orange-600' : ''}`}>
                      {kpi.open_issues}
                    </div>
                  </div>
                </div>

                {/* ADR */}
                <div className="flex items-center justify-between text-xs pt-1 border-t">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> ADR
                  </span>
                  <span className="font-medium">
                    {kpi.occupied > 0 ? formatCurrency(kpi.revenue_month / kpi.occupied) : '—'}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
