'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import {
  LayoutGrid, ListOrdered, Receipt, Plus, Minus, Search,
  X, Printer, RefreshCw, ChefHat, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';
type OrderStatus = 'open' | 'billed' | 'paid' | 'cancelled';
type PaymentMethod = 'cash' | 'card' | 'room_charge' | 'qr';

interface RestaurantTable {
  id: string;
  hotel_id: string;
  outlet_id?: string | null;
  table_no: string;
  capacity: number;
  status: TableStatus;
  floor?: string | null;
  section?: string | null;
  updated_at?: string | null;
}

interface OrderItem {
  menu_item_id: string;
  name: string;
  qty: number;
  price: number;
  notes?: string | null;
  allergy_tags?: string[];
}

interface RestaurantOrder {
  id: string;
  hotel_id: string;
  table_id: string;
  outlet_id?: string | null;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  service_charge: number;
  vat: number;
  total: number;
  status: OrderStatus;
  payment_method?: PaymentMethod | null;
  room_no?: string | null;
  reservation_id?: string | null;
  server_id?: string | null;
  opened_at?: string | null;
  closed_at?: string | null;
  notes?: string | null;
}

interface MenuItem {
  id: string;
  outlet_id: string;
  name: string;
  price: number;
  category_id?: string | null;
  is_available: boolean;
  allergy_tags?: string[] | null;
}

interface Outlet {
  id: string;
  name: string;
  type?: string | null;
}

interface Props {
  hotelId: string;
  initialTables: RestaurantTable[];
  initialOrders: RestaurantOrder[];
  outlets: Outlet[];
  menuItems: MenuItem[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_CHARGE_PCT = 0.1;
const VAT_PCT = 0.07;

const TABLE_STATUS_CONFIG: Record<TableStatus, { label: string; bg: string; text: string; border: string }> = {
  available: { label: 'ว่าง', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
  occupied:  { label: 'มีลูกค้า', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
  reserved:  { label: 'จอง', bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-800 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-700' },
  cleaning:  { label: 'ทำความสะอาด', bg: 'bg-slate-100 dark:bg-slate-800/40', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-600' },
};

const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; badge: string }> = {
  open:      { label: 'เปิดโต๊ะ', badge: 'bg-sky-100 text-sky-700 border-sky-200' },
  billed:    { label: 'รอชำระ', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  paid:      { label: 'ชำระแล้ว', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'ยกเลิก', badge: 'bg-red-100 text-red-700 border-red-200' },
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'เงินสด', card: 'บัตรเครดิต', room_charge: 'เก็บห้อง', qr: 'QR Code',
};

// ─── Calc helpers ─────────────────────────────────────────────────────────────

function calcTotals(items: OrderItem[], discount = 0) {
  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
  const service = Math.round(subtotal * SERVICE_CHARGE_PCT * 100) / 100;
  const vat = Math.round((subtotal + service) * VAT_PCT * 100) / 100;
  const total = Math.max(0, subtotal + service + vat - discount);
  return { subtotal, service, vat, total };
}

function timeLabel(iso: string | null | undefined) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

// ─── New Order Modal ──────────────────────────────────────────────────────────

function NewOrderModal({
  table,
  outlets,
  menuItems,
  hotelId,
  onClose,
  onCreated,
}: {
  table: RestaurantTable;
  outlets: Outlet[];
  menuItems: MenuItem[];
  hotelId: string;
  onClose: () => void;
  onCreated: (order: RestaurantOrder, updatedTable: RestaurantTable) => void;
}) {
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([]);
  const [search, setSearch] = useState('');
  const [outletId, setOutletId] = useState(table.outlet_id ?? outlets[0]?.id ?? '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendToKitchen, setSendToKitchen] = useState(true);

  const filteredMenu = menuItems.filter(m =>
    (outletId ? m.outlet_id === outletId : true) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  function addItem(item: MenuItem) {
    setSelectedItems(prev => {
      const existing = prev.find(i => i.menu_item_id === item.id);
      if (existing) return prev.map(i => i.menu_item_id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, {
        menu_item_id: item.id, name: item.name, qty: 1, price: item.price,
        allergy_tags: item.allergy_tags ?? [],
      }];
    });
  }

  function adjustQty(menuItemId: string, delta: number) {
    setSelectedItems(prev =>
      prev.map(i => i.menu_item_id === menuItemId ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
        .filter(i => i.qty > 0)
    );
  }

  const { subtotal, service, vat, total } = calcTotals(selectedItems);

  async function handleSubmit() {
    if (selectedItems.length === 0) { toast.error('เพิ่มรายการอาหารก่อน'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/restaurant/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId, tableId: table.id,
          outletId: outletId || null,
          items: selectedItems,
          notes: notes || null,
          service_charge_pct: SERVICE_CHARGE_PCT,
          vat_pct: VAT_PCT,
        }),
      });
      if (!res.ok) { const j = await res.json(); toast.error(j.error ?? 'สร้างออร์เดอร์ไม่สำเร็จ'); return; }
      const { data: order } = await res.json();

      // Send to kitchen
      if (sendToKitchen && order) {
        await fetch('/api/kitchen', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelId,
            orderId: order.id,
            outletId: outletId || null,
            items: selectedItems.map(i => ({ name: i.name, qty: i.qty, allergy_tags: i.allergy_tags })),
            kitchen_note: notes || null,
            priority: 5,
          }),
        });
      }

      const updatedTable: RestaurantTable = { ...table, status: 'occupied' };
      onCreated(order, updatedTable);
      toast.success(`เปิดโต๊ะ ${table.table_no} แล้ว`);
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <h2 className="font-display font-semibold text-lg">เปิดออร์เดอร์ — โต๊ะ {table.table_no}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col sm:flex-row flex-1 min-h-0">
          {/* Menu picker */}
          <div className="flex-1 flex flex-col border-b sm:border-b-0 sm:border-r min-h-0">
            <div className="p-3 border-b space-y-2 shrink-0">
              {outlets.length > 1 && (
                <select
                  value={outletId}
                  onChange={e => setOutletId(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-card px-2 text-sm"
                >
                  {outlets.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  placeholder="ค้นหาเมนู…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 w-full rounded-lg border border-input bg-card pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredMenu.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">ไม่พบเมนู</p>
              )}
              {filteredMenu.map(item => {
                const inOrder = selectedItems.find(i => i.menu_item_id === item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm hover:bg-secondary transition-colors text-left',
                      inOrder && 'bg-primary/5 border border-primary/20'
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{item.name}</span>
                      {item.allergy_tags && item.allergy_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {item.allergy_tags.map(tag => (
                            <span key={tag} className="text-xs px-1 rounded bg-amber-100 text-amber-700 border border-amber-200">
                              ⚠ {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-muted-foreground">{formatCurrency(item.price)}</span>
                      {inOrder && (
                        <span className="font-bold text-primary text-xs bg-primary/10 px-1.5 py-0.5 rounded-full">
                          {inOrder.qty}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Order summary */}
          <div className="w-full sm:w-72 flex flex-col shrink-0">
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedItems.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">ยังไม่มีรายการ</p>
              ) : (
                selectedItems.map(item => (
                  <div key={item.menu_item_id} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0 text-sm">
                      <div className="font-medium truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{formatCurrency(item.price)} × {item.qty}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => adjustQty(item.menu_item_id, -1)}
                        className="h-6 w-6 rounded border flex items-center justify-center hover:bg-secondary"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        onClick={() => adjustQty(item.menu_item_id, 1)}
                        className="h-6 w-6 rounded border flex items-center justify-center hover:bg-secondary"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-medium w-16 text-right shrink-0">
                      {formatCurrency(item.price * item.qty)}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Totals + notes */}
            <div className="border-t p-3 space-y-3 shrink-0">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>ค่าอาหาร</span><span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Service Charge (10%)</span><span>{formatCurrency(service)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>VAT (7%)</span><span>{formatCurrency(vat)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-1 text-base">
                  <span>รวม</span><span>{formatCurrency(total)}</span>
                </div>
              </div>
              <input
                placeholder="หมายเหตุออร์เดอร์…"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="h-8 w-full rounded-lg border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendToKitchen}
                  onChange={e => setSendToKitchen(e.target.checked)}
                  className="rounded"
                />
                <ChefHat className="h-3.5 w-3.5" />
                ส่งไปครัวด้วย
              </label>
              <Button
                className="w-full"
                disabled={loading || selectedItems.length === 0}
                onClick={handleSubmit}
              >
                {loading ? 'กำลังบันทึก…' : 'เปิดออร์เดอร์'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Modal ───────────────────────────────────────────────────────

function OrderModal({
  order,
  table,
  outlets,
  menuItems,
  hotelId,
  onClose,
  onUpdated,
}: {
  order: RestaurantOrder;
  table: RestaurantTable;
  outlets: Outlet[];
  menuItems: MenuItem[];
  hotelId: string;
  onClose: () => void;
  onUpdated: (order: RestaurantOrder, updatedTable?: RestaurantTable) => void;
}) {
  const [discount, setDiscount] = useState(order.discount ?? 0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [loading, setLoading] = useState<string | null>(null);
  const [addingItems, setAddingItems] = useState(false);
  const [search, setSearch] = useState('');

  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
  const { subtotal, service, vat, total } = calcTotals(items, discount);

  async function doAction(action: string, extra: Record<string, unknown> = {}) {
    setLoading(action);
    try {
      const res = await fetch(`/api/restaurant/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          discount,
          service_charge_pct: SERVICE_CHARGE_PCT,
          vat_pct: VAT_PCT,
          ...extra,
        }),
      });
      if (!res.ok) { const j = await res.json(); toast.error(j.error ?? 'เกิดข้อผิดพลาด'); return; }
      const { data } = await res.json();
      if (action === 'pay') {
        onUpdated(data, { ...table, status: 'cleaning' });
        toast.success('ชำระเงินสำเร็จ');
        onClose();
      } else if (action === 'cancel') {
        onUpdated(data, { ...table, status: 'available' });
        toast.success('ยกเลิกออร์เดอร์แล้ว');
        onClose();
      } else {
        onUpdated(data);
        toast.success(action === 'bill' ? 'ออกบิลแล้ว' : 'อัพเดทแล้ว');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(null);
    }
  }

  function handlePrint() {
    window.print();
  }

  const filteredMenu = menuItems.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  async function addItem(item: MenuItem) {
    setLoading('add_items');
    try {
      const res = await fetch(`/api/restaurant/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_items',
          items: [{ menu_item_id: item.id, name: item.name, qty: 1, price: item.price, allergy_tags: item.allergy_tags ?? [] }],
          service_charge_pct: SERVICE_CHARGE_PCT,
          vat_pct: VAT_PCT,
        }),
      });
      if (!res.ok) { const j = await res.json(); toast.error(j.error ?? 'เพิ่มรายการไม่สำเร็จ'); return; }
      const { data } = await res.json();
      onUpdated(data);
      toast.success(`เพิ่ม ${item.name} แล้ว`);
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col print:shadow-none print:border-0 print:rounded-none print:max-h-none">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0 print:hidden">
          <div>
            <h2 className="font-display font-semibold text-lg">โต๊ะ {table.table_no}</h2>
            <p className="text-xs text-muted-foreground">เปิด {timeLabel(order.opened_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full border font-medium',
              ORDER_STATUS_CONFIG[order.status].badge
            )}>
              {ORDER_STATUS_CONFIG[order.status].label}
            </span>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Print header */}
        <div className="hidden print:block px-5 py-4 text-center border-b">
          <h2 className="font-bold text-xl">ใบเสร็จรับเงิน</h2>
          <p className="text-sm">โต๊ะ {table.table_no} | {timeLabel(order.opened_at)}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {/* Items */}
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm gap-2">
                <div className="flex-1 min-w-0">
                  <span>{item.qty}× {item.name}</span>
                  {item.notes && <p className="text-xs text-muted-foreground italic">{item.notes}</p>}
                  {item.allergy_tags && item.allergy_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {item.allergy_tags.map(t => (
                        <span key={t} className="text-xs px-1 rounded bg-amber-100 text-amber-700">⚠ {t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="font-medium shrink-0">{formatCurrency(item.price * item.qty)}</span>
              </div>
            ))}
          </div>

          {/* Add more items toggle */}
          {order.status === 'open' && (
            <div className="print:hidden">
              <button
                onClick={() => setAddingItems(v => !v)}
                className="flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <Plus className="h-3.5 w-3.5" />
                {addingItems ? 'ซ่อนเมนู' : 'เพิ่มรายการ'}
              </button>
              {addingItems && (
                <div className="mt-2 space-y-1">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      placeholder="ค้นหาเมนู…"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="h-8 w-full rounded-lg border border-input bg-card pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredMenu.slice(0, 20).map(m => (
                      <button
                        key={m.id}
                        onClick={() => addItem(m)}
                        disabled={loading === 'add_items'}
                        className="w-full flex justify-between items-center px-2 py-1.5 text-sm rounded-lg hover:bg-secondary transition-colors"
                      >
                        <span>{m.name}</span>
                        <span className="text-muted-foreground">{formatCurrency(m.price)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Totals */}
          <div className="border-t pt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>ค่าอาหาร</span><span>{formatCurrency(subtotal)}</span>
            </div>
            {/* Discount */}
            {order.status === 'open' || order.status === 'billed' ? (
              <div className="flex items-center justify-between print:hidden">
                <span className="text-muted-foreground">ส่วนลด</span>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="h-7 w-24 rounded-lg border border-input bg-card px-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            ) : discount > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>ส่วนลด</span><span>-{formatCurrency(discount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted-foreground">
              <span>Service Charge (10%)</span><span>{formatCurrency(service)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>VAT (7%)</span><span>{formatCurrency(vat)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-1">
              <span>รวมทั้งสิ้น</span><span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment method */}
          {(order.status === 'open' || order.status === 'billed') && (
            <div className="print:hidden space-y-2">
              <p className="text-sm font-medium">วิธีชำระเงิน</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map(m => (
                  <button
                    key={m}
                    onClick={() => setPayMethod(m)}
                    className={cn(
                      'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                      payMethod === m ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-primary/50'
                    )}
                  >
                    {PAYMENT_LABELS[m]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Print payment info */}
          {order.payment_method && (
            <div className="hidden print:block text-sm text-center">
              ชำระด้วย: {PAYMENT_LABELS[order.payment_method]}
            </div>
          )}

          <div className="hidden print:block text-xs text-center text-muted-foreground pt-4">
            ขอบคุณที่ใช้บริการ — Thank you
          </div>
        </div>

        {/* Footer actions */}
        {order.status !== 'paid' && order.status !== 'cancelled' && (
          <div className="flex flex-wrap gap-2 p-4 border-t shrink-0 print:hidden">
            {order.status === 'open' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                disabled={!!loading}
                onClick={() => doAction('bill')}
              >
                <Receipt className="h-3.5 w-3.5" />
                {loading === 'bill' ? 'กำลังออกบิล…' : 'ออกบิล'}
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={!!loading}
              onClick={() => doAction('pay', { payment_method: payMethod })}
            >
              {loading === 'pay' ? 'กำลังบันทึก…' : 'ชำระเงิน'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-1"
            >
              <Printer className="h-3.5 w-3.5" />
              พิมพ์ใบเสร็จ
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!!loading}
              onClick={() => doAction('cancel')}
            >
              {loading === 'cancel' ? '…' : 'ยกเลิก'}
            </Button>
          </div>
        )}
        {(order.status === 'paid' || order.status === 'cancelled') && (
          <div className="flex gap-2 p-4 border-t shrink-0 print:hidden">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1">
              <Printer className="h-3.5 w-3.5" />
              พิมพ์ใบเสร็จ
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={onClose}>
              ปิด
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Table Grid ───────────────────────────────────────────────────────────────

function TableGrid({
  tables,
  orders,
  onTableClick,
}: {
  tables: RestaurantTable[];
  orders: RestaurantOrder[];
  onTableClick: (table: RestaurantTable) => void;
}) {
  const floors = Array.from(new Set(tables.map(t => t.floor ?? '1'))).sort();

  return (
    <div className="space-y-6 p-4">
      {floors.map(floor => (
        <div key={floor}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">ชั้น {floor}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {tables
              .filter(t => (t.floor ?? '1') === floor)
              .map(table => {
                const cfg = TABLE_STATUS_CONFIG[table.status];
                const order = orders.find(o => o.table_id === table.id);
                const orderTotal = order ? calcTotals(Array.isArray(order.items) ? order.items : [], order.discount ?? 0).total : 0;
                return (
                  <button
                    key={table.id}
                    onClick={() => onTableClick(table)}
                    className={cn(
                      'rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-all hover:shadow-md active:scale-95',
                      cfg.bg, cfg.border, cfg.text
                    )}
                  >
                    <div className="font-bold text-lg leading-none">{table.table_no}</div>
                    <div className="flex items-center gap-1 text-xs opacity-70">
                      <Users className="h-3 w-3" />
                      {table.capacity}
                    </div>
                    <div className={cn('text-xs font-medium px-2 py-0.5 rounded-full', cfg.bg, cfg.border, 'border')}>
                      {cfg.label}
                    </div>
                    {order && (
                      <div className="text-xs font-semibold">{formatCurrency(orderTotal)}</div>
                    )}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Orders List ──────────────────────────────────────────────────────────────

function OrdersList({
  orders,
  tables,
  onOrderClick,
}: {
  orders: RestaurantOrder[];
  tables: RestaurantTable[];
  onOrderClick: (order: RestaurantOrder) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-2 p-4">
        <ListOrdered className="h-10 w-10 opacity-30" />
        <p>ไม่มีออร์เดอร์ที่ active</p>
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {orders.map(order => {
        const table = tables.find(t => t.id === order.table_id);
        const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
        const { total } = calcTotals(items, order.discount ?? 0);
        const cfg = ORDER_STATUS_CONFIG[order.status];
        return (
          <button
            key={order.id}
            onClick={() => onOrderClick(order)}
            className="bg-card rounded-xl border shadow-sm p-4 flex flex-col gap-2 text-left hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">โต๊ะ {table?.table_no ?? '—'}</span>
              <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', cfg.badge)}>
                {cfg.label}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">{items.length} รายการ | เปิด {timeLabel(order.opened_at)}</div>
            <ul className="text-sm space-y-0.5">
              {items.slice(0, 3).map((item, i) => (
                <li key={i} className="truncate text-muted-foreground">{item.qty}× {item.name}</li>
              ))}
              {items.length > 3 && <li className="text-xs text-muted-foreground">+{items.length - 3} รายการอื่น</li>}
            </ul>
            <div className="font-semibold text-right">{formatCurrency(total)}</div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Billing Tab ─────────────────────────────────────────────────────────────

function BillingTab({
  orders,
  tables,
  onOrderClick,
}: {
  orders: RestaurantOrder[];
  tables: RestaurantTable[];
  onOrderClick: (order: RestaurantOrder) => void;
}) {
  const billable = orders.filter(o => o.status === 'billed' || o.status === 'open');

  if (billable.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-2 p-4">
        <Receipt className="h-10 w-10 opacity-30" />
        <p>ไม่มีออร์เดอร์ที่รอชำระ</p>
      </div>
    );
  }

  return (
    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {billable.map(order => {
        const table = tables.find(t => t.id === order.table_id);
        const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
        const { subtotal, service, vat, total } = calcTotals(items, order.discount ?? 0);
        return (
          <button
            key={order.id}
            onClick={() => onOrderClick(order)}
            className="bg-card rounded-xl border shadow-sm p-4 flex flex-col gap-2 text-left hover:shadow-md transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold">โต๊ะ {table?.table_no ?? '—'}</span>
              <span className={cn(
                'text-xs px-2 py-0.5 rounded-full border font-medium',
                order.status === 'billed'
                  ? 'bg-amber-100 text-amber-700 border-amber-200'
                  : 'bg-sky-100 text-sky-700 border-sky-200'
              )}>
                {order.status === 'billed' ? 'รอชำระ' : 'เปิดโต๊ะ'}
              </span>
            </div>
            <div className="space-y-0.5 text-xs text-muted-foreground">
              <div className="flex justify-between"><span>ค่าอาหาร</span><span>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between"><span>Service (10%)</span><span>{formatCurrency(service)}</span></div>
              <div className="flex justify-between"><span>VAT (7%)</span><span>{formatCurrency(vat)}</span></div>
              {(order.discount ?? 0) > 0 && (
                <div className="flex justify-between text-emerald-600"><span>ส่วนลด</span><span>-{formatCurrency(order.discount ?? 0)}</span></div>
              )}
            </div>
            <div className="flex justify-between font-bold border-t pt-1">
              <span>รวม</span><span>{formatCurrency(total)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ─── Main Client ─────────────────────────────────────────────────────────────

export function RestaurantClient({ hotelId, initialTables, initialOrders, outlets, menuItems }: Props) {
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables);
  const [orders, setOrders] = useState<RestaurantOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState<'tables' | 'orders' | 'billing'>('tables');
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [showNewOrder, setShowNewOrder] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchAll = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        fetch(`/api/restaurant/tables?hotel_id=${hotelId}`, { cache: 'no-store' }),
        fetch(`/api/restaurant/orders?hotel_id=${hotelId}&status=open,billed`, { cache: 'no-store' }),
      ]);
      if (tablesRes.ok) { const j = await tablesRes.json(); setTables(j.data ?? []); }
      if (ordersRes.ok) { const j = await ordersRes.json(); setOrders(j.data ?? []); }
    } catch { /* silent */ } finally {
      if (showLoader) setRefreshing(false);
    }
  }, [hotelId]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchAll(false), 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchAll]);

  function handleTableClick(table: RestaurantTable) {
    if (table.status === 'occupied') {
      const order = orders.find(o => o.table_id === table.id);
      if (order) {
        setSelectedTable(table);
        setSelectedOrder(order);
      } else {
        // Occupied but no open order — allow new order
        setSelectedTable(table);
        setShowNewOrder(true);
      }
    } else if (table.status === 'available') {
      setSelectedTable(table);
      setShowNewOrder(true);
    } else {
      toast.info(`โต๊ะ ${table.table_no}: ${TABLE_STATUS_CONFIG[table.status].label}`);
    }
  }

  function handleOrderClick(order: RestaurantOrder) {
    const table = tables.find(t => t.id === order.table_id);
    if (table) {
      setSelectedTable(table);
      setSelectedOrder(order);
    }
  }

  function handleOrderCreated(order: RestaurantOrder, updatedTable: RestaurantTable) {
    setOrders(prev => [order, ...prev]);
    setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
    setShowNewOrder(false);
    setSelectedTable(null);
  }

  function handleOrderUpdated(updated: RestaurantOrder, updatedTable?: RestaurantTable) {
    setOrders(prev => prev.map(o => o.id === updated.id ? updated : o)
      .filter(o => o.status !== 'paid' && o.status !== 'cancelled'));
    if (updatedTable) {
      setTables(prev => prev.map(t => t.id === updatedTable.id ? updatedTable : t));
    }
    setSelectedOrder(updated);
  }

  const tabs = [
    { key: 'tables' as const, label: 'โต๊ะ', icon: LayoutGrid, count: null },
    { key: 'orders' as const, label: 'ออร์เดอร์', icon: ListOrdered, count: orders.filter(o => o.status === 'open').length },
    { key: 'billing' as const, label: 'ชำระเงิน', icon: Receipt, count: orders.filter(o => o.status === 'billed').length },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          <h1 className="font-display text-lg font-semibold">Restaurant POS</h1>
        </div>
        <Button size="sm" variant="outline" onClick={() => fetchAll(true)} disabled={refreshing} className="gap-1.5">
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          รีเฟรช
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-card px-4 shrink-0">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count !== null && count > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-primary text-primary-foreground font-bold">
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'tables' && (
          <TableGrid tables={tables} orders={orders} onTableClick={handleTableClick} />
        )}
        {activeTab === 'orders' && (
          <OrdersList orders={orders} tables={tables} onOrderClick={handleOrderClick} />
        )}
        {activeTab === 'billing' && (
          <BillingTab orders={orders} tables={tables} onOrderClick={handleOrderClick} />
        )}
      </div>

      {/* Modals */}
      {showNewOrder && selectedTable && (
        <NewOrderModal
          table={selectedTable}
          outlets={outlets}
          menuItems={menuItems}
          hotelId={hotelId}
          onClose={() => { setShowNewOrder(false); setSelectedTable(null); }}
          onCreated={handleOrderCreated}
        />
      )}
      {selectedOrder && selectedTable && !showNewOrder && (
        <OrderModal
          order={selectedOrder}
          table={selectedTable}
          outlets={outlets}
          menuItems={menuItems}
          hotelId={hotelId}
          onClose={() => { setSelectedOrder(null); setSelectedTable(null); }}
          onUpdated={handleOrderUpdated}
        />
      )}
    </div>
  );
}
