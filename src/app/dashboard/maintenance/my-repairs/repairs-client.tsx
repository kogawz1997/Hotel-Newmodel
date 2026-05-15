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
import { Wrench, ImagePlus, Package, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Room {
  room_number: string;
  floor?: string | number;
}

interface AssignedProfile {
  id: string;
  full_name: string | null;
}

interface MaintenanceRequest {
  id: string;
  hotel_id: string;
  room_id: string | null;
  title: string;
  description: string | null;
  type: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to: string | null;
  before_photos: string[] | null;
  after_photos: string[] | null;
  parts_used: any;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  room: Room | null;
  assigned_profile: AssignedProfile | null;
}

interface Part {
  id: string;
  name: string;
  unit: string;
  quantity: number;
}

interface Props {
  hotelId: string;
  userId: string;
  isManager: boolean;
  initialRequests: MaintenanceRequest[];
  parts: Part[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<string, { label: string; className: string; pulse?: boolean }> = {
  low: { label: 'ต่ำ', className: 'bg-slate-100 text-slate-600' },
  normal: { label: 'ปกติ', className: 'bg-sky-100 text-sky-700' },
  high: { label: 'สูง', className: 'bg-orange-100 text-orange-700' },
  urgent: { label: 'เร่งด่วน!', className: 'bg-red-100 text-red-700', pulse: true },
};

const TABS = [
  { key: 'pending', label: 'รอรับ', icon: Clock },
  { key: 'in_progress', label: 'กำลังซ่อม', icon: Wrench },
  { key: 'completed', label: 'เสร็จแล้ว', icon: CheckCircle2 },
];

const MANAGER_TABS = [...TABS, { key: 'all', label: 'ทั้งหมด', icon: Package }];

// ─── Component ────────────────────────────────────────────────────────────────

export function RepairsClient({ hotelId, userId, isManager, initialRequests, parts }: Props) {
  const [requests, setRequests] = useState<MaintenanceRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<string>('pending');
  const [saving, setSaving] = useState(false);

  // Photo modal state
  const [photoModal, setPhotoModal] = useState<{
    requestId: string;
    type: 'before' | 'after';
  } | null>(null);
  const [photoUrl, setPhotoUrl] = useState('');

  // Parts modal state
  const [partModal, setPartModal] = useState<string | null>(null); // requestId
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQty, setPartQty] = useState(1);

  // Complete modal state
  const [completeModal, setCompleteModal] = useState<MaintenanceRequest | null>(null);
  const [afterPhotoUrl, setAfterPhotoUrl] = useState('');

  const tabs = isManager ? MANAGER_TABS : TABS;

  const filtered = useMemo(() => {
    if (activeTab === 'all') return requests;
    return requests.filter((r) => r.status === activeTab);
  }, [requests, activeTab]);

  const counts = useMemo(
    () => ({
      pending: requests.filter((r) => r.status === 'pending').length,
      in_progress: requests.filter((r) => r.status === 'in_progress').length,
      completed: requests.filter((r) => r.status === 'completed').length,
    }),
    [requests]
  );

  // ─── Actions ────────────────────────────────────────────────────────────────

  async function claimRequest(req: MaintenanceRequest) {
    setSaving(true);
    const res = await fetch(`/api/maintenance/requests/${req.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_to: userId, status: 'in_progress', started_at: new Date().toISOString() }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('รับงานไม่สำเร็จ'); return; }
    setRequests((prev) =>
      prev.map((r) =>
        r.id === req.id
          ? { ...r, assigned_to: userId, status: 'in_progress', started_at: new Date().toISOString() }
          : r
      )
    );
    toast.success('รับงานซ่อมแล้ว!');
  }

  async function escalate(req: MaintenanceRequest) {
    setSaving(true);
    const res = await fetch(`/api/maintenance/requests/${req.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: 'urgent' }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('เปลี่ยนระดับไม่สำเร็จ'); return; }
    setRequests((prev) =>
      prev.map((r) => (r.id === req.id ? { ...r, priority: 'urgent' } : r))
    );
    toast.success('ยกระดับความเร่งด่วนแล้ว');
  }

  async function uploadPhoto() {
    if (!photoModal || !photoUrl.trim()) { toast.error('กรอก URL รูปภาพก่อน'); return; }
    setSaving(true);
    const res = await fetch(`/api/maintenance/requests/${photoModal.requestId}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_url: photoUrl.trim(), photo_type: photoModal.type }),
    });
    setSaving(false);
    if (!res.ok) { toast.error('อัพโหลดรูปไม่สำเร็จ'); return; }
    const updated = await res.json();
    setRequests((prev) =>
      prev.map((r) =>
        r.id === photoModal.requestId
          ? { ...r, before_photos: updated.before_photos, after_photos: updated.after_photos }
          : r
      )
    );
    setPhotoModal(null);
    setPhotoUrl('');
    toast.success('เพิ่มรูปภาพแล้ว');
  }

  async function usePart() {
    if (!partModal || !selectedPartId || partQty <= 0) {
      toast.error('เลือกอะไหล่และกรอกจำนวน');
      return;
    }
    setSaving(true);
    const res = await fetch('/api/maintenance/parts/use', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ part_id: selectedPartId, quantity_used: partQty, work_order_id: partModal }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error ?? 'ใช้อะไหล่ไม่สำเร็จ');
      return;
    }
    setPartModal(null);
    setSelectedPartId('');
    setPartQty(1);
    toast.success('บันทึกการใช้อะไหล่แล้ว');
  }

  async function completeRepair() {
    if (!completeModal) return;
    if (!afterPhotoUrl.trim()) { toast.error('กรุณาอัพโหลดรูปหลังซ่อมก่อน'); return; }

    setSaving(true);

    // Upload after photo
    const photoRes = await fetch(`/api/maintenance/requests/${completeModal.id}/photos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photo_url: afterPhotoUrl.trim(), photo_type: 'after' }),
    });

    // Mark as completed
    const res = await fetch(`/api/maintenance/requests/${completeModal.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed', completed_at: new Date().toISOString() }),
    });

    setSaving(false);
    if (!res.ok) { toast.error('ปิดงานไม่สำเร็จ'); return; }

    const photoData = photoRes.ok ? await photoRes.json() : null;

    setRequests((prev) =>
      prev.map((r) =>
        r.id === completeModal.id
          ? {
              ...r,
              status: 'completed',
              completed_at: new Date().toISOString(),
              after_photos: photoData?.after_photos ?? r.after_photos,
            }
          : r
      )
    );
    setCompleteModal(null);
    setAfterPhotoUrl('');
    toast.success('ปิดงานซ่อมเรียบร้อย!');
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar
        title="งานซ่อมของฉัน"
        description="รับงาน อัพเดตสถานะ และปิดงานซ่อม"
      />

      {/* Tab bar */}
      <div className="flex gap-2 mt-6 mb-4 border-b border-border overflow-x-auto pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const count = counts[tab.key as keyof typeof counts] ?? null;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {count !== null && count > 0 && (
                <span className="ml-1 rounded-full bg-accent/20 text-accent text-xs px-1.5 py-0.5">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Request cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            ไม่มีรายการในขณะนี้
          </div>
        )}
        {filtered.map((req) => {
          const pCfg = PRIORITY_CFG[req.priority] ?? PRIORITY_CFG.normal;
          return (
            <Card key={req.id} className="border-border">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Room + title */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {req.room && (
                        <span className="text-xs font-medium text-muted-foreground bg-secondary rounded px-1.5 py-0.5">
                          ห้อง {req.room.room_number}
                        </span>
                      )}
                      <h3 className="font-medium text-sm">{req.title}</h3>
                    </div>

                    {/* Description */}
                    {req.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {req.description}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {/* Priority badge */}
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          pCfg.className,
                          pCfg.pulse && 'animate-pulse'
                        )}
                      >
                        {pCfg.label}
                      </span>

                      {/* Assigned to */}
                      {req.assigned_profile && (
                        <span className="text-xs text-muted-foreground">
                          ผู้รับผิดชอบ: {req.assigned_profile.full_name ?? '—'}
                        </span>
                      )}

                      {/* Photos count */}
                      <span className="text-xs text-muted-foreground">
                        รูปก่อน: {req.before_photos?.length ?? 0} | หลัง:{' '}
                        {req.after_photos?.length ?? 0}
                      </span>

                      {/* Created at */}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(req.created_at), 'd MMM yy HH:mm', { locale: th })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {/* Claim job */}
                  {req.status === 'pending' && (
                    <Button
                      size="sm"
                      variant="default"
                      disabled={saving}
                      onClick={() => claimRequest(req)}
                    >
                      <Wrench className="h-3.5 w-3.5" />
                      รับงาน
                    </Button>
                  )}

                  {/* Photo upload buttons */}
                  {req.status === 'in_progress' && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPhotoModal({ requestId: req.id, type: 'before' })}
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                        รูปก่อนซ่อม
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPhotoModal({ requestId: req.id, type: 'after' })}
                      >
                        <ImagePlus className="h-3.5 w-3.5" />
                        รูปหลังซ่อม
                      </Button>
                    </>
                  )}

                  {/* Use parts */}
                  {(req.status === 'in_progress' || isManager) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPartModal(req.id)}
                    >
                      <Package className="h-3.5 w-3.5" />
                      เพิ่มอะไหล่
                    </Button>
                  )}

                  {/* Complete */}
                  {req.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={saving}
                      onClick={() => setCompleteModal(req)}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      เสร็จแล้ว
                    </Button>
                  )}

                  {/* Escalate */}
                  {req.priority !== 'urgent' && req.status !== 'completed' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      disabled={saving}
                      onClick={() => escalate(req)}
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      เร่งด่วน
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Photo upload modal ── */}
      <Dialog open={!!photoModal} onOpenChange={(o) => { if (!o) { setPhotoModal(null); setPhotoUrl(''); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              อัพโหลดรูป{photoModal?.type === 'before' ? 'ก่อน' : 'หลัง'}ซ่อม
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-sm font-medium">URL รูปภาพ</label>
            <input
              type="url"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              placeholder="https://..."
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPhotoModal(null); setPhotoUrl(''); }}>
              ยกเลิก
            </Button>
            <Button onClick={uploadPhoto} disabled={saving}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Use part modal ── */}
      <Dialog open={!!partModal} onOpenChange={(o) => { if (!o) { setPartModal(null); setSelectedPartId(''); setPartQty(1); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>เพิ่มอะไหล่ที่ใช้</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-medium mb-1 block">อะไหล่</label>
              <select
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={selectedPartId}
                onChange={(e) => setSelectedPartId(e.target.value)}
              >
                <option value="">เลือกอะไหล่...</option>
                {parts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (คงเหลือ {p.quantity} {p.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">จำนวนที่ใช้</label>
              <input
                type="number"
                min={1}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
                value={partQty}
                onChange={(e) => setPartQty(Number(e.target.value))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPartModal(null); setSelectedPartId(''); setPartQty(1); }}>
              ยกเลิก
            </Button>
            <Button onClick={usePart} disabled={saving}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Complete repair modal ── */}
      <Dialog
        open={!!completeModal}
        onOpenChange={(o) => { if (!o) { setCompleteModal(null); setAfterPhotoUrl(''); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ปิดงานซ่อม</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              กรุณาอัพโหลดรูปหลังซ่อมก่อนปิดงาน
            </p>
            <label className="text-sm font-medium">URL รูปภาพหลังซ่อม</label>
            <input
              type="url"
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background"
              placeholder="https://..."
              value={afterPhotoUrl}
              onChange={(e) => setAfterPhotoUrl(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setCompleteModal(null); setAfterPhotoUrl(''); }}
            >
              ยกเลิก
            </Button>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={completeRepair}
              disabled={saving}
            >
              ยืนยันปิดงาน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
