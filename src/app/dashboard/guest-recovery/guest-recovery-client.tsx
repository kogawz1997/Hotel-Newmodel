'use client';
import { useState } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { HeartHandshake } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  pending: { label: 'รอดำเนินการ', cls: 'bg-amber-100 text-amber-700' },
  in_progress: { label: 'กำลังแก้ไข', cls: 'bg-blue-100 text-blue-700' },
  done: { label: 'แก้ไขแล้ว', cls: 'bg-emerald-100 text-emerald-700' },
};

const COMPENSATIONS = ['ส่วนลดค่าห้อง', 'ยกเว้นค่า minibar', 'ของขวัญต้อนรับ', 'อัพเกรดห้อง', 'คืนเงินบางส่วน', 'ส่ง sorry letter'];

export function GuestRecoveryClient({ complaints: init, hotelId, profile }: any) {
  const [complaints, setComplaints] = useState<any[]>(init);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [form, setForm] = useState({ title: '', description: '', guest_name: '', room_no: '', priority: 'normal' });
  const [resolution, setResolution] = useState('');
  const [compensation, setCompensation] = useState('');
  const [saving, setSaving] = useState(false);

  async function createComplaint() {
    if (!form.title.trim()) { toast.error('กรุณากรอกชื่อเรื่องร้องเรียน'); return; }
    setSaving(true);
    const res = await fetch('/api/work-orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: 'concierge', source: 'manual' }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error); return; }
    setComplaints(prev => [data, ...prev]);
    setShowNew(false);
    setForm({ title: '', description: '', guest_name: '', room_no: '', priority: 'normal' });
    toast.success('บันทึกเรื่องร้องเรียนแล้ว');
  }

  async function resolve() {
    if (!selected) return;
    setSaving(true);
    const notes = [resolution, compensation ? `ค่าชดเชย: ${compensation}` : ''].filter(Boolean).join('\n');
    await fetch(`/api/work-orders/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'done', notes }),
    });
    setSaving(false);
    setComplaints(prev => prev.map(c => c.id === selected.id ? { ...c, status: 'done', notes } : c));
    setSelected(null); setResolution(''); setCompensation('');
    toast.success('แก้ไขเรื่องร้องเรียนแล้ว');
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar title="Guest Recovery" description="จัดการเรื่องร้องเรียนและการชดเชย" action={
        <Button size="sm" onClick={() => setShowNew(true)}>+ บันทึกเรื่องร้องเรียน</Button>
      } />
      <div className="flex-1 p-4 md:p-6 space-y-3">
        {complaints.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground"><HeartHandshake className="h-8 w-8 mx-auto mb-2 opacity-30" /><p className="text-sm">ไม่มีเรื่องร้องเรียน</p></div>
        ) : complaints.map((c: any) => {
          const st = STATUS_CFG[c.status] ?? STATUS_CFG.pending;
          return (
            <Card key={c.id} className="cursor-pointer hover:shadow-sm transition-shadow" onClick={() => { if (c.status !== 'done') setSelected(c); }}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-muted-foreground">{c.guest_name ? `${c.guest_name}${c.room_no ? ` • ห้อง ${c.room_no}` : ''}` : 'ไม่ระบุ guest'}</p>
                    {c.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.description}</p>}
                    {c.notes && c.status === 'done' && <p className="text-xs text-emerald-600 mt-1">✓ {c.notes}</p>}
                  </div>
                  <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium shrink-0', st.cls)}>{st.label}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader><DialogTitle>บันทึกเรื่องร้องเรียน</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-xs font-medium text-muted-foreground">เรื่อง *</label>
              <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="เช่น ร้องเรียนเสียงดัง" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-xs font-medium text-muted-foreground">ชื่อ guest</label>
                <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.guest_name} onChange={e => setForm(p => ({ ...p, guest_name: e.target.value }))} /></div>
              <div><label className="text-xs font-medium text-muted-foreground">ห้อง</label>
                <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.room_no} onChange={e => setForm(p => ({ ...p, room_no: e.target.value }))} /></div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground">รายละเอียด</label>
              <textarea className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">ความเร่งด่วน</label>
              <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">ต่ำ</option><option value="normal">ปกติ</option><option value="high">เร่งด่วน</option><option value="urgent">วิกฤต</option>
              </select></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>ยกเลิก</Button>
            <Button onClick={createComplaint} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>แก้ไขเรื่องร้องเรียน</DialogTitle></DialogHeader>
          {selected && <div className="space-y-3">
            <p className="text-sm font-medium">{selected.title}</p>
            <div><label className="text-xs font-medium text-muted-foreground">วิธีแก้ไข</label>
              <textarea className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" rows={3} placeholder="อธิบายการแก้ไข..." value={resolution} onChange={e => setResolution(e.target.value)} /></div>
            <div><label className="text-xs font-medium text-muted-foreground">ค่าชดเชย (ถ้ามี)</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {COMPENSATIONS.map(c => (
                  <button key={c} onClick={() => setCompensation(prev => prev === c ? '' : c)} className={cn('px-2 py-1 rounded-lg text-xs border transition-colors', compensation === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary')}>{c}</button>
                ))}
              </div></div>
          </div>}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>ยกเลิก</Button>
            <Button onClick={resolve} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
