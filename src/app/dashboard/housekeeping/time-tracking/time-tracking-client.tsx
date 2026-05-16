'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Square, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TASK_LABELS: Record<string, string> = {
  checkout_cleaning: 'ทำความสะอาดหลัง Check-out',
  daily_cleaning: 'ทำความสะอาดประจำวัน',
  deep_cleaning: 'ทำความสะอาดขั้นลึก',
  turndown: 'Turndown Service',
  inspection: 'ตรวจสอบ',
  other: 'อื่นๆ',
};

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} นาที`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} ชม. ${m} นาที`;
}

function elapsed(start: string) {
  return Math.floor((Date.now() - new Date(start).getTime()) / 60000);
}

export function TimeTrackingClient({ hotelId, tasks: initial, staff }: { hotelId: string; tasks: any[]; staff: any[] }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState(initial);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  async function startTask(id: string) {
    const { error } = await supabase.from('housekeeping_tasks').update({ started_at: new Date().toISOString(), status: 'in_progress' }).eq('id', id);
    if (error) { toast.error('ไม่สามารถเริ่มจับเวลา'); return; }
    setTasks(p => p.map(t => t.id === id ? { ...t, started_at: new Date().toISOString(), status: 'in_progress' } : t));
    toast.success('เริ่มจับเวลาแล้ว');
  }

  async function stopTask(id: string) {
    const { error } = await supabase.from('housekeeping_tasks').update({ completed_at: new Date().toISOString(), status: 'done' }).eq('id', id);
    if (error) { toast.error('ไม่สามารถหยุดจับเวลา'); return; }
    setTasks(p => p.map(t => t.id === id ? { ...t, completed_at: new Date().toISOString(), status: 'done' } : t));
    toast.success('หยุดจับเวลาแล้ว');
  }

  const avgByType: Record<string, { total: number; count: number }> = {};
  tasks.filter(t => t.started_at && t.completed_at).forEach(t => {
    const type = t.task_type || 'other';
    const mins = Math.floor((new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 60000);
    if (!avgByType[type]) avgByType[type] = { total: 0, count: 0 };
    avgByType[type].total += mins;
    avgByType[type].count++;
  });

  const inProgress = tasks.filter(t => t.status === 'in_progress');
  const done = tasks.filter(t => t.status === 'done' && t.started_at && t.completed_at);
  const pending = tasks.filter(t => !t.started_at && t.status !== 'done');

  return (
    <div className="space-y-6">
      {Object.keys(avgByType).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(avgByType).map(([type, data]) => (
            <Card key={type}><CardContent className="p-3">
              <p className="text-2xs text-muted-foreground mb-1">{TASK_LABELS[type] || type}</p>
              <p className="font-bold text-sm">{formatDuration(Math.round(data.total / data.count))}</p>
              <p className="text-2xs text-muted-foreground">เฉลี่ย ({data.count} ห้อง)</p>
            </CardContent></Card>
          ))}
        </div>
      )}

      {inProgress.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader><CardTitle className="text-sm text-amber-700 flex items-center gap-2"><Timer className="h-4 w-4" />กำลังดำเนินการ ({inProgress.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {inProgress.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">ห้อง {t.rooms?.room_number || '-'} — {TASK_LABELS[t.task_type] || 'งาน'}</p>
                  <p className="text-xs text-amber-700 flex items-center gap-1 mt-0.5">
                    <Clock className="h-3 w-3" />ผ่านไป {elapsed(t.started_at)} นาที
                  </p>
                </div>
                <button
                  onClick={() => stopTask(t.id)}
                  aria-label="หยุดจับเวลา"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors">
                  <Square className="h-3 w-3" />หยุด
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {pending.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" />รอเริ่ม ({pending.length})</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {pending.map(t => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">ห้อง {t.rooms?.room_number || '-'} — {TASK_LABELS[t.task_type] || 'งาน'}</p>
                  <p className="text-xs text-muted-foreground">{staff.find(s => s.id === t.assigned_to)?.full_name || 'ยังไม่มอบหมาย'}</p>
                </div>
                <button
                  onClick={() => startTask(t.id)}
                  aria-label="เริ่มจับเวลา"
                  className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                  <Play className="h-3 w-3" />เริ่ม
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {done.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2 text-emerald-600"><Clock className="h-4 w-4" />เสร็จแล้ววันนี้ ({done.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/40">
                {['ห้อง', 'ประเภท', 'เริ่ม', 'เสร็จ', 'ระยะเวลา'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {done.map(t => {
                  const mins = Math.floor((new Date(t.completed_at).getTime() - new Date(t.started_at).getTime()) / 60000);
                  return (
                    <tr key={t.id} className="border-b border-border/50 last:border-0">
                      <td className="px-4 py-2.5 font-medium">ห้อง {t.rooms?.room_number || '-'}</td>
                      <td className="px-4 py-2.5 text-muted-foreground text-xs">{TASK_LABELS[t.task_type] || '-'}</td>
                      <td className="px-4 py-2.5 text-xs font-mono">{new Date(t.started_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-2.5 text-xs font-mono">{new Date(t.completed_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="px-4 py-2.5">
                        <Badge className={cn('border-0 text-2xs', mins <= 30 ? 'bg-emerald-100 text-emerald-700' : mins <= 60 ? 'bg-secondary text-muted-foreground' : 'bg-amber-100 text-amber-700')}>
                          {formatDuration(mins)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {tasks.length === 0 && (
        <p className="text-center text-muted-foreground text-sm py-12">ยังไม่มีงานทำความสะอาดวันนี้</p>
      )}
    </div>
  );
}
