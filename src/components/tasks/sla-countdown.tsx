'use client';

import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlaCountdownProps {
  deadline: string;
  className?: string;
}

function formatRemaining(ms: number) {
  const totalSecs = Math.round(ms / 1000);
  if (totalSecs < 0) {
    const abs = Math.abs(totalSecs);
    if (abs < 3600) return `เกิน ${Math.ceil(abs / 60)}m`;
    return `เกิน ${Math.floor(abs / 3600)}h ${Math.ceil((abs % 3600) / 60)}m`;
  }
  if (totalSecs < 3600) return `เหลือ ${Math.ceil(totalSecs / 60)}m`;
  const h = Math.floor(totalSecs / 3600);
  const m = Math.ceil((totalSecs % 3600) / 60);
  return `เหลือ ${h}h ${m}m`;
}

export function SlaCountdown({ deadline, className }: SlaCountdownProps) {
  const [ms, setMs] = useState(() => new Date(deadline).getTime() - Date.now());

  useEffect(() => {
    const tick = () => setMs(new Date(deadline).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 10_000); // update every 10s
    return () => clearInterval(id);
  }, [deadline]);

  const overdue = ms < 0;
  const urgent = ms < 15 * 60_000; // < 15 min

  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
        overdue ? 'text-red-600 dark:text-red-400' : urgent ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-500',
        className
      )}
    >
      {overdue ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
      {formatRemaining(ms)}
    </span>
  );
}
