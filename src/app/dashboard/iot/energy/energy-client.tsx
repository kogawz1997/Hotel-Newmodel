'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Zap, Plus, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';

const CATEGORIES = ['ไฟฟ้า', 'น้ำ', 'แก๊ส', 'อินเทอร์เน็ต', 'อื่นๆ'];
const CATEGORY_COLOR: Record<string, string> = {
  'ไฟฟ้า': 'bg-amber-100 text-amber-700',
  'น้ำ': 'bg-sky-100 text-sky-700',
  'แก๊ส': 'bg-orange-100 text-orange-700',
  'อินเทอร์เน็ต': 'bg-violet-100 text-violet-700',
  'อื่นๆ': 'bg-secondary text-muted-foreground',
};

type Log = { id: string; room_id?: string; category: string; kwh?: number; cost: number; recorded_date: string; notes?: string; rooms?: { room_number: string } | null };
type Room = { id: string; room_number: string; floor: string | number };

const EMPTY_FORM = { roomId: '', category: 'ไฟฟ้า', kwh: '', cost: '', date: new Date().toISOString().slice(0, 10), notes: '' };

export function EnergyClient({ hotelId, logs: initLogs, rooms, thisMonth }: { hotelId: string; logs: Log[]; rooms: Room[]; thisMonth: string }) {
  const supabase = createClient();
  const [logs, setLogs] = useState(initLogs);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('');

  const thisMo = logs.filter(l => l.recorded_date.startsWith(thisMonth));
  const lastMo = logs.filter(l => !l.recorded_date.startsWith(thisMonth));

  const totalCostThisMo = thisMo.reduce((s, l) => s + Number(l.cost), 0);
  const totalCostLastMo = lastMo.reduce((s, l) => s + Number(l.cost), 0);
  const totalKwhThisMo = thisMo.reduce((s, l) => s + Number(l.kwh || 0), 0);

  const byCategoryThisMo = useMemo(() => {
    const map: Record<string, { cost: number; kwh: number }> = {};
    thisMo.forEach(l => {
      if (!map[l.category]) map[l.category] = { cost: 0, kwh: 0 };
      map[l.category].cost += Number(l.cost);
      map[l.category].kwh += Number(l.kwh || 0);
    });
    return map;
  }, [thisMo]);

  const topRooms = useMemo(() => {
    const map: Record<string, { cost: number; room_number: string }> = {};
    thisMo.filter(l => l.room_id).forEach(l => {
      if (!map[l.room_id!]) map[l.room_id!] = { cost: 0, room_number: l.rooms?.room_number || '?' };
      map[l.room_id!].cost += Number(l.cost);
    });
    return Object.entries(map).sort((a, b) => b[1].cost - a[1].cost).slice(0, 5);
  }, [thisMo]);

  async function addLog() {
    if (!form.cost || !form.date) { toast.error('กรอกค่าใช้จ่ายและวันที่'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('energy_logs').insert({
      hotel_id: hotelId,
      room_id: form.roomId || null,
      category: form.category,
      kwh: form.kwh ? Number(form.kwh) : null,
      cost: Number(form.cost),
      recorded_date: form.date,
      notes: form.notes || null,
    }).select('*, rooms(room_number)').single();
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    setLogs(p => [data, ...p]);
    setShowAdd(false); setForm(EMPTY_FORM);
    toast.success('บันทึกค่าสาธารณูปโภคแล้ว');
  }

  const costDiff = totalCostLastMo > 0 ? ((totalCostThisMo - totalCostLastMo) / totalCostLastMo) * 100 : 0;

  const filtered = filterCat ? logs.filter(l => l.category === filterCat) : logs;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><DollarSign className="h-3.5 w-3.5" />ค่าใช้จ่ายเดือนนี้</div>
          <div className="text-2xl font-bold">{formatCurrency(totalCostThisMo)}</div>
          {totalCostLastMo > 0 && (
            <div className={cn('flex items-center gap-1 text-xs mt-1', costDiff > 0 ? 'text-red-600' : 'text-emerald-600')}>
              {costDiff > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(Math.round(costDiff))}% จากเดือนก่อน
            </div>
          )}
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><Zap className="h-3.5 w-3.5" />kWh เดือนนี้</div>
          <div className="text-2xl font-bold">{totalKwhThisMo.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">หน่วยไฟฟ้า</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5"><DollarSign className="h-3.5 w-3.5" />เดือนก่อน</div>
          <div className="text-2xl font-bold">{formatCurrency(totalCostLastMo)}</div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">ค่าใช้จ่ายตามประเภท (เดือนนี้)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(byCategoryThisMo).sort((a, b) => b[1].cost - a[1].cost).map(([cat, data]) => (
              <div key={cat} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={`${CATEGORY_COLOR[cat] || ''} border-0 text-2xs`}>{cat}</Badge>
                  {data.kwh > 0 && <span className="text-xs text-muted-foreground">{data.kwh.toLocaleString()} kWh</span>}
                </div>
                <span className="font-medium text-sm">{formatCurrency(data.cost)}</span>
              </div>
            ))}
            {Object.keys(byCategoryThisMo).length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูล</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">ห้องที่ใช้พลังงานมากสุด</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topRooms.map(([roomId, data], i) => (
              <div key={roomId} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                  <span className="text-sm font-medium">ห้อง {data.room_number}</span>
                </div>
                <span className="text-sm">{formatCurrency(data.cost)}</span>
              </div>
            ))}
            {topRooms.length === 0 && <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลรายห้อง</p>}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCat('')}
            className={cn('px-3 py-1.5 text-xs rounded-full transition-colors', !filterCat ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80')}>
            ทั้งหมด
          </button>
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={cn('px-3 py-1.5 text-xs rounded-full transition-colors', filterCat === c ? 'bg-primary text-primary-foreground' : 'bg-secondary hover:bg-secondary/80')}>
              {c}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-3.5 w-3.5" />บันทึกค่าใช้จ่าย</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">ยังไม่มีข้อมูล</p>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border bg-secondary/40">
                {['วันที่', 'ประเภท', 'ห้อง', 'kWh', 'ค่าใช้จ่าย', 'หมายเหตุ'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.slice(0, 50).map(l => (
                  <tr key={l.id} className="border-b border-border/50 last:border-0">
                    <td className="px-4 py-2.5 text-xs">{l.recorded_date}</td>
                    <td className="px-4 py-2.5">
                      <Badge className={`${CATEGORY_COLOR[l.category] || ''} border-0 text-2xs`}>{l.category}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{l.rooms?.room_number ? `ห้อง ${l.rooms.room_number}` : 'ส่วนกลาง'}</td>
                    <td className="px-4 py-2.5 text-xs">{l.kwh ? l.kwh.toLocaleString() : '—'}</td>
                    <td className="px-4 py-2.5 font-medium">{formatCurrency(Number(l.cost))}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{l.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={o => !o && setShowAdd(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>บันทึกค่าสาธารณูปโภค</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground block mb-1">ประเภท</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, category: c }))}
                    className={cn('px-2.5 py-1 text-xs rounded-full transition-colors', form.category === c ? (CATEGORY_COLOR[c] || '') + ' font-medium' : 'bg-secondary text-muted-foreground')}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">วันที่ *</label>
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ห้อง</label>
              <select value={form.roomId} onChange={e => setForm(p => ({ ...p, roomId: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                <option value="">ส่วนกลาง</option>
                {rooms.map(r => <option key={r.id} value={r.id}>ห้อง {r.room_number}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">kWh (ถ้ามี)</label>
              <input type="number" step="0.01" value={form.kwh} onChange={e => setForm(p => ({ ...p, kwh: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">ค่าใช้จ่าย (฿) *</label>
              <input type="number" step="0.01" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label className="text-xs text-muted-foreground block mb-1">หมายเหตุ</label>
              <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>ยกเลิก</Button>
            <Button onClick={addLog} disabled={saving}>{saving ? 'กำลังบันทึก...' : 'บันทึก'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
