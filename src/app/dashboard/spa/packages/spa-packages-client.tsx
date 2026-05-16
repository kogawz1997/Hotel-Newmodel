'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Flower2, Plus, Pencil, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

type SpaService = { id: string; name: string; price: number; duration_min: number };
type RoomType = { id: string; name: string; base_price: number };
type PackageItem = { spa_service_id: string; spa_services: { name: string; price: number; duration_min: number } | null };
type SpaPackage = {
  id: string; name: string; description?: string; price: number;
  discount_pct?: number; nights?: number; active: boolean;
  room_type_id?: string; spa_package_items: PackageItem[];
};

const EMPTY_FORM = { name: '', description: '', price: '', discountPct: '', nights: '1', roomTypeId: '', serviceIds: [] as string[], active: true };

export function SpaPackagesClient({ hotelId, packages: initPkgs, services, roomTypes }: {
  hotelId: string; packages: SpaPackage[]; services: SpaService[]; roomTypes: RoomType[];
}) {
  const supabase = createClient();
  const [packages, setPackages] = useState(initPkgs);
  const [showForm, setShowForm] = useState(false);
  const [editPkg, setEditPkg] = useState<SpaPackage | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditPkg(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(pkg: SpaPackage) {
    setEditPkg(pkg);
    setForm({
      name: pkg.name, description: pkg.description || '',
      price: String(pkg.price), discountPct: String(pkg.discount_pct || ''),
      nights: String(pkg.nights || 1), roomTypeId: pkg.room_type_id || '',
      serviceIds: pkg.spa_package_items.map(i => i.spa_service_id), active: pkg.active,
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.name || !form.price) { toast.error('กรอกชื่อและราคา'); return; }
    setSaving(true);
    const payload = {
      hotel_id: hotelId, name: form.name, description: form.description || null,
      price: Number(form.price), discount_pct: form.discountPct ? Number(form.discountPct) : null,
      nights: Number(form.nights), room_type_id: form.roomTypeId || null, active: form.active,
    };
    let pkgId: string;
    if (editPkg) {
      const { error } = await supabase.from('spa_packages').update(payload).eq('id', editPkg.id);
      if (error) { setSaving(false); toast.error('แก้ไขไม่สำเร็จ'); return; }
      pkgId = editPkg.id;
      await supabase.from('spa_package_items').delete().eq('package_id', pkgId);
    } else {
      const { data, error } = await supabase.from('spa_packages').insert(payload).select('id').single();
      if (error || !data) { setSaving(false); toast.error('บันทึกไม่สำเร็จ'); return; }
      pkgId = data.id;
    }
    if (form.serviceIds.length > 0) {
      await supabase.from('spa_package_items').insert(form.serviceIds.map(sid => ({ hotel_id: hotelId, package_id: pkgId, spa_service_id: sid })));
    }
    setSaving(false);
    toast.success(editPkg ? 'แก้ไขแพ็กเกจแล้ว' : 'เพิ่มแพ็กเกจแล้ว');
    setShowForm(false);
    window.location.reload();
  }

  async function deletePkg(id: string) {
    await supabase.from('spa_packages').delete().eq('id', id);
    setPackages(p => p.filter(pkg => pkg.id !== id));
    toast.success('ลบแพ็กเกจแล้ว');
  }

  function toggleService(id: string) {
    setForm(p => ({
      ...p,
      serviceIds: p.serviceIds.includes(id) ? p.serviceIds.filter(s => s !== id) : [...p.serviceIds, id],
    }));
  }

  const selectedServices = services.filter(s => form.serviceIds.includes(s.id));
  const spaTotal = selectedServices.reduce((s, svc) => s + svc.price, 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openCreate}><Plus className="h-3.5 w-3.5" />สร้างแพ็กเกจ</Button>
      </div>

      {packages.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">ยังไม่มีแพ็กเกจ</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {packages.map(pkg => {
            const roomType = roomTypes.find(r => r.id === pkg.room_type_id);
            const svcTotal = pkg.spa_package_items.reduce((s, i) => s + (i.spa_services?.price || 0), 0);
            const roomTotal = roomType ? roomType.base_price * (pkg.nights || 1) : 0;
            const originalTotal = svcTotal + roomTotal;
            const saving_amount = originalTotal > 0 ? originalTotal - pkg.price : 0;
            return (
              <Card key={pkg.id} className={pkg.active ? '' : 'opacity-60'}>
                <CardHeader className="pb-2 flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Flower2 className="h-4 w-4 text-pink-500" />{pkg.name}
                    </CardTitle>
                    {pkg.description && <p className="text-xs text-muted-foreground mt-0.5">{pkg.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(pkg)} aria-label="แก้ไข" className="p-1 rounded hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deletePkg(pkg.id)} aria-label="ลบ" className="p-1 rounded hover:bg-secondary text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {roomType && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-3.5 w-3.5" />
                        <span>{roomType.name} × {pkg.nights || 1} คืน</span>
                      </div>
                    )}
                    {pkg.spa_package_items.map(i => (
                      <div key={i.spa_service_id} className="flex items-center gap-2 text-muted-foreground">
                        <Flower2 className="h-3.5 w-3.5" />
                        <span>{i.spa_services?.name || '—'} ({i.spa_services?.duration_min || 0} นาที)</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div>
                      <p className="text-lg font-bold">{formatCurrency(pkg.price)}</p>
                      {saving_amount > 0 && (
                        <p className="text-xs text-emerald-600">ประหยัด {formatCurrency(saving_amount)} ({Math.round((saving_amount / originalTotal) * 100)}%)</p>
                      )}
                    </div>
                    <Badge className={pkg.active ? 'bg-emerald-100 text-emerald-700 border-0' : 'bg-secondary text-muted-foreground border-0'}>
                      {pkg.active ? 'เปิดขาย' : 'ปิด'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={o => !o && setShowForm(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editPkg ? 'แก้ไขแพ็กเกจ' : 'สร้างแพ็กเกจใหม่'}</DialogTitle></DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ชื่อแพ็กเกจ *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">คำอธิบาย</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">ราคาแพ็กเกจ (฿) *</label>
                <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">จำนวนคืน</label>
                <input type="number" min={1} value={form.nights} onChange={e => setForm(p => ({ ...p, nights: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ประเภทห้อง</label>
              <select value={form.roomTypeId} onChange={e => setForm(p => ({ ...p, roomTypeId: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">— ไม่รวมห้อง —</option>
                {roomTypes.map(r => <option key={r.id} value={r.id}>{r.name} ({formatCurrency(r.base_price)}/คืน)</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-2">บริการ Spa ที่รวม</label>
              <div className="grid grid-cols-2 gap-2">
                {services.map(s => (
                  <label key={s.id} className="flex items-center gap-2 cursor-pointer rounded-lg border border-border p-2 hover:bg-secondary/50">
                    <input type="checkbox" checked={form.serviceIds.includes(s.id)} onChange={() => toggleService(s.id)}
                      className="rounded" />
                    <div>
                      <p className="text-xs font-medium">{s.name}</p>
                      <p className="text-2xs text-muted-foreground">{s.duration_min} นาที · {formatCurrency(s.price)}</p>
                    </div>
                  </label>
                ))}
              </div>
              {selectedServices.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">รวมค่า Spa: {formatCurrency(spaTotal)}</p>
              )}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => setForm(p => ({ ...p, active: e.target.checked }))} className="rounded" />
              <span className="text-sm">เปิดขาย</span>
            </label>
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
