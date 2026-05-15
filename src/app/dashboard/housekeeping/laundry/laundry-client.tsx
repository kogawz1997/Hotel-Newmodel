'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/layout/top-bar';
import { Plus, Package, Truck, CheckCircle, Hash, Calendar, User } from 'lucide-react';

type LaundryBatch = {
  id: string;
  hotel_id: string;
  batch_no: string;
  collected_at: string | null;
  returned_at: string | null;
  items_count: number;
  items_detail: any;
  assigned_to: string | null;
  vendor: string | null;
  status: 'collected' | 'sent' | 'returned' | 'cancelled';
  notes: string | null;
  assignee: { id: string; full_name: string } | null;
};

type Tab = 'sending' | 'returned' | 'all';

const STATUS_LABEL: Record<string, string> = {
  collected: 'รอส่ง',
  sent: 'ส่งซักแล้ว',
  returned: 'รับคืนแล้ว',
  cancelled: 'ยกเลิก',
};

const STATUS_VARIANT: Record<string, 'default' | 'warning' | 'success' | 'secondary' | 'destructive' | 'outline' | 'info' | 'accent'> = {
  collected: 'warning',
  sent: 'info',
  returned: 'success',
  cancelled: 'destructive',
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'sending', label: 'ส่งซัก' },
  { key: 'returned', label: 'รับคืน' },
  { key: 'all', label: 'ทั้งหมด' },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type CreateForm = {
  vendor: string;
  items_count: string;
  items_detail: string;
  notes: string;
};

type Props = {
  hotelId: string;
  userId: string;
  batches: LaundryBatch[];
};

export function LaundryClient({ hotelId, userId, batches: initialBatches }: Props) {
  const [batches, setBatches] = useState(initialBatches);
  const [activeTab, setActiveTab] = useState<Tab>('sending');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState<CreateForm>({
    vendor: '',
    items_count: '',
    items_detail: '',
    notes: '',
  });

  const sendingBatches = batches.filter(
    (b) => b.status === 'collected' || b.status === 'sent'
  );
  const returnedBatches = batches.filter((b) => b.status === 'returned');
  const allBatches = batches;

  const currentBatches: Record<Tab, LaundryBatch[]> = {
    sending: sendingBatches,
    returned: returnedBatches,
    all: allBatches,
  };

  function resetForm() {
    setForm({ vendor: '', items_count: '', items_detail: '', notes: '' });
  }

  async function handleCreate() {
    const count = parseInt(form.items_count);
    if (!form.items_count || isNaN(count) || count < 1) {
      toast.error('กรุณาระบุจำนวนชิ้น');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/housekeeping/laundry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotel_id: hotelId,
            vendor: form.vendor.trim() || null,
            items_count: count,
            items_detail: form.items_detail.trim() || null,
            notes: form.notes.trim() || null,
          }),
        });

        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || 'เกิดข้อผิดพลาด');
          return;
        }

        const json = await res.json();
        setBatches((prev) => [json.batch, ...prev]);
        setShowCreateModal(false);
        resetForm();
        toast.success(`สร้าง Batch ${json.batch.batch_no} สำเร็จ`);
      } catch {
        toast.error('เกิดข้อผิดพลาดในการส่งข้อมูล');
      }
    });
  }

  async function handleStatusUpdate(
    id: string,
    status: LaundryBatch['status']
  ) {
    startTransition(async () => {
      try {
        const res = await fetch('/api/housekeeping/laundry', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status }),
        });

        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || 'เกิดข้อผิดพลาด');
          return;
        }

        const json = await res.json();
        setBatches((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...json.batch } : b))
        );

        const labels: Record<string, string> = {
          sent: 'ส่งซักแล้ว',
          returned: 'รับคืนแล้ว',
          cancelled: 'ยกเลิกแล้ว',
        };
        toast.success(labels[status] || 'อัปเดตสำเร็จ');
      } catch {
        toast.error('เกิดข้อผิดพลาดในการส่งข้อมูล');
      }
    });
  }

  function BatchCard({ batch }: { batch: LaundryBatch }) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-stone-700 dark:bg-stone-800/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 font-mono text-sm font-bold text-stone-700 dark:text-stone-200">
                <Hash className="h-3.5 w-3.5" />
                {batch.batch_no}
              </span>
              <Badge variant={STATUS_VARIANT[batch.status]}>
                {STATUS_LABEL[batch.status]}
              </Badge>
            </div>

            <div className="mt-2 space-y-1 text-sm text-stone-500 dark:text-stone-400">
              <div className="flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5 flex-shrink-0" />
                <span>{batch.items_count} ชิ้น</span>
                {batch.vendor && (
                  <span className="text-stone-400">· ร้าน: {batch.vendor}</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span>รวบรวม: {formatDate(batch.collected_at)}</span>
              </div>
              {batch.returned_at && (
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                  <span>รับคืน: {formatDate(batch.returned_at)}</span>
                </div>
              )}
              {batch.assignee && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{batch.assignee.full_name}</span>
                </div>
              )}
              {batch.notes && (
                <p className="text-xs text-stone-400 italic mt-1">{batch.notes}</p>
              )}
            </div>

            {/* items_detail preview */}
            {batch.items_detail && (
              <div className="mt-2 rounded-lg bg-stone-50 p-2 text-xs text-stone-600 dark:bg-stone-700/40 dark:text-stone-400">
                {typeof batch.items_detail === 'string'
                  ? batch.items_detail
                  : JSON.stringify(batch.items_detail, null, 2).slice(0, 200)}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-1.5">
            {batch.status === 'collected' && (
              <Button
                size="sm"
                className="gap-1 whitespace-nowrap"
                onClick={() => handleStatusUpdate(batch.id, 'sent')}
                disabled={isPending}
              >
                <Truck className="h-3.5 w-3.5" />
                ส่งซัก
              </Button>
            )}
            {batch.status === 'sent' && (
              <Button
                size="sm"
                className="gap-1 whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleStatusUpdate(batch.id, 'returned')}
                disabled={isPending}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                รับคืนแล้ว
              </Button>
            )}
            {(batch.status === 'collected' || batch.status === 'sent') && (
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-rose-500 hover:text-rose-600"
                onClick={() => handleStatusUpdate(batch.id, 'cancelled')}
                disabled={isPending}
              >
                ยกเลิก
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar
        title="การซักผ้า"
        description={`Batch ทั้งหมด ${batches.length} รายการ · รอส่ง/กำลังซัก ${sendingBatches.length} รายการ`}
        action={
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            สร้าง Batch ใหม่
          </Button>
        }
      />

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800/50 dark:bg-amber-900/20">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {batches.filter((b) => b.status === 'collected').length}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400">รอส่ง</div>
        </div>
        <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-center dark:border-sky-800/50 dark:bg-sky-900/20">
          <div className="text-2xl font-bold text-sky-700 dark:text-sky-300">
            {batches.filter((b) => b.status === 'sent').length}
          </div>
          <div className="text-xs text-sky-600 dark:text-sky-400">ส่งซักแล้ว</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center dark:border-emerald-800/50 dark:bg-emerald-900/20">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {batches.filter((b) => b.status === 'returned').length}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">รับคืนแล้ว</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              activeTab === tab.key
                ? 'bg-white shadow text-stone-900 dark:bg-stone-700 dark:text-stone-100'
                : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
            )}
          >
            {tab.label}
            <span className="ml-2 rounded-full bg-stone-200 px-1.5 py-0.5 text-xs font-semibold text-stone-600 dark:bg-stone-600 dark:text-stone-300">
              {currentBatches[tab.key].length}
            </span>
          </button>
        ))}
      </div>

      {/* Batch List */}
      <div className="mt-4 grid gap-3">
        {currentBatches[activeTab].length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-stone-200 p-12 text-center dark:border-stone-700">
            <Package className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-600" />
            <p className="mt-3 text-stone-500 dark:text-stone-400">
              {activeTab === 'sending'
                ? 'ไม่มี Batch ที่รอส่งหรือกำลังซัก'
                : activeTab === 'returned'
                ? 'ยังไม่มี Batch ที่รับคืน'
                : 'ยังไม่มี Batch ผ้า'}
            </p>
          </div>
        ) : (
          currentBatches[activeTab].map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))
        )}
      </div>

      {/* Create Modal */}
      <Dialog
        open={showCreateModal}
        onOpenChange={(open) => { if (!open) { setShowCreateModal(false); resetForm(); } }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>สร้าง Batch ซักผ้าใหม่</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  จำนวนชิ้น <span className="text-rose-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={form.items_count}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, items_count: e.target.value }))
                  }
                  placeholder="เช่น 50"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  ร้านซักผ้า / Vendor
                </label>
                <Input
                  value={form.vendor}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, vendor: e.target.value }))
                  }
                  placeholder="ชื่อร้าน"
                  maxLength={200}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                รายละเอียดสิ่งของ
              </label>
              <textarea
                value={form.items_detail}
                onChange={(e) =>
                  setForm((f) => ({ ...f, items_detail: e.target.value }))
                }
                rows={4}
                placeholder="เช่น&#10;ผ้าปูที่นอน: 20 ผืน&#10;ผ้าขนหนู: 15 ผืน&#10;ปลอกหมอน: 15 ใบ"
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                หมายเหตุ
              </label>
              <textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={2}
                maxLength={2000}
                placeholder="ข้อมูลเพิ่มเติม..."
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setShowCreateModal(false); resetForm(); }}
              disabled={isPending}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isPending || !form.items_count}
            >
              สร้าง Batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
