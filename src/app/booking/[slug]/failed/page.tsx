import Link from 'next/link';
import { XCircle, RefreshCw, Phone, ArrowLeft } from 'lucide-react';

export default async function BookingFailedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const { slug } = await params;
  const { reason } = await searchParams;

  const REASONS: Record<string, string> = {
    card_declined:     'บัตรเครดิตถูกปฏิเสธ — กรุณาตรวจสอบยอดเงินหรือลองบัตรอื่น',
    insufficient_funds:'ยอดเงินในบัญชีไม่เพียงพอ',
    expired_card:      'บัตรเครดิตหมดอายุ',
    invalid_cvc:       'รหัส CVV ไม่ถูกต้อง',
    payment_timeout:   'หมดเวลาการชำระเงิน กรุณาลองใหม่อีกครั้ง',
    secure_failed:     'การยืนยัน 3D Secure ล้มเหลว',
  };

  const reasonText = reason ? (REASONS[reason] || reason) : null;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <nav className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Link href="/" className="font-serif text-xl font-medium text-[#2A2522]">🪷 Maitri</Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">
        {/* Error header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-red-50 border-4 border-red-100 mb-5">
            <XCircle className="h-10 w-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#2A2522] mb-1">ชำระเงินไม่สำเร็จ</h1>
          <p className="text-[#2A2522]/50 text-sm">ไม่สามารถดำเนินการชำระเงินได้ในขณะนี้</p>
        </div>

        {/* Reason card */}
        <div className="bg-white rounded-2xl border border-red-100 p-5 mb-5">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 bg-red-50 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <p className="font-semibold text-[#2A2522] mb-1">สาเหตุ</p>
              <p className="text-sm text-[#2A2522]/60">
                {reasonText || 'เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง'}
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
          <p className="font-semibold text-amber-800 text-sm mb-3">💡 สิ่งที่ควรตรวจสอบ</p>
          <ul className="space-y-2 text-xs text-amber-800/80">
            <li>• ตรวจสอบว่ายอดเงินในบัญชีเพียงพอ</li>
            <li>• ตรวจสอบวันหมดอายุและรหัส CVV ของบัตร</li>
            <li>• ลองใช้บัตรใบอื่นหรือวิธีชำระเงินอื่น</li>
            <li>• ติดต่อธนาคารหากปัญหายังคงอยู่</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href={`/booking/${slug}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-xl text-sm font-bold transition-colors">
            <RefreshCw className="h-4 w-4" /> ลองชำระเงินอีกครั้ง
          </Link>
          <Link href="/portal/bookings"
            className="flex items-center justify-center gap-2 w-full py-3 border border-black/10 bg-white rounded-xl text-sm font-medium text-[#2A2522] hover:bg-[#FAF7F2] transition-colors">
            ไปที่รายการจองของฉัน
          </Link>
          <a href="tel:+66-2-000-0000"
            className="flex items-center justify-center gap-2 w-full py-3 text-sm text-[#2A2522]/50 hover:text-[#2A2522] transition-colors">
            <Phone className="h-4 w-4" /> ติดต่อฝ่ายสนับสนุน
          </a>
        </div>
      </main>
    </div>
  );
}
