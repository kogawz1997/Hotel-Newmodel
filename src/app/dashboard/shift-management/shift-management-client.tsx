'use client';
import { useState } from 'react';
import { Plus, Calendar } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const DAY_TH = ['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'];

export function ShiftManagementClient({ shifts: initShifts, staff, assignments: initAssignments, days, hotelId }: any) {
  const [shifts, setShifts] = useState<any[]>(initShifts);
  const [assignments, setAssignments] = useState<any[]>(initAssignments);
  const [showCreate, setShowCreate] = useState(false);
  const [showAssign, setShowAssign] = useState(false);
  const [form, setForm] = useState({ name: '', dept: '', start_time: '08:00', end_time: '17:00', color: '#6366f1' });
  const [assignForm, setAssignForm] = useState({ staffId: '', shiftId: '', workDate: days[0] ?? '' });
  const [saving, setSaving] = useState(false);

  function getAssignment(staffId: string, date: string) {
    return assignments.find((a: any) => a.staff_id === staffId && a.work_date === date);
  }

  async function createShift() {
    if (!form.name || !form.start_time || !form.end_time) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return; }
    setSaving(true);
    const res = await fetch('/api/shifts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error ?? 'สร้างกะไม่สำเร็จ'); return; }
    setShifts(prev => [...prev, data]);
    setShowCreate(false);
    setForm({ name: '', dept: '', start_time: '08:00', end_time: '17:00', color: '#6366f1' });
    toast.success('สร้างกะแล้ว');
  }

  async function assignShift() {
    if (!assignForm.staffId || !assignForm.shiftId || !assignForm.workDate) { toast.error('กรุณาเลือกข้อมูลให้ครบ'); return; }
    setSaving(true);
    const res = await fetch('/api/shifts/assign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ staffId: assignForm.staffId, shiftId: assignForm.shiftId, workDate: assignForm.workDate }) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error ?? 'มอบหมายกะไม่สำเร็จ'); return; }
    const shift = shifts.find((s: any) => s.id === assignForm.shiftId);
    const staffMember = staff.find((s: any) => s.id === assignForm.staffId);
    setAssignments((prev: any[]) => {
      const filtered = prev.filter((a: any) => !(a.staff_id === assignForm.staffId && a.work_date === assignForm.workDate));
      return [...filtered, { ...data, shifts: shift, staff: staffMember }];
    });
    setShowAssign(false);
    toast.success('มอบหมายกะแล้ว');
  }

  const dayLabels = days.map((d: string) => {
    const dt = new Date(d + 'T12:00:00');
    return { date: d, label: `${DAY_TH[dt.getDay() === 0 ? 6 : dt.getDay() - 1]} ${dt.getDate()}` };
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar title="จัดการกะงาน" description="ตารางกะประจำสัปดาห์" action={
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />สร้างกะ</Button>
          <Button size="sm" onClick={() => setShowAssign(true)}><Calendar className="h-4 w-4 mr-1" />มอบหมาย</Button>
        </div>
      } />
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Shift list */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">กะทั้งหมด</CardTitle></CardHeader>
          <CardContent>
            {shifts.length === 0 ? (
              <p className="text-sm text-muted-foreground">ยังไม่มีกะ — กดสร้างกะใหม่</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {shifts.map((s: any) => (
                  <div key={s.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border text-sm">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground text-xs">{s.start_time.slice(0,5)}–{s.end_time.slice(0,5)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly grid */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">ตารางสัปดาห์นี้</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground w-32">พนักงาน</th>
                  {dayLabels.map((d: any) => (
                    <th key={d.date} className="text-center py-2 px-1 font-medium text-muted-foreground min-w-[52px]">{d.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {staff.map((s: any) => (
                  <tr key={s.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 pr-3 font-medium truncate max-w-[120px]">{s.full_name}</td>
                    {dayLabels.map((d: any) => {
                      const a = getAssignment(s.id, d.date);
                      return (
                        <td key={d.date} className="text-center py-1 px-0.5">
                          {a ? (
                            <div className="rounded px-1 py-0.5 text-white text-center truncate" style={{ background: a.shifts?.color ?? '#6366f1', fontSize: '10px' }}>
                              {a.shifts?.name ?? '–'}
                            </div>
                          ) : <span className="text-muted-foreground/40">–</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
            {staff.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">ไม่มีพนักงาน</p>}
          </CardContent>
        </Card>
      </div>

      {/* Create shift dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>สร้างกะงานใหม่</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-muted-foreground">ชื่อกะ *</label>
              <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="เช่น เช้า, บ่าย, ดึก" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">แผนก (ไม่ระบุ = ทุกแผนก)</label>
              <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="เช่น housekeeping" value={form.dept} onChange={e => setForm(p => ({ ...p, dept: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-medium text-muted-foreground">เวลาเริ่ม</label>
                <input type="time" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.start_time} onChange={e => setForm(p => ({ ...p, start_time: e.target.value }))} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">เวลาสิ้นสุด</label>
                <input type="time" className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.end_time} onChange={e => setForm(p => ({ ...p, end_time: e.target.value }))} /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">สี</label>
              <input type="color" className="mt-1 h-9 w-full rounded-lg border border-border" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
            <Button onClick={createShift} disabled={saving}>{saving ? 'กำลังสร้าง...' : 'สร้างกะ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={showAssign} onOpenChange={setShowAssign}>
        <DialogContent>
          <DialogHeader><DialogTitle>มอบหมายกะงาน</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-muted-foreground">พนักงาน</label>
              <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={assignForm.staffId} onChange={e => setAssignForm(p => ({ ...p, staffId: e.target.value }))}>
                <option value="">เลือกพนักงาน</option>
                {staff.map((s: any) => <option key={s.id} value={s.id}>{s.full_name} ({s.role})</option>)}
              </select></div>
            <div><label className="text-xs font-medium text-muted-foreground">กะ</label>
              <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={assignForm.shiftId} onChange={e => setAssignForm(p => ({ ...p, shiftId: e.target.value }))}>
                <option value="">เลือกกะ</option>
                {shifts.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.start_time.slice(0,5)}–{s.end_time.slice(0,5)})</option>)}
              </select></div>
            <div><label className="text-xs font-medium text-muted-foreground">วันที่</label>
              <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={assignForm.workDate} onChange={e => setAssignForm(p => ({ ...p, workDate: e.target.value }))}>
                {dayLabels.map((d: any) => <option key={d.date} value={d.date}>{d.date} ({d.label})</option>)}
              </select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssign(false)}>ยกเลิก</Button>
            <Button onClick={assignShift} disabled={saving}>{saving ? 'กำลังมอบหมาย...' : 'มอบหมาย'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
