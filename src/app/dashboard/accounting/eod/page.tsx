export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { EODCloseButton } from './eod-close-button';

export default async function EODPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'accounting']);
  const { data: hotel } = await supabase.from('hotels').select('id,currency').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const today = new Date().toISOString().slice(0, 10);
  const todayStart = today + 'T00:00:00.000Z';
  const todayEnd   = today + 'T23:59:59.999Z';

  const [payments, checkIns, checkOuts, noShows, walkIns] = await Promise.all([
    supabase.from('payments').select('amount,payment_method,status').eq('hotel_id', hotel.id).gte('created_at', todayStart).lte('created_at', todayEnd),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_in', today).in('status', ['checked_in', 'checked_out']),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_out', today).eq('status', 'checked_out'),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_in', today).eq('status', 'no_show'),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).eq('check_in', today).eq('source', 'walk_in'),
  ]);

  const pmts = payments.data || [];
  const completed = pmts.filter((p: any) => p.status === 'completed');
  const totalCash = completed.filter((p: any) => p.payment_method === 'cash').reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalCard = completed.filter((p: any) => ['credit_card', 'debit_card'].includes(p.payment_method)).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalOnline = completed.filter((p: any) => ['online', 'promptpay', 'truemoney'].includes(p.payment_method)).reduce((s: number, p: any) => s + Number(p.amount), 0);
  const totalRevenue = totalCash + totalCard + totalOnline;
  const pending = pmts.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + Number(p.amount), 0);

  const rows = [
    { label: 'เงินสด (Cash)', value: totalCash, color: 'text-emerald-600' },
    { label: 'บัตรเครดิต/เดบิต', value: totalCard, color: 'text-blue-600' },
    { label: 'Online / PromptPay', value: totalOnline, color: 'text-violet-600' },
  ];

  return (
    <div className="container max-w-3xl py-8 animate-fade-in">
      <TopBar title="ปิดยอดประจำวัน" description={`End-of-Day Report · ${today}`} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'เช็คอินวันนี้', value: String(checkIns.count || 0) + ' ห้อง' },
          { label: 'เช็คเอาท์วันนี้', value: String(checkOuts.count || 0) + ' ห้อง' },
          { label: 'No-Show', value: String(noShows.count || 0) + ' ห้อง' },
          { label: 'Walk-in', value: String(walkIns.count || 0) + ' ห้อง' },
        ].map(({ label, value }) => (
          <Card key={label}><CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">{label}</p>
            <p className="text-xl font-display font-medium">{value}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-sm">ยอดรับชำระวันนี้</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rows.map(r => (
              <div key={r.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <span className="text-sm text-muted-foreground">{r.label}</span>
                <span className={`font-medium text-sm ${r.color}`}>{formatCurrency(r.value)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 font-bold">
              <span>รวมทั้งสิ้น</span>
              <span className="text-lg text-emerald-600">{formatCurrency(totalRevenue)}</span>
            </div>
            {pending > 0 && (
              <div className="flex items-center justify-between text-amber-600 text-sm">
                <span>รอชำระ (Pending)</span>
                <span>{formatCurrency(pending)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EODCloseButton hotelId={hotel.id} date={today} totalRevenue={totalRevenue} />
    </div>
  );
}
