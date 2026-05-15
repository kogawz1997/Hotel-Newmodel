'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { TopBar } from '@/components/layout/top-bar';
import { Plus, MapPin, Calendar, User, ImageIcon, Package } from 'lucide-react';

type LostFoundItem = {
  id: string;
  hotel_id: string;
  room_no: string | null;
  description: string;
  found_by: string | null;
  found_at: string | null;
  location: string | null;
  photo_url: string | null;
  status: 'stored' | 'claimed' | 'donated' | 'disposed';
  claimed_by: string | null;
  claimed_at: string | null;
  notes: string | null;
  finder: { id: string; full_name: string } | null;
};

type Tab = 'stored' | 'claimed' | 'other';

const STATUS_LABEL: Record<string, string> = {
  stored: 'เก็บรักษา',
  claimed: 'ถูกรับไปแล้ว',
  donated: 'บริจาค',
  disposed: 'ทิ้ง',
};

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'secondary' | 'destructive' | 'warning' | 'outline' | 'info' | 'accent'> = {
  stored: 'info',
  claimed: 'success',
  donated: 'secondary',
  disposed: 'destructive',
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'stored', label: 'เก็บรักษา' },
  { key: 'claimed', label: 'ถูกรับไปแล้ว' },
  { key: 'other', label: 'บริจาค/ทิ้ง' },
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

type Props = {
  hotelId: string;
  userId: string;
  items: LostFoundItem[];
};

type AddForm = {
  description: string;
  location: string;
  room_no: string;
  found_at: string;
  notes: string;
};

export function LostFoundClient({ hotelId, userId, items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [activeTab, setActiveTab] = useState<Tab>('stored');
  const [showAddModal, setShowAddModal] = useState(false);
  const [claimTarget, setClaimTarget] = useState<LostFoundItem | null>(null);
  const [disposeTarget, setDisposeTarget] = useState<{
    item: LostFoundItem;
    action: 'donated' | 'disposed';
  } | null>(null);

  const [addForm, setAddForm] = useState<AddForm>({
    description: '',
    location: '',
    room_no: '',
    found_at: new Date().toISOString().slice(0, 16),
    notes: '',
  });
  const [claimedBy, setClaimedBy] = useState('');
  const [isPending, startTransition] = useTransition();

  const storedItems = items.filter((i) => i.status === 'stored');
  const claimedItems = items.filter((i) => i.status === 'claimed');
  const otherItems = items.filter(
    (i) => i.status === 'donated' || i.status === 'disposed'
  );

  const currentItems: Record<Tab, LostFoundItem[]> = {
    stored: storedItems,
    claimed: claimedItems,
    other: otherItems,
  };

  function resetAddForm() {
    setAddForm({
      description: '',
      location: '',
      room_no: '',
      found_at: new Date().toISOString().slice(0, 16),
      notes: '',
    });
  }

  async function handleAdd() {
    if (!addForm.description.trim()) {
      toast.error('กรุณากรอกรายละเอียดสิ่งของ');
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch('/api/housekeeping/lost-found', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotel_id: hotelId,
            description: addForm.description.trim(),
            location: addForm.location.trim() || null,
            room_no: addForm.room_no.trim() || null,
            found_at: addForm.found_at
              ? new Date(addForm.found_at).toISOString()
              : null,
            notes: addForm.notes.trim() || null,
          }),
        });

        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || 'เกิดข้อผิดพลาด');
          return;
        }

        const json = await res.json();
        setItems((prev) => [json.item, ...prev]);
        setShowAddModal(false);
        resetAddForm();
        toast.success('เพิ่มรายการสำเร็จ');
      } catch {
        toast.error('เกิดข้อผิดพลาดในการส่งข้อมูล');
      }
    });
  }

  async function handlePatch(
    id: string,
    status: LostFoundItem['status'],
    extra: Record<string, string | null> = {}
  ) {
    startTransition(async () => {
      try {
        const res = await fetch('/api/housekeeping/lost-found', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status, ...extra }),
        });

        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || 'เกิดข้อผิดพลาด');
          return;
        }

        const json = await res.json();
        setItems((prev) =>
          prev.map((i) => (i.id === id ? { ...i, ...json.item } : i))
        );
        setClaimTarget(null);
        setDisposeTarget(null);
        setClaimedBy('');

        const labels: Record<string, string> = {
          claimed: 'บันทึกการรับไปแล้ว',
          donated: 'บันทึกการบริจาค',
          disposed: 'บันทึกการทิ้ง',
        };
        toast.success(labels[status] || 'อัปเดตสำเร็จ');
      } catch {
        toast.error('เกิดข้อผิดพลาดในการส่งข้อมูล');
      }
    });
  }

  function ItemCard({ item }: { item: LostFoundItem }) {
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-stone-700 dark:bg-stone-800/60">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-stone-800 dark:text-stone-100 truncate">
                {item.description}
              </span>
              <Badge variant={STATUS_VARIANT[item.status]}>
                {STATUS_LABEL[item.status]}
              </Badge>
            </div>

            <div className="mt-2 space-y-1 text-sm text-stone-500 dark:text-stone-400">
              {item.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{item.location}</span>
                  {item.room_no && (
                    <span className="text-stone-400">· ห้อง {item.room_no}</span>
                  )}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                <span>พบเมื่อ: {formatDate(item.found_at)}</span>
              </div>
              {item.finder && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>ผู้พบ: {item.finder.full_name}</span>
                </div>
              )}
              {item.claimed_by && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>รับโดย: {item.claimed_by}</span>
                  {item.claimed_at && (
                    <span>· {formatDate(item.claimed_at)}</span>
                  )}
                </div>
              )}
              {item.notes && (
                <p className="text-xs text-stone-400 italic mt-1">{item.notes}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {item.photo_url && (
              <a href={item.photo_url} target="_blank" rel="noopener noreferrer">
                <img
                  src={item.photo_url}
                  alt="รูปสิ่งของ"
                  className="h-14 w-14 rounded-lg object-cover ring-1 ring-stone-200 dark:ring-stone-700"
                />
              </a>
            )}
            {item.status === 'stored' && (
              <div className="flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    setClaimTarget(item);
                    setClaimedBy('');
                  }}
                >
                  รับแล้ว
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-stone-500"
                  onClick={() =>
                    setDisposeTarget({ item, action: 'donated' })
                  }
                >
                  บริจาค
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs text-rose-500"
                  onClick={() =>
                    setDisposeTarget({ item, action: 'disposed' })
                  }
                >
                  ทิ้ง
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar
        title="ของหาย & ของที่พบ"
        description={`รายการทั้งหมด ${items.length} รายการ · เก็บรักษา ${storedItems.length} รายการ`}
        action={
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            เพิ่มรายการ
          </Button>
        }
      />

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
              {currentItems[tab.key].length}
            </span>
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="mt-4 grid gap-3">
        {currentItems[activeTab].length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-stone-200 p-12 text-center dark:border-stone-700">
            <Package className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-600" />
            <p className="mt-3 text-stone-500 dark:text-stone-400">
              {activeTab === 'stored'
                ? 'ไม่มีสิ่งของที่เก็บรักษาในขณะนี้'
                : activeTab === 'claimed'
                ? 'ยังไม่มีรายการที่ถูกรับไป'
                : 'ไม่มีรายการที่บริจาค/ทิ้ง'}
            </p>
          </div>
        ) : (
          currentItems[activeTab].map((item) => (
            <ItemCard key={item.id} item={item} />
          ))
        )}
      </div>

      {/* Add Modal */}
      <Dialog open={showAddModal} onOpenChange={(open) => { if (!open) { setShowAddModal(false); resetAddForm(); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>เพิ่มรายการของที่พบ</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                รายละเอียดสิ่งของ <span className="text-rose-500">*</span>
              </label>
              <Input
                value={addForm.description}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="เช่น กระเป๋าสีดำ, โทรศัพท์มือถือ Samsung..."
                maxLength={1000}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  สถานที่พบ
                </label>
                <Input
                  value={addForm.location}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="เช่น ล็อบบี้, ห้องอาหาร..."
                  maxLength={300}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                  เลขห้อง
                </label>
                <Input
                  value={addForm.room_no}
                  onChange={(e) =>
                    setAddForm((f) => ({ ...f, room_no: e.target.value }))
                  }
                  placeholder="เช่น 101"
                  maxLength={20}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                วันเวลาที่พบ
              </label>
              <Input
                type="datetime-local"
                value={addForm.found_at}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, found_at: e.target.value }))
                }
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                หมายเหตุ
              </label>
              <textarea
                value={addForm.notes}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, notes: e.target.value }))
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
              onClick={() => { setShowAddModal(false); resetAddForm(); }}
              disabled={isPending}
            >
              ยกเลิก
            </Button>
            <Button onClick={handleAdd} disabled={isPending || !addForm.description.trim()}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Claim Modal */}
      <Dialog
        open={!!claimTarget}
        onOpenChange={(open) => { if (!open) setClaimTarget(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>บันทึกการรับสิ่งของ</DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <p className="text-sm text-stone-600 dark:text-stone-300">
              สิ่งของ: <span className="font-medium">{claimTarget?.description}</span>
            </p>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-stone-700 dark:text-stone-300">
                ชื่อผู้รับสิ่งของ
              </label>
              <Input
                value={claimedBy}
                onChange={(e) => setClaimedBy(e.target.value)}
                placeholder="ชื่อ-นามสกุล ผู้รับ"
                maxLength={300}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimTarget(null)} disabled={isPending}>
              ยกเลิก
            </Button>
            <Button
              onClick={() =>
                claimTarget &&
                handlePatch(claimTarget.id, 'claimed', {
                  claimed_by: claimedBy.trim() || null,
                })
              }
              disabled={isPending}
            >
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dispose/Donate Modal */}
      <Dialog
        open={!!disposeTarget}
        onOpenChange={(open) => { if (!open) setDisposeTarget(null); }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {disposeTarget?.action === 'donated' ? 'ยืนยันการบริจาค' : 'ยืนยันการทิ้ง'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-stone-600 dark:text-stone-300">
              สิ่งของ:{' '}
              <span className="font-medium">{disposeTarget?.item.description}</span>
            </p>
            <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
              {disposeTarget?.action === 'donated'
                ? 'ต้องการบันทึกว่าสิ่งของนี้ถูกบริจาคแล้วใช่หรือไม่?'
                : 'ต้องการบันทึกว่าสิ่งของนี้ถูกทิ้งแล้วใช่หรือไม่?'}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDisposeTarget(null)} disabled={isPending}>
              ยกเลิก
            </Button>
            <Button
              variant={disposeTarget?.action === 'disposed' ? 'destructive' : 'default'}
              onClick={() =>
                disposeTarget &&
                handlePatch(disposeTarget.item.id, disposeTarget.action)
              }
              disabled={isPending}
            >
              ยืนยัน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
