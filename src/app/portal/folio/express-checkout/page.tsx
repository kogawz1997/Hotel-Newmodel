'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ExpressCheckoutPage() {
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  async function confirm() {
    setLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    setLoading(false);
    setConfirmed(true);
  }

  if (confirmed) return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold">เช็คเอาท์สำเร็จ!</h2>
        <p className="text-sm text-muted-foreground">ขอบคุณที่เลือกใช้บริการ ใบเสร็จจะถูกส่งทางอีเมล</p>
        <p className="text-sm text-muted-foreground">พบกันใหม่ 🙏</p>
      </div>
    </div>
  );

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
          <div className="rounded-xl border border-border p-4 space-y-2">
            <p className="text-sm font-medium">ยืนยันยอดชำระ</p>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ค่าห้องและบริการ</span>
              <span>฿2,900</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">VAT 7%</span>
              <span>฿203</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border pt-2">
              <span>ยอดรวม</span>
              <span className="text-primary">฿3,103</span>
            </div>
          </div>
          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium mb-2">วิธีชำระเงิน</p>
            <p className="text-sm text-muted-foreground">บัตรเครดิตที่ลงทะเบียนไว้ •••• 4242</p>
          </div>
          <button onClick={confirm} disabled={loading} className="w-full rounded-xl bg-primary text-primary-foreground py-3 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
            {loading ? 'กำลังดำเนินการ...' : 'ยืนยัน Express Check-out'}
          </button>
          <p className="text-xs text-muted-foreground text-center">กดยืนยันเพื่อตรวจสอบและชำระยอดทั้งหมด</p>
        </div>
      </div>
    </div>
  );
}
