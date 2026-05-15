'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Package, Clock, CheckCheck, RefreshCw, Banknote, Home, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn, formatCurrency } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type RSStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
type PaymentMethod = 'cash' | 'room_charge' | 'card' | 'qr';

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  notes?: string | null;
}

interface RSOrder {
  id: string;
  hotel_id: string;
  outlet_id?: string | null;
  order_type: string;
  status: RSStatus;
  total: number;
  room_no?: string | null;
  reservation_id?: string | null;
  items: OrderItem[];
  created_at: string;
  fb_outlets?: { id: string; name: string } | null;
}

interface Props {
  hotelId: string;
  initialOrders: RSOrder[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TAB_CONFIG: { key: string; label: string; statuses: RSStatus[]; color: string } [] = [
  { key: 'pending', label: 'รอส่ง', statuses: ['pending', 'ready'], color: 'text-amber-600' },
  { key: 'delivering', label: 'กำลังส่ง', statuses: ['preparing'], color: 'text-sky-600' },
  { key: 'delivered', label: 'ส่งแล้ว', statuses: ['delivered'], color: 'text-emerald-600' },
];

const STATUS_LABEL: Record<RSStatus, string> = {
  pending: 'รอรับงาน',
  preparing: 'กำลังส่ง',
  ready: 'พร้อมส่ง',
  delivered: 'ส่งแล้ว',
  cancelled: 'ยกเลิก',
};

const STATUS_BADGE: Record<RSStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  preparing: 'bg-sky-100 text-sky-800 border-sky-200',
  ready: 'bg-violet-100 text-violet-800 border-violet-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash: 'เงินสด',
  room_charge: 'เก็บห้อง',
  card: 'บัตรเครดิต',
  qr: 'QR Code',
};

function timeLabel(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function elapsed(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'เมื่อกี้';
  if (diff < 60) return `${diff} นาทีที่แล้ว`;
  return `${Math.floor(diff / 60)} ชม. ${diff % 60} นาทีที่แล้ว`;
}

// ─── Payment Modal ────────────────────────────────────────────────────────────

function PaymentModal({
  order,
  onClose,
  onConfirm,
}: {
  order: RSOrder;
  onClose: () => void;
  onConfirm: (method: PaymentMethod) => Promise<void>;
}) {
  const [method, setMethod] = useState<PaymentMethod>('room_charge');
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    await onConfirm(method);
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-2xl border shadow-xl w-full max-w-sm p-6 flex flex-col gap-4">
        <h2 className="font-display font-semibold text-lg">เก็บเงิน — ห้อง {order.room_no}</h2>

        <div className="space-y-1 text-sm">
          {(Array.isArray(order.items) ? order.items : []).map((item, i) => (
            <div key={i} className="flex justify-between">
              <span>{item.qty}× {item.name}</span>
              <span className="text-muted-foreground">{formatCurrency(item.price * item.qty)}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>รวม</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(PAYMENT_LABELS) as PaymentMethod[]).map(m => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm font-medium transition-all',
                method === m
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50'
              )}
            >
              {PAYMENT_LABELS[m]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
            ยกเลิก
          </Button>
          <Button className="flex-1" onClick={handleConfirm} disabled={loading}>
            {loading ? 'กำลังบันทึก…' : 'ยืนยัน'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onStatusChange,
  onPayment,
  onTrayReturn,
}: {
  order: RSOrder;
  onStatusChange: (id: string, status: RSStatus) => Promise<void>;
  onPayment: (order: RSOrder) => void;
  onTrayReturn: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];

  async function doStatus(status: RSStatus) {
    setLoading(true);
    await onStatusChange(order.id, status);
    setLoading(false);
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Home className="h-4 w-4 text-primary shrink-0" />
          <span className="font-bold text-base">ห้อง {order.room_no || '—'}</span>
          <span className={cn(
            'text-xs px-2 py-0.5 rounded-full border font-medium',
            STATUS_BADGE[order.status]
          )}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <div className="text-xs text-muted-foreground shrink-0 text-right">
          <div>{timeLabel(order.created_at)}</div>
          <div className="mt-0.5">{elapsed(order.created_at)}</div>
        </div>
      </div>

      {/* Outlet */}
      {order.fb_outlets && (
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <UtensilsCrossed className="h-3 w-3" />
          {order.fb_outlets.name}
        </div>
      )}

      {/* Items */}
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm flex justify-between gap-2">
            <span>{item.qty}× {item.name}{item.notes ? ` (${item.notes})` : ''}</span>
            <span className="text-muted-foreground shrink-0">{formatCurrency(item.price * item.qty)}</span>
          </li>
        ))}
      </ul>

      {/* Total */}
      <div className="flex justify-between items-center font-semibold border-t pt-2">
        <span className="text-sm">รวม</span>
        <span>{formatCurrency(order.total)}</span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {order.status === 'pending' && (
          <Button
            size="sm"
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
            disabled={loading}
            onClick={() => doStatus('preparing')}
          >
            รับงาน
          </Button>
        )}
        {order.status === 'ready' && (
          <Button
            size="sm"
            className="flex-1 bg-sky-500 hover:bg-sky-600 text-white"
            disabled={loading}
            onClick={() => doStatus('preparing')}
          >
            รับงาน
          </Button>
        )}
        {order.status === 'preparing' && (
          <>
            <Button
              size="sm"
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
              disabled={loading}
              onClick={() => doStatus('delivered')}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              ส่งแล้ว
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={loading}
              onClick={() => onPayment(order)}
            >
              <Banknote className="h-3.5 w-3.5" />
              เก็บเงิน
            </Button>
          </>
        )}
        {order.status === 'delivered' && (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onTrayReturn(order.id)}
          >
            เก็บถาด
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Client ─────────────────────────────────────────────────────────────

export function RoomServiceClient({ hotelId, initialOrders }: Props) {
  const [orders, setOrders] = useState<RSOrder[]>(initialOrders);
  const [activeTab, setActiveTab] = useState('pending');
  const [refreshing, setRefreshing] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<RSOrder | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    try {
      const res = await fetch(`/api/room-service?hotel_id=${hotelId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setOrders(data ?? []);
    } catch {
      // silent
    } finally {
      if (showLoader) setRefreshing(false);
    }
  }, [hotelId]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchOrders(false), 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchOrders]);

  async function handleStatusChange(id: string, status: RSStatus) {
    try {
      const res = await fetch('/api/room-service', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) { toast.error('อัพเดทไม่สำเร็จ'); return; }
      const { data } = await res.json();
      setOrders(o => o.map(r => r.id === id ? { ...r, ...data } : r));
      toast.success(STATUS_LABEL[status]);
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    }
  }

  async function handlePayment(method: PaymentMethod) {
    if (!paymentOrder) return;
    try {
      const res = await fetch('/api/room-service', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: paymentOrder.id, status: 'delivered', payment_method: method }),
      });
      if (!res.ok) { toast.error('บันทึกการชำระไม่สำเร็จ'); return; }
      const { data } = await res.json();
      setOrders(o => o.map(r => r.id === paymentOrder.id ? { ...r, ...data } : r));
      toast.success('บันทึกการชำระเงินแล้ว');
      setPaymentOrder(null);
    } catch {
      toast.error('เกิดข้อผิดพลาด');
    }
  }

  function handleTrayReturn(id: string) {
    // Mark visually as tray collected (no DB column needed — just remove from view)
    setOrders(o => o.filter(r => r.id !== id));
    toast.success('เก็บถาดแล้ว');
  }

  // Filter by tab
  const tab = TAB_CONFIG.find(t => t.key === activeTab) ?? TAB_CONFIG[0];
  const visible = orders.filter(o => tab.statuses.includes(o.status));

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-card sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h1 className="font-display text-lg font-semibold">Room Service</h1>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => fetchOrders(true)}
          disabled={refreshing}
          className="gap-1.5"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
          รีเฟรช
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b bg-card px-4 shrink-0">
        {TAB_CONFIG.map(t => {
          const count = orders.filter(o => t.statuses.includes(o.status)).length;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5',
                activeTab === t.key
                  ? `border-primary ${t.color}`
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-xs bg-primary text-primary-foreground font-bold">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Order cards */}
      <div className="flex-1 p-4">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-60 text-muted-foreground gap-2">
            <Package className="h-10 w-10 opacity-30" />
            <p>ไม่มีออร์เดอร์</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map(order => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={handleStatusChange}
                onPayment={setPaymentOrder}
                onTrayReturn={handleTrayReturn}
              />
            ))}
          </div>
        )}
      </div>

      {/* Payment modal */}
      {paymentOrder && (
        <PaymentModal
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
          onConfirm={handlePayment}
        />
      )}
    </div>
  );
}
