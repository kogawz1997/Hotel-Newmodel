export const dynamic = 'force-dynamic';

import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { AlertTriangle, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const BUCKET_CONFIG = [
  { key: 'current', label: 'ยังไม่ถึงกำหนด', color: 'bg-green-100 text-green-800',  bar: 'bg-green-400' },
  { key: '1_30',    label: '1–30 วัน',        color: 'bg-yellow-100 text-yellow-800', bar: 'bg-yellow-400' },
  { key: '31_60',   label: '31–60 วัน',       color: 'bg-orange-100 text-orange-700', bar: 'bg-orange-400' },
  { key: '61_90',   label: '61–90 วัน',       color: 'bg-red-100 text-red-700',       bar: 'bg-red-400' },
  { key: 'over_90', label: '90+ วัน',         color: 'bg-red-200 text-red-900',       bar: 'bg-red-600' },
] as const;

export default async function ARAgingPage() {
  const { hotelId } = await requireDashboardRole([
    'owner', 'admin', 'manager', 'accounting_manager', 'accounting', 'accounting_staff',
  ]);

  const admin  = createAdminClient();
  const asOf   = new Date().toISOString().split('T')[0];
  const asOfDate = new Date(asOf);

  const { data: folios } = await admin
    .from('folios')
    .select('id, reservation_id, balance, created_at, reservations(reservation_code, guests(first_name, last_name))')
    .eq('hotel_id', hotelId)
    .eq('status', 'open')
    .gt('balance', 0)
    .order('created_at', { ascending: true });

  type Bucket = 'current' | '1_30' | '31_60' | '61_90' | 'over_90';
  const buckets: Record<Bucket, { count: number; amount: number; items: any[] }> = {
    current: { count: 0, amount: 0, items: [] },
    '1_30':  { count: 0, amount: 0, items: [] },
    '31_60': { count: 0, amount: 0, items: [] },
    '61_90': { count: 0, amount: 0, items: [] },
    over_90: { count: 0, amount: 0, items: [] },
  };

  for (const folio of folios ?? []) {
    const days = Math.floor((asOfDate.getTime() - new Date(folio.created_at).getTime()) / 864e5);
    const key: Bucket = days <= 0 ? 'current' : days <= 30 ? '1_30' : days <= 60 ? '31_60' : days <= 90 ? '61_90' : 'over_90';
    const guest = (folio.reservations as any)?.guests;
    buckets[key].count++;
    buckets[key].amount += Number(folio.balance);
    buckets[key].items.push({
      code: (folio.reservations as any)?.reservation_code ?? '-',
      guest: guest ? `${guest.first_name ?? ''} ${guest.last_name ?? ''}`.trim() : 'ไม่ระบุ',
      balance: Number(folio.balance),
      days,
      createdAt: folio.created_at,
    });
  }

  const totalAmount = Object.values(buckets).reduce((s, b) => s + b.amount, 0);
  const overdueAmount = buckets['1_30'].amount + buckets['31_60'].amount + buckets['61_90'].amount + buckets.over_90.amount;

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TrendingUp className="w-6 h-6" /> AR Aging Report
        </h1>
        <p className="text-muted-foreground text-sm">ณ วันที่ {format(asOfDate, 'dd/MM/yyyy')} — ลูกหนี้ค้างชำระทั้งหมด</p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">ยอดค้างชำระรวม</div>
            <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
            <div className="text-xs text-muted-foreground">{(folios ?? []).length} รายการ</div>
          </CardContent>
        </Card>
        <Card className={overdueAmount > 0 ? 'border-red-300' : ''}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">เกินกำหนด</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</div>
            <div className="text-xs text-muted-foreground">
              {totalAmount > 0 ? Math.round((overdueAmount / totalAmount) * 100) : 0}% ของทั้งหมด
            </div>
          </CardContent>
        </Card>
        <Card className={buckets['61_90'].amount + buckets.over_90.amount > 0 ? 'border-red-400' : ''}>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-3 h-3 text-red-500" />เกิน 60 วัน</div>
            <div className="text-2xl font-bold text-red-700">{formatCurrency(buckets['61_90'].amount + buckets.over_90.amount)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground">ยังไม่ถึงกำหนด</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(buckets.current.amount)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Aging bar chart */}
      <Card>
        <CardHeader><CardTitle className="text-base">การกระจายตามอายุหนี้</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {BUCKET_CONFIG.map(({ key, label, color, bar }) => {
            const b = buckets[key as Bucket];
            const pct = totalAmount > 0 ? (b.amount / totalAmount) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs w-32 shrink-0">{label}</span>
                <div className="flex-1 bg-muted rounded-full h-3">
                  <div className={`${bar} h-3 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-right w-28 shrink-0">{formatCurrency(b.amount)}</span>
                <Badge className={`text-xs ${color} shrink-0`}>{b.count} รายการ</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Detail tables per bucket */}
      {BUCKET_CONFIG.filter(({ key }) => buckets[key as Bucket].items.length > 0).map(({ key, label, color }) => (
        <Card key={key}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              {label}
              <Badge className={`text-xs ${color}`}>{buckets[key as Bucket].count} รายการ</Badge>
              <span className="text-sm font-normal text-muted-foreground ml-auto">{formatCurrency(buckets[key as Bucket].amount)}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-xs text-muted-foreground">
                    <th className="text-left py-1 pr-4">Reservation</th>
                    <th className="text-left py-1 pr-4">แขก</th>
                    <th className="text-right py-1 pr-4">ยอดค้าง</th>
                    <th className="text-right py-1">วันที่เปิด</th>
                  </tr>
                </thead>
                <tbody>
                  {buckets[key as Bucket].items.map((item: any, i: number) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1.5 pr-4 font-mono text-xs">{item.code}</td>
                      <td className="py-1.5 pr-4">{item.guest}</td>
                      <td className="py-1.5 pr-4 text-right font-medium">{formatCurrency(item.balance)}</td>
                      <td className="py-1.5 text-right text-muted-foreground text-xs">
                        {format(new Date(item.createdAt), 'dd/MM/yy')}
                        {item.days > 0 && <span className="ml-1 text-red-500">({item.days}d)</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}

      {(folios ?? []).length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          ไม่มียอดค้างชำระ ✓
        </div>
      )}
    </div>
  );
}
