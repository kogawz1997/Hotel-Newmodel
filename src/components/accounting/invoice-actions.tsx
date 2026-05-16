'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { XCircle, FileDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  status: string;
}

export function InvoiceActions({ invoiceId, invoiceNumber, status }: InvoiceActionsProps) {
  const [voiding, setVoiding] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [reason, setReason] = useState('');
  const [done, setDone] = useState(false);

  const canVoid = status !== 'cancelled' && status !== 'paid';

  async function handleVoid() {
    if (!reason.trim()) return;
    setVoiding(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/void`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) {
        setDone(true);
        setShowConfirm(false);
      }
    } finally {
      setVoiding(false);
    }
  }

  if (done) {
    return <span className="text-2xs text-muted-foreground">ยกเลิกแล้ว</span>;
  }

  return (
    <div className="flex items-center gap-2">
      <a
        href={`/api/invoices/${invoiceId}/pdf`}
        download={`invoice-${invoiceNumber}.pdf`}
        className="text-xs text-accent hover:underline flex items-center gap-1"
      >
        <FileDown className="h-3 w-3" />
        PDF
      </a>

      {canVoid && !showConfirm && (
        <button
          onClick={() => setShowConfirm(true)}
          className="text-xs text-destructive hover:underline flex items-center gap-1"
        >
          <XCircle className="h-3 w-3" />
          ยกเลิก
        </button>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setShowConfirm(false)}>
          <div
            className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-semibold text-sm mb-1">ยกเลิกใบกำกับ {invoiceNumber}</h3>
            <p className="text-2xs text-muted-foreground mb-4">การยกเลิกไม่สามารถย้อนกลับได้ กรุณาระบุเหตุผล</p>
            <textarea
              className={cn(
                'w-full text-sm border border-border rounded-lg p-2.5 resize-none bg-background',
                'focus:outline-none focus:ring-2 focus:ring-accent/30'
              )}
              rows={3}
              placeholder="เหตุผลการยกเลิก..."
              value={reason}
              onChange={e => setReason(e.target.value)}
            />
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                variant="destructive"
                className="flex-1"
                disabled={!reason.trim() || voiding}
                onClick={handleVoid}
              >
                {voiding ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setShowConfirm(false)}>
                ปิด
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
