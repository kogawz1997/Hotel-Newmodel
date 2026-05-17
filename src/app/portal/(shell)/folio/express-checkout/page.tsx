'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Loader2, AlertCircle, CreditCard, Banknote } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type PaymentMethod = 'card_on_file' | 'promptpay' | 'at_hotel';

export default function ExpressCheckoutPage() {
  const [reservation, setReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('promptpay');

  useEffect(() => {
    fetch('/api/guest/folio')
      .then(r => r.json())
      .then(d => { setReservation(d.reservation); setLoading(false); })
      .catch(() => { setError('โหลดข้อมูลไม่สำเร็จ'); setLoading(false); });
  }, []);

  async function confirm() {
    if (!reservation) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/guest/express-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reservationId: reservation.id,
          paymentMethod: method,
          acknowledgedAmount: reservation.outstanding,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); return; }
      setConfirmed(true);
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  const hotel = reservation?.hotels as any;
  const currency = hotel?.currency || 'THB';

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (confirmed) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold">เช็คเอาท์สำเร็จ!</h2>
        <p className="text-sm text-muted-foreground">ขอบคุณที่เลือกใช้บริการ ใบเสร็จจะถูกส่งทางอีเมล</p>
        {method === 'at_hotel' && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700">
            กรุณาชำระยอดค้างที่เคาน์เตอร์ก่อนออกจากโรงแรม
          </div>
        )}
        <p className="text-sm text-muted-foreground">พบกันใหม่ 🙏</p>
        <Link href="/" className="block w-full rounded-xl bg-primary text-primary-foreground text-center py-2.5 text-sm font-medium">
          กลับหน้าหลัก
        </Link>
      </div>
    </div>
  );

  if (!reservation) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="font-medium">ไม่พบการเข้าพักที่ active</p>
        <Link href="/portal/folio" className="text-sm text-primary hover:underline">กลับ</Link>
      </div>
    </div>
  );

  const methods: { value: PaymentMethod; label: string; icon: typeof CreditCard; note?: string }[] = [
    { value: 'promptpay', label: 'PromptPay QR', icon: CreditCard, note: 'QR โดยตรงจากธนาคาร' },
    { value: 'card_on_file', label: 'บัตรเครดิต/เดบิต', icon: CreditCard, note: 'ชำระอัตโนมัติ' },
    { value: 'at_hotel', label: 'ชำระที่เคาน์เตอร์', icon: Banknote, note: 'เงินสด / บัตร ณ จุดออก' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/portal/folio" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-semibold">Express Check-out</h1>
        </div>

        <div className="space-y-4">
          {/* Amount summary */}
          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-sm font-medium">ยืนยันยอดชำระ</p>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>ค่าห้องและบริการ</span>
              <span>{formatCurrency(reservation.room_charge + reservation.charges_total, currency)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>ชำระแล้ว</span>
              <span>- {formatCurrency(reservation.paid_amount, currency)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border pt-2">
              <span>ยอดค้างชำระ</span>
              <span className={`text-lg ${reservation.outstanding > 0 ? 'text-primary' : 'text-emerald-600'}`}>
                {formatCurrency(reservation.outstanding, currency)}
              </span>
            </div>
          </div>

          {reservation.outstanding === 0 && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700 text-center">
              ชำระครบแล้ว — กดยืนยันเพื่อ check-out
            </div>
          )}

          {/* Payment method selection */}
          {reservation.outstanding > 0 && (
            <div className="rounded-xl border border-border p-4 space-y-2">
              <p className="text-sm font-medium mb-3">วิธีชำระเงิน</p>
              {methods.map(m => (
                <button
                  key={m.value}
                  onClick={() => setMethod(m.value)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${method === m.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                >
                  <m.icon className={`h-4 w-4 shrink-0 ${method === m.value ? 'text-primary' : 'text-muted-foreground'}`} />
                  <div>
                    <p className="text-sm font-medium">{m.label}</p>
                    {m.note && <p className="text-xs text-muted-foreground">{m.note}</p>}
                  </div>
                  <div className={`ml-auto h-4 w-4 rounded-full border-2 ${method === m.value ? 'border-primary bg-primary' : 'border-muted-foreground'}`} />
                </button>
              ))}
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={confirm}
            disabled={submitting}
            className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'กำลังดำเนินการ...' : reservation.outstanding > 0 ? `ยืนยัน Express Check-out · ${formatCurrency(reservation.outstanding, currency)}` : 'ยืนยัน Check-out (ไม่มียอดค้าง)'}
          </button>
          <p className="text-xs text-muted-foreground text-center">กดยืนยันเพื่อตรวจสอบและชำระยอดทั้งหมด</p>
        </div>
      </div>
    </div>
  );
}
