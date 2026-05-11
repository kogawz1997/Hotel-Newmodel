import Link from 'next/link';
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
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-amber-800">รอการชำระเงิน ⏳</h1>
        <p className="mt-3 text-amber-900">เรารอการยืนยันการชำระเงินของคุณอยู่</p>
        {amount ? <p className="mt-4 text-sm text-amber-900/80">ยอดที่รอชำระ: <span className="font-semibold">฿{Number(amount).toLocaleString()}</span></p> : null}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={`/booking/${slug}`} className="rounded-lg bg-amber-700 px-4 py-2 text-white hover:bg-amber-800">
            กลับไปหน้าชำระเงิน
          </Link>
          <Link href={`/portal/bookings`} className="rounded-lg border border-amber-700 px-4 py-2 text-amber-800 hover:bg-amber-100">
            ดูสถานะการจอง
          </Link>
        </div>
      </div>
    </main>
  );
}
