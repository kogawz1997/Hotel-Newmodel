'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UtensilsCrossed, Plus, Users, Phone, Clock, AlertCircle, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:    { label: 'รอยืนยัน', color: 'bg-amber-100 text-amber-700' },
  confirmed:  { label: 'ยืนยันแล้ว', color: 'bg-emerald-100 text-emerald-700' },
  seated:     { label: 'นั่งแล้ว', color: 'bg-blue-100 text-blue-700' },
  completed:  { label: 'เสร็จสิ้น', color: 'bg-secondary text-muted-foreground' },
  cancelled:  { label: 'ยกเลิก', color: 'bg-red-100 text-red-600' },
  no_show:    { label: 'ไม่มา', color: 'bg-red-50 text-red-400' },
};

const TIMES = Array.from({ length: 28 }, (_, i) => {
  const h = Math.floor(i / 2) + 10;
  const m = i % 2 === 0 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
}).filter(t => t <= '23:00');

const EMPTY = { guestName: '', phone: '', partySize: 2, date: new Date().toISOString().slice(0, 10), time: '19:00', tableNo: '', notes: '', dietary: '' };

export function TableReservationsClient({ hotelId, initial }: { hotelId: string; initial: any[] }) {
  const supabase = createClient();
  const [reservations, setReservations] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!form.guestName || !form.date || !form.time) { toast.error('กรอกข้อมูลให้ครบ'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('table_reservations').insert({
      hotel_id: hotelId,
      guest_name: form.guestName,
      phone: form.phone || null,
      party_size: form.partySize,
      reservation_date: form.date,
      reservation_time: form.time,
      table_number: form.tableNo || null,
      notes: form.notes || null,
      dietary_notes: form.dietary || null,
      status: 'confirmed',
    }).select().single();
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    setReservations(p => [...p, data].sort((a: any, b: any) => `${a.reservation_date}T${a.reservation_time}`.localeCompare(`${b.reservation_date}T${b.reservation_time}`)));
    setShowForm(false);
    setForm(EMPTY);
    toast.success('จองโต๊ะแล้ว');
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('table_reservations').update({ status }).eq('id', id);
    setReservations(p => p.map(r => r.id === id ? { ...r, status } : r));
  }

  const grouped: Record<string, any[]> = {};
  reservations.forEach(r => {
    const k = r.reservation_date;
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(r);
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="h-3.5 w-3.5" />จองโต๊ะใหม่</Button>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">ยังไม่มีการจองโต๊ะ</div>
      ) : (
        Object.entries(grouped).map(([date, rsvs]) => (
          <Card key={date}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{format(parseISO(date), 'EEEE d MMMM yyyy', { locale: th })}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {rsvs.map(r => {
                  const cfg = STATUS_CFG[r.status] || STATUS_CFG.pending;
                  return (
                    <div key={r.id} className={cn('flex items-center gap-3 px-4 py-3', r.status === 'cancelled' && 'opacity-50')}>
                      <Clock className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{r.guest_name}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Users className="h-3 w-3" />{r.party_size} คน</span>
                          <span className="text-xs text-muted-foreground">{r.reservation_time}</span>
                          {r.table_number && <span className="text-xs text-muted-foreground">โต๊ะ {r.table_number}</span>}
                        </div>
                        {r.phone && <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" />{r.phone}</p>}
                        {r.dietary_notes && <p className="text-xs text-amber-700 flex items-center gap-1 mt-0.5"><AlertCircle className="h-3 w-3" />อาหาร: {r.dietary_notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge className={cn('text-2xs border-0', cfg.color)}>{cfg.label}</Badge>
                        {r.status === 'confirmed' && (
                          <>
                            <button onClick={() => updateStatus(r.id, 'seated')} aria-label="นั่งแล้ว" className="p-1 rounded hover:bg-secondary text-emerald-600"><Check className="h-3.5 w-3.5" /></button>
                            <button onClick={() => updateStatus(r.id, 'no_show')} aria-label="ไม่มา" className="p-1 rounded hover:bg-secondary text-red-500"><X className="h-3.5 w-3.5" /></button>
                          </>
                        )}
                        {r.status === 'seated' && (
                          <button onClick={() => updateStatus(r.id, 'completed')} aria-label="เสร็จสิ้น" className="p-1 rounded hover:bg-secondary text-blue-600"><Check className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={showForm} onOpenChange={o => !o && setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>จองโต๊ะใหม่</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { key: 'guestName', label: 'ชื่อแขก *', col: 2 },
              { key: 'phone', label: 'เบอร์โทร', type: 'tel' },
              { key: 'tableNo', label: 'หมายเลขโต๊ะ' },
            ].map(({ key, label, type = 'text', col }) => (
              <div key={key} style={{ gridColumn: col === 2 ? 'span 2' : undefined }}>
                <label className="text-xs text-muted-foreground block mb-1">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground block mb-1">จำนวนคน</label>
              <input type="number" min={1} max={50} value={form.partySize} onChange={e => setForm(p => ({ ...p, partySize: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">เวลา</label>
              <select value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {TIMES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground block mb-1">วันที่</label>
              <input type="date" value={form.date} min={new Date().toISOString().slice(0, 10)} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground block mb-1">ข้อมูลอาหาร / แพ้อาหาร</label>
              <input type="text" value={form.dietary} onChange={e => setForm(p => ({ ...p, dietary: e.target.value }))}
                placeholder="เช่น มังสวิรัติ, แพ้ถั่ว..."
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground block mb-1">หมายเหตุ</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>ยกเลิก</Button>
            <Button onClick={add} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'จองโต๊ะ'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
