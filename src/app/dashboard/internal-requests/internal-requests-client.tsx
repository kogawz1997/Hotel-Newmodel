'use client';

import { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ClipboardList, Plus, ChevronDown, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type RequestType = 'purchase' | 'repair' | 'resource' | 'it' | 'hr' | 'other';
type RequestStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'completed';

type InternalRequest = {
  id: string;
  hotel_id: string;
  requester_id: string;
  dept: string | null;
  type: RequestType;
  title: string;
  details: Record<string, unknown>;
  status: RequestStatus;
  approved_by: string | null;
  approved_at: string | null;
  reject_note: string | null;
  created_at: string;
  updated_at: string;
  requester?: { id: string; full_name: string | null; role: string } | null;
  approver?: { id: string; full_name: string | null } | null;
};

type Props = {
  hotelId: string;
  requests: InternalRequest[];
  userId: string;
  userRole: string;
  isManager: boolean;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<RequestType, string> = {
  purchase: 'จัดซื้อ',
  repair: 'ซ่อมแซม',
  resource: 'ขอทรัพยากร',
  it: 'IT',
  hr: 'HR',
  other: 'อื่นๆ',
};

const TYPE_BADGE: Record<RequestType, string> = {
  purchase: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  repair: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  resource: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  it: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  hr: 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const STATUS_CFG: Record<RequestStatus, { label: string; cls: string }> = {
  pending:   { label: 'รออนุมัติ',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
  reviewing: { label: 'กำลังตรวจ',   cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  approved:  { label: 'อนุมัติแล้ว', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
  rejected:  { label: 'ปฏิเสธ',      cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
  completed: { label: 'เสร็จสิ้น',   cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' },
};

const STATUS_TABS: Array<RequestStatus | 'all'> = ['all', 'pending', 'reviewing', 'approved', 'rejected', 'completed'];
const STATUS_TAB_LABELS: Record<RequestStatus | 'all', string> = {
  all: 'ทั้งหมด',
  pending: 'รออนุมัติ',
  reviewing: 'กำลังตรวจ',
  approved: 'อนุมัติแล้ว',
  rejected: 'ปฏิเสธ',
  completed: 'เสร็จสิ้น',
};

const REQUEST_TYPES: RequestType[] = ['purchase', 'repair', 'resource', 'it', 'hr', 'other'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─── Create Request Modal ─────────────────────────────────────────────────────

type CreateForm = {
  type: RequestType;
  title: string;
  dept: string;
  details: string;
};

const EMPTY_FORM: CreateForm = {
  type: 'purchase',
  title: '',
  dept: '',
  details: '',
};

function CreateRequestModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (req: InternalRequest) => void;
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof CreateForm>(key: K, val: CreateForm[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error('กรุณากรอกชื่อคำร้อง'); return; }
    setSaving(true);
    try {
      let detailsParsed: Record<string, unknown> = {};
      if (form.details.trim()) {
        detailsParsed = { description: form.details.trim() };
      }
      const res = await fetch('/api/internal-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          title: form.title.trim(),
          dept: form.dept.trim() || null,
          details: detailsParsed,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'เกิดข้อผิดพลาด'); return; }
      toast.success('สร้างคำร้องสำเร็จ');
      onSuccess(data);
      setForm(EMPTY_FORM);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>สร้างคำร้องภายใน</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">ประเภทคำร้อง *</label>
            <select
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={form.type}
              onChange={(e) => set('type', e.target.value as RequestType)}
            >
              {REQUEST_TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABELS[t]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">ชื่อคำร้อง *</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="เช่น ขอซื้ออุปกรณ์ทำความสะอาด"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">แผนก</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="เช่น แม่บ้าน, ต้อนรับ"
              value={form.dept}
              onChange={(e) => set('dept', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">รายละเอียด</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              rows={4}
              placeholder="อธิบายรายละเอียดของคำร้อง..."
              value={form.details}
              onChange={(e) => set('details', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'สร้างคำร้อง'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reject Note Modal ────────────────────────────────────────────────────────

function RejectModal({
  open,
  onClose,
  onConfirm,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
  saving: boolean;
}) {
  const [note, setNote] = useState('');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>ระบุเหตุผลการปฏิเสธ</DialogTitle>
        </DialogHeader>
        <textarea
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          rows={4}
          placeholder="กรุณาระบุเหตุผล..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button
            variant="destructive"
            onClick={() => {
              if (!note.trim()) { toast.error('กรุณาระบุเหตุผล'); return; }
              onConfirm(note.trim());
            }}
            disabled={saving}
          >
            {saving ? 'กำลังบันทึก...' : 'ยืนยันปฏิเสธ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Request Detail Modal ─────────────────────────────────────────────────────

function RequestDetailModal({
  req,
  isManager,
  onClose,
  onAction,
  acting,
}: {
  req: InternalRequest;
  isManager: boolean;
  onClose: () => void;
  onAction: (action: 'review' | 'approve' | 'reject' | 'complete', note?: string) => void;
  acting: boolean;
}) {
  const [showReject, setShowReject] = useState(false);
  const st = STATUS_CFG[req.status];

  const canReview   = isManager && req.status === 'pending';
  const canApprove  = isManager && req.status === 'reviewing';
  const canReject   = isManager && (req.status === 'pending' || req.status === 'reviewing');
  const canComplete = isManager && req.status === 'approved';

  const detailText = typeof req.details?.description === 'string' ? req.details.description : JSON.stringify(req.details, null, 2);

  return (
    <>
      <Dialog open onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="pr-6 leading-snug">{req.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', TYPE_BADGE[req.type])}>
                {TYPE_LABELS[req.type]}
              </span>
              <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', st.cls)}>
                {st.label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {req.dept && (
                <>
                  <span className="text-muted-foreground">แผนก</span>
                  <span className="font-medium">{req.dept}</span>
                </>
              )}
              {req.requester?.full_name && (
                <>
                  <span className="text-muted-foreground">ผู้ยื่น</span>
                  <span className="font-medium">{req.requester.full_name}</span>
                </>
              )}
              <span className="text-muted-foreground">วันที่ยื่น</span>
              <span>{formatDate(req.created_at)}</span>
              {req.approver?.full_name && (
                <>
                  <span className="text-muted-foreground">อนุมัติโดย</span>
                  <span className="font-medium">{req.approver.full_name}</span>
                </>
              )}
            </div>

            {detailText && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">รายละเอียด</p>
                <p className="rounded-lg bg-secondary px-3 py-2 text-sm whitespace-pre-wrap">{detailText}</p>
              </div>
            )}

            {req.reject_note && (
              <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3 py-2">
                <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-0.5">เหตุผลปฏิเสธ</p>
                <p className="text-sm text-red-700 dark:text-red-300">{req.reject_note}</p>
              </div>
            )}
          </div>

          {isManager && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-border mt-1">
              {canReview && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onAction('review')}
                  disabled={acting}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  เริ่มตรวจสอบ
                </Button>
              )}
              {canApprove && (
                <Button
                  size="sm"
                  onClick={() => onAction('approve')}
                  disabled={acting}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  อนุมัติ
                </Button>
              )}
              {canReject && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowReject(true)}
                  disabled={acting}
                >
                  <XCircle className="h-3.5 w-3.5" />
                  ปฏิเสธ
                </Button>
              )}
              {canComplete && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                  onClick={() => onAction('complete')}
                  disabled={acting}
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                  ทำเครื่องหมายว่าเสร็จสิ้น
                </Button>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RejectModal
        open={showReject}
        onClose={() => setShowReject(false)}
        onConfirm={(note) => {
          setShowReject(false);
          onAction('reject', note);
        }}
        saving={acting}
      />
    </>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function InternalRequestsClient({
  hotelId,
  requests: initialRequests,
  userId,
  userRole,
  isManager,
}: Props) {
  const [requests, setRequests] = useState<InternalRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<RequestStatus | 'all'>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [selectedReq, setSelectedReq] = useState<InternalRequest | null>(null);
  const [acting, setActing] = useState(false);

  const filtered = useMemo(() => {
    if (activeTab === 'all') return requests;
    return requests.filter((r) => r.status === activeTab);
  }, [requests, activeTab]);

  function handleCreated(req: InternalRequest) {
    setRequests((prev) => [req, ...prev]);
  }

  async function handleAction(
    req: InternalRequest,
    action: 'review' | 'approve' | 'reject' | 'complete',
    rejectNote?: string
  ) {
    setActing(true);
    try {
      const body: Record<string, unknown> = { action };
      if (rejectNote) body.reject_note = rejectNote;

      const res = await fetch(`/api/internal-requests/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'เกิดข้อผิดพลาด'); return; }

      setRequests((prev) => prev.map((r) => (r.id === req.id ? data : r)));
      setSelectedReq(data);

      const actionLabels: Record<string, string> = {
        review: 'เริ่มตรวจสอบแล้ว',
        approve: 'อนุมัติคำร้องแล้ว',
        reject: 'ปฏิเสธคำร้องแล้ว',
        complete: 'ทำเครื่องหมายว่าเสร็จสิ้นแล้ว',
      };
      toast.success(actionLabels[action] ?? 'อัปเดตสำเร็จ');
    } finally {
      setActing(false);
    }
  }

  const tabCount = (tab: RequestStatus | 'all') => {
    if (tab === 'all') return requests.length;
    return requests.filter((r) => r.status === tab).length;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="p-4 md:p-6 space-y-6">
        <TopBar
          title="คำร้องภายใน"
          description="จัดการคำร้องขอ การอนุมัติ และติดตามสถานะ"
          action={
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              สร้างคำร้อง
            </Button>
          }
        />

        {/* Status tabs */}
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => {
            const count = tabCount(tab);
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                  activeTab === tab
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-foreground'
                )}
              >
                {STATUS_TAB_LABELS[tab]}
                {count > 0 && (
                  <span className="ml-1 opacity-70">({count})</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Request list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <ClipboardList className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">ไม่มีคำร้อง</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-4"
              onClick={() => setShowCreate(true)}
            >
              สร้างคำร้องแรก
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <RequestRow
                key={req.id}
                req={req}
                isManager={isManager}
                userId={userId}
                onClick={() => setSelectedReq(req)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateRequestModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onSuccess={handleCreated}
        />
      )}

      {/* Detail / Action Modal */}
      {selectedReq && (
        <RequestDetailModal
          req={selectedReq}
          isManager={isManager}
          onClose={() => setSelectedReq(null)}
          onAction={(action, note) => handleAction(selectedReq, action, note)}
          acting={acting}
        />
      )}
    </div>
  );
}

// ─── Request Row ──────────────────────────────────────────────────────────────

function RequestRow({
  req,
  isManager,
  userId,
  onClick,
}: {
  req: InternalRequest;
  isManager: boolean;
  userId: string;
  onClick: () => void;
}) {
  const st = STATUS_CFG[req.status];
  const isOwner = req.requester_id === userId;

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-card px-4 py-3.5 hover:shadow-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', TYPE_BADGE[req.type])}>
              {TYPE_LABELS[req.type]}
            </span>
            {req.dept && (
              <span className="text-xs text-muted-foreground">{req.dept}</span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-medium line-clamp-1">{req.title}</p>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
            {req.requester?.full_name && isManager && (
              <span>{req.requester.full_name}</span>
            )}
            {isOwner && !isManager && <span>คำร้องของฉัน</span>}
            <span>{formatDate(req.created_at)}</span>
          </div>
          {req.reject_note && (
            <p className="mt-1 text-xs text-red-500 line-clamp-1">
              เหตุผลปฏิเสธ: {req.reject_note}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('rounded-md px-2 py-0.5 text-xs font-medium', st.cls)}>
            {st.label}
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground -rotate-90" />
        </div>
      </div>
    </button>
  );
}
