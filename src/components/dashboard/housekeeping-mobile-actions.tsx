'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function HousekeepingMobileActions({ taskId }: { taskId: string }) {
  const [loading, setLoading] = useState<'start' | 'complete' | null>(null);

  async function doAction(action: 'start' | 'complete') {
    setLoading(action);
    const endpoint = action === 'start'
      ? `/api/housekeeping/tasks/${taskId}/start`
      : `/api/housekeeping/tasks/${taskId}/complete`;
    try {
      const res = await fetch(endpoint, { method: 'POST' });
      if (res.ok) {
        toast.success(action === 'start' ? 'เริ่มงานแล้ว' : 'งานเสร็จแล้ว');
        window.location.reload();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || 'เกิดข้อผิดพลาด');
      }
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="mt-4 grid grid-cols-2 gap-2">
      <button
        onClick={() => doAction('start')}
        disabled={!!loading}
        className="rounded-xl bg-amber-400 px-4 py-3 text-center text-sm font-semibold text-stone-950 disabled:opacity-60"
      >
        {loading === 'start' ? '...' : 'เริ่มงาน'}
      </button>
      <button
        onClick={() => doAction('complete')}
        disabled={!!loading}
        className="rounded-xl bg-emerald-400 px-4 py-3 text-center text-sm font-semibold text-emerald-950 disabled:opacity-60"
      >
        {loading === 'complete' ? '...' : 'เสร็จแล้ว'}
      </button>
    </div>
  );
}
