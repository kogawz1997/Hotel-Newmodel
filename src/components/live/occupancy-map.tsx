'use client';
import { cn } from '@/lib/utils';

const STATUS_CFG: Record<string, { label: string; bg: string; text: string }> = {
  available:   { label: 'ว่าง',        bg: 'bg-emerald-500', text: 'text-white' },
  occupied:    { label: 'มีผู้เข้าพัก', bg: 'bg-sky-500',     text: 'text-white' },
  cleaning:    { label: 'ทำความสะอาด', bg: 'bg-amber-400',   text: 'text-white' },
  maintenance: { label: 'ซ่อมบำรุง',   bg: 'bg-orange-500', text: 'text-white' },
  blocked:     { label: 'บล็อก',        bg: 'bg-red-500',    text: 'text-white' },
};

interface Room { id: string; room_number: string; floor: number | string; status: string; }

export function OccupancyMap({ rooms }: { rooms: Room[] }) {
  const floors = Array.from(new Set(rooms.map(r => String(r.floor)))).sort((a, b) => Number(b) - Number(a));

  if (rooms.length === 0) return <div className="text-sm text-muted-foreground text-center py-8">ไม่มีข้อมูลห้อง</div>;

  return (
    <div className="space-y-3">
      {floors.map(floor => {
        const floorRooms = rooms.filter(r => String(r.floor) === floor);
        return (
          <div key={floor}>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">ชั้น {floor}</p>
            <div className="flex flex-wrap gap-1.5">
              {floorRooms.map(room => {
                const cfg = STATUS_CFG[room.status] ?? { bg: 'bg-muted', text: 'text-foreground', label: room.status };
                return (
                  <div key={room.id} title={`${room.room_number} — ${cfg.label}`}
                    className={cn('w-10 h-10 rounded-lg flex items-center justify-center text-xs font-semibold cursor-default', cfg.bg, cfg.text)}>
                    {room.room_number}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
        {Object.entries(STATUS_CFG).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1">
            <div className={cn('w-3 h-3 rounded', v.bg)} />
            <span className="text-xs text-muted-foreground">{v.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
