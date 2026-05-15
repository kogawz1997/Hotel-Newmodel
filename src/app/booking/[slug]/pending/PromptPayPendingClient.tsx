'use client';

import Link from 'next/link';
import { PromptPayQR } from '@/components/payments/PromptPayQR';
import { toast } from 'sonner';

interface Props {
  reservationId: string;
  amount: number;
  slug: string;
}

export function PromptPayPendingClient({ reservationId, amount, slug }: Props) {
  return (
    <div className="rounded-2xl border border-[#004B87]/20 bg-white p-8 shadow-sm text-center">
      <h1 className="text-xl font-bold text-[#2A2522] mb-1">ชำระเงินด้วย PromptPay</h1>
      <p className="text-sm text-[#2A2522]/50 mb-6">สแกน QR Code ด้วย Mobile Banking ของคุณ</p>

      <PromptPayQR
        reservationId={reservationId}
        amount={amount}
        onSuccess={() => toast.success('ชำระเงินสำเร็จ! การจองได้รับการยืนยันแล้ว')}
        onExpired={() => toast.warning('QR Code หมดอายุ กรุณาสร้างใหม่')}
        className="mx-auto"
      />

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/portal/bookings" className="rounded-lg bg-[#004B87] px-4 py-2 text-sm text-white hover:bg-[#003a6b]">
          ดูสถานะการจอง
        </Link>
        <Link href={`/booking/${slug}`} className="rounded-lg border border-black/10 px-4 py-2 text-sm text-[#2A2522] hover:bg-black/5">
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );
}
