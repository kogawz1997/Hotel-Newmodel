export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Globe2, TrendingUp, BarChart3 } from 'lucide-react';
import { format, subMonths, startOfMonth } from 'date-fns';

const SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct (เว็บโรงแรม)',
  booking_com: 'Booking.com',
  agoda: 'Agoda',
  expedia: 'Expedia',
  airbnb: 'Airbnb',
  tripadvisor: 'TripAdvisor',
  walk_in: 'Walk-in',
  phone: 'โทรศัพท์',
  other: 'อื่นๆ',
};

const SOURCE_COLORS: Record<string, string> = {
  direct: 'bg-emerald-500',
  booking_com: 'bg-blue-500',
  agoda: 'bg-red-500',
  expedia: 'bg-yellow-500',
  airbnb: 'bg-rose-500',
  walk_in: 'bg-purple-500',
  phone: 'bg-cyan-500',
  other: 'bg-gray-400',
};

export default async function ChannelsPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager']);
  const { data: hotel } = await supabase.from('hotels').select('id,currency').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const sixMonthsAgo = subMonths(new Date(), 5);
  const startDate = startOfMonth(sixMonthsAgo).toISOString().slice(0, 10);

  const { data: reservations } = await supabase
    .from('reservations')
    .select('source, total_amount, status')
    .eq('hotel_id', hotel.id)
    .gte('check_in', startDate)
    .neq('status', 'cancelled');

  const rows = reservations || [];
  const channelMap: Record<string, { count: number; revenue: number }> = {};
  rows.forEach((r: any) => {
    const src = r.source || 'other';
    if (!channelMap[src]) channelMap[src] = { count: 0, revenue: 0 };
    channelMap[src].count++;
    channelMap[src].revenue += Number(r.total_amount || 0);
  });

  const channels = Object.entries(channelMap)
    .map(([src, { count, revenue }]) => ({ src, label: SOURCE_LABELS[src] || src, count, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = channels.reduce((s, c) => s + c.revenue, 0);
  const totalBookings = channels.reduce((s, c) => s + c.count, 0);

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="Channel Performance" description="เปรียบเทียบรายได้และการจองจากแต่ละช่องทาง (6 เดือน)" />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><TrendingUp className="h-3.5 w-3.5" />รายได้รวม</div>
          <div className="text-2xl font-display font-medium">{formatCurrency(totalRevenue)}</div>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><BarChart3 className="h-3.5 w-3.5" />การจองรวม</div>
          <div className="text-2xl font-display font-medium">{totalBookings.toLocaleString()} ครั้ง</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Globe2 className="h-4 w-4" />รายได้แยกตามช่องทาง</CardTitle></CardHeader>
        <CardContent>
          {channels.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-4">
              {channels.map(c => {
                const revPct = totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0;
                const bookPct = totalBookings > 0 ? (c.count / totalBookings) * 100 : 0;
                return (
                  <div key={c.src}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${SOURCE_COLORS[c.src] || 'bg-gray-400'}`} aria-hidden="true" />
                        <span className="text-sm font-medium">{c.label}</span>
                        <span className="text-xs text-muted-foreground">{c.count} จอง</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium">{formatCurrency(c.revenue)}</span>
                        <span className="text-xs text-muted-foreground ml-2">({revPct.toFixed(1)}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${SOURCE_COLORS[c.src] || 'bg-gray-400'}`}
                        style={{ width: `${revPct}%` }}
                        role="progressbar"
                        aria-valuenow={revPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${c.label}: ${revPct.toFixed(1)}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
