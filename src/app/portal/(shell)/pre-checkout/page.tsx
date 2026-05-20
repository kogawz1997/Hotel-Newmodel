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
      color: 'text-blue-600',
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
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/95 dark:bg-background/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <Link href="/portal/stay"
            className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground">Express Check-out</p>
            <p className="text-[10px] text-muted-foreground">ขั้นตอนการเช็คเอาท์</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 pb-24 max-w-screen-sm mx-auto space-y-3">

        {/* Reservation summary */}
        {res && (
          <div className="rounded-2xl border border-gray-100 dark:border-border/60 bg-white dark:bg-card p-4 flex items-center gap-3 shadow-sm">
            <CheckCircle2 className="h-9 w-9 text-emerald-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">{hotel.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                เช็คเอาท์: <strong>{res.check_out}</strong>
                {(res.rooms as any)?.room_number && ` · ห้อง ${(res.rooms as any).room_number}`}
              </p>
            </div>
            {outstanding > 0 && (
              <span className="text-sm font-bold text-red-500 shrink-0">
                ฿{Number(outstanding).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* Steps */}
        <div className="space-y-2.5">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="flex gap-3.5 rounded-2xl border border-gray-100 dark:border-border/60 bg-white dark:bg-card p-4 shadow-sm">
                <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <Icon className={`h-4.5 w-4.5 ${s.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 pt-1">
          <Link href="/portal/folio"
            className="flex-1 text-center py-3 rounded-2xl border border-border/60 bg-white dark:bg-card text-sm font-semibold text-foreground hover:bg-secondary transition-colors shadow-sm">
            ดูใบบัญชี
          </Link>
          {outstanding > 0 ? (
            <Link href="/portal/folio"
              className="flex-1 text-center py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm flex items-center justify-center gap-2">
              <CreditCard className="h-4 w-4" /> ชำระ
            </Link>
          ) : (
            <Link href="/portal/trips"
              className="flex-1 text-center py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm">
              ดูการจองทั้งหมด
            </Link>
          )}
        </div>

        {hotel.phone && (
          <a href={`tel:${hotel.phone}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-border/60 bg-white dark:bg-card text-sm font-semibold text-foreground shadow-sm hover:bg-secondary transition-colors">
            <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Front Desk: {hotel.phone}
          </a>
        )}
      </div>
    </div>
  );
}
