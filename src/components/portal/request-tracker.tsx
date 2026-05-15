'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Clock, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG: Record<string, { label: string; icon: any; cls: string }> = {
  pending:     { label: 'รอดำเนินการ', icon: Clock,         cls: 'text-amber-600' },
  assigned:    { label: 'มอบหมายแล้ว', icon: Loader2,       cls: 'text-blue-600' },
  in_progress: { label: 'กำลังดำเนินการ', icon: Loader2,    cls: 'text-blue-600' },
  done:        { label: 'เสร็จแล้ว',   icon: CheckCircle,  cls: 'text-emerald-600' },
  cancelled:   { label: 'ยกเลิก',      icon: AlertCircle,  cls: 'text-red-500' },
};

function getSLALabel(deadline: string) {
  const mins = Math.round((new Date(deadline).getTime() - Date.now()) / 60000);
  if (mins < 0) return 'เกินเวลาที่กำหนด';
  return `โดยประมาณ ${mins} นาที`;
}

interface Props { workOrderId: string; }

export function RequestTracker({ workOrderId }: Props) {
  const [task, setTask] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('work_orders').select('id, title, status, sla_deadline, created_at, notes').eq('id', workOrderId).single()
      .then(({ data }) => { setTask(data); setLoading(false); });

    const channel = supabase.channel(`task-${workOrderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'work_orders', filter: `id=eq.${workOrderId}` },
        (p: any) => setTask((prev: any) => ({ ...prev, ...p.new })))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [workOrderId]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="h-4 w-4 animate-spin" />กำลังโหลด...</div>;
  if (!task) return <p className="text-sm text-muted-foreground">ไม่พบคำร้อง</p>;

  const cfg = STATUS_CFG[task.status] ?? STATUS_CFG.pending;
  const Icon = cfg.icon;

  const steps = ['pending', 'assigned', 'in_progress', 'done'];
  const currentStep = steps.indexOf(task.status);

  return (
    <div className="space-y-4">
      <div className={cn('flex items-center gap-2', cfg.cls)}>
        <Icon className={cn('h-5 w-5', ['assigned','in_progress'].includes(task.status) && 'animate-spin')} />
        <span className="font-semibold">{cfg.label}</span>
      </div>

      {/* Progress bar */}
      <div className="flex gap-1.5">
        {steps.filter(s => s !== 'cancelled').map((s, i) => (
          <div key={s} className={cn('flex-1 h-1.5 rounded-full transition-colors', i <= currentStep ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>

      <div>
        <p className="text-sm font-medium">{task.title}</p>
        {task.sla_deadline && task.status !== 'done' && (
          <p className="text-xs text-muted-foreground mt-0.5">⏱ {getSLALabel(task.sla_deadline)}</p>
        )}
        {task.notes && task.status === 'done' && (
          <p className="text-xs text-emerald-600 mt-0.5">✓ {task.notes}</p>
        )}
      </div>
    </div>
  );
}
