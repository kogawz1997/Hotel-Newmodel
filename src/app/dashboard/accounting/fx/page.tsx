export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, TrendingUp, Globe2 } from 'lucide-react';
import { FXClient } from './fx-client';

export default async function FXPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'accounting'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id,currency').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const thisMonth = new Date().toISOString().slice(0, 7) + '-01';
  const { data: payments } = await supabase
    .from('payments')
    .select('amount, currency, status, payment_method, exchange_rate, created_at')
    .eq('hotel_id', hotel.id)
    .gte('created_at', thisMonth)
    .eq('status', 'completed');

  const rows = payments || [];
  const byCurrency: Record<string, { count: number; amount: number; thbEquiv: number }> = {};
  rows.forEach((p: any) => {
    const cur = p.currency || hotel.currency || 'THB';
    if (!byCurrency[cur]) byCurrency[cur] = { count: 0, amount: 0, thbEquiv: 0 };
    byCurrency[cur].count++;
    byCurrency[cur].amount += Number(p.amount || 0);
    const rate = Number(p.exchange_rate || 1);
    byCurrency[cur].thbEquiv += Number(p.amount || 0) * (cur !== 'THB' ? rate : 1);
  });

  const totalTHB = Object.values(byCurrency).reduce((s, c) => s + c.thbEquiv, 0);

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="Multi-Currency Reconciliation" description="สรุปยอดและกระทบยอดหลายสกุลเงิน เดือนนี้" />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><Globe2 className="h-3.5 w-3.5" />สกุลเงินที่รับ</div>
          <div className="text-2xl font-display font-medium">{Object.keys(byCurrency).length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><DollarSign className="h-3.5 w-3.5" />รายการรวม</div>
          <div className="text-2xl font-display font-medium">{rows.length}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><TrendingUp className="h-3.5 w-3.5" />รวม (THB equiv)</div>
          <div className="text-2xl font-display font-medium">{formatCurrency(totalTHB)}</div>
        </CardContent></Card>
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">สรุปยอดแยกสกุลเงิน</CardTitle></CardHeader>
        <CardContent className="p-0">
          {Object.keys(byCurrency).length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">ยังไม่มีข้อมูล</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/40">
                {['สกุลเงิน', 'จำนวนรายการ', 'ยอดรวม', 'เทียบ THB'].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground text-xs">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {Object.entries(byCurrency).sort((a, b) => b[1].thbEquiv - a[1].thbEquiv).map(([cur, data]) => (
                  <tr key={cur} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-3 font-medium font-mono">{cur}</td>
                    <td className="px-4 py-3 text-muted-foreground">{data.count}</td>
                    <td className="px-4 py-3">{data.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })} {cur}</td>
                    <td className="px-4 py-3 font-medium text-emerald-600">{formatCurrency(data.thbEquiv)}</td>
                  </tr>
                ))}
                <tr className="bg-secondary/30 font-bold">
                  <td className="px-4 py-3" colSpan={3}>รวมทั้งสิ้น</td>
                  <td className="px-4 py-3 text-emerald-600">{formatCurrency(totalTHB)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <FXClient />
    </div>
  );
}
