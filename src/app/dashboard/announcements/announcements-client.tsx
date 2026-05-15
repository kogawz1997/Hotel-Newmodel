'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus, Megaphone, AlertTriangle, ChevronDown, ChevronUp, Eye, EyeOff, Trash2, X } from 'lucide-react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type AnnouncementType = 'general' | 'urgent' | 'policy' | 'event' | 'other';

interface Creator {
  full_name: string | null;
}

interface Announcement {
  id: string;
  hotel_id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  target_roles: string[] | null;
  created_by: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  creator: Creator | null;
}

interface Profile {
  id: string;
  role: string;
  full_name: string | null;
}

interface Props {
  initialAnnouncements: Announcement[];
  profile: Profile;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_TABS = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'general', label: 'ทั่วไป' },
  { key: 'urgent', label: 'ด่วน' },
  { key: 'policy', label: 'นโยบาย' },
  { key: 'event', label: 'กิจกรรม' },
] as const;

const TYPE_LABEL: Record<AnnouncementType, string> = {
  general: 'ทั่วไป',
  urgent: 'ด่วน',
  policy: 'นโยบาย',
  event: 'กิจกรรม',
  other: 'อื่นๆ',
};

const TYPE_BADGE: Record<AnnouncementType, string> = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  policy: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  event: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  general: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  other: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const MANAGER_ROLES = ['owner', 'admin', 'manager'];

const ALL_TARGET_ROLES = [
  { value: 'front_desk', label: 'พนักงานต้อนรับ' },
  { value: 'housekeeping', label: 'แม่บ้าน' },
  { value: 'maintenance', label: 'พนักงานซ่อม' },
  { value: 'fb', label: 'อาหารและเครื่องดื่ม' },
  { value: 'security', label: 'รักษาความปลอดภัย' },
  { value: 'concierge', label: 'คอนเซียร์จ' },
  { value: 'accounting', label: 'พนักงานบัญชี' },
  { value: 'staff', label: 'พนักงานทั่วไป' },
];

const VALID_TYPES: AnnouncementType[] = ['general', 'urgent', 'policy', 'event', 'other'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// ─── Announcement Card ────────────────────────────────────────────────────────

function AnnouncementCard({
  item,
  isManager,
  onToggle,
  onDelete,
}: {
  item: Announcement;
  isManager: boolean;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const expired = isExpired(item.expires_at);
  const dimmed = !item.is_active || expired;

  async function handleToggle() {
    setToggling(true);
    try {
      const res = await fetch(`/api/announcements/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !item.is_active }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? 'เกิดข้อผิดพลาด');
        return;
      }
      onToggle(item.id, !item.is_active);
      toast.success(item.is_active ? 'ปิดการใช้งานประกาศแล้ว' : 'เปิดใช้งานประกาศแล้ว');
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/announcements/${item.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.error ?? 'เกิดข้อผิดพลาด');
        return;
      }
      onDelete(item.id);
      toast.success('ลบประกาศแล้ว');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  const bodyLines = item.body.split('\n');
  const isLong = item.body.length > 200 || bodyLines.length > 3;

  return (
    <Card
      className={cn(
        'transition-opacity',
        dimmed && 'opacity-50',
        item.type === 'urgent' && item.is_active && !expired && 'border-red-300 dark:border-red-800'
      )}
    >
      <CardContent className="pt-4 pb-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <span
              className={cn(
                'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium shrink-0 mt-0.5',
                TYPE_BADGE[item.type]
              )}
            >
              {item.type === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
              {TYPE_LABEL[item.type]}
            </span>
            {!item.is_active && (
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 shrink-0 mt-0.5">
                ปิดใช้งาน
              </span>
            )}
            {expired && item.is_active && (
              <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 shrink-0 mt-0.5">
                หมดอายุ
              </span>
            )}
          </div>

          {/* Manager actions */}
          {isManager && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleToggle}
                disabled={toggling}
                title={item.is_active ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
              >
                {item.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              {confirmDelete ? (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-2 py-1 rounded text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950 dark:text-red-300 font-medium transition-colors disabled:opacity-50"
                  >
                    {deleting ? '...' : 'ยืนยัน'}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(true)}
                  title="ลบประกาศ"
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-base mt-2 leading-snug">{item.title}</h3>

        {/* Body */}
        <div className="mt-1.5">
          <p
            className={cn(
              'text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed',
              !expanded && isLong && 'line-clamp-3'
            )}
          >
            {item.body}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="mt-1 text-xs text-primary hover:underline flex items-center gap-0.5"
            >
              {expanded ? (
                <>ย่อ <ChevronUp className="h-3 w-3" /></>
              ) : (
                <>อ่านเพิ่มเติม <ChevronDown className="h-3 w-3" /></>
              )}
            </button>
          )}
        </div>

        {/* Footer meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{item.creator?.full_name ?? 'ไม่ระบุ'}</span>
          <span>·</span>
          <span>{fmtDateTime(item.created_at)}</span>
          {item.expires_at && (
            <>
              <span>·</span>
              <span className={cn(expired && 'text-amber-600 dark:text-amber-400')}>
                แสดงถึง: {fmtDate(item.expires_at)}
              </span>
            </>
          )}
          {item.target_roles && item.target_roles.length > 0 && (
            <>
              <span>·</span>
              <span>
                ถึง:{' '}
                {item.target_roles
                  .map(r => ALL_TARGET_ROLES.find(x => x.value === r)?.label ?? r)
                  .join(', ')}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateForm {
  title: string;
  body: string;
  type: AnnouncementType;
  target_roles: string[];
  expires_at: string;
}

const EMPTY_FORM: CreateForm = {
  title: '',
  body: '',
  type: 'general',
  target_roles: [],
  expires_at: '',
};

function CreateModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (a: Announcement) => void;
}) {
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  function resetAndClose() {
    setForm(EMPTY_FORM);
    onClose();
  }

  function toggleRole(role: string) {
    setForm(prev => ({
      ...prev,
      target_roles: prev.target_roles.includes(role)
        ? prev.target_roles.filter(r => r !== role)
        : [...prev.target_roles, role],
    }));
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error('กรุณากรอกหัวข้อประกาศ'); return; }
    if (!form.body.trim()) { toast.error('กรุณากรอกเนื้อหาประกาศ'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          body: form.body.trim(),
          type: form.type,
          target_roles: form.target_roles.length > 0 ? form.target_roles : null,
          expires_at: form.expires_at || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'สร้างประกาศไม่สำเร็จ'); return; }
      onCreated(data);
      toast.success('สร้างประกาศเรียบร้อยแล้ว');
      resetAndClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && resetAndClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>สร้างประกาศใหม่</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">หัวข้อ *</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="หัวข้อประกาศ"
              value={form.title}
              onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
              maxLength={200}
            />
          </div>

          {/* Body */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">เนื้อหา *</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={5}
              placeholder="รายละเอียดประกาศ..."
              value={form.body}
              onChange={e => setForm(p => ({ ...p, body: e.target.value }))}
            />
          </div>

          {/* Type + Expires */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">ประเภท</label>
              <select
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.type}
                onChange={e => setForm(p => ({ ...p, type: e.target.value as AnnouncementType }))}
              >
                {VALID_TYPES.map(t => (
                  <option key={t} value={t}>{TYPE_LABEL[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">วันหมดอายุ (ไม่บังคับ)</label>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.expires_at}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setForm(p => ({ ...p, expires_at: e.target.value }))}
              />
            </div>
          </div>

          {/* Target roles */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              แสดงต่อแผนก (ถ้าไม่เลือก = แสดงทุกคน)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {ALL_TARGET_ROLES.map(r => (
                <label
                  key={r.value}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 cursor-pointer hover:bg-muted transition-colors text-sm"
                >
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={form.target_roles.includes(r.value)}
                    onChange={() => toggleRole(r.value)}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose} disabled={saving}>
            ยกเลิก
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'กำลังสร้าง...' : 'สร้างประกาศ'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function AnnouncementsClient({ initialAnnouncements, profile }: Props) {
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showCreate, setShowCreate] = useState(false);

  const isManager = MANAGER_ROLES.includes(profile.role);

  // Filtered list
  const filtered = useMemo(() => {
    return announcements.filter(a => {
      if (activeTab !== 'all' && a.type !== activeTab) return false;
      // Non-managers never see inactive or expired
      if (!isManager) {
        if (!a.is_active) return false;
        if (isExpired(a.expires_at)) return false;
      }
      return true;
    });
  }, [announcements, activeTab, isManager]);

  // Urgent banners (active, non-expired)
  const urgentBanners = useMemo(
    () =>
      filtered.filter(
        a => a.type === 'urgent' && a.is_active && !isExpired(a.expires_at)
      ),
    [filtered]
  );

  const handleCreated = useCallback((a: Announcement) => {
    setAnnouncements(prev => [a, ...prev]);
  }, []);

  const handleToggle = useCallback((id: string, active: boolean) => {
    setAnnouncements(prev =>
      prev.map(a => (a.id === id ? { ...a, is_active: active } : a))
    );
  }, []);

  const handleDelete = useCallback((id: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  }, []);

  const tabCount = (key: string) => {
    if (key === 'all') return announcements.filter(a => isManager || (a.is_active && !isExpired(a.expires_at))).length;
    return announcements.filter(a => {
      if (a.type !== key) return false;
      if (!isManager) return a.is_active && !isExpired(a.expires_at);
      return true;
    }).length;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopBar
        title="ประกาศ"
        description="ข่าวสารและประกาศสำหรับทีมงาน"
        action={
          isManager ? (
            <Button size="sm" onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4 mr-1" />
              สร้างประกาศ
            </Button>
          ) : undefined
        }
      />

      <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full space-y-4">
        {/* Urgent banners */}
        {urgentBanners.length > 0 && activeTab !== 'urgent' && (
          <div className="space-y-2">
            {urgentBanners.map(a => (
              <div
                key={a.id}
                className="flex items-start gap-3 rounded-xl border-2 border-red-400 bg-red-50 dark:bg-red-950/50 px-4 py-3"
              >
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-red-800 dark:text-red-300 text-sm">
                    {a.title}
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-400 mt-0.5 line-clamp-2">
                    {a.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Type filter tabs */}
        <div className="flex gap-1 flex-wrap">
          {TYPE_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5',
                activeTab === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {t.label}
              <span
                className={cn(
                  'text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center',
                  activeTab === t.key
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-background text-muted-foreground'
                )}
              >
                {tabCount(t.key)}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <Megaphone className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">ไม่มีประกาศในหมวดนี้</p>
            {isManager && (
              <p className="text-xs mt-1 opacity-60">กดปุ่ม "สร้างประกาศ" เพื่อเพิ่มประกาศใหม่</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(a => (
              <AnnouncementCard
                key={a.id}
                item={a}
                isManager={isManager}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create modal */}
      {isManager && (
        <CreateModal
          open={showCreate}
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
