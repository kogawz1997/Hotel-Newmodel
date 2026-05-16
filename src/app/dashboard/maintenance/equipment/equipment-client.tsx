'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Wrench, Plus, ChevronRight, History, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

type Equipment = { id: string; name: string; serial_number?: string; location?: string; status: string; last_service_at?: string; next_service_at?: string; purchase_date?: string; warranty_until?: string };
type HistoryRow = { id: string; equipment_id: string; event_type: string; description: string; cost?: number; performed_by?: string; created_at: string };

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  operational:  { label: 'ใช้งานได้', color: 'bg-emerald-100 text-emerald-700' },
  maintenance:  { label: 'กำลังซ่อม', color: 'bg-amber-100 text-amber-700' },
  out_of_order: { label: 'เสีย', color: 'bg-red-100 text-red-700' },
  retired:      { label: 'เลิกใช้', color: 'bg-secondary text-muted-foreground' },
};

const EVENT_TYPES = ['ซ่อมแซม', 'บำรุงรักษาตามวาระ', 'เปลี่ยนอะไหล่', 'ตรวจสอบ', 'อัปเกรด', 'อื่นๆ'];

const EMPTY_FORM = { eventType: EVENT_TYPES[0], description: '', cost: '', performedBy: '' };

export function EquipmentClient({ hotelId, equipment: initEq, history: initHistory }: { hotelId: string; equipment: Equipment[]; history: HistoryRow[] }) {
  const supabase = createClient();
  const [equipment] = useState(initEq);
  const [history, setHistory] = useState(initHistory);
  const [selected, setSelected] = useState<string>(initEq[0]?.id || '');
  const [showLog, setShowLog] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const eq = equipment.find(e => e.id === selected);
  const eqHistory = history.filter(h => h.equipment_id === selected).sort((a, b) => b.created_at.localeCompare(a.created_at));

  async function saveLog() {
    if (!form.description.trim()) { toast.error('กรอกรายละเอียด'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('equipment_history').insert({
      hotel_id: hotelId, equipment_id: selected,
      event_type: form.eventType, description: form.description,
      cost: form.cost ? Number(form.cost) : null,
      performed_by: form.performedBy || null,
    }).select().single();
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    setHistory(p => [data, ...p]);
    setShowLog(false); setForm(EMPTY_FORM);
    toast.success('บันทึกประวัติแล้ว');
  }

  const now = new Date();
  const nearWarrantyExpiry = eq?.warranty_until ? new Date(eq.warranty_until) < new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) : false;
  const overduePm = eq?.next_service_at ? new Date(eq.next_service_at) < now : false;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <Card className="lg:col-span-1">
        <CardHeader><CardTitle className="text-sm">อุปกรณ์ทั้งหมด</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border max-h-[500px] overflow-y-auto">
            {equipment.map(e => {
              const cfg = STATUS_CFG[e.status] || STATUS_CFG.operational;
              return (
                <button key={e.id} onClick={() => setSelected(e.id)}
                  className={`flex items-center justify-between w-full px-3 py-2.5 text-sm text-left transition-colors ${selected === e.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50'}`}>
                  <div>
                    <p className="font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">{e.location || '—'}</p>
                  </div>
                  <Badge className={`${cfg.color} border-0 text-2xs`}>{cfg.label}</Badge>
                </button>
              );
            })}
            {equipment.length === 0 && <p className="text-sm text-muted-foreground p-4">ยังไม่มีอุปกรณ์</p>}
          </div>
        </CardContent>
      </Card>

      {eq && (
        <div className="lg:col-span-3 space-y-4">
          {(nearWarrantyExpiry || overduePm) && (
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                {overduePm && <p>PM ค้างเกินกำหนด — ควรตรวจสอบทันที</p>}
                {nearWarrantyExpiry && <p>การรับประกันใกล้หมดอายุ ({new Date(eq.warranty_until!).toLocaleDateString('th-TH')})</p>}
              </div>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4" />{eq.name}</CardTitle>
              <Button size="sm" onClick={() => setShowLog(true)}>
                <Plus className="h-3.5 w-3.5" />บันทึกงาน
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: 'Serial No.', value: eq.serial_number || '—' },
                  { label: 'สถานที่', value: eq.location || '—' },
                  { label: 'ซ่อมบำรุงล่าสุด', value: eq.last_service_at ? new Date(eq.last_service_at).toLocaleDateString('th-TH') : '—' },
                  { label: 'PM ครั้งต่อไป', value: eq.next_service_at ? new Date(eq.next_service_at).toLocaleDateString('th-TH') : '—' },
                  { label: 'วันที่ซื้อ', value: eq.purchase_date ? new Date(eq.purchase_date).toLocaleDateString('th-TH') : '—' },
                  { label: 'รับประกันถึง', value: eq.warranty_until ? new Date(eq.warranty_until).toLocaleDateString('th-TH') : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-secondary/40 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                    <p className="font-medium">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" />ประวัติการซ่อมบำรุง</CardTitle></CardHeader>
            <CardContent className="p-0">
              {eqHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4">ยังไม่มีประวัติ</p>
              ) : (
                <div className="divide-y divide-border">
                  {eqHistory.map(h => (
                    <div key={h.id} className="px-4 py-3 flex items-start gap-3">
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className="bg-secondary text-muted-foreground border-0 text-2xs">{h.event_type}</Badge>
                          {h.cost && <span className="text-xs text-emerald-600 font-medium">{formatCurrency(h.cost)}</span>}
                        </div>
                        <p className="text-sm mt-0.5">{h.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {h.performed_by && `โดย ${h.performed_by} · `}
                          {new Date(h.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={showLog} onOpenChange={o => !o && setShowLog(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>บันทึกงานซ่อมบำรุง — {eq?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ประเภทงาน</label>
              <select value={form.eventType} onChange={e => setForm(p => ({ ...p, eventType: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">รายละเอียด *</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">ค่าใช้จ่าย (฿)</label>
                <input type="number" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">ผู้ดำเนินการ</label>
                <input value={form.performedBy} onChange={e => setForm(p => ({ ...p, performedBy: e.target.value }))}
                  className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLog(false)}>ยกเลิก</Button>
            <Button onClick={saveLog} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
