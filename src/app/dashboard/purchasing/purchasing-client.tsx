'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ShoppingCart,
  Users,
  Package,
  PlusCircle,
  Trash2,
  Star,
  AlertTriangle,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type POStatus = 'draft' | 'submitted' | 'approved' | 'ordered' | 'received' | 'cancelled';

interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_id: string | null;
  category: string | null;
  rating: number | null;
  is_active: boolean;
  notes: string | null;
}

interface POItem {
  name: string;
  qty: number;
  unit?: string;
  unit_price: number;
  inventory_item_id?: string;
}

interface PurchaseOrder {
  id: string;
  hotel_id: string;
  supplier_id: string;
  po_number: string;
  items: POItem[];
  total_amount: number;
  currency: string;
  status: POStatus;
  requested_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  ordered_at: string | null;
  received_at: string | null;
  notes: string | null;
  created_at: string;
  supplier?: { id: string; name: string; contact_name: string | null; phone: string | null } | null;
  requester?: { id: string; full_name: string | null } | null;
  approver?: { id: string; full_name: string | null } | null;
}

interface InventoryItem {
  id: string;
  name: string;
  sku: string | null;
  category: string | null;
  unit: string | null;
  quantity: number;
  min_stock: number | null;
  cost_per_unit: number | null;
  location: string | null;
  supplier_id: string | null;
  updated_at: string;
  supplier?: { id: string; name: string } | null;
}

interface Props {
  hotel: { id: string; name: string };
  profile: { id: string; role: string };
  userId: string;
  initialOrders: PurchaseOrder[];
  initialSuppliers: Supplier[];
  initialInventory: InventoryItem[];
  lowStockCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PO_STATUS_LABELS: Record<POStatus, string> = {
  draft: 'ร่าง',
  submitted: 'รอพิจารณา',
  approved: 'อนุมัติแล้ว',
  ordered: 'สั่งซื้อแล้ว',
  received: 'รับสินค้าแล้ว',
  cancelled: 'ยกเลิก',
};

const PO_STATUS_VARIANTS: Record<POStatus, string> = {
  draft: 'secondary',
  submitted: 'warning',
  approved: 'info',
  ordered: 'accent',
  received: 'success',
  cancelled: 'destructive',
};

const APPROVER_ROLES = ['owner', 'admin', 'manager', 'purchasing_manager', 'accounting_manager', 'general_manager'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function fmtMoney(n: number, currency = 'THB') {
  return `฿${n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function POStatusBadge({ status }: { status: POStatus }) {
  return (
    <Badge variant={(PO_STATUS_VARIANTS[status] ?? 'secondary') as any}>
      {PO_STATUS_LABELS[status] ?? status}
    </Badge>
  );
}

function StarRating({ value }: { value: number | null }) {
  const v = value ?? 0;
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= v ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}
        />
      ))}
    </span>
  );
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'orders', label: 'ใบสั่งซื้อ', icon: ShoppingCart },
  { key: 'suppliers', label: 'ผู้ขาย', icon: Users },
  { key: 'stock', label: 'สต็อก', icon: Package },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ─── Main Component ───────────────────────────────────────────────────────────

export function PurchasingClient({
  hotel,
  profile,
  userId,
  initialOrders,
  initialSuppliers,
  initialInventory,
  lowStockCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('orders');
  const isApprover = APPROVER_ROLES.includes(profile.role);

  // ── Orders ──
  const [orders, setOrders] = useState<PurchaseOrder[]>(initialOrders);
  const [showCreatePO, setShowCreatePO] = useState(false);
  const [poSupplier, setPoSupplier] = useState('');
  const [poItems, setPoItems] = useState<POItem[]>([{ name: '', qty: 1, unit: '', unit_price: 0 }]);
  const [poNotes, setPoNotes] = useState('');
  const [creatingPO, setCreatingPO] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // ── Suppliers ──
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supTaxId, setSupTaxId] = useState('');
  const [supCategory, setSupCategory] = useState('');
  const [addingSupplier, setAddingSupplier] = useState(false);

  // ── Inventory ──
  const [inventory, setInventory] = useState<InventoryItem[]>(initialInventory);
  const [showAddItem, setShowAddItem] = useState(false);
  const [invName, setInvName] = useState('');
  const [invSku, setInvSku] = useState('');
  const [invCategory, setInvCategory] = useState('');
  const [invUnit, setInvUnit] = useState('');
  const [invQty, setInvQty] = useState('0');
  const [invMinStock, setInvMinStock] = useState('0');
  const [invCost, setInvCost] = useState('');
  const [invLocation, setInvLocation] = useState('');
  const [invSupplier, setInvSupplier] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // Adjust stock modal
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNote, setAdjustNote] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  // ── PO helpers ────────────────────────────────────────────────────────────

  const poTotal = poItems.reduce((s, i) => s + i.qty * i.unit_price, 0);

  function addPoItem() {
    setPoItems((prev) => [...prev, { name: '', qty: 1, unit: '', unit_price: 0 }]);
  }

  function removePoItem(idx: number) {
    setPoItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updatePoItem(idx: number, field: keyof POItem, value: string | number) {
    setPoItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }

  async function handleCreatePO(e: React.FormEvent) {
    e.preventDefault();
    if (!poSupplier || !poItems.some((i) => i.name)) return;
    setCreatingPO(true);
    try {
      const res = await fetch('/api/purchasing/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplier_id: poSupplier,
          items: poItems.filter((i) => i.name),
          notes: poNotes || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setOrders((prev) => [d.order, ...prev]);
      setShowCreatePO(false);
      setPoSupplier(''); setPoItems([{ name: '', qty: 1, unit: '', unit_price: 0 }]); setPoNotes('');
      toast.success('สร้างใบสั่งซื้อแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setCreatingPO(false);
  }

  async function handlePOAction(orderId: string, action: string) {
    setActionLoading(orderId + action);
    try {
      const res = await fetch(`/api/purchasing/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? d.order : o)));
      toast.success('อัปเดตสถานะแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setActionLoading(null);
  }

  // ── Supplier helpers ─────────────────────────────────────────────────────

  async function handleAddSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!supName) return;
    setAddingSupplier(true);
    try {
      const res = await fetch('/api/purchasing/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: supName,
          contact_name: supContact || null,
          phone: supPhone || null,
          email: supEmail || null,
          address: supAddress || null,
          tax_id: supTaxId || null,
          category: supCategory || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setSuppliers((prev) => [...prev, d.supplier].sort((a, b) => a.name.localeCompare(b.name)));
      setShowAddSupplier(false);
      setSupName(''); setSupContact(''); setSupPhone(''); setSupEmail('');
      setSupAddress(''); setSupTaxId(''); setSupCategory('');
      toast.success('เพิ่มผู้ขายแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setAddingSupplier(false);
  }

  // ── Inventory helpers ────────────────────────────────────────────────────

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!invName) return;
    setAddingItem(true);
    try {
      const res = await fetch('/api/purchasing/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: invName,
          sku: invSku || null,
          category: invCategory || null,
          unit: invUnit || null,
          quantity: parseFloat(invQty) || 0,
          min_stock: parseFloat(invMinStock) || 0,
          cost_per_unit: invCost ? parseFloat(invCost) : null,
          location: invLocation || null,
          supplier_id: invSupplier || null,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setInventory((prev) => [...prev, d.item].sort((a, b) => a.name.localeCompare(b.name)));
      setShowAddItem(false);
      setInvName(''); setInvSku(''); setInvCategory(''); setInvUnit('');
      setInvQty('0'); setInvMinStock('0'); setInvCost(''); setInvLocation(''); setInvSupplier('');
      toast.success('เพิ่มสินค้าแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setAddingItem(false);
  }

  async function handleAdjust(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustTarget || adjustQty === '') return;
    setAdjusting(true);
    try {
      const res = await fetch(`/api/purchasing/inventory?id=${adjustTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adjustment: parseFloat(adjustQty),
          note: adjustNote || null,
          type: parseFloat(adjustQty) >= 0 ? 'in' : 'out',
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setInventory((prev) =>
        prev.map((i) => (i.id === adjustTarget.id ? { ...i, quantity: d.item.quantity } : i))
      );
      setAdjustTarget(null);
      setAdjustQty('');
      setAdjustNote('');
      toast.success('ปรับสต็อกแล้ว');
    } catch (err: any) {
      toast.error(err.message || 'เกิดข้อผิดพลาด');
    }
    setAdjusting(false);
  }

  const lowStockItems = inventory.filter(
    (i) => i.min_stock != null && i.quantity <= i.min_stock
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <TopBar
        title="จัดซื้อจัดจ้าง"
        description={hotel.name}
      />

      {/* Tab Navigation */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const showBadge = tab.key === 'stock' && lowStockCount > 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                  {showBadge && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                      {lowStockCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* ── Purchase Orders Tab ───────────────────────────────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">ใบสั่งซื้อ ({orders.length})</h2>
              <Button onClick={() => setShowCreatePO(true)}>
                <PlusCircle size={16} className="mr-2" />
                สร้างใบสั่งซื้อ
              </Button>
            </div>

            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  ยังไม่มีใบสั่งซื้อ
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono font-semibold text-sm">
                              {order.po_number}
                            </span>
                            <POStatusBadge status={order.status} />
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ผู้ขาย: <span className="text-foreground">{order.supplier?.name ?? '—'}</span>
                            {' · '}
                            รวม:{' '}
                            <span className="font-semibold text-foreground">
                              {fmtMoney(order.total_amount, order.currency)}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            สร้างโดย: {order.requester?.full_name ?? '—'}
                            {' · '}
                            {fmtDate(order.created_at)}
                            {order.approved_at && ` · อนุมัติ: ${fmtDate(order.approved_at)}`}
                            {order.received_at && ` · รับสินค้า: ${fmtDate(order.received_at)}`}
                          </div>

                          {/* Items summary */}
                          <div className="mt-2 text-xs text-muted-foreground">
                            {order.items?.slice(0, 3).map((item, idx) => (
                              <span key={idx}>
                                {item.name} ×{item.qty}
                                {idx < Math.min(order.items.length, 3) - 1 ? ', ' : ''}
                              </span>
                            ))}
                            {order.items?.length > 3 && ` +${order.items.length - 3} รายการ`}
                          </div>

                          {order.notes && (
                            <div className="mt-1 text-xs text-muted-foreground italic">
                              {order.notes}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-col gap-1 shrink-0">
                          {order.status === 'draft' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actionLoading === order.id + 'submit'}
                              onClick={() => handlePOAction(order.id, 'submit')}
                            >
                              ส่งพิจารณา
                            </Button>
                          )}
                          {order.status === 'submitted' && isApprover && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300"
                              disabled={actionLoading === order.id + 'approve'}
                              onClick={() => handlePOAction(order.id, 'approve')}
                            >
                              อนุมัติ
                            </Button>
                          )}
                          {order.status === 'submitted' && isApprover && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
                              disabled={actionLoading === order.id + 'cancel'}
                              onClick={() => handlePOAction(order.id, 'cancel')}
                            >
                              ยกเลิก
                            </Button>
                          )}
                          {order.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-300"
                              disabled={actionLoading === order.id + 'order'}
                              onClick={() => handlePOAction(order.id, 'order')}
                            >
                              สั่งซื้อแล้ว
                            </Button>
                          )}
                          {order.status === 'ordered' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300"
                              disabled={actionLoading === order.id + 'receive'}
                              onClick={() => handlePOAction(order.id, 'receive')}
                            >
                              รับสินค้า
                            </Button>
                          )}
                          {(order.status === 'draft') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-muted-foreground"
                              disabled={actionLoading === order.id + 'cancel'}
                              onClick={() => handlePOAction(order.id, 'cancel')}
                            >
                              ยกเลิก
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Suppliers Tab ─────────────────────────────────────────────── */}
        {activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">ผู้ขาย ({suppliers.length})</h2>
              <Button onClick={() => setShowAddSupplier(true)}>
                <PlusCircle size={16} className="mr-2" />
                เพิ่มผู้ขาย
              </Button>
            </div>

            {suppliers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  ยังไม่มีผู้ขาย
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {suppliers.map((sup) => (
                  <Card key={sup.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <CardTitle className="text-base">{sup.name}</CardTitle>
                          {sup.category && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {sup.category}
                            </Badge>
                          )}
                        </div>
                        <StarRating value={sup.rating} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-1.5 text-sm">
                      {sup.contact_name && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20 shrink-0">ติดต่อ</span>
                          <span>{sup.contact_name}</span>
                        </div>
                      )}
                      {sup.phone && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20 shrink-0">โทร</span>
                          <a href={`tel:${sup.phone}`} className="text-primary hover:underline">
                            {sup.phone}
                          </a>
                        </div>
                      )}
                      {sup.email && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20 shrink-0">อีเมล</span>
                          <a href={`mailto:${sup.email}`} className="text-primary hover:underline truncate">
                            {sup.email}
                          </a>
                        </div>
                      )}
                      {sup.address && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20 shrink-0">ที่อยู่</span>
                          <span className="text-muted-foreground text-xs">{sup.address}</span>
                        </div>
                      )}
                      {sup.tax_id && (
                        <div className="flex gap-2">
                          <span className="text-muted-foreground w-20 shrink-0">เลขภาษี</span>
                          <span className="font-mono text-xs">{sup.tax_id}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Stock Tab ─────────────────────────────────────────────────── */}
        {activeTab === 'stock' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold">สต็อกสินค้า ({inventory.length})</h2>
                {lowStockItems.length > 0 && (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle size={12} />
                    สต็อกต่ำ {lowStockItems.length} รายการ
                  </Badge>
                )}
              </div>
              <Button onClick={() => setShowAddItem(true)}>
                <PlusCircle size={16} className="mr-2" />
                เพิ่มสินค้า
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left px-4 py-3 font-medium">ชื่อสินค้า</th>
                        <th className="text-left px-4 py-3 font-medium">SKU</th>
                        <th className="text-left px-4 py-3 font-medium">หมวดหมู่</th>
                        <th className="text-left px-4 py-3 font-medium">หน่วย</th>
                        <th className="text-right px-4 py-3 font-medium">จำนวน</th>
                        <th className="text-right px-4 py-3 font-medium">ขั้นต่ำ</th>
                        <th className="text-left px-4 py-3 font-medium">ที่เก็บ</th>
                        <th className="text-right px-4 py-3 font-medium">ราคา/หน่วย</th>
                        <th className="text-left px-4 py-3 font-medium">การดำเนินการ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center text-muted-foreground py-8">
                            ยังไม่มีรายการสินค้า
                          </td>
                        </tr>
                      ) : (
                        inventory.map((item) => {
                          const isLow = item.min_stock != null && item.quantity <= item.min_stock;
                          return (
                            <tr
                              key={item.id}
                              className={`border-b hover:bg-muted/30 transition-colors ${
                                isLow ? 'bg-red-50/50 dark:bg-red-950/20' : ''
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {isLow && (
                                    <AlertTriangle size={14} className="text-red-500 shrink-0" />
                                  )}
                                  <span className={`font-medium ${isLow ? 'text-red-600 dark:text-red-400' : ''}`}>
                                    {item.name}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                {item.sku ?? '—'}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{item.category ?? '—'}</td>
                              <td className="px-4 py-3 text-muted-foreground">{item.unit ?? '—'}</td>
                              <td className={`px-4 py-3 text-right font-semibold ${isLow ? 'text-red-600 dark:text-red-400' : ''}`}>
                                {item.quantity}
                              </td>
                              <td className="px-4 py-3 text-right text-muted-foreground">
                                {item.min_stock ?? '—'}
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">{item.location ?? '—'}</td>
                              <td className="px-4 py-3 text-right text-muted-foreground">
                                {item.cost_per_unit != null ? fmtMoney(item.cost_per_unit) : '—'}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setAdjustTarget(item);
                                    setAdjustQty('');
                                    setAdjustNote('');
                                  }}
                                >
                                  ปรับสต็อก
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Create PO Modal */}
      <Dialog open={showCreatePO} onOpenChange={setShowCreatePO}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>สร้างใบสั่งซื้อ</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePO} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">ผู้ขาย</label>
              <select
                value={poSupplier}
                onChange={(e) => setPoSupplier(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">เลือกผู้ขาย</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {/* Items table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">รายการสินค้า</label>
                <Button type="button" size="sm" variant="outline" onClick={addPoItem}>
                  <PlusCircle size={14} className="mr-1" />
                  เพิ่มรายการ
                </Button>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium">ชื่อสินค้า</th>
                      <th className="text-right px-3 py-2 font-medium w-20">จำนวน</th>
                      <th className="text-left px-3 py-2 font-medium w-20">หน่วย</th>
                      <th className="text-right px-3 py-2 font-medium w-28">ราคา/หน่วย</th>
                      <th className="text-right px-3 py-2 font-medium w-28">รวม</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {poItems.map((item, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updatePoItem(idx, 'name', e.target.value)}
                            placeholder="ชื่อสินค้า"
                            className="w-full border-none bg-transparent focus:outline-none text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={item.qty}
                            onChange={(e) => updatePoItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                            className="w-full text-right border-none bg-transparent focus:outline-none text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={item.unit ?? ''}
                            onChange={(e) => updatePoItem(idx, 'unit', e.target.value)}
                            placeholder="ชิ้น"
                            className="w-full border-none bg-transparent focus:outline-none text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unit_price}
                            onChange={(e) => updatePoItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full text-right border-none bg-transparent focus:outline-none text-sm"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {fmtMoney(item.qty * item.unit_price)}
                        </td>
                        <td className="px-2 py-2">
                          {poItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePoItem(idx)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/30 border-t">
                    <tr>
                      <td colSpan={4} className="px-3 py-2 text-right font-medium text-sm">ยอดรวมทั้งสิ้น</td>
                      <td className="px-3 py-2 text-right font-bold">{fmtMoney(poTotal)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
              <textarea
                value={poNotes}
                onChange={(e) => setPoNotes(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowCreatePO(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={creatingPO}>
                {creatingPO ? 'กำลังสร้าง...' : 'สร้างใบสั่งซื้อ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Supplier Modal */}
      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มผู้ขาย</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSupplier} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">ชื่อบริษัท/ร้านค้า *</label>
                <input
                  type="text"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ชื่อผู้ติดต่อ</label>
                <input
                  type="text"
                  value={supContact}
                  onChange={(e) => setSupContact(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">โทรศัพท์</label>
                <input
                  type="tel"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">อีเมล</label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
                <input
                  type="text"
                  value={supCategory}
                  onChange={(e) => setSupCategory(e.target.value)}
                  placeholder="อาหาร, วัสดุ, บริการ..."
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">เลขประจำตัวผู้เสียภาษี</label>
                <input
                  type="text"
                  value={supTaxId}
                  onChange={(e) => setSupTaxId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">ที่อยู่</label>
                <textarea
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  rows={2}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowAddSupplier(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={addingSupplier}>
                {addingSupplier ? 'กำลังเพิ่ม...' : 'เพิ่มผู้ขาย'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Inventory Item Modal */}
      <Dialog open={showAddItem} onOpenChange={setShowAddItem}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มสินค้าในสต็อก</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">ชื่อสินค้า *</label>
                <input
                  type="text"
                  value={invName}
                  onChange={(e) => setInvName(e.target.value)}
                  required
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  type="text"
                  value={invSku}
                  onChange={(e) => setInvSku(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">หมวดหมู่</label>
                <input
                  type="text"
                  value={invCategory}
                  onChange={(e) => setInvCategory(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">หน่วย</label>
                <input
                  type="text"
                  value={invUnit}
                  onChange={(e) => setInvUnit(e.target.value)}
                  placeholder="ชิ้น, กก., ลิตร..."
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">จำนวนเริ่มต้น</label>
                <input
                  type="number"
                  min={0}
                  value={invQty}
                  onChange={(e) => setInvQty(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ขั้นต่ำแจ้งเตือน</label>
                <input
                  type="number"
                  min={0}
                  value={invMinStock}
                  onChange={(e) => setInvMinStock(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ราคา/หน่วย (฿)</label>
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={invCost}
                  onChange={(e) => setInvCost(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ที่เก็บ</label>
                <input
                  type="text"
                  value={invLocation}
                  onChange={(e) => setInvLocation(e.target.value)}
                  placeholder="คลัง A, ห้องครัว..."
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ผู้ขาย</label>
                <select
                  value={invSupplier}
                  onChange={(e) => setInvSupplier(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">ไม่ระบุ</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setShowAddItem(false)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={addingItem}>
                {addingItem ? 'กำลังเพิ่ม...' : 'เพิ่มสินค้า'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Adjust Stock Modal */}
      <Dialog open={!!adjustTarget} onOpenChange={() => setAdjustTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ปรับสต็อก: {adjustTarget?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdjust} className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              จำนวนปัจจุบัน:{' '}
              <strong className={
                adjustTarget && adjustTarget.min_stock != null && adjustTarget.quantity <= adjustTarget.min_stock
                  ? 'text-red-600 dark:text-red-400'
                  : ''
              }>
                {adjustTarget?.quantity} {adjustTarget?.unit ?? ''}
              </strong>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                จำนวนที่ปรับ (+ เพิ่ม / - ลด)
              </label>
              <input
                type="number"
                step={1}
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                placeholder="เช่น 10 หรือ -5"
                required
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            {adjustQty !== '' && adjustTarget && (
              <div className="text-sm text-muted-foreground">
                จำนวนใหม่:{' '}
                <strong>
                  {Math.max(0, adjustTarget.quantity + (parseFloat(adjustQty) || 0))} {adjustTarget.unit ?? ''}
                </strong>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">หมายเหตุ</label>
              <input
                type="text"
                value={adjustNote}
                onChange={(e) => setAdjustNote(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setAdjustTarget(null)}>
                ยกเลิก
              </Button>
              <Button type="submit" disabled={adjusting}>
                {adjusting ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
