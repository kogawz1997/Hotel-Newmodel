'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, ShoppingCart, CheckCircle, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Part = { id: string; name: string; sku?: string; unit: string; quantity: number; min_stock: number; cost?: number; supplier?: string; location?: string };

export function ReorderClient({ hotelId, parts, lowStock: initLow }: { hotelId: string; parts: Part[]; lowStock: Part[] }) {
  const supabase = createClient();
  const [reordered, setReordered] = useState<Set<string>>(new Set());
  const [qty, setQty] = useState<Record<string, number>>({});

  const lowStock = parts.filter(p => p.quantity <= p.min_stock);
  const critical = lowStock.filter(p => p.quantity === 0);
  const warning = lowStock.filter(p => p.quantity > 0 && p.quantity <= p.min_stock);

  function suggestQty(p: Part) {
    return qty[p.id] ?? Math.max(p.min_stock * 2, p.min_stock - p.quantity + p.min_stock);
  }

  async function markReordered(partId: string) {
    const amount = suggestQty(parts.find(p => p.id === partId)!);
    const { error } = await supabase.from('work_orders').insert({
      hotel_id: hotelId, type: 'maintenance',
      title: `สั่งซื้ออะไหล่: ${parts.find(p => p.id === partId)?.name}`,
      description: `จำนวนที่สั่ง: ${amount} ${parts.find(p => p.id === partId)?.unit}`,
      priority: parts.find(p => p.id === partId)?.quantity === 0 ? 'high' : 'normal',
      status: 'open', source: 'system',
    });
    if (error) { toast.error('บันทึกไม่สำเร็จ'); return; }
    setReordered(p => new Set([...p, partId]));
    toast.success('สร้างใบสั่งซื้อแล้ว');
  }

  async function reorderAll() {
    const toOrder = lowStock.filter(p => !reordered.has(p.id));
    if (!toOrder.length) { toast.error('ไม่มีรายการที่ต้องสั่งแล้ว'); return; }
    const inserts = toOrder.map(p => ({
      hotel_id: hotelId, type: 'maintenance',
      title: `สั่งซื้ออะไหล่: ${p.name}`,
      description: `จำนวนที่สั่ง: ${suggestQty(p)} ${p.unit} | ผู้จัดจำหน่าย: ${p.supplier || '-'}`,
      priority: p.quantity === 0 ? 'high' : 'normal',
      status: 'open', source: 'system',
    }));
    await supabase.from('work_orders').insert(inserts);
    setReordered(new Set(lowStock.map(p => p.id)));
    toast.success(`สร้างใบสั่งซื้อ ${inserts.length} รายการแล้ว`);
  }

  if (lowStock.length === 0) {
    return (
      <div className="text-center py-16">
        <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
        <p className="text-lg font-medium">สต็อกอะไหล่เพียงพอทั้งหมด</p>
        <p className="text-sm text-muted-foreground mt-1">ทุกรายการมีปริมาณเกินขั้นต่ำ</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800 flex-1">
          <Bell className="h-4 w-4 shrink-0 mt-0.5" />
          <p><strong>{critical.length}</strong> รายการหมดสต็อก · <strong>{warning.length}</strong> รายการใกล้หมด</p>
        </div>
        <button onClick={reorderAll}
          className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors whitespace-nowrap">
          <ShoppingCart className="h-4 w-4" />สั่งทั้งหมด
        </button>
      </div>

      {critical.length > 0 && (
        <Card className="border-red-200">
          <CardHeader><CardTitle className="text-sm text-red-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />หมดสต็อก — ต้องสั่งด่วน ({critical.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <PartsList parts={critical} reordered={reordered} qty={qty} setQty={setQty} onReorder={markReordered} suggestQty={suggestQty} urgency="critical" />
          </CardContent>
        </Card>
      )}

      {warning.length > 0 && (
        <Card className="border-amber-200">
          <CardHeader><CardTitle className="text-sm text-amber-700 flex items-center gap-2"><AlertTriangle className="h-4 w-4" />ใกล้หมด ({warning.length})</CardTitle></CardHeader>
          <CardContent className="p-0">
            <PartsList parts={warning} reordered={reordered} qty={qty} setQty={setQty} onReorder={markReordered} suggestQty={suggestQty} urgency="warning" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PartsList({ parts, reordered, qty, setQty, onReorder, suggestQty, urgency }: {
  parts: Part[]; reordered: Set<string>; qty: Record<string, number>;
  setQty: (fn: (p: Record<string, number>) => Record<string, number>) => void;
  onReorder: (id: string) => void; suggestQty: (p: Part) => number; urgency: string;
}) {
  return (
    <table className="w-full text-sm">
      <thead><tr className="border-b border-border bg-secondary/40">
        {['รายการ', 'คงเหลือ', 'ขั้นต่ำ', 'จำนวนที่สั่ง', 'มูลค่า', ''].map(h => (
          <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">{h}</th>
        ))}
      </tr></thead>
      <tbody>
        {parts.map(p => {
          const orderQty = qty[p.id] !== undefined ? qty[p.id] : suggestQty(p);
          const done = reordered.has(p.id);
          return (
            <tr key={p.id} className={cn('border-b border-border/50 last:border-0', done ? 'opacity-50' : '')}>
              <td className="px-4 py-3">
                <p className="font-medium">{p.name}</p>
                {p.supplier && <p className="text-xs text-muted-foreground">{p.supplier}</p>}
              </td>
              <td className="px-4 py-3">
                <Badge className={cn('border-0 text-2xs', urgency === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')}>
                  {p.quantity} {p.unit}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs">{p.min_stock} {p.unit}</td>
              <td className="px-4 py-3">
                <input type="number" min={1} value={orderQty}
                  onChange={e => setQty(prev => ({ ...prev, [p.id]: Number(e.target.value) }))}
                  aria-label={`จำนวนสั่งซื้อ ${p.name}`}
                  className="w-20 px-2 py-1 bg-secondary border-0 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-ring" />
                <span className="text-xs text-muted-foreground ml-1">{p.unit}</span>
              </td>
              <td className="px-4 py-3 text-xs">
                {p.cost ? formatCurrency(p.cost * orderQty) : '—'}
              </td>
              <td className="px-4 py-3">
                {done ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-0 text-2xs">สั่งแล้ว</Badge>
                ) : (
                  <button onClick={() => onReorder(p.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    <ShoppingCart className="h-3 w-3" />สั่งซื้อ
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
