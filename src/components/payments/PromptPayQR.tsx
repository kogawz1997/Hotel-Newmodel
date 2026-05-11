'use client';

import { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface PromptPayQRProps {
  reservationId: string;
  amount: number;
  currency?: string;
  description?: string;
  onSuccess?: () => void;
  onExpired?: () => void;
  className?: string;
}

type Status = 'loading' | 'ready' | 'completed' | 'expired' | 'error';

const POLL_INTERVAL_MS = 4_000;
const MAX_POLL_MINUTES = 15;

export function PromptPayQR({
  reservationId,
  amount,
  currency = 'THB',
  description,
  onSuccess,
  onExpired,
  className,
}: PromptPayQRProps) {
  const [status, setStatus] = useState<Status>('loading');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(MAX_POLL_MINUTES * 60);

  // Create PromptPay charge + get QR
  useEffect(() => {
    let cancelled = false;
    async function createCharge() {
      try {
        const res = await fetch('/api/payments/promptpay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reservationId, amount, currency, description }),
        });
        if (cancelled) return;
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError(data?.error || 'ไม่สามารถสร้าง QR Code ได้');
          setStatus('error');
          return;
        }
        const data = await res.json();
        setQrCodeUrl(data.qrCodeUrl);
        setTransactionId(data.transactionId);
        setStatus('ready');
      } catch {
        if (!cancelled) {
          setError('เกิดข้อผิดพลาด กรุณาลองใหม่');
          setStatus('error');
        }
      }
    }
    createCharge();
    return () => { cancelled = true; };
  }, [reservationId, amount, currency, description]);

  // Poll for payment confirmation
  const checkStatus = useCallback(async () => {
    if (!transactionId) return;
    try {
      const res = await fetch(`/api/payments/promptpay/status?transactionId=${transactionId}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.status === 'completed') {
        setStatus('completed');
        onSuccess?.();
      }
    } catch { /* ignore poll errors */ }
  }, [transactionId, onSuccess]);

  useEffect(() => {
    if (status !== 'ready' || !transactionId) return;

    const pollInterval = setInterval(checkStatus, POLL_INTERVAL_MS);
    const countdown = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(pollInterval);
          clearInterval(countdown);
          setStatus('expired');
          onExpired?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1_000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(countdown);
    };
  }, [status, transactionId, checkStatus, onExpired]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const fmt = new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 });

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C66A30] border-t-transparent" />
          <p className="text-sm text-muted-foreground">กำลังสร้าง QR Code…</p>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-sm font-medium text-red-700">⚠️ {error}</p>
          <button
            onClick={() => { setStatus('loading'); setError(null); }}
            className="mt-3 rounded-lg bg-red-100 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-200"
          >
            ลองใหม่
          </button>
        </div>
      )}

      {status === 'ready' && qrCodeUrl && (
        <>
          <div className="rounded-2xl border-2 border-[#004B87] bg-white p-4 shadow-md">
            {/* PromptPay logo header */}
            <div className="mb-3 flex items-center justify-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#004B87] text-xs font-bold text-white">P</div>
              <span className="text-sm font-bold text-[#004B87]">PromptPay</span>
            </div>
            {/* QR Code image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="PromptPay QR Code"
              className="h-52 w-52 object-contain"
              crossOrigin="anonymous"
            />
            {/* Amount */}
            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground">ยอดชำระ</p>
              <p className="text-xl font-bold text-[#004B87]">{fmt.format(amount)}</p>
            </div>
          </div>

          {/* Countdown timer */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>หมดอายุใน</span>
            <span className={cn('font-mono font-semibold tabular-nums', timeLeft < 60 ? 'text-red-600' : 'text-[#2A2522]')}>
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
          </div>

          <p className="max-w-[240px] text-center text-xs text-muted-foreground">
            เปิด Mobile Banking หรือ App ธนาคารแล้วสแกน QR Code
          </p>
        </>
      )}

      {status === 'completed' && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-8 py-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <svg className="h-7 w-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="font-semibold text-emerald-800">ชำระเงินสำเร็จ ✅</p>
          <p className="text-sm text-emerald-700">การจองได้รับการยืนยันแล้ว</p>
        </div>
      )}

      {status === 'expired' && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-8 py-6 text-center">
          <p className="font-medium text-amber-800">⏰ QR Code หมดอายุแล้ว</p>
          <p className="text-sm text-amber-700">กรุณาสร้าง QR Code ใหม่</p>
          <button
            onClick={() => { setStatus('loading'); setQrCodeUrl(null); setTransactionId(null); setTimeLeft(MAX_POLL_MINUTES * 60); }}
            className="mt-1 rounded-lg bg-amber-100 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-200"
          >
            สร้าง QR ใหม่
          </button>
        </div>
      )}
    </div>
  );
}
