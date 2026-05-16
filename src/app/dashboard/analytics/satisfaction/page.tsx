export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, TrendingUp, TrendingDown, MessageSquare } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';
import { SatisfactionChart } from './satisfaction-chart';

export default async function SatisfactionPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager']);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return { label: format(d, 'MMM', { locale: th }), start: startOfMonth(d).toISOString(), end: endOfMonth(d).toISOString() };
  });

  const trendData = await Promise.all(months.map(async m => {
    const { data } = await supabase
      .from('reviews')
      .select('overall_rating, clean_rating, service_rating, location_rating, value_rating')
      .eq('hotel_id', hotel.id)
      .gte('created_at', m.start)
      .lte('created_at', m.end);
    const rows = data || [];
    if (rows.length === 0) return { label: m.label, avg: 0, count: 0 };
    const avg = rows.reduce((s, r) => s + Number(r.overall_rating), 0) / rows.length;
    return { label: m.label, avg: Number(avg.toFixed(2)), count: rows.length };
  }));

  const allReviews = await supabase.from('reviews').select('overall_rating, clean_rating, service_rating, location_rating, value_rating').eq('hotel_id', hotel.id).gte('created_at', months[0].start);
  const reviews = allReviews.data || [];
  const overall = reviews.length > 0 ? reviews.reduce((s, r) => s + Number(r.overall_rating), 0) / reviews.length : 0;
  const categories = ['clean_rating', 'service_rating', 'location_rating', 'value_rating'] as const;
  const labels: Record<string, string> = { clean_rating: 'ความสะอาด', service_rating: 'บริการ', location_rating: 'ทำเล', value_rating: 'คุ้มค่า' };

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="Guest Satisfaction" description="แนวโน้มความพึงพอใจแขก 6 เดือนล่าสุด" />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />คะแนนรวม</div>
          <div className="text-3xl font-display font-medium text-amber-500">{overall.toFixed(1)}</div>
          <div className="text-xs text-muted-foreground">จาก {reviews.length} รีวิว</div>
        </CardContent></Card>
        {categories.map(cat => {
          const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + Number((r as any)[cat] || 0), 0) / reviews.length : 0;
          return (
            <Card key={cat}><CardContent className="p-4">
              <div className="text-xs text-muted-foreground mb-1">{labels[cat]}</div>
              <div className="text-2xl font-display font-medium">{avg.toFixed(1)}</div>
              <div className="h-1.5 bg-secondary rounded-full mt-1.5 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${(avg / 5) * 100}%` }} />
              </div>
            </CardContent></Card>
          );
        })}
      </div>

      <SatisfactionChart data={trendData} />
    </div>
  );
}
