'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function EODCloseButton({ hotelId, date, totalRevenue }: { hotelId: string; date: string; totalRevenue: number }) {
  const [closing, setClosing] = useState(false);
  const [closed, setClosed] = useState(false);
  const [notes, setNotes] = useState('');

  async function closeDay() {
    if (!confirm(`ยืนยันปิดยอดวันที่ ${date} ยอดรวม ${formatCurrency(totalRevenue)}?`)) return;
    setClosing(true);
    const supabase = createClient();
    const { error } = await supabase.from('eod_reports').insert({
      hotel_id: hotelId,
      report_date: date,
      total_revenue: totalRevenue,
      notes,
      closed_at: new Date().toISOString(),
    });
    setClosing(false);
    if (error) { toast.error('ปิดยอดไม่สำเร็จ: ' + error.message); return; }
    setClosed(true);
    toast.success('ปิดยอดประจำวันสำเร็จ');
  }

  if (closed) {
    return (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-700">
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <p className="text-sm font-medium">ปิดยอดวันที่ {date} เรียบร้อยแล้ว</p>
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="p-5 space-y-3">
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Lock className="h-4 w-4" aria-hidden="true" />
          ปิดยอดประจำวัน
        </h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="หมายเหตุสำหรับวันนี้ (ไม่บังคับ)"
          rows={3}
          className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="หมายเหตุการปิดยอด"
        />
        <button
          onClick={closeDay}
          disabled={closing}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors"
          aria-busy={closing}
        >
          {closing ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Lock className="h-4 w-4" aria-hidden="true" />}
          {closing ? 'กำลังปิดยอด...' : `ปิดยอด — ${formatCurrency(totalRevenue)}`}
        </button>
      </CardContent>
    </Card>
  );
}
