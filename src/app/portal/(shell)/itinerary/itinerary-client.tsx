'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Plus, MapPin, Clock, Trash2, Plane, Utensils, Camera, Ticket, Car, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type ItineraryItem = { id: string; date: string; time?: string; title: string; category: string; location?: string; notes?: string; confirmed: boolean };
type Reservation = { id: string; check_in: string; check_out: string; guest_name: string; rooms: { room_number: string } | null };

const CATEGORIES = [
  { key: 'hotel', label: 'โรงแรม', icon: Star, color: 'bg-violet-100 text-violet-700' },
  { key: 'flight', label: 'เที่ยวบิน', icon: Plane, color: 'bg-sky-100 text-sky-700' },
  { key: 'restaurant', label: 'ร้านอาหาร', icon: Utensils, color: 'bg-amber-100 text-amber-700' },
  { key: 'activity', label: 'กิจกรรม', icon: Ticket, color: 'bg-emerald-100 text-emerald-700' },
  { key: 'sightseeing', label: 'ท่องเที่ยว', icon: Camera, color: 'bg-orange-100 text-orange-700' },
  { key: 'transport', label: 'การเดินทาง', icon: Car, color: 'bg-secondary text-muted-foreground' },
];

const EMPTY_FORM = { date: '', time: '', title: '', category: 'activity', location: '', notes: '' };

function getCategoryMeta(key: string) {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[3];
}

function getDates(checkIn: string, checkOut: string): string[] {
  const dates: string[] = [];
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

export function ItineraryClient({ reservation, items: initItems }: { reservation: Reservation; items: ItineraryItem[] }) {
  const supabase = createClient();
  const [items, setItems] = useState(initItems);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const dates = getDates(reservation.check_in, reservation.check_out);

  async function addItem() {
    if (!form.date || !form.title) { toast.error('กรอกวันที่และชื่อกิจกรรม'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('itinerary_items').insert({
      reservation_id: reservation.id,
      date: form.date, time: form.time || null, title: form.title,
      category: form.category, location: form.location || null,
      notes: form.notes || null, confirmed: false,
    }).select().single();
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    setItems(p => [...p, data].sort((a, b) => a.date.localeCompare(b.date) || (a.time || '').localeCompare(b.time || '')));
    setShowAdd(false); setForm(EMPTY_FORM);
    toast.success('เพิ่มกิจกรรมแล้ว');
  }

  async function deleteItem(id: string) {
    await supabase.from('itinerary_items').delete().eq('id', id);
    setItems(p => p.filter(i => i.id !== id));
    toast.success('ลบกิจกรรมแล้ว');
  }

  async function toggleConfirm(item: ItineraryItem) {
    await supabase.from('itinerary_items').update({ confirmed: !item.confirmed }).eq('id', item.id);
    setItems(p => p.map(i => i.id === item.id ? { ...i, confirmed: !i.confirmed } : i));
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="font-medium">{reservation.guest_name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(reservation.check_in).toLocaleDateString('th-TH', { dateStyle: 'medium' })} – {new Date(reservation.check_out).toLocaleDateString('th-TH', { dateStyle: 'medium' })}
              {reservation.rooms?.room_number && ` · ห้อง ${reservation.rooms.room_number}`}
            </p>
          </div>
          <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" />เพิ่มกิจกรรม</Button>
        </CardContent>
      </Card>

      {dates.map(date => {
        const dayItems = items.filter(i => i.date === date);
        const d = new Date(date + 'T12:00:00');
        const dayLabel = d.toLocaleDateString('th-TH', { weekday: 'long', month: 'short', day: 'numeric' });
        return (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="font-medium text-sm">{dayLabel}</h3>
            </div>
            {dayItems.length === 0 ? (
              <div className="border border-dashed border-border rounded-xl p-4 text-center text-sm text-muted-foreground">
                ยังไม่มีกิจกรรม
              </div>
            ) : (
              <div className="space-y-2">
                {dayItems.map(item => {
                  const meta = getCategoryMeta(item.category);
                  const Icon = meta.icon;
                  return (
                    <Card key={item.id} className={cn(item.confirmed ? 'opacity-70' : '')}>
                      <CardContent className="p-3 flex items-start gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${meta.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={cn('font-medium text-sm', item.confirmed && 'line-through text-muted-foreground')}>{item.title}</p>
                            <Badge className={`${meta.color} border-0 text-2xs`}>{meta.label}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-0.5 text-xs text-muted-foreground">
                            {item.time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{item.time}</span>}
                            {item.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.location}</span>}
                          </div>
                          {item.notes && <p className="text-xs text-muted-foreground mt-0.5 italic">{item.notes}</p>}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => toggleConfirm(item)} aria-label="ทำเครื่องหมายเสร็จ"
                            className={cn('p-1 rounded transition-colors', item.confirmed ? 'text-emerald-500' : 'text-muted-foreground hover:text-emerald-500')}>
                            <Star className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteItem(item.id)} aria-label="ลบ"
                            className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <Dialog open={showAdd} onOpenChange={o => !o && setShowAdd(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>เพิ่มกิจกรรม</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ชื่อกิจกรรม *</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">ประเภท</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.key} onClick={() => setForm(p => ({ ...p, category: c.key }))}
                    className={cn('px-2.5 py-1 text-xs rounded-full transition-colors', form.category === c.key ? c.color + ' font-medium' : 'bg-secondary text-muted-foreground hover:bg-secondary/80')}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">วันที่ *</label>
                <select value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">— เลือกวัน —</option>
                  {dates.map(d => <option key={d} value={d}>{new Date(d + 'T12:00:00').toLocaleDateString('th-TH', { weekday: 'short', month: 'short', day: 'numeric' })}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">เวลา</label>
                <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">สถานที่</label>
              <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">หมายเหตุ</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
            <Button onClick={addItem} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
