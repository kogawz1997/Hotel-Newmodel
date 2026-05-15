'use client';

import { useState } from 'react';
import { Wrench, Sparkles, ShoppingCart, Shield, Car, BriefcaseBusiness, ChefHat, Flower2, Headphones, MoreHorizontal, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TYPE_ICON: Record<string, any> = {
  housekeeping: Sparkles,
  maintenance: Wrench,
  room_service: ShoppingCart,
  concierge: Headphones,
  security: Shield,
  transport: Car,
  bellboy: BriefcaseBusiness,
  fnb: ChefHat,
  spa: Flower2,
  other: MoreHorizontal,
};

const TYPE_LABEL: Record<string, string> = {
  housekeeping: 'แม่บ้าน', maintenance: 'ซ่อมบำรุง', room_service: 'Room Service',
  concierge: 'คอนเซียร์จ', security: 'รักษาความปลอดภัย', transport: 'ขนส่ง',
  bellboy: 'พอร์เตอร์', fnb: 'อาหาร', spa: 'สปา', other: 'อื่นๆ',
};

const PRIORITY_CFG: Record<string, { label: string; cls: string }> = {
  low:    { label: 'ต่ำ',    cls: 'bg-slate-100 text-slate-600' },
  normal: { label: 'ปกติ',   cls: 'bg-sky-100 text-sky-700' },
  high:   { label: 'เร่งด่วน', cls: 'bg-orange-100 text-orange-700' },
  urgent: { label: '🚨 วิกฤต', cls: 'bg-red-100 text-red-700' },
};

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending:     { label: 'รอดำเนินการ', cls: 'bg-amber-100 text-amber-700' },
  assigned:    { label: 'มอบหมายแล้ว', cls: 'bg-purple-100 text-purple-700' },
  in_progress: { label: 'กำลังทำ',    cls: 'bg-blue-100 text-blue-700' },
  done:        { label: 'เสร็จแล้ว',  cls: 'bg-emerald-100 text-emerald-700' },
  cancelled:   { label: 'ยกเลิก',     cls: 'bg-slate-100 text-slate-500' },
};

function getSLAColor(deadline: string) {
  const mins = (new Date(deadline).getTime() - Date.now()) / 60000;
  if (mins < 0) return 'text-red-600';
  if (mins < 15) return 'text-amber-600';
  return 'text-emerald-600';
}

function getSLALabel(deadline: string) {
  const mins = Math.round((new Date(deadline).getTime() - Date.now()) / 60000);
  if (mins < 0) return `เกิน ${Math.abs(mins)}m`;
  return `เหลือ ${mins}m`;
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'เมื่อกี้';
  if (mins < 60) return `${mins}m ที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ที่แล้ว`;
  return `${Math.floor(hrs / 24)}d ที่แล้ว`;
}

interface TaskCardProps {
  task: any;
  onStatusChange?: (id: string, status: string) => void;
  showAssignee?: boolean;
  compact?: boolean;
}

export function TaskCard({ task, onStatusChange, showAssignee, compact }: TaskCardProps) {
  const [loading, setLoading] = useState(false);
  const Icon = TYPE_ICON[task.type] ?? MoreHorizontal;
  const priority = PRIORITY_CFG[task.priority] ?? PRIORITY_CFG.normal;
  const status = STATUS_CFG[task.status] ?? STATUS_CFG.pending;
  const isUrgent = task.priority === 'urgent';

  async function changeStatus(newStatus: string) {
    setLoading(true);
    try {
      await fetch(`/api/work-orders/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onStatusChange?.(task.id, newStatus);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={cn(
      'rounded-xl border border-border bg-card p-4 space-y-2 transition-shadow hover:shadow-sm',
      isUrgent && 'border-red-200 bg-red-50/30 dark:bg-red-950/10',
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('p-1.5 rounded-lg shrink-0', isUrgent ? 'bg-red-100' : 'bg-muted')}>
            <Icon className={cn('h-3.5 w-3.5', isUrgent ? 'text-red-600' : 'text-muted-foreground')} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{task.title}</p>
            {task.room_no && <p className="text-xs text-muted-foreground">ห้อง {task.room_no}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', priority.cls)}>{priority.label}</span>
          <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', status.cls)}>{status.label}</span>
        </div>
      </div>

      {!compact && task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{TYPE_LABEL[task.type] ?? task.type}</span>
          {showAssignee && task.assigned_user?.full_name && (
            <span>→ {task.assigned_user.full_name}</span>
          )}
          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{timeAgo(task.created_at)}</span>
        </div>
        {task.sla_deadline && !['done','cancelled'].includes(task.status) && (
          <span className={cn('font-medium flex items-center gap-0.5', getSLAColor(task.sla_deadline))}>
            <AlertTriangle className="h-3 w-3" />
            {getSLALabel(task.sla_deadline)}
          </span>
        )}
      </div>

      {onStatusChange && !['done','cancelled'].includes(task.status) && (
        <div className="flex gap-2 pt-1">
          {task.status === 'in_progress' && (
            <Button size="sm" variant="default" className="h-7 text-xs" disabled={loading} onClick={() => changeStatus('done')}>
              เสร็จแล้ว
            </Button>
          )}
          {['pending','assigned'].includes(task.status) && (
            <Button size="sm" variant="outline" className="h-7 text-xs" disabled={loading} onClick={() => changeStatus('in_progress')}>
              เริ่มทำ
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
