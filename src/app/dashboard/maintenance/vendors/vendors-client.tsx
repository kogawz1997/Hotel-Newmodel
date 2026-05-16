'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Phone, Mail, Globe2, Plus, Pencil, Trash2, Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['plumbing', 'electrical', 'ac', 'elevator', 'cleaning', 'laundry', 'pest_control', 'landscaping', 'it', 'security', 'food_supply', 'linens', 'other'];
const CAT_LABELS: Record<string, string> = {
  plumbing: 'ประปา', electrical: 'ไฟฟ้า', ac: 'แอร์', elevator: 'ลิฟต์',
  cleaning: 'ความสะอาด', laundry: 'ซักรีด', pest_control: 'กำจัดแมลง',
  landscaping: 'สวน', it: 'IT', security: 'รักษาความปลอดภัย',
  food_supply: 'อาหาร/วัตถุดิบ', linens: 'ผ้า/เครื่องนอน', other: 'อื่นๆ',
};

const EMPTY = { name: '', category: 'other', contact_name: '', phone: '', email: '', website: '', notes: '', contract_value: '', contract_end: '' };

export function VendorsClient({ hotelId, initial }: { hotelId: string; initial: any[] }) {
  const supabase = createClient();
  const [vendors, setVendors] = useState(initial);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('all');

  function openNew() { setEditing(null); setForm(EMPTY); setShowForm(true); }
  function openEdit(v: any) { setEditing(v); setForm({ ...EMPTY, ...v, contract_value: String(v.contract_value || ''), contract_end: v.contract_end || '' }); setShowForm(true); }

  async function save() {
    if (!form.name) { toast.error('กรอกชื่อ Vendor ก่อน'); return; }
    setSaving(true);
    const payload = { hotel_id: hotelId, ...form, contract_value: form.contract_value ? Number(form.contract_value) : null, contract_end: form.contract_end || null };
    if (editing) {
      const { data, error } = await supabase.from('vendors').update(payload).eq('id', editing.id).select().single();
      if (error) { toast.error('บันทึกไม่สำเร็จ'); setSaving(false); return; }
      setVendors(p => p.map(v => v.id === editing.id ? data : v));
      toast.success('อัพเดต Vendor แล้ว');
    } else {
      const { data, error } = await supabase.from('vendors').insert(payload).select().single();
      if (error) { toast.error('บันทึกไม่สำเร็จ'); setSaving(false); return; }
      setVendors(p => [...p, data]);
      toast.success('เพิ่ม Vendor แล้ว');
    }
    setSaving(false);
    setShowForm(false);
  }

  async function remove(id: string) {
    if (!confirm('ลบ Vendor นี้?')) return;
    await supabase.from('vendors').delete().eq('id', id);
    setVendors(p => p.filter(v => v.id !== id));
    toast.success('ลบแล้ว');
  }

  const filtered = filterCat === 'all' ? vendors : vendors.filter(v => v.category === filterCat);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {['all', ...CATEGORIES.slice(0, 6)].map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`px-3 py-1 rounded-full text-xs transition ${filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}>
              {c === 'all' ? 'ทั้งหมด' : CAT_LABELS[c]}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={openNew}><Plus className="h-3.5 w-3.5" />เพิ่ม Vendor</Button>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">ยังไม่มี Vendor ในหมวดนี้</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(v => (
            <Card key={v.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium text-sm">{v.name}</p>
                    <Badge variant="outline" className="text-2xs mt-1">{CAT_LABELS[v.category] || v.category}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(v)} aria-label="แก้ไข" className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => remove(v.id)} aria-label="ลบ" className="p-1.5 rounded hover:bg-secondary text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {v.contact_name && <p className="flex items-center gap-1.5"><Building2 className="h-3 w-3" />{v.contact_name}</p>}
                  {v.phone && <a href={`tel:${v.phone}`} className="flex items-center gap-1.5 hover:text-foreground"><Phone className="h-3 w-3" />{v.phone}</a>}
                  {v.email && <a href={`mailto:${v.email}`} className="flex items-center gap-1.5 hover:text-foreground"><Mail className="h-3 w-3" />{v.email}</a>}
                  {v.contract_end && <p>สัญญาหมด: {v.contract_end}</p>}
                </div>
                {v.notes && <p className="mt-2 text-xs bg-secondary/50 rounded p-2 text-muted-foreground">{v.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showForm} onOpenChange={o => !o && setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'แก้ไข Vendor' : 'เพิ่ม Vendor ใหม่'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { key: 'name', label: 'ชื่อบริษัท/ร้าน *', col: 2 },
              { key: 'contact_name', label: 'ชื่อผู้ติดต่อ' },
              { key: 'phone', label: 'เบอร์โทร', type: 'tel' },
              { key: 'email', label: 'อีเมล', type: 'email', col: 2 },
              { key: 'website', label: 'Website', col: 2 },
              { key: 'contract_value', label: 'มูลค่าสัญญา (฿)', type: 'number' },
              { key: 'contract_end', label: 'สัญญาหมดอายุ', type: 'date' },
            ].map(({ key, label, type = 'text', col }) => (
              <div key={key} style={{ gridColumn: col === 2 ? 'span 2' : undefined }}>
                <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
                <input type={type} value={(form as any)[key]} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            ))}
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground mb-1 block">หมวดหมู่</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {CATEGORIES.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground mb-1 block">หมายเหตุ</label>
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
    </div>
  );
}
