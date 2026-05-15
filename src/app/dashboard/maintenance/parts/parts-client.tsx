'use client';

import { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, AlertTriangle, Search, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Part {
  id: string;
  hotel_id: string;
  name: string;
  sku: string | null;
  unit: string;
  quantity: number;
  min_stock: number;
  cost: number | null;
  location: string | null;
  supplier: string | null;
  updated_at: string;
}

interface Props {
  hotelId: string;
  initialParts: Part[];
  initialLowStock: Part[];
}

// ─── Default form ─────────────────────────────────────────────────────────────

const DEFAULT_FORM = {
  name: '',
  sku: '',
  unit: 'ชิ้น',
  quantity: 0,
  min_stock: 5,
  cost: '',
  location: '',
  supplier: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PartsClient({ hotelId, initialParts, initialLowStock }: Props) {
  const [parts, setParts] = useState<Part[]>(initialParts);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  // Add part modal
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);

  // Use part modal
  const [useModal, setUseModal] = useState<Part | null>(null);
  const [useQty, setUseQty] = useState(1);
  const [useWorkOrder, setUseWorkOrder] = useState('');

  const lowStockCount = parts.filter((p) => p.quantity <= p.min_stock).length;

  const filtered = useMemo(() => {
    if (!search.trim()) return parts;
    const q = search.toLowerCase();
    return parts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q) ||
        (p.location ?? '').toLowerCase().includes(q)
    );
  }, [parts, search]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  async function addPart() {
    if (!form.name.trim()) { toast.error('กรอกชื่ออะไหล่ก่อน'); return; }
    setSaving(true);
    const res = await fetch('/api/maintenance/parts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity),
        min_stock: Number(form.min_stock),
        cost: form.cost ? Number(form.cost) : null,
      }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('เพิ่มอะไหล่ไม่สำเร็จ'); return; }
    const newPart = await res.json();
    setParts((prev) => [...prev, newPart].sort((a, b) => a.name.localeCompare(b.name)));
    setShowAdd(false);
    setForm(DEFAULT_FORM);
    toast.success('เพิ่มอะไหล่แล้ว');
  }

  async function usePart() {
    if (!useModal) return;
    if (useQty <= 0) { toast.error('กรอกจำนวนที่ใช้'); return; }
    setSaving(true);
    const res = await fetch('/api/maintenance/parts/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        part_id: useModal.id,
        quantity_used: useQty,
        work_order_id: useWorkOrder || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? 'ใช้อะไหล่ไม่สำเร็จ');
      return;
    }
    const result = await res.json();
    setParts((prev) =>
      prev.map((p) =>
        p.id === useModal.id ? { ...p, quantity: result.remaining_quantity } : p
      )
    );
    setUseModal(null);
    setUseQty(1);
    setUseWorkOrder('');
    toast.success('บันทึกการใช้อะไหล่แล้ว');
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar
        title="คลังอะไหล่"
        description="จัดการสต็อกอะไหล่และวัสดุซ่อม"
        action={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" />
            เพิ่มอะไหล่
          </Button>
        }
      />

      {/* Low stock alert */}
      {lowStockCount > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            มีอะไหล่สต็อกต่ำกว่าระดับขั้นต่ำ{' '}
            <span className="inline-flex items-center justify-center rounded-full bg-red-600 text-white text-xs font-bold w-5 h-5">
              {lowStockCount}
            </span>{' '}
            รายการ — ควรสั่งซื้อเพิ่ม
          </span>
        </div>
      )}

      {/* Search */}
      <div className="relative mt-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="ค้นหาชื่อ, SKU, สถานที่..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-border rounded-lg text-sm bg-background"
        />
      </div>

      {/* Table */}
      <div className="mt-4 rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              <th className="text-left px-4 py-3 font-medium">ชื่ออะไหล่</th>
              <th className="text-left px-4 py-3 font-medium">SKU</th>
              <th className="text-left px-4 py-3 font-medium">หน่วย</th>
              <th className="text-right px-4 py-3 font-medium">คงเหลือ</th>
              <th className="text-right px-4 py-3 font-medium">ขั้นต่ำ</th>
              <th className="text-left px-4 py-3 font-medium">สถานที่</th>
              <th className="text-right px-4 py-3 font-medium">ราคา/หน่วย</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-muted-foreground">
                  ไม่พบรายการ
                </td>
              </tr>
            )}
            {filtered.map((part) => {
              const isLow = part.quantity <= part.min_stock;
              return (
                <tr
                  key={part.id}
                  className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{part.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{part.sku ?? '—'}</td>
                  <td className="px-4 py-3">{part.unit}</td>
                  <td
                    className={cn(
                      'px-4 py-3 text-right font-semibold',
                      isLow ? 'text-red-600' : 'text-emerald-600'
                    )}
                  >
                    {part.quantity}
                    {isLow && (
                      <span className="ml-1 text-red-500 text-xs">⚠</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {part.min_stock}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {part.location ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {part.cost != null
                      ? new Intl.NumberFormat('th-TH').format(part.cost)
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setUseModal(part); setUseQty(1); setUseWorkOrder(''); }}
                    >
                      <Package className="h-3.5 w-3.5" />
                      ใช้อะไหล่
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Add Part Modal ── */}
      <Dialog open={showAdd} onOpenChange={(o) => { if (!o) { setShowAdd(false); setForm(DEFAULT_FORM); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มอะไหล่ใหม่</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">ชื่ออะไหล่ *</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="เช่น หลอด LED 9W"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">SKU</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.sku}
                onChange={(e) => setForm((p) => ({ ...p, sku: e.target.value }))}
                placeholder="SKU-001"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">หน่วย</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                placeholder="ชิ้น, เมตร, กล่อง..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">จำนวน (ปัจจุบัน)</label>
              <input
                type="number"
                min={0}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.quantity}
                onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">สต็อกขั้นต่ำ</label>
              <input
                type="number"
                min={0}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.min_stock}
                onChange={(e) => setForm((p) => ({ ...p, min_stock: Number(e.target.value) }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">ราคา/หน่วย (บาท)</label>
              <input
                type="number"
                min={0}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.cost}
                onChange={(e) => setForm((p) => ({ ...p, cost: e.target.value }))}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">สถานที่เก็บ</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="ห้องสต็อก B3"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">ผู้จัดจำหน่าย</label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={form.supplier}
                onChange={(e) => setForm((p) => ({ ...p, supplier: e.target.value }))}
                placeholder="ชื่อบริษัท / ร้านค้า"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAdd(false); setForm(DEFAULT_FORM); }}>
              ยกเลิก
            </Button>
            <Button onClick={addPart} disabled={saving}>
              เพิ่มอะไหล่
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Use Part Modal ── */}
      <Dialog
        open={!!useModal}
        onOpenChange={(o) => { if (!o) { setUseModal(null); setUseQty(1); setUseWorkOrder(''); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ใช้อะไหล่: {useModal?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              คงเหลือ: <strong>{useModal?.quantity}</strong> {useModal?.unit}
            </p>
            <div>
              <label className="text-sm font-medium mb-1 block">จำนวนที่ใช้ *</label>
              <input
                type="number"
                min={1}
                max={useModal?.quantity}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={useQty}
                onChange={(e) => setUseQty(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">
                อ้างอิงใบงาน (ไม่บังคับ)
              </label>
              <input
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={useWorkOrder}
                onChange={(e) => setUseWorkOrder(e.target.value)}
                placeholder="WO-2024-001 หรือ ID คำร้องซ่อม"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setUseModal(null); setUseQty(1); setUseWorkOrder(''); }}
            >
              ยกเลิก
            </Button>
            <Button onClick={usePart} disabled={saving}>
              ยืนยันการใช้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
