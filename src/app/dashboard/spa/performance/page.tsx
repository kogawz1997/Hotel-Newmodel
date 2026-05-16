export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Star, Users, DollarSign, Clock, Trophy } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';

export default async function TherapistPerformancePage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'spa_manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id,currency').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const now = new Date();
  const mStart = startOfMonth(now).toISOString();
  const mEnd = endOfMonth(now).toISOString();

  const { data: bookings } = await supabase
    .from('spa_bookings')
    .select('id, therapist_name, service_name, amount, rating, status, created_at')
    .eq('hotel_id', hotel.id)
    .gte('created_at', mStart)
    .lte('created_at', mEnd);

  const rows = bookings || [];
  const therapistMap: Record<string, { name: string; count: number; revenue: number; ratings: number[] }> = {};
  rows.forEach((b: any) => {
    const k = b.therapist_name || 'ไม่ระบุ';
    if (!therapistMap[k]) therapistMap[k] = { name: k, count: 0, revenue: 0, ratings: [] };
    therapistMap[k].count++;
    therapistMap[k].revenue += Number(b.amount || 0);
    if (b.rating) therapistMap[k].ratings.push(Number(b.rating));
  });

  const therapists = Object.values(therapistMap)
    .map(t => ({ ...t, avgRating: t.ratings.length > 0 ? t.ratings.reduce((s, r) => s + r, 0) / t.ratings.length : 0 }))
    .sort((a, b) => b.revenue - a.revenue);

  const totalRevenue = therapists.reduce((s, t) => s + t.revenue, 0);
  const totalBookings = therapists.reduce((s, t) => s + t.count, 0);

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="Therapist Performance" description={`ผลงานนักบำบัดเดือน ${format(now, 'MMMM yyyy', { locale: th })}`} />

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { icon: Users, label: 'จำนวนนักบำบัด', value: String(therapists.length) + ' คน' },
          { icon: Clock, label: 'จำนวน Bookings', value: String(totalBookings) + ' ครั้ง' },
          { icon: DollarSign, label: 'รายได้รวม', value: formatCurrency(totalRevenue) },
        ].map(({ icon: Icon, label, value }) => (
          <Card key={label}><CardContent className="p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><Icon className="h-3.5 w-3.5" />{label}</div>
            <div className="text-2xl font-display font-medium">{value}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4" />อันดับนักบำบัด</CardTitle></CardHeader>
        <CardContent className="p-0">
          {therapists.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="divide-y divide-border">
              {therapists.map((t, i) => (
                <div key={t.name} className="flex items-center gap-4 px-4 py-3">
                  <div className="w-6 text-center font-bold text-muted-foreground text-sm">{i + 1}</div>
                  <div className="h-9 w-9 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-300 flex items-center justify-center font-medium shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.count} ครั้ง</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium">{formatCurrency(t.revenue)}</p>
                    {t.avgRating > 0 && (
                      <p className="text-xs text-amber-600 flex items-center justify-end gap-0.5">
                        <Star className="h-3 w-3 fill-current" />{t.avgRating.toFixed(1)}
                      </p>
                    )}
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
