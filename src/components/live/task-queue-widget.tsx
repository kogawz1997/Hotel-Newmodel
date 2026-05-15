'use client';
import Link from 'next/link';
import { AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITY_COLOR: Record<string, string> = {
  low: 'text-slate-500', normal: 'text-sky-600', high: 'text-orange-600', urgent: 'text-red-600',
};

function slaLabel(deadline: string) {
  const mins = Math.round((new Date(deadline).getTime() - Date.now()) / 60000);
  if (mins < 0) return { text: `เกิน ${Math.abs(mins)}m`, cls: 'text-red-600' };
  if (mins < 15) return { text: `เหลือ ${mins}m`, cls: 'text-amber-600' };
  return { text: `เหลือ ${mins}m`, cls: 'text-emerald-600' };
}

interface Task { id: string; type: string; title: string; priority: string; status: string; sla_deadline?: string; }

export function TaskQueueWidget({ tasks }: { tasks: Task[] }) {
  const shown = tasks.filter(t => ['pending','assigned','in_progress'].includes(t.status)).slice(0, 8);
  if (shown.length === 0) return (
    <div className="text-center py-4 text-muted-foreground text-sm flex flex-col items-center gap-1">
      <span className="text-2xl">✅</span>ไม่มีงานค้าง
    </div>
  );
  return (
    <div className="space-y-2">
      {shown.map(t => {
        const sla = t.sla_deadline ? slaLabel(t.sla_deadline) : null;
        return (
          <div key={t.id} className="flex items-start justify-between gap-2 p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
            <div className="min-w-0">
              <p className={cn('text-xs font-semibold', PRIORITY_COLOR[t.priority])}>{t.priority === 'urgent' ? '🚨 ' : ''}{t.title}</p>
              <p className="text-xs text-muted-foreground">{t.type}</p>
            </div>
            {sla && (
              <span className={cn('text-xs font-medium shrink-0 flex items-center gap-0.5', sla.cls)}>
                <AlertTriangle className="h-3 w-3" />{sla.text}
              </span>
            )}
          </div>
        );
      })}
      {tasks.length > 8 && (
        <Link href="/dashboard/work-orders" className="block text-xs text-center text-primary hover:underline pt-1">
          ดูทั้งหมด ({tasks.length} งาน)
        </Link>
      )}
    </div>
  );
}
