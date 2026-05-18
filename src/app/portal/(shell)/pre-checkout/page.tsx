export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ArrowLeft, Clock, CreditCard, BaggageClaim, Star, Phone, KeyRound, CheckCircle2 } from 'lucide-react';

export default async function PreCheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/pre-checkout');

  const { data: res } = await supabase
    .from('reservations')
    .select(`
      reservation_code, check_out, total_amount, paid_amount, payment_status,
      hotels(name, check_out_time, phone, currency),
      rooms(room_number, floor),
      room_types(name)
    `)
    .eq('guest_account_id', user.id)
    .eq('status', 'checked_in')
    .order('check_out', { ascending: true })
    .limit(1)
    .maybeSingle();

  const hotel = (res?.hotels as any) || {};
  const outstanding = res ? Math.max(0, Number(res.total_amount) - Number(res.paid_amount)) : 0;

  const STEPS = [
    {
      icon: Clock,
      title: `เช็คเอาท์ก่อน ${hotel.check_out_time || '12:00'} น.`,
      desc: 'กรุณาออกจากห้องพักก่อนเวลาเช็คเอาท์ หากต้องการขยายเวลากรุณาติดต่อ Front Desk',
      color: 'text-amber-600',
    },
    {
      icon: KeyRound,
      title: 'คืนกุญแจห้อง',
      desc: 'นำกุญแจ/คีย์การ์ดทุกใบคืนที่ Front Desk หรือหย่อนในกล่องรับคืนกุญแจ',
      color: 'text-blue-600',
    },
    {
      icon: BaggageClaim,
      title: 'ตรวจสอบทรัพย์สิน',
      desc: 'ตรวจสอบทรัพย์สินของท่านก่อนออกจากห้อง — ตู้เย็น ตู้เสื้อผ้า ห้องน้ำ และ safe box',
      color: 'text-purple-600',
    },
    {
      icon: CreditCard,
      title: 'ชำระยอดค้าง',
      desc: outstanding > 0
        ? `มียอดค้างชำระ ${Number(outstanding).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ${hotel.currency || 'THB'} กรุณาชำระที่ Front Desk`
        : 'ยอดชำระครบถ้วนแล้ว ✓',
      color: outstanding > 0 ? 'text-red-600' : 'text-emerald-600',
    },
    {
      icon: Star,
      title: 'แจ้งความคิดเห็น',
      desc: 'หากมีข้อเสนอแนะหรือความคิดเห็น กรุณาแจ้ง Front Desk หรือกรอกแบบสอบถามออนไลน์',
      color: 'text-yellow-600',
    },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/portal/stay" className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="กลับ">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-semibold">Pre-Checkout Briefing</h1>
          <p className="text-xs text-muted-foreground">ขั้นตอนการเช็คเอาท์</p>
        </div>
      </div>

      {res && (
        <div className="mb-5 rounded-xl border border-border bg-card p-4 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-medium text-sm">{hotel.name}</p>
            <p className="text-xs text-muted-foreground">เช็คเอาท์: <strong>{res.check_out}</strong> · รหัส: <span className="font-mono">{res.reservation_code}</span></p>
            {(res.rooms as any)?.room_number && (
              <p className="text-xs text-muted-foreground">ห้อง {(res.rooms as any).room_number}</p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-4">
              <div className="shrink-0 mt-0.5">
                <Icon className={`h-5 w-5 ${s.color}`} aria-hidden="true" />
              </div>
              <div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {hotel.phone && (
        <a
          href={`tel:${hotel.phone}`}
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-border bg-card py-3 text-sm font-medium hover:bg-secondary transition-colors"
          aria-label={`โทรหา ${hotel.name}`}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          โทร Front Desk: {hotel.phone}
        </a>
      )}

      <div className="mt-4 flex gap-3">
        <Link
          href="/portal/folio"
          className="flex-1 text-center rounded-xl border border-border py-3 text-sm font-medium hover:bg-secondary transition-colors"
        >
          ดูใบบัญชี Folio
        </Link>
        {outstanding === 0 && (
          <Link
            href="/portal/trips"
            className="flex-1 text-center rounded-xl bg-primary text-primary-foreground py-3 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            ดูการจองทั้งหมด
          </Link>
        )}
      </div>
    </div>
  );
}
