'use client';
import { Star } from 'lucide-react';

interface Arrival { id: string; guest_name: string; room_number?: string; check_in_date: string; special_requests?: string; }

export function VipArrivalsWidget({ arrivals }: { arrivals: Arrival[] }) {
  if (arrivals.length === 0) return (
    <div className="text-center py-4 text-muted-foreground text-sm">ไม่มี VIP วันนี้</div>
  );
  return (
    <div className="space-y-2">
      {arrivals.map(a => (
        <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
            <Star className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{a.guest_name}</p>
            <p className="text-xs text-muted-foreground">
              {a.room_number ? `ห้อง ${a.room_number}` : 'ยังไม่ได้มอบห้อง'}
              {a.special_requests && <span className="ml-2 text-amber-600">⚠ มีความต้องการพิเศษ</span>}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
