'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function BlackoutClient({ hotelId, initial }: { hotelId: string; initial: any[] }) {
  const supabase = createClient();
  const [blackouts, setBlackouts] = useState(initial);
  const [form, setForm] = useState({ dateFrom: '', dateTo: '', reason: '', allChannels: true });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function add() {
    if (!form.dateFrom || !form.dateTo) { toast.error('เลือกช่วงวันที่ก่อน'); return; }
    if (form.dateTo < form.dateFrom) { toast.error('วันสิ้นสุดต้องหลังวันเริ่มต้น'); return; }
    setSaving(true);
    const { data, error } = await supabase.from('blackout_dates').insert({
      hotel_id: hotelId,
      date_from: form.dateFrom,
      date_to: form.dateTo,
      reason: form.reason || null,
      all_channels: form.allChannels,
    }).select().single();
    setSaving(false);
    if (error) { toast.error('บันทึกไม่สำเร็จ: ' + error.message); return; }
    setBlackouts(p => [...p, data].sort((a: any, b: any) => a.date_from.localeCompare(b.date_from)));
    setForm({ dateFrom: '', dateTo: '', reason: '', allChannels: true });
    toast.success('เพิ่ม Blackout Date แล้ว');
  }

  async function remove(id: string) {
    if (!confirm('ลบ Blackout Date นี้?')) return;
    setDeleting(id);
    await supabase.from('blackout_dates').delete().eq('id', id);
    setBlackouts(p => p.filter((b: any) => b.id !== id));
    setDeleting(null);
    toast.success('ลบแล้ว');
  }

  const upcoming = blackouts.filter((b: any) => b.date_to >= new Date().toISOString().slice(0, 10));

  return (
    <div className="space-y-4">
      {upcoming.length > 0 && (
        <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          มี {upcoming.length} ช่วงเวลาที่ปิดรับจองอยู่
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4" />เพิ่ม Blackout Date ใหม่</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">วันเริ่มต้น <span aria-hidden="true">*</span></label>
              <input type="date" value={form.dateFrom} onChange={e => setForm(p => ({ ...p, dateFrom: e.target.value }))}
                min={new Date().toISOString().slice(0, 10)} aria-label="วันเริ่มต้น"
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">วันสิ้นสุด <span aria-hidden="true">*</span></label>
              <input type="date" value={form.dateTo} onChange={e => setForm(p => ({ ...p, dateTo: e.target.value }))}
                min={form.dateFrom || new Date().toISOString().slice(0, 10)} aria-label="วันสิ้นสุด"
                className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">เหตุผล</label>
            <input type="text" value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
              placeholder="เช่น งานกิจกรรมพิเศษ, ปรับปรุงโรงแรม..."
              className="w-full px-3 py-2 bg-secondary border-0 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="เหตุผล" />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.allChannels} onChange={e => setForm(p => ({ ...p, allChannels: e.target.checked }))} className="rounded" />
            <span className="text-sm">ปิดทุก Channel พร้อมกัน (Booking.com, Agoda, Direct...)</span>
          </label>
          <button onClick={add} disabled={saving || !form.dateFrom || !form.dateTo}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors"
            aria-busy={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
            {saving ? 'กำลังบันทึก...' : 'บันทึก Blackout Date'}
          </button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">รายการ Blackout Dates ({blackouts.length})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {blackouts.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">ยังไม่มี Blackout Date</p>
          ) : (
            <div className="divide-y divide-border">
              {blackouts.map((b: any) => {
                const isPast = b.date_to < new Date().toISOString().slice(0, 10);
                return (
                  <div key={b.id} className={cn('flex items-center gap-3 px-4 py-3', isPast && 'opacity-50')}>
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{b.date_from} → {b.date_to}</p>
                      {b.reason && <p className="text-xs text-muted-foreground">{b.reason}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      {isPast
                        ? <Badge variant="outline" className="text-2xs">ผ่านแล้ว</Badge>
                        : <Badge className="text-2xs bg-red-100 text-red-700 border-0">ปิดจอง</Badge>
                      }
                      {b.all_channels && <Badge variant="outline" className="text-2xs">ทุก Channel</Badge>}
                      <button onClick={() => remove(b.id)} disabled={deleting === b.id} aria-label="ลบ" className="text-muted-foreground hover:text-destructive transition-colors">
                        {deleting === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
