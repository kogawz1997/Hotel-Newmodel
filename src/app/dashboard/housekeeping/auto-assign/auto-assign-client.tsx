'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserCheck, Zap, ClipboardList, Users } from 'lucide-react';
import { toast } from 'sonner';

type Task = { id: string; task_type: string; priority: string; status: string; room_id: string; rooms: { id: string; room_number: string; floor: string | number } | null };
type Staff = { id: string; full_name: string; zone?: string };

const TASK_LABELS: Record<string, string> = {
  checkout_cleaning: 'ทำความสะอาดหลัง CO',
  daily_cleaning: 'ทำความสะอาดประจำวัน',
  deep_cleaning: 'ทำความสะอาดขั้นลึก',
  turndown: 'Turndown',
  inspection: 'ตรวจสอบ',
  other: 'อื่นๆ',
};

function floorGroup(floor: string | number | null | undefined): string {
  const f = Number(floor);
  if (isNaN(f)) return 'ชั้น ?';
  return `ชั้น ${f}`;
}

export function AutoAssignClient({ hotelId, tasks: initTasks, staff }: { hotelId: string; tasks: Task[]; staff: Staff[]; rooms: any[] }) {
  const supabase = createClient();
  const [tasks, setTasks] = useState(initTasks);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const tasksByFloor = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach(t => {
      const key = floorGroup(t.rooms?.floor);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(t);
    });
    return grouped;
  }, [tasks]);

  function autoAssign() {
    if (!staff.length) { toast.error('ยังไม่มีพนักงาน'); return; }
    const newAssignments: Record<string, string> = {};
    const floors = Object.keys(tasksByFloor).sort();
    floors.forEach((floor, fi) => {
      const staffIdx = fi % staff.length;
      tasksByFloor[floor].forEach(t => {
        newAssignments[t.id] = staff[staffIdx].id;
      });
    });
    setAssignments(newAssignments);
    toast.success('จัดสรรงานอัตโนมัติแล้ว ตรวจสอบก่อนบันทึก');
  }

  async function saveAssignments() {
    const toSave = Object.entries(assignments).filter(([id]) => tasks.find(t => t.id === id));
    if (!toSave.length) { toast.error('ยังไม่ได้มอบหมายงาน'); return; }
    setSaving(true);
    const updates = toSave.map(([id, userId]) =>
      supabase.from('housekeeping_tasks').update({ assigned_to: userId, status: 'assigned' }).eq('id', id)
    );
    await Promise.all(updates);
    setSaving(false);
    setTasks(p => p.filter(t => !assignments[t.id]));
    setAssignments({});
    toast.success(`มอบหมาย ${toSave.length} งานแล้ว`);
  }

  const assignCount = Object.values(assignments).filter(Boolean).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClipboardList className="h-4 w-4" />
          {tasks.length} งานรอมอบหมาย · <Users className="h-4 w-4 ml-1" />{staff.length} พนักงาน
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={autoAssign} disabled={!tasks.length || !staff.length}>
            <Zap className="h-3.5 w-3.5" />Auto-Assign
          </Button>
          {assignCount > 0 && (
            <Button size="sm" onClick={saveAssignments} disabled={saving}>
              <UserCheck className="h-3.5 w-3.5" />{saving ? 'กำลังบันทึก...' : `บันทึก (${assignCount})`}
            </Button>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">ไม่มีงานรอมอบหมาย</div>
      ) : (
        Object.entries(tasksByFloor).sort().map(([floor, floorTasks]) => (
          <Card key={floor}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm">{floor} — {floorTasks.length} งาน</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {floorTasks.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">ห้อง {t.rooms?.room_number || '?'}</p>
                      <p className="text-xs text-muted-foreground">{TASK_LABELS[t.task_type] || t.task_type}</p>
                    </div>
                    {t.priority === 'high' || t.priority === 'emergency' ? (
                      <Badge className="bg-red-100 text-red-700 border-0 text-2xs">ด่วน</Badge>
                    ) : null}
                    <select
                      value={assignments[t.id] || ''}
                      onChange={e => setAssignments(p => ({ ...p, [t.id]: e.target.value }))}
                      aria-label={`มอบหมายห้อง ${t.rooms?.room_number}`}
                      className="px-2 py-1.5 bg-secondary border-0 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="">— เลือกพนักงาน —</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>{s.full_name}{s.zone ? ` (${s.zone})` : ''}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
