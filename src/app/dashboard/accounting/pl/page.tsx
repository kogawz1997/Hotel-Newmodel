export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, DollarSign, Receipt, Building2, Users } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { th } from 'date-fns/locale';

export default async function PLPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager']);
  const { data: hotel } = await supabase.from('hotels').select('id,currency').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = subMonths(new Date(), 5 - i);
    return { label: format(d, 'MMM yyyy', { locale: th }), start: startOfMonth(d).toISOString(), end: endOfMonth(d).toISOString() };
  });

  const monthData = await Promise.all(months.map(async m => {
    const [rev, expenses] = await Promise.all([
      supabase.from('payments').select('amount').eq('hotel_id', hotel.id).eq('status', 'completed').gte('created_at', m.start).lte('created_at', m.end),
      supabase.from('expenses').select('amount').eq('hotel_id', hotel.id).gte('created_at', m.start).lte('created_at', m.end),
    ]);
    const revenue = (rev.data || []).reduce((s: number, p: any) => s + Number(p.amount), 0);
    const expense = ((expenses as any).data || []).reduce((s: number, e: any) => s + Number(e.amount), 0);
    return { label: m.label, revenue, expense, profit: revenue - expense };
  }));

  const totalRevenue = monthData.reduce((s, m) => s + m.revenue, 0);
  const totalExpense = monthData.reduce((s, m) => s + m.expense, 0);
  const totalProfit = totalRevenue - totalExpense;
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="P&L Statement" description="กำไร-ขาดทุน รายได้ vs ค่าใช้จ่าย 6 เดือนล่าสุด" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { icon: DollarSign, label: 'รายได้รวม', value: formatCurrency(totalRevenue), color: 'text-emerald-600' },
          { icon: Receipt, label: 'ค่าใช้จ่ายรวม', value: formatCurrency(totalExpense), color: 'text-red-500' },
          { icon: totalProfit >= 0 ? TrendingUp : TrendingDown, label: 'กำไรสุทธิ', value: formatCurrency(totalProfit), color: totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600' },
          { icon: Building2, label: 'Profit Margin', value: `${margin.toFixed(1)}%`, color: margin >= 20 ? 'text-emerald-600' : margin >= 10 ? 'text-amber-600' : 'text-red-600' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}><CardContent className="p-5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5"><Icon className="h-3.5 w-3.5" />{label}</div>
            <div className={`text-2xl font-display font-medium ticker ${color}`}>{value}</div>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-sm">รายเดือน (6 เดือนล่าสุด)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/40">
                {['เดือน', 'รายได้', 'ค่าใช้จ่าย', 'กำไร', 'Margin'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {monthData.map(m => (
                  <tr key={m.label} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                    <td className="px-4 py-3 font-medium">{m.label}</td>
                    <td className="px-4 py-3 text-emerald-600">{formatCurrency(m.revenue)}</td>
                    <td className="px-4 py-3 text-red-500">{formatCurrency(m.expense)}</td>
                    <td className={`px-4 py-3 font-medium ${m.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(m.profit)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{m.revenue > 0 ? ((m.profit / m.revenue) * 100).toFixed(1) + '%' : '—'}</td>
                  </tr>
                ))}
                <tr className="bg-secondary/50 font-medium">
                  <td className="px-4 py-3">รวม</td>
                  <td className="px-4 py-3 text-emerald-600">{formatCurrency(totalRevenue)}</td>
                  <td className="px-4 py-3 text-red-500">{formatCurrency(totalExpense)}</td>
                  <td className={`px-4 py-3 ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(totalProfit)}</td>
                  <td className="px-4 py-3">{margin.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
