'use client';
import { cn } from '@/lib/utils';

const ROLE_TH: Record<string, string> = {
  housekeeper: 'แม่บ้าน', technician: 'ช่าง', front_desk: 'แผนกต้อนรับ',
  concierge: 'คอนเซียร์จ', security_staff: 'รปภ.', bellboy: 'พอร์เตอร์',
  room_service_staff: 'Room Service', kitchen_staff: 'ครัว', transport_driver: 'คนขับ',
  spa_staff: 'สปา', restaurant_staff: 'พนักงานร้านอาหาร',
};

interface StaffMember { id: string; full_name: string; role: string; is_available?: boolean; active_tasks?: number; }

export function StaffStatusGrid({ staff }: { staff: StaffMember[] }) {
  if (staff.length === 0) return <div className="text-sm text-muted-foreground text-center py-4">ไม่มีพนักงานออนไลน์</div>;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {staff.map(s => {
        const busy = (s.active_tasks ?? 0) > 0;
        const initials = (s.full_name ?? '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
        return (
          <div key={s.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50">
            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0', busy ? 'bg-amber-500' : s.is_available !== false ? 'bg-emerald-500' : 'bg-slate-400')}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{s.full_name}</p>
              <p className="text-xs text-muted-foreground">{ROLE_TH[s.role] ?? s.role}</p>
              {busy && <p className="text-xs text-amber-600">{s.active_tasks} งาน</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
