'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TrendingDown, TrendingUp, Plus, Pencil, Trash2, AlertTriangle, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';

type Rate = { id: string; competitor_name: string; room_type_label: string; our_rate: number; their_rate: number; check_date: string; source: string; notes?: string };
type RoomType = { id: string; name: string; base_price: number };

const SOURCES = ['Booking.com', 'Agoda', 'Expedia', 'Hotels.com', 'Direct', 'อื่นๆ'];
const EMPTY_FORM = { competitorName: '', roomTypeLabel: '', ourRate: '', theirRate: '', checkDate: new Date().toISOString().slice(0, 10), source: SOURCES[0], notes: '' };

export function CompetitorClient({ hotelId, rates: initRates, roomTypes, currency }: { hotelId: string; rates: Rate[]; roomTypes: RoomType[]; currency: string }) {
  const supabase = createClient();
  const [rates, setRates] = useState(initRates);
  const [showForm, setShowForm] = useState(false);
  const [editRate, setEditRate] = useState<Rate | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const competitors = useMemo(() => [...new Set(rates.map(r => r.competitor_name))], [rates]);

  const avgPositioning = useMemo(() => {
    if (!rates.length) return null;
    const diffs = rates.map(r => ((r.our_rate - r.their_rate) / r.their_rate) * 100);
    return diffs.reduce((s, d) => s + d, 0) / diffs.length;
  }, [rates]);

  const cheaper = rates.filter(r => r.their_rate < r.our_rate * 0.95).length;
  const similar = rates.filter(r => Math.abs(r.their_rate - r.our_rate) / r.our_rate <= 0.05).length;
  const moreExpensive = rates.filter(r => r.their_rate > r.our_rate * 1.05).length;

  function openEdit(r: Rate) {
    setEditRate(r);
    setForm({ competitorName: r.competitor_name, roomTypeLabel: r.room_type_label, ourRate: String(r.our_rate), theirRate: String(r.their_rate), checkDate: r.check_date, source: r.source, notes: r.notes || '' });
    setShowForm(true);
  }

  async function save() {
    if (!form.competitorName || !form.ourRate || !form.theirRate) { toast.error('กรอกข้อมูลให้ครบ'); return; }
    setSaving(true);
    const payload = { hotel_id: hotelId, competitor_name: form.competitorName, room_type_label: form.roomTypeLabel || 'Standard', our_rate: Number(form.ourRate), their_rate: Number(form.theirRate), check_date: form.checkDate, source: form.source, notes: form.notes || null };
    if (editRate) {
      const { error } = await supabase.from('competitor_rates').update(payload).eq('id', editRate.id);
      if (error) { setSaving(false); toast.error('แก้ไขไม่สำเร็จ'); return; }
      setRates(p => p.map(r => r.id === editRate.id ? { ...r, ...payload } as any : r));
    } else {
      const { data, error } = await supabase.from('competitor_rates').insert(payload).select().single();
      if (error) { setSaving(false); toast.error('บันทึกไม่สำเร็จ'); return; }
      setRates(p => [...p, data]);
    }
    setSaving(false);
    setShowForm(false); setEditRate(null); setForm(EMPTY_FORM);
    toast.success(editRate ? 'แก้ไขแล้ว' : 'บันทึกแล้ว');
  }

  async function deleteRate(id: string) {
    await supabase.from('competitor_rates').delete().eq('id', id);
    setRates(p => p.filter(r => r.id !== id));
    toast.success('ลบแล้ว');
  }

  function getDiffBadge(our: number, their: number) {
    const diff = ((their - our) / our) * 100;
    if (diff < -5) return { label: `คู่แข่งถูกกว่า ${Math.abs(Math.round(diff))}%`, color: 'bg-red-100 text-red-700', icon: TrendingDown };
    if (diff > 5) return { label: `คู่แข่งแพงกว่า ${Math.round(diff)}%`, color: 'bg-emerald-100 text-emerald-700', icon: TrendingUp };
    return { label: 'ราคาใกล้เคียง', color: 'bg-secondary text-muted-foreground', icon: null };
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5" />Positioning เฉลี่ย</div>
          <div className={cn('text-xl font-bold', avgPositioning === null ? '' : avgPositioning > 0 ? 'text-red-600' : 'text-emerald-600')}>
            {avgPositioning === null ? '—' : `${avgPositioning > 0 ? '+' : ''}${Math.round(avgPositioning)}%`}
          </div>
          <div className="text-xs text-muted-foreground">{avgPositioning === null ? 'ยังไม่มีข้อมูล' : avgPositioning > 0 ? 'เราแพงกว่า' : 'เราถูกกว่า'}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground mb-1">คู่แข่งถูกกว่า</div>
          <div className="text-xl font-bold text-red-600">{cheaper}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground mb-1">ราคาใกล้เคียง</div>
          <div className="text-xl font-bold">{similar}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground mb-1">เราถูกกว่า</div>
          <div className="text-xl font-bold text-emerald-600">{moreExpensive}</div>
        </CardContent></Card>
      </div>

      {cheaper > 0 && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-300">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p><strong>{cheaper}</strong> รายการ — คู่แข่งราคาต่ำกว่าเรามากกว่า 5% ควรปรับราคา</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button size="sm" onClick={() => { setEditRate(null); setForm(EMPTY_FORM); setShowForm(true); }}>
          <Plus className="h-3.5 w-3.5" />เพิ่มข้อมูลราคา
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {rates.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-30" />
              ยังไม่มีข้อมูลราคาคู่แข่ง
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/40">
                {['วันที่', 'คู่แข่ง', 'ห้อง', 'ราคาเรา', 'ราคาคู่แข่ง', 'แหล่ง', 'ต่าง', ''].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {rates.map(r => {
                  const badge = getDiffBadge(r.our_rate, r.their_rate);
                  const Icon = badge.icon;
                  return (
                    <tr key={r.id} className="border-b border-border/50 last:border-0 hover:bg-secondary/20">
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.check_date}</td>
                      <td className="px-3 py-2.5 font-medium">{r.competitor_name}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.room_type_label}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{formatCurrency(r.our_rate)}</td>
                      <td className="px-3 py-2.5 font-mono text-xs">{formatCurrency(r.their_rate)}</td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">{r.source}</td>
                      <td className="px-3 py-2.5">
                        <Badge className={`${badge.color} border-0 text-2xs flex items-center gap-1 w-fit`}>
                          {Icon && <Icon className="h-2.5 w-2.5" />}{badge.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(r)} aria-label="แก้ไข" className="p-1 rounded hover:bg-secondary"><Pencil className="h-3.5 w-3.5" /></button>
                          <button onClick={() => deleteRate(r.id)} aria-label="ลบ" className="p-1 rounded hover:bg-secondary text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={o => !o && setShowForm(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editRate ? 'แก้ไขข้อมูล' : 'เพิ่มราคาคู่แข่ง'}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground block mb-1">ชื่อคู่แข่ง *</label>
              <input value={form.competitorName} onChange={e => setForm(p => ({ ...p, competitorName: e.target.value }))}
                placeholder="เช่น Avani Riverside"
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">วันที่ *</label>
              <input type="date" value={form.checkDate} onChange={e => setForm(p => ({ ...p, checkDate: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ประเภทห้อง</label>
              <select value={form.roomTypeLabel} onChange={e => setForm(p => ({ ...p, roomTypeLabel: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">Standard</option>
                {roomTypes.map(r => <option key={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ราคาเรา (฿) *</label>
              <input type="number" value={form.ourRate} onChange={e => setForm(p => ({ ...p, ourRate: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ราคาคู่แข่ง (฿) *</label>
              <input type="number" value={form.theirRate} onChange={e => setForm(p => ({ ...p, theirRate: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">แหล่งข้อมูล</label>
              <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {SOURCES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground block mb-1">หมายเหตุ</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
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
