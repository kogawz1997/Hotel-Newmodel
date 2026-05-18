'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Smartphone, Wifi, ArrowLeft, CheckCircle2, Clock, Loader2, Key } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

function MobileKeyContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code') || '';
  const [loading, setLoading] = useState(false);
  const [key, setKey]         = useState<any>(null);
  const [error, setError]     = useState('');

  async function requestKey() {
    if (!code) { setError('ไม่พบรหัสการจอง'); return; }
    setLoading(true);
    const res = await fetch('/api/mobile-key', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reservationCode: code }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || 'เกิดข้อผิดพลาด'); return; }
    setKey(data.key);
  }

  async function openDoor() {
    if (!key?.token) return;
    if ('NDEFReader' in window) {
      try {
        const ndef = new (window as any).NDEFReader();
        await ndef.write({ records: [{ recordType: 'text', data: key.token }] });
        alert('แตะที่ประตู!');
      } catch {
        alert('NFC ไม่รองรับ ลองวิธี BLE');
      }
    } else {
      alert(`Key Token:\n${key.token}\n\nแสดงให้ระบบ door lock สแกน`);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link href="/portal/stay"
          className="flex items-center gap-2 text-muted-foreground text-sm mb-6 hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> กลับ
        </Link>

        <div className="bg-card rounded-3xl border border-border/60 shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-amber-600 to-[#C66A30] p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 h-24 w-24 rounded-full bg-white/10" />
            <div className="relative">
              <div className="h-16 w-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 border border-white/30">
                <Key className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-white font-display font-bold text-lg">Mobile Key</h1>
              <p className="text-white/70 text-sm mt-1">กุญแจดิจิทัลสำหรับห้องพัก</p>
            </div>
          </div>

          <div className="p-6">
            {!key && !loading && (
              <>
                <div className="bg-muted/50 rounded-2xl p-4 mb-5 space-y-3 text-sm border border-border/40">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Wifi className="h-4 w-4 text-sky-500 shrink-0" />
                    ใช้ NFC หรือ BLE unlock ประตู
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    ใช้ได้ตลอดช่วงเข้าพัก
                  </div>
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                    ปลอดภัย — ยืนยันตัวตนแล้ว
                  </div>
                </div>
                {error && (
                  <div className="bg-red-500/8 border border-red-500/20 rounded-2xl p-3 text-sm text-red-600 dark:text-red-400 mb-4">
                    {error}
                  </div>
                )}
                <button onClick={requestKey}
                  className="w-full py-3.5 bg-amber-600 dark:bg-amber-500 text-white rounded-2xl font-bold hover:opacity-90 transition-opacity">
                  ขอรับ Mobile Key
                </button>
              </>
            )}

            {loading && (
              <div className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-amber-600 dark:text-amber-400 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">กำลังออก key...</p>
              </div>
            )}

            {key && (
              <div className="space-y-4">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  <p className="font-bold text-emerald-700 dark:text-emerald-400">Key พร้อมใช้งาน!</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">
                    {key.vendorConnected ? 'เชื่อมต่อ door lock แล้ว' : key.vendorMessage}
                  </p>
                </div>

                <div className="bg-muted/50 rounded-2xl border border-border/40 p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ห้อง</span>
                    <span className="font-bold text-foreground">{key.roomNumber}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ใช้ได้ถึง</span>
                    <span className="font-medium text-foreground">{format(parseISO(key.validUntil), 'd MMM · HH:mm', { locale: th })}</span>
                  </div>
                </div>

                {key.vendorConnected && (
                  <button onClick={openDoor}
                    className="w-full py-4 bg-foreground text-background rounded-2xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <Smartphone className="h-5 w-5" /> แตะเปิดประตู (NFC)
                  </button>
                )}

                <p className="text-[10px] text-muted-foreground/50 text-center">Key จะหมดอายุอัตโนมัติเมื่อ Check-out</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MobileKeyPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600 dark:text-amber-400" />
      </div>
    }>
      <MobileKeyContent />
    </Suspense>
  );
}
