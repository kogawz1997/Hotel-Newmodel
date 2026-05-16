'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UtensilsCrossed, Plus, MapPin, Star, Phone, Calendar, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Restaurant = {
  id: string; name: string; cuisine: string; distance_km?: number;
  price_range: string; rating?: number; phone?: string; address?: string;
  opening_hours?: string; booking_url?: string; notes?: string; active: boolean;
};
type Guest = { id: string; guest_name: string; room_id?: string | null; rooms: { room_number: string } | null };

const CUISINES = ['ไทย', 'ญี่ปุ่น', 'อิตาเลียน', 'ซีฟู้ด', 'ฟาสต์ฟู้ด', 'บุฟเฟ่ต์', 'มังสวิรัติ', 'อื่นๆ'];
const PRICE_RANGES = ['฿', '฿฿', '฿฿฿', '฿฿฿฿'];
const EMPTY_FORM = { name: '', cuisine: CUISINES[0], distanceKm: '', priceRange: '฿฿', rating: '', phone: '', address: '', openingHours: '', bookingUrl: '', notes: '' };

export function RestaurantRecClient({ hotelId, restaurants: initRests, guests }: { hotelId: string; restaurants: Restaurant[]; guests: Guest[] }) {
  const supabase = createClient();
  const [restaurants, setRestaurants] = useState(initRests);
  const [showForm, setShowForm] = useState(false);
  const [editRest, setEditRest] = useState<Restaurant | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showBook, setShowBook] = useState<Restaurant | null>(null);
  const [bookForm, setBookForm] = useState({ guestId: '', date: '', time: '19:00', pax: 2, notes: '' });
  const [saving, setSaving] = useState(false);
  const [filterCuisine, setFilterCuisine] = useState('');

  const filtered = filterCuisine ? restaurants.filter(r => r.cuisine === filterCuisine) : restaurants;

  function openEdit(r: Restaurant) {
    setEditRest(r);
    setForm({ name: r.name, cuisine: r.cuisine, distanceKm: String(r.distance_km || ''), priceRange: r.price_range, rating: String(r.rating || ''), phone: r.phone || '', address: r.address || '', openingHours: r.opening_hours || '', bookingUrl: r.booking_url || '', notes: r.notes || '' });
    setShowForm(true);
  }

  async function save() {
    if (!form.name) { toast.error('กรอกชื่อร้าน'); return; }
    setSaving(true);
    const payload = { hotel_id: hotelId, name: form.name, cuisine: form.cuisine, distance_km: form.distanceKm ? Number(form.distanceKm) : null, price_range: form.priceRange, rating: form.rating ? Number(form.rating) : null, phone: form.phone || null, address: form.address || null, opening_hours: form.openingHours || null, booking_url: form.bookingUrl || null, notes: form.notes || null, active: true };
    if (editRest) {
      const { error } = await supabase.from('restaurant_recommendations').update(payload).eq('id', editRest.id);
      if (error) { setSaving(false); toast.error('แก้ไขไม่สำเร็จ'); return; }
      setRestaurants(p => p.map(r => r.id === editRest.id ? { ...r, ...payload } as any : r));
    } else {
      const { data, error } = await supabase.from('restaurant_recommendations').insert(payload).select().single();
      if (error) { setSaving(false); toast.error('บันทึกไม่สำเร็จ'); return; }
      setRestaurants(p => [...p, data]);
    }
    setSaving(false);
    setShowForm(false); setEditRest(null); setForm(EMPTY_FORM);
    toast.success(editRest ? 'แก้ไขแล้ว' : 'เพิ่มร้านแล้ว');
  }

  async function bookForGuest() {
    if (!bookForm.guestId || !bookForm.date) { toast.error('เลือกแขกและวันที่'); return; }
    const guest = guests.find(g => g.id === bookForm.guestId);
    setSaving(true);
    const { error } = await supabase.from('concierge_bookings').insert({
      hotel_id: hotelId, guest_name: guest?.guest_name || 'แขก',
      activity_type: 'ร้านอาหาร', activity_date: bookForm.date,
      activity_time: bookForm.time, pax: bookForm.pax,
      location: showBook?.name, notes: `${showBook?.address || ''} ${bookForm.notes}`.trim(),
      supplier_contact: showBook?.phone || null, status: 'confirmed',
    });
    setSaving(false);
    if (error) { toast.error('จองไม่สำเร็จ'); return; }
    setShowBook(null);
    setBookForm({ guestId: '', date: '', time: '19:00', pax: 2, notes: '' });
    toast.success('จองร้านอาหารให้แขกแล้ว');
  }

  async function deleteRest(id: string) {
    await supabase.from('restaurant_recommendations').delete().eq('id', id);
    setRestaurants(p => p.filter(r => r.id !== id));
    toast.success('ลบร้านแล้ว');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCuisine('')}
            className={cn('px-3 py-1.5 text-xs rounded-full transition-colors', !filterCuisine ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80')}>ทั้งหมด</button>
          {[...new Set(restaurants.map(r => r.cuisine))].map(c => (
            <button key={c} onClick={() => setFilterCuisine(c)}
              className={cn('px-3 py-1.5 text-xs rounded-full transition-colors', filterCuisine === c ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80')}>{c}</button>
          ))}
        </div>
        <Button size="sm" onClick={() => { setEditRest(null); setForm(EMPTY_FORM); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5" />เพิ่มร้าน
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">ยังไม่มีร้านอาหารแนะนำ</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-sm">{r.name}</h3>
                      <Badge className="bg-secondary text-muted-foreground border-0 text-2xs">{r.cuisine}</Badge>
                      <span className="text-xs text-muted-foreground">{r.price_range}</span>
                    </div>
                    {r.rating && (
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-amber-600">
                        <Star className="h-3 w-3 fill-current" />{r.rating.toFixed(1)}
                      </div>
                    )}
                    <div className="space-y-0.5 mt-2 text-xs text-muted-foreground">
                      {r.address && <p className="flex items-center gap-1"><MapPin className="h-3 w-3 shrink-0" />{r.address}{r.distance_km ? ` (${r.distance_km} กม.)` : ''}</p>}
                      {r.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{r.phone}</p>}
                      {r.opening_hours && <p>{r.opening_hours}</p>}
                      {r.notes && <p className="italic">{r.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(r)} aria-label="แก้ไข" className="p-1 rounded hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteRest(r.id)} aria-label="ลบ" className="p-1 rounded hover:bg-secondary text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <button
                  onClick={() => setShowBook(r)}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                  <Calendar className="h-3.5 w-3.5" />จองให้แขก
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit dialog */}
      <Dialog open={showForm} onOpenChange={o => !o && setShowForm(false)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editRest ? 'แก้ไขร้านอาหาร' : 'เพิ่มร้านอาหาร'}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ชื่อร้าน *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">ประเภทอาหาร</label>
                <select value={form.cuisine} onChange={e => setForm(p => ({ ...p, cuisine: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {CUISINES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">ระดับราคา</label>
                <select value={form.priceRange} onChange={e => setForm(p => ({ ...p, priceRange: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {PRICE_RANGES.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">คะแนน (1-5)</label>
                <input type="number" step="0.1" min="1" max="5" value={form.rating} onChange={e => setForm(p => ({ ...p, rating: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">ระยะทาง (กม.)</label>
                <input type="number" step="0.1" value={form.distanceKm} onChange={e => setForm(p => ({ ...p, distanceKm: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">เบอร์โทร</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ที่อยู่</label>
              <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">เวลาเปิด-ปิด</label>
              <input value={form.openingHours} onChange={e => setForm(p => ({ ...p, openingHours: e.target.value }))}
                placeholder="11:00–22:00"
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">หมายเหตุ / แนะนำ</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>ยกเลิก</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book for guest dialog */}
      <Dialog open={!!showBook} onOpenChange={o => !o && setShowBook(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>จองร้าน {showBook?.name} ให้แขก</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">แขก</label>
              <select value={bookForm.guestId} onChange={e => setBookForm(p => ({ ...p, guestId: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— เลือกแขก —</option>
                {guests.map(g => <option key={g.id} value={g.id}>{g.guest_name} (ห้อง {g.rooms?.room_number || '?'})</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">วันที่</label>
                <input type="date" value={bookForm.date} onChange={e => setBookForm(p => ({ ...p, date: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">เวลา</label>
                <input type="time" value={bookForm.time} onChange={e => setBookForm(p => ({ ...p, time: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">จำนวนคน</label>
              <input type="number" min={1} value={bookForm.pax} onChange={e => setBookForm(p => ({ ...p, pax: Number(e.target.value) }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">หมายเหตุ</label>
              <textarea value={bookForm.notes} onChange={e => setBookForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBook(null)}>ยกเลิก</Button>
            <Button onClick={bookForGuest} disabled={saving}>{saving ? 'กำลังจอง...' : 'จองให้แขก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
