'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Compass, Plus, Users, MapPin, Calendar, Phone, Check, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

const ACTIVITY_TYPES = ['ทัวร์เมือง', 'ดำน้ำ / Snorkeling', 'ATV / Off-road', 'ล่องเรือ', 'ปีนเขา / Hiking', 'คูกกิ้งคลาส', 'มวยไทย', 'Yoga / ทำสมาธิ', 'ช็อปปิ้งทัวร์', 'อื่นๆ'];
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'รอยืนยัน', color: 'bg-amber-100 text-amber-700' },
  confirmed:  { label: 'ยืนยันแล้ว', color: 'bg-emerald-100 text-emerald-700' },
  completed:  { label: 'เสร็จสิ้น', color: 'bg-secondary text-muted-foreground' },
  cancelled:  { label: 'ยกเลิก', color: 'bg-red-100 text-red-600' },
};
const EMPTY = { guestName: '', phone: '', activityType: ACTIVITY_TYPES[0], date: '', time: '09:00', pax: 2, price: '', location: '', notes: '', supplierContact: '' };

export function ActivitiesClient({ hotelId, initial }: { hotelId: string; initial: any[] }) {
  const supabase = createClient();
  const [activities, setActivities] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!form.guestName || !form.date) { toast.error('กรอกข้อมูลให้ครบ'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('concierge_bookings').insert({
      hotel_id: hotelId, guest_name: form.guestName, phone: form.phone || null,
      activity_type: form.activityType, activity_date: form.date, activity_time: form.time,
      pax: form.pax, price: form.price ? Number(form.price) : null,
      location: form.location || null, notes: form.notes || null,
      supplier_contact: form.supplierContact || null, status: 'confirmed',
    }).select().single();
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    setActivities(p => [...p, data].sort((a: any, b: any) => a.activity_date.localeCompare(b.activity_date)));
    setShowForm(false); setForm(EMPTY);
    toast.success('จองกิจกรรมแล้ว');
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('concierge_bookings').update({ status }).eq('id', id);
    setActivities(p => p.map(a => a.id === id ? { ...a, status } : a));
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-3.5 w-3.5" />จองกิจกรรม</Button>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">ยังไม่มีการจองกิจกรรม</div>
      ) : (
        <div className="space-y-3">
          {activities.map(a => {
            const cfg = STATUS_CFG[a.status] || STATUS_CFG.pending;
            return (
              <Card key={a.id}>
                <CardContent className="p-4 flex items-start gap-3">
                  <Compass className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{a.activity_type}</span>
                      <Badge className={`text-2xs border-0 ${cfg.color}`}>{cfg.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.guest_name} · {a.pax} คน</p>
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{a.activity_date} {a.activity_time}</span>
                      {a.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{a.location}</span>}
                      {a.price && <span>{formatCurrency(a.price)}</span>}
                    </div>
                    {a.notes && <p className="text-xs text-muted-foreground mt-1">{a.notes}</p>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {a.status === 'confirmed' && (
                      <>
                        <button onClick={() => updateStatus(a.id, 'completed')} aria-label="เสร็จสิ้น" className="p-1 rounded hover:bg-secondary text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => updateStatus(a.id, 'cancelled')} aria-label="ยกเลิก" className="p-1 rounded hover:bg-secondary text-red-500"><X className="h-3.5 w-3.5" /></button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={o => !o && setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>จองกิจกรรม / ทัวร์</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground block mb-1">ชื่อแขก *</label>
              <input value={form.guestName} onChange={e => setForm(p => ({ ...p, guestName: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground block mb-1">ประเภทกิจกรรม</label>
              <select value={form.activityType} onChange={e => setForm(p => ({ ...p, activityType: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {ACTIVITY_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="text-xs text-muted-foreground block mb-1">วันที่ *</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">เวลา</label>
              <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">จำนวนคน</label>
              <input type="number" min={1} value={form.pax} onChange={e => setForm(p => ({ ...p, pax: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs text-muted-foreground block mb-1">ราคา (฿)</label>
              <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div style={{ gridColumn: 'span 2' }}><label className="text-xs text-muted-foreground block mb-1">สถานที่ / จุดนัดพบ</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div style={{ gridColumn: 'span 2' }}><label className="text-xs text-muted-foreground block mb-1">หมายเหตุ</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>ยกเลิก</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
