'use client';

import { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { th } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AssignedStaff {
  id: string;
  full_name: string | null;
}

interface PMTask {
  id: string;
  hotel_id: string;
  title: string;
  description: string | null;
  equipment_type: string | null;
  location: string | null;
  frequency_days: number;
  last_done_at: string | null;
  next_due_at: string;
  assigned_to: string | null;
  checklist: string[] | null;
  is_active: boolean;
  assigned_staff: AssignedStaff | null;
}

interface StaffMember {
  id: string;
  full_name: string | null;
  role: string;
}

interface Props {
  hotelId: string;
  initialTasks: PMTask[];
  staffList: StaffMember[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRowColor(nextDueAt: string): string {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(nextDueAt));
  const inOneWeek = addDays(today, 7);

  if (isBefore(due, today) || due.getTime() === today.getTime()) {
    return 'bg-red-50 border-l-4 border-l-red-500';
  }
  if (isBefore(due, inOneWeek)) {
    return 'bg-amber-50 border-l-4 border-l-amber-400';
  }
  return 'bg-emerald-50/30 border-l-4 border-l-emerald-400';
}

function getDueBadge(nextDueAt: string) {
  const today = startOfDay(new Date());
  const due = startOfDay(new Date(nextDueAt));
  const inOneWeek = addDays(today, 7);

  if (isBefore(due, today) || due.getTime() === today.getTime()) {
    return { text: 'เกินกำหนด', className: 'bg-red-100 text-red-700' };
  }
  if (isBefore(due, inOneWeek)) {
    return { text: 'ใกล้ถึงกำหนด', className: 'bg-amber-100 text-amber-700' };
  }
  return { text: 'ปกติ', className: 'bg-emerald-100 text-emerald-700' };
}

const DEFAULT_FORM = {
  title: '',
  description: '',
  equipment_type: '',
  location: '',
  frequency_days: 30,
  assigned_to: '',
  checklist: [''],
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PMClient({ hotelId, initialTasks, staffList }: Props) {
  const [tasks, setTasks] = useState<PMTask[]>(initialTasks);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  const overdueCount = useMemo(() => {
    const today = startOfDay(new Date());
    return tasks.filter((t) => {
      const due = startOfDay(new Date(t.next_due_at));
      return isBefore(due, today) || due.getTime() === today.getTime();
    }).length;
  }, [tasks]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function markDone(task: PMTask) {
    setSaving(true);
    const res = await fetch('/api/maintenance/pm', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: task.id }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('บันทึกไม่สำเร็จ'); return; }
    const updated = await res.json();
    setTasks((prev) =>
      prev
        .map((t) => (t.id === task.id ? { ...t, ...updated } : t))
        .sort((a, b) => a.next_due_at.localeCompare(b.next_due_at))
    );
    toast.success('บันทึก PM เรียบร้อย!');
  }

  async function createPM() {
    if (!form.title.trim()) { toast.error('กรอกชื่องาน PM ก่อน'); return; }
    if (form.frequency_days <= 0) { toast.error('ความถี่ต้องมากกว่า 0'); return; }

    const cleanChecklist = form.checklist.filter((c) => c.trim() !== '');

    setSaving(true);
    const res = await fetch('/api/maintenance/pm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.title.trim(),
        description: form.description.trim() || null,
        equipment_type: form.equipment_type.trim() || null,
        location: form.location.trim() || null,
        frequency_days: Number(form.frequency_days),
        assigned_to: form.assigned_to || null,
        checklist: cleanChecklist.length > 0 ? cleanChecklist : null,
      }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('สร้าง PM ไม่สำเร็จ'); return; }
    const newTask = await res.json();
    setTasks((prev) =>
      [...prev, newTask].sort((a, b) => a.next_due_at.localeCompare(b.next_due_at))
    );
    setShowAdd(false);
    setForm(DEFAULT_FORM);
    toast.success('สร้างงาน PM แล้ว!');
  }

  function addChecklistItem() {
    setForm((p) => ({ ...p, checklist: [...p.checklist, ''] }));
  }

  function updateChecklistItem(idx: number, val: string) {
    setForm((p) => {
      const cl = [...p.checklist];
      cl[idx] = val;
      return { ...p, checklist: cl };
    });
  }

  function removeChecklistItem(idx: number) {
    setForm((p) => ({
      ...p,
      checklist: p.checklist.filter((_, i) => i !== idx),
    }));
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="container max-w-6xl py-8 animate-fade-in">
      <TopBar
        title="ตารางบำรุงรักษาเชิงป้องกัน"
        description="PM Schedule — ติดตามและบันทึกงานบำรุงรักษาประจำ"
        action={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" />
            เพิ่ม PM
          </Button>
        }
      />

      {/* Overdue alert */}
      {overdueCount > 0 && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm flex items-center gap-2">
          <span className="font-semibold">⚠ มีงาน PM เกินกำหนด {overdueCount} รายการ</span>
        </div>
      )}

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-400" /> เกินกำหนด
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-400" /> ใกล้ถึงกำหนด (7 วัน)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-emerald-400" /> ปกติ
        </span>
      </div>

      {/* Table */}
      <div className="mt-4 rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-4 py-3 font-medium">ชื่องาน</th>
              <th className="text-left px-4 py-3 font-medium">ประเภทอุปกรณ์</th>
              <th className="text-left px-4 py-3 font-medium">สถานที่</th>
              <th className="text-right px-4 py-3 font-medium">ความถี่</th>
              <th className="text-left px-4 py-3 font-medium">ทำล่าสุด</th>
              <th className="text-left px-4 py-3 font-medium">ถึงกำหนด</th>
              <th className="text-left px-4 py-3 font-medium">ผู้รับผิดชอบ</th>
              <th className="text-left px-4 py-3 font-medium">สถานะ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-muted-foreground">
                  ยังไม่มีตาราง PM — กด "เพิ่ม PM" เพื่อเริ่มต้น
                </td>
              </tr>
            )}
            {tasks.map((task) => {
              const rowColor = getRowColor(task.next_due_at);
              const badge = getDueBadge(task.next_due_at);
              return (
                <tr
                  key={task.id}
                  className={cn(
                    'border-b border-border last:border-0 transition-colors',
                    rowColor
                  )}
                >
                  <td className="px-4 py-3 font-medium max-w-[200px]">
                    <div className="truncate">{task.title}</div>
                    {task.description && (
                      <div className="text-xs text-muted-foreground truncate">
                        {task.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {task.equipment_type ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {task.location ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    ทุก {task.frequency_days} วัน
                  </td>
                  <td className="px-4 py-3">
                    {task.last_done_at
                      ? format(new Date(task.last_done_at), 'd MMM yy', { locale: th })
                      : '—'}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {format(new Date(task.next_due_at), 'd MMM yy', { locale: th })}
                  </td>
                  <td className="px-4 py-3">
                    {task.assigned_staff?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        badge.className
                      )}
                    >
                      {badge.text}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                      disabled={saving}
                      onClick={() => markDone(task)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      บันทึกทำแล้ว
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add PM Modal ── */}
      <Dialog
        open={showAdd}
        onOpenChange={(o) => { if (!o) { setShowAdd(false); setForm(DEFAULT_FORM); } }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>เพิ่มงาน PM ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">ชื่องาน *</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="เช่น ตรวจสอบระบบแอร์ชั้น 3"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">รายละเอียด</label>
              <textarea
                rows={2}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background resize-none"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">ประเภทอุปกรณ์</label>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.equipment_type}
                  onChange={(e) => setForm((p) => ({ ...p, equipment_type: e.target.value }))}
                  placeholder="แอร์, ลิฟต์, เครื่องสูบน้ำ..."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">สถานที่</label>
                <input
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.location}
                  onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                  placeholder="ชั้น 1 / ห้องเครื่อง"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">ความถี่ (วัน) *</label>
                <input
                  type="number"
                  min={1}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.frequency_days}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, frequency_days: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">มอบหมายให้</label>
                <select
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                  value={form.assigned_to}
                  onChange={(e) => setForm((p) => ({ ...p, assigned_to: e.target.value }))}
                >
                  <option value="">— ยังไม่มอบหมาย —</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name ?? 'ไม่มีชื่อ'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Checklist */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">รายการตรวจสอบ</label>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={addChecklistItem}
                >
                  <Plus className="h-3.5 w-3.5" />
                  เพิ่ม
                </Button>
              </div>
              <div className="space-y-2">
                {form.checklist.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background"
                      value={item}
                      onChange={(e) => updateChecklistItem(idx, e.target.value)}
                      placeholder={`รายการที่ ${idx + 1}`}
                    />
                    {form.checklist.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeChecklistItem(idx)}
                        className="text-muted-foreground hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowAdd(false); setForm(DEFAULT_FORM); }}
            >
              ยกเลิก
            </Button>
            <Button onClick={createPM} disabled={saving}>
              สร้าง PM
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
