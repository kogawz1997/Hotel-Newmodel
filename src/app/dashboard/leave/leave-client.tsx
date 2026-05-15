'use client';

import { useState, useCallback } from 'react';
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
import { CalendarDays, PlusCircle, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type LeaveType =
  | 'sick'
  | 'vacation'
  | 'personal'
  | 'maternity'
  | 'paternity'
  | 'ordination'
  | 'unpaid'
  | 'other';

type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface StaffProfile {
  id: string;
  full_name: string | null;
  role?: string;
}

interface LeaveRequest {
  id: string;
  hotel_id: string;
  staff_id: string;
  type: LeaveType;
  start_date: string;
  end_date: string;
  days: number | null;
  reason: string | null;
  status: LeaveStatus;
  approved_by: string | null;
  approved_at: string | null;
  reject_note: string | null;
  created_at: string;
  staff?: StaffProfile | null;
  approver?: StaffProfile | null;
}

interface Props {
  hotel: { id: string; name: string };
  profile: { id: string; role: string };
  initialRequests: LeaveRequest[];
  isManager: boolean;
  userId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  sick: 'ลาป่วย',
  vacation: 'ลาพักร้อน',
  personal: 'ลากิจ',
  maternity: 'ลาคลอด',
  paternity: 'ลาบิดา',
  ordination: 'ลาบวช',
  unpaid: 'ลาไม่รับค่าจ้าง',
  other: 'อื่นๆ',
};

const LEAVE_TYPE_KEYS: LeaveType[] = [
  'sick',
  'vacation',
  'personal',
  'maternity',
  'paternity',
  'ordination',
  'unpaid',
  'other',
];

const STATUS_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'pending', label: 'รออนุมัติ' },
  { key: 'approved', label: 'อนุมัติแล้ว' },
  { key: 'rejected', label: 'ปฏิเสธ' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string) {
  // Append T00:00:00 so it's parsed as local date, not UTC
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function StatusBadge({ status }: { status: LeaveStatus }) {
  const map: Record<LeaveStatus, { label: string; variant: 'warning' | 'success' | 'destructive' | 'secondary' }> = {
    pending:   { label: 'รออนุมัติ',   variant: 'warning' },
    approved:  { label: 'อนุมัติแล้ว', variant: 'success' },
    rejected:  { label: 'ปฏิเสธ',      variant: 'destructive' },
    cancelled: { label: 'ยกเลิก',      variant: 'secondary' },
  };
  const s = map[status] ?? { label: status, variant: 'secondary' as const };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function LeaveClient({
  hotel,
  profile,
  initialRequests,
  isManager,
  userId,
}: Props) {
  const [requests, setRequests] = useState<LeaveRequest[]>(initialRequests);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [loadingList, setLoadingList] = useState(false);

  // ── Submit-leave modal ──
  const [showSubmit, setShowSubmit] = useState(false);
  const [formType, setFormType] = useState<LeaveType>('sick');
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');
  const [formReason, setFormReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // ── Reject modal ──
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Filter by active tab
  const filtered = requests.filter((r) =>
    activeTab === 'all' ? true : r.status === activeTab
  );

  // Refresh full list from API
  const refresh = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await fetch('/api/leave');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests ?? []);
      }
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoadingList(false);
    }
  }, []);

  // ── Submit new leave request ──
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formStart || !formEnd) {
      toast.error('กรุณาระบุวันที่เริ่มและสิ้นสุด');
      return;
    }
    if (new Date(formEnd) < new Date(formStart)) {
      toast.error('วันสิ้นสุดต้องไม่น้อยกว่าวันเริ่มต้น');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: formType,
          start_date: formStart,
          end_date: formEnd,
          reason: formReason.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'ยื่นใบลาไม่สำเร็จ');
        return;
      }
      toast.success('ยื่นใบลาสำเร็จ');
      setShowSubmit(false);
      setFormType('sick');
      setFormStart('');
      setFormEnd('');
      setFormReason('');
      await refresh();
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Approve request ──
  async function handleApprove(req: LeaveRequest) {
    try {
      const res = await fetch(`/api/leave/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'อนุมัติไม่สำเร็จ');
        return;
      }
      toast.success('อนุมัติใบลาแล้ว');
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, ...data } : r))
      );
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  }

  // ── Open reject modal ──
  function openReject(req: LeaveRequest) {
    setRejectTarget(req);
    setRejectNote('');
  }

  // ── Confirm rejection ──
  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectTarget) return;
    if (!rejectNote.trim()) {
      toast.error('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }
    setRejecting(true);
    try {
      const res = await fetch(`/api/leave/${rejectTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reject_note: rejectNote.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'ปฏิเสธไม่สำเร็จ');
        return;
      }
      toast.success('ปฏิเสธใบลาแล้ว');
      setRequests((prev) =>
        prev.map((r) => (r.id === rejectTarget.id ? { ...r, ...data } : r))
      );
      setRejectTarget(null);
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setRejecting(false);
    }
  }

  // ── Cancel own pending request ──
  async function handleCancel(req: LeaveRequest) {
    try {
      const res = await fetch(`/api/leave/${req.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'ยกเลิกไม่สำเร็จ');
        return;
      }
      toast.success('ยกเลิกใบลาแล้ว');
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, ...data } : r))
      );
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  }

  // Days preview while filling the form
  const daysDiff =
    formStart && formEnd && new Date(formEnd) >= new Date(formStart)
      ? Math.round(
          (new Date(formEnd).getTime() - new Date(formStart).getTime()) / 86_400_000 + 1
        )
      : null;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar
        title="การลา"
        description={hotel.name}
        action={
          <Button onClick={() => setShowSubmit(true)} size="sm" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            ยื่นใบลา
          </Button>
        }
      />

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-4">

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 rounded-xl bg-secondary/50 p-1 w-fit overflow-x-auto">
          {STATUS_TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? requests.length
                : requests.filter((r) => r.status === tab.key).length;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 py-0.5 text-xs ${
                      activeTab === tab.key
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Leave Request List ── */}
        {loadingList ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            กำลังโหลด...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <FileText className="h-10 w-10 mb-3 opacity-25" />
            <p className="text-sm">ไม่มีรายการลา</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <Card key={req.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">

                    {/* Left: information */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      {/* Name + type + status */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-sm">
                          {req.staff?.full_name ?? 'ไม่ระบุชื่อ'}
                        </span>
                        <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                          {LEAVE_TYPE_LABELS[req.type] ?? req.type}
                        </span>
                        <StatusBadge status={req.status} />
                      </div>

                      {/* Dates + days count */}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                        <span>
                          {fmtDate(req.start_date)}
                          {req.start_date !== req.end_date && (
                            <> &ndash; {fmtDate(req.end_date)}</>
                          )}
                        </span>
                        {req.days != null && (
                          <span className="text-xs">({req.days} วัน)</span>
                        )}
                      </div>

                      {/* Reason */}
                      {req.reason && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          เหตุผล: {req.reason}
                        </p>
                      )}

                      {/* Approved-by */}
                      {req.status === 'approved' && req.approver && (
                        <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          อนุมัติโดย {req.approver.full_name}
                        </p>
                      )}

                      {/* Reject note */}
                      {req.status === 'rejected' && (
                        <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          {req.reject_note
                            ? `ปฏิเสธ: ${req.reject_note}`
                            : 'ถูกปฏิเสธ'}
                        </p>
                      )}
                    </div>

                    {/* Right: action buttons */}
                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        {isManager && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950"
                              onClick={() => handleApprove(req)}
                            >
                              อนุมัติ
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                              onClick={() => openReject(req)}
                            >
                              ปฏิเสธ
                            </Button>
                          </>
                        )}
                        {req.staff_id === userId && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-muted-foreground"
                            onClick={() => handleCancel(req)}
                          >
                            ยกเลิก
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ─── Submit Leave Modal ───────────────────────────────────────────── */}
      <Dialog open={showSubmit} onOpenChange={setShowSubmit}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ยื่นใบลา</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Leave type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">ประเภทการลา</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as LeaveType)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                required
              >
                {LEAVE_TYPE_KEYS.map((t) => (
                  <option key={t} value={t}>
                    {LEAVE_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">วันที่เริ่ม</label>
                <input
                  type="date"
                  value={formStart}
                  onChange={(e) => setFormStart(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">วันที่สิ้นสุด</label>
                <input
                  type="date"
                  value={formEnd}
                  min={formStart || undefined}
                  onChange={(e) => setFormEnd(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
              </div>
            </div>

            {/* Days preview */}
            {daysDiff !== null && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                ระยะเวลา: {daysDiff} วัน
              </p>
            )}

            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">
                เหตุผล{' '}
                <span className="text-muted-foreground font-normal">(ไม่บังคับ)</span>
              </label>
              <textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                rows={3}
                placeholder="ระบุเหตุผลหรือรายละเอียดเพิ่มเติม..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowSubmit(false)}
                disabled={submitting}
              >
                ยกเลิก
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'กำลังส่ง...' : 'ยื่นใบลา'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Reject Modal ────────────────────────────────────────────────── */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(open) => !open && setRejectTarget(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>ปฏิเสธใบลา</DialogTitle>
          </DialogHeader>

          {rejectTarget && (
            <form onSubmit={handleReject} className="space-y-4 mt-2">
              <p className="text-sm text-muted-foreground">
                ใบลา{LEAVE_TYPE_LABELS[rejectTarget.type]}ของ{' '}
                <span className="font-medium text-foreground">
                  {rejectTarget.staff?.full_name ?? 'พนักงาน'}
                </span>{' '}
                วันที่ {fmtDate(rejectTarget.start_date)}
                {rejectTarget.start_date !== rejectTarget.end_date &&
                  ` – ${fmtDate(rejectTarget.end_date)}`}
              </p>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">เหตุผลในการปฏิเสธ</label>
                <textarea
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  rows={3}
                  placeholder="ระบุเหตุผลที่ปฏิเสธใบลา..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                  autoFocus
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRejectTarget(null)}
                  disabled={rejecting}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" variant="destructive" disabled={rejecting}>
                  {rejecting ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
