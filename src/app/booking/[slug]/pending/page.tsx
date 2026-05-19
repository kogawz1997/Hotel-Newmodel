import Link from 'next/link';
import { Clock, ArrowLeft, Calendar, Phone, RefreshCw } from 'lucide-react';
import { PromptPayPendingClient } from './PromptPayPendingClient';

export default async function BookingPendingPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ amount?: string; method?: string; reservationId?: string }>;
}) {
  const { slug } = await params;
  const { amount, method, reservationId } = await searchParams;

  if (method === 'promptpay' && reservationId && amount) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <PromptPayPendingClient
          reservationId={reservationId}
          amount={Number(amount)}
          slug={slug}
        />
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <nav className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href={`/booking/${slug}`} className="p-2 rounded-full hover:bg-black/5 transition-colors">
            <ArrowLeft className="h-4 w-4 text-[#2A2522]" />
          </Link>
          <span className="font-medium text-[#2A2522]">สถานะการชำระเงิน</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-12 space-y-5">
        {/* Status card */}
        <div className="bg-white rounded-2xl border border-black/5 p-8 text-center">
          <div className="h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="text-xl font-bold text-[#2A2522] mb-2">รอการยืนยันการชำระเงิน</h1>
          <p className="text-[#2A2522]/50 text-sm leading-relaxed">
            เรากำลังรอการยืนยันจากสถาบันการเงินของคุณ<br />กรุณารอสักครู่ อาจใช้เวลา 1–15 นาที
          </p>
          {amount && (
            <div className="mt-5 inline-block bg-[#FAF7F2] rounded-xl px-6 py-3">
              <p className="text-xs text-[#2A2522]/40 mb-0.5">ยอดที่รอการยืนยัน</p>
              <p className="text-2xl font-bold text-[#2A2522]">฿{Number(amount).toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* What to expect */}
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <h2 className="font-bold text-[#2A2522] mb-4">ขั้นตอนถัดไป</h2>
          <div className="space-y-4">
            {[
              { icon: RefreshCw, title: 'ระบบตรวจสอบอัตโนมัติ', desc: 'เราตรวจสอบสถานะทุก 30 วินาที หน้าจะอัปเดตอัตโนมัติเมื่อยืนยันสำเร็จ' },
              { icon: Calendar, title: 'อีเมลยืนยัน', desc: 'คุณจะได้รับอีเมลยืนยันการจองทันทีหลังจากการชำระเงินสำเร็จ' },
              { icon: Phone, title: 'ติดต่อธนาคาร', desc: 'หากผ่านไปเกิน 15 นาทีแล้วยังไม่ได้รับการยืนยัน กรุณาติดต่อธนาคารของคุณ' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-3">
                <div className="h-9 w-9 bg-[#FAF7F2] rounded-full flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-[#2563eb]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#2A2522]">{title}</p>
                  <p className="text-xs text-[#2A2522]/50 mt-0.5 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/portal/trips"
            className="flex-1 text-center py-3 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl font-semibold text-sm transition-colors"
          >
            ดูสถานะการจอง
          </Link>
          <Link
            href={`/booking/${slug}`}
            className="flex-1 text-center py-3 border border-black/10 hover:bg-black/5 text-[#2A2522] rounded-xl font-semibold text-sm transition-colors"
          >
            กลับไปหน้าชำระเงิน
          </Link>
        </div>

        {/* Trust note */}
        <p className="text-center text-xs text-[#2A2522]/30 px-4">
          การชำระเงินของคุณปลอดภัยและเข้ารหัสด้วยมาตรฐาน SSL · Maitri ไม่เก็บข้อมูลบัตรเครดิตของคุณ
        </p>
      </div>
    </div>
  );
}
