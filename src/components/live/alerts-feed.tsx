'use client';
import { AlertTriangle, Clock, Shield, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALERT_CFG: Record<string, { icon: any; cls: string }> = {
  sla_breach:  { icon: Clock,          cls: 'text-red-600 bg-red-50 dark:bg-red-950/20' },
  urgent_task: { icon: AlertTriangle,  cls: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20' },
  incident:    { icon: Shield,         cls: 'text-red-600 bg-red-50 dark:bg-red-950/20' },
  maintenance: { icon: Wrench,         cls: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20' },
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'เมื่อกี้';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

interface Alert { id: string; type: string; message: string; time: string; severity: string; }

export function AlertsFeed({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return (
    <div className="text-center py-4 text-muted-foreground text-sm flex flex-col items-center gap-1">
      <span className="text-2xl text-emerald-500">✓</span>ไม่มีการแจ้งเตือน
    </div>
  );
  return (
    <div className="space-y-2">
      {alerts.map(a => {
        const cfg = ALERT_CFG[a.type] ?? ALERT_CFG.urgent_task;
        const Icon = cfg.icon;
        return (
          <div key={a.id} className={cn('flex items-start gap-2 p-2.5 rounded-lg', cfg.cls)}>
            <Icon className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium">{a.message}</p>
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{timeAgo(a.time)}</span>
          </div>
        );
      })}
    </div>
  );
}
