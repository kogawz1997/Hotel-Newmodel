'use client';

import { useState, useMemo } from 'react';
import { Plus, Filter } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TaskCard } from '@/components/tasks/task-card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const TYPES = ['housekeeping','maintenance','room_service','concierge','security','transport','bellboy','fnb','spa','other'];
const TYPE_TH: Record<string,string> = { housekeeping:'แม่บ้าน', maintenance:'ซ่อมบำรุง', room_service:'Room Service', concierge:'คอนเซียร์จ', security:'รปภ.', transport:'ขนส่ง', bellboy:'พอร์เตอร์', fnb:'อาหาร', spa:'สปา', other:'อื่นๆ' };
const STATUS_TABS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รอดำเนินการ' },
  { key: 'in_progress', label: 'กำลังทำ' },
  { key: 'done', label: 'เสร็จแล้ว' },
];

export function WorkOrdersClient({ orders: init, staff, hotelId, profile }: any) {
  const [orders, setOrders] = useState<any[]>(init);
  const [activeTab, setActiveTab] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'other', room_no: '', description: '', priority: 'normal' });
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => orders.filter(o => {
    if (activeTab !== 'all' && o.status !== activeTab) return false;
    if (typeFilter !== 'all' && o.type !== typeFilter) return false;
    return true;
  }), [orders, activeTab, typeFilter]);

  function handleStatusChange(id: string, status: string) {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  }

  async function createOrder() {
    if (!form.title.trim()) { toast.error('กรุณากรอกชื่องาน'); return; }
    setSaving(true);
    const res = await fetch('/api/work-orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error ?? 'สร้างงานไม่สำเร็จ'); return; }
    setOrders(prev => [data, ...prev]);
    setShowCreate(false);
    setForm({ title: '', type: 'other', room_no: '', description: '', priority: 'normal' });
    toast.success('สร้างงานใหม่แล้ว');
  }

  function tabCount(key: string) {
    if (key === 'all') return orders.length;
    return orders.filter(o => o.status === key).length;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar title="Work Orders" description="ติดตามและจัดการงานทุกแผนก" action={
        <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" />สร้างงาน</Button>
      } />
      <div className="flex-1 p-4 md:p-6 space-y-4">
        {/* Tabs */}
        <div className="flex gap-1 flex-wrap">
          {STATUS_TABS.map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} className={cn('px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5', activeTab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
              {t.label}
              <span className={cn('text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center', activeTab === t.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-muted-foreground')}>
                {tabCount(t.key)}
              </span>
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-1 flex-wrap items-center">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          <button onClick={() => setTypeFilter('all')} className={cn('px-2 py-1 rounded text-xs transition-colors', typeFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>ทุกประเภท</button>
          {TYPES.map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={cn('px-2 py-1 rounded text-xs transition-colors', typeFilter === t ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground')}>
              {TYPE_TH[t]}
            </button>
          ))}
        </div>

        {/* Task list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-sm">ไม่มีงานในหมวดนี้</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map(o => <TaskCard key={o.id} task={o} onStatusChange={handleStatusChange} showAssignee />)}
          </div>
        )}
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>สร้างงานใหม่</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">ชื่องาน *</label>
              <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="เช่น ซ่อมก๊อกน้ำห้อง 301" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground">ประเภท</label>
                <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                  {TYPES.map(t => <option key={t} value={t}>{TYPE_TH[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">ห้อง</label>
                <input className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" placeholder="เช่น 301" value={form.room_no} onChange={e => setForm(p => ({ ...p, room_no: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">ความเร่งด่วน</label>
              <select className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}>
                <option value="low">ต่ำ</option>
                <option value="normal">ปกติ</option>
                <option value="high">เร่งด่วน</option>
                <option value="urgent">วิกฤต</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">รายละเอียด</label>
              <textarea className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none" rows={3} placeholder="รายละเอียดเพิ่มเติม..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
            <Button onClick={createOrder} disabled={saving}>{saving ? 'กำลังสร้าง...' : 'สร้างงาน'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
