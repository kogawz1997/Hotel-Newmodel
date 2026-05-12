import { requireDashboardRole } from '@/lib/auth/page-guards';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

export default async function ShiftHandoverReportPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'front_desk', 'receptionist']);

  const { data: hotel } = await supabase.from('hotels').select('id, name, currency').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) return null;

  const today = new Date().toISOString().slice(0, 10);
  const [cashTx, cardTx, promptpayTx, openRes, hkPending] = await Promise.all([
    supabase.from('payments').select('amount').eq('hotel_id', hotel.id).eq('status', 'completed').eq('method', 'cash').gte('created_at', `${today}T00:00:00.000Z`).lt('created_at', `${today}T23:59:59.999Z`),
    supabase.from('payments').select('amount').eq('hotel_id', hotel.id).eq('status', 'completed').in('method', ['card', 'credit_card', 'online']).gte('created_at', `${today}T00:00:00.000Z`).lt('created_at', `${today}T23:59:59.999Z`),
    supabase.from('payments').select('amount').eq('hotel_id', hotel.id).eq('status', 'completed').eq('method', 'promptpay').gte('created_at', `${today}T00:00:00.000Z`).lt('created_at', `${today}T23:59:59.999Z`),
    supabase.from('reservations').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).in('status', ['confirmed', 'pending']),
    supabase.from('housekeeping_tasks').select('id', { count: 'exact', head: true }).eq('hotel_id', hotel.id).in('status', ['pending', 'in_progress']),
  ]);

  const sum = (rows: any[] | null | undefined) => (rows || []).reduce((s, r) => s + Number(r.amount || 0), 0);
  const cash = sum(cashTx.data);
  const card = sum(cardTx.data);
  const promptpay = sum(promptpayTx.data);
  const total = cash + card + promptpay;

  return (
    <main className="space-y-6 p-6 md:p-8">
      <section>
        <h1 className="text-2xl font-semibold">Shift Handover Report</h1>
        <p className="mt-1 text-sm text-muted-foreground">{hotel.name} · วันที่ {today}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Cash in drawer</p><p className="text-2xl font-semibold">{formatCurrency(cash, hotel.currency || 'THB')}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Card / Online</p><p className="text-2xl font-semibold">{formatCurrency(card, hotel.currency || 'THB')}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">PromptPay</p><p className="text-2xl font-semibold">{formatCurrency(promptpay, hotel.currency || 'THB')}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total shift intake</p><p className="text-2xl font-semibold">{formatCurrency(total, hotel.currency || 'THB')}</p></CardContent></Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Operations to hand over</CardTitle><CardDescription>รายการที่ต้องส่งไม้ต่อให้กะถัดไป</CardDescription></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg border p-3"><span>Open reservations</span><Badge variant="outline">{openRes.count || 0}</Badge></div>
            <div className="flex items-center justify-between rounded-lg border p-3"><span>Pending housekeeping tasks</span><Badge variant={(hkPending.count || 0) > 0 ? 'warning' : 'success'}>{hkPending.count || 0}</Badge></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Cash Count Checklist</CardTitle><CardDescription>เช็กลิสต์ก่อนส่งเวร</CardDescription></CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• นับเงินสดหน้าเคาน์เตอร์ + float cash ให้ตรงกับยอดในระบบ</p>
            <p>• ตรวจรายการค้างชำระ/มัดจำที่ยังไม่ settle</p>
            <p>• ส่งมอบ note พิเศษของแขกที่กำลัง in-house</p>
            <p>• ยืนยันงานแม่บ้านด่วนที่ยังไม่เริ่ม</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
