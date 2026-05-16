'use client';

import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ReviewActionsProps {
  reservationId: string;
  reservationCode: string;
  guestName: string;
  checkOut: string;
}

export function ReviewActions({ reservationId, reservationCode, guestName, checkOut }: ReviewActionsProps) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function sendRequest() {
    setSending(true);
    try {
      const res = await fetch('/api/reviews/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId, channel: 'email' }),
      });
      if (res.ok) {
        setSent(true);
        toast.success(`ส่งคำขอรีวิวให้ ${guestName} แล้ว`);
      } else {
        const d = await res.json().catch(() => ({}));
        if ((d as any).error?.includes('already sent')) {
          setSent(true);
          toast.info('ส่งคำขอรีวิวไปแล้วก่อนหน้า');
        } else {
          toast.error((d as any).error || 'ส่งไม่สำเร็จ');
        }
      }
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{guestName || '—'}</p>
        <p className="text-2xs text-muted-foreground">{reservationCode} · CO {checkOut}</p>
      </div>
      <button
        onClick={sendRequest}
        disabled={sent || sending}
        className={cn(
          'shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-2xs font-medium transition-colors',
          sent
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 cursor-default'
            : 'bg-secondary hover:bg-accent/10 hover:text-accent text-muted-foreground'
        )}
      >
        {sent ? <><CheckCircle className="h-3 w-3" /> ส่งแล้ว</> : sending ? '...' : <><Send className="h-3 w-3" /> ส่ง</>}
      </button>
    </div>
  );
}
