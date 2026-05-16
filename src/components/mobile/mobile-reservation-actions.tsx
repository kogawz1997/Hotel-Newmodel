'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ActionType = 'check_in' | 'check_out';

export function MobileReservationActions({
  reservationId,
  action,
}: {
  reservationId: string;
  action: ActionType;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleAction() {
    setLoading(true);
    try {
      const res = await fetch(`/api/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        toast.success(action === 'check_in' ? 'เช็คอินสำเร็จ' : 'เช็คเอาต์สำเร็จ');
        router.refresh();
      } else {
        const d = await res.json().catch(() => ({}));
        toast.error(d.error || 'เกิดข้อผิดพลาด');
      }
    } catch {
      toast.error('ไม่สามารถเชื่อมต่อได้');
    } finally {
      setLoading(false);
    }
  }

  if (action === 'check_in') {
    return (
      <button
        onClick={handleAction}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-xl bg-sky-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
        เช็คอิน
      </button>
    );
  }

  return (
    <button
      onClick={handleAction}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
      เช็คเอาต์
    </button>
  );
}
