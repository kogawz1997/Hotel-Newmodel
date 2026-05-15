'use client';

import { useState, useMemo } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { FileText, Download, Search, Upload, Trash2, Pencil, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type DocumentCategory = 'policy' | 'form' | 'manual' | 'sop' | 'contract' | 'other';

type Document = {
  id: string;
  hotel_id: string;
  category: DocumentCategory;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  version: string | null;
  target_roles: string[];
  uploaded_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  uploader?: { id: string; full_name: string | null; role: string } | null;
};

type Props = {
  hotelId: string;
  documents: Document[];
  userRole: string;
  isManager: boolean;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<DocumentCategory | 'all', string> = {
  all: 'ทั้งหมด',
  policy: 'นโยบาย',
  form: 'แบบฟอร์ม',
  manual: 'คู่มือ',
  sop: 'SOP',
  contract: 'สัญญา',
  other: 'อื่นๆ',
};

const CATEGORY_BADGE: Record<DocumentCategory, string> = {
  policy: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  form: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  manual: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  sop: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  contract: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  other: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

const CATEGORY_TABS: Array<DocumentCategory | 'all'> = ['all', 'policy', 'form', 'manual', 'sop', 'contract', 'other'];

const ALLOWED_CATEGORIES: DocumentCategory[] = ['policy', 'form', 'manual', 'sop', 'contract', 'other'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

type UploadForm = {
  title: string;
  category: DocumentCategory;
  description: string;
  file_url: string;
  file_type: string;
  version: string;
};

const EMPTY_UPLOAD: UploadForm = {
  title: '',
  category: 'policy',
  description: '',
  file_url: '',
  file_type: '',
  version: '1.0',
};

function UploadModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (doc: Document) => void;
}) {
  const [form, setForm] = useState<UploadForm>(EMPTY_UPLOAD);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof UploadForm>(key: K, val: UploadForm[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error('กรุณากรอกชื่อเอกสาร'); return; }
    if (!form.file_url.trim()) { toast.error('กรุณากรอก URL ไฟล์'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          description: form.description.trim() || null,
          file_url: form.file_url.trim(),
          file_type: form.file_type.trim() || null,
          version: form.version.trim() || '1.0',
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'เกิดข้อผิดพลาด'); return; }
      toast.success('อัปโหลดเอกสารสำเร็จ');
      onSuccess(data);
      setForm(EMPTY_UPLOAD);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>อัปโหลดเอกสาร</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">ชื่อเอกสาร *</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="เช่น นโยบายการลาหยุด"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">หมวดหมู่ *</label>
            <select
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={form.category}
              onChange={(e) => set('category', e.target.value as DocumentCategory)}
            >
              {ALLOWED_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">URL ไฟล์ *</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="https://..."
              value={form.file_url}
              onChange={(e) => set('file_url', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">ประเภทไฟล์</label>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="เช่น PDF, DOCX"
                value={form.file_type}
                onChange={(e) => set('file_type', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">เวอร์ชัน</label>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="1.0"
                value={form.version}
                onChange={(e) => set('version', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">คำอธิบาย</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              rows={3}
              placeholder="รายละเอียดเพิ่มเติม..."
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'อัปโหลด'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────

function EditModal({
  doc,
  onClose,
  onSuccess,
}: {
  doc: Document;
  onClose: () => void;
  onSuccess: (updated: Document) => void;
}) {
  const [form, setForm] = useState<UploadForm>({
    title: doc.title,
    category: doc.category,
    description: doc.description ?? '',
    file_url: doc.file_url,
    file_type: doc.file_type ?? '',
    version: doc.version ?? '1.0',
  });
  const [saving, setSaving] = useState(false);

  function set<K extends keyof UploadForm>(key: K, val: UploadForm[K]) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function handleSubmit() {
    if (!form.title.trim()) { toast.error('กรุณากรอกชื่อเอกสาร'); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          category: form.category,
          description: form.description.trim() || null,
          file_url: form.file_url.trim(),
          file_type: form.file_type.trim() || null,
          version: form.version.trim() || '1.0',
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? 'เกิดข้อผิดพลาด'); return; }
      toast.success('แก้ไขเอกสารสำเร็จ');
      onSuccess(data);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>แก้ไขเอกสาร</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">ชื่อเอกสาร *</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">หมวดหมู่ *</label>
            <select
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={form.category}
              onChange={(e) => set('category', e.target.value as DocumentCategory)}
            >
              {ALLOWED_CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">URL ไฟล์</label>
            <input
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              value={form.file_url}
              onChange={(e) => set('file_url', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">ประเภทไฟล์</label>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={form.file_type}
                onChange={(e) => set('file_type', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">เวอร์ชัน</label>
              <input
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                value={form.version}
                onChange={(e) => set('version', e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">คำอธิบาย</label>
            <textarea
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>ยกเลิก</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Client Component ────────────────────────────────────────────────────

export function DocumentsClient({ hotelId, documents: initialDocs, userRole, isManager }: Props) {
  const [docs, setDocs] = useState<Document[]>(initialDocs);
  const [activeCategory, setActiveCategory] = useState<DocumentCategory | 'all'>('all');
  const [search, setSearch] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [editDoc, setEditDoc] = useState<Document | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = docs;
    if (activeCategory !== 'all') {
      list = list.filter((d) => d.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((d) => d.title.toLowerCase().includes(q));
    }
    return list;
  }, [docs, activeCategory, search]);

  function handleUploaded(doc: Document) {
    setDocs((prev) => [doc, ...prev]);
  }

  function handleUpdated(doc: Document) {
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? doc : d)));
  }

  async function handleDelete(doc: Document) {
    if (!confirm(`ลบเอกสาร "${doc.title}" ใช่หรือไม่?`)) return;
    setDeletingId(doc.id);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? 'เกิดข้อผิดพลาด');
        return;
      }
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      toast.success('ลบเอกสารสำเร็จ');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <div className="p-4 md:p-6 space-y-6">
        <TopBar
          title="คลังเอกสาร"
          description="นโยบาย แบบฟอร์ม คู่มือ และเอกสารสำคัญ"
          action={
            isManager ? (
              <Button size="sm" onClick={() => setShowUpload(true)}>
                <Upload className="h-4 w-4" />
                อัปโหลดเอกสาร
              </Button>
            ) : undefined
          }
        />

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full rounded-lg border border-border bg-card pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="ค้นหาเอกสาร..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setSearch('')}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {CATEGORY_TABS.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors border',
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:border-primary hover:text-foreground'
              )}
            >
              {CATEGORY_LABELS[cat]}
              {cat !== 'all' && (
                <span className="ml-1 opacity-70">
                  ({docs.filter((d) => d.category === cat).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Document list */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <FileText className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">ไม่พบเอกสาร</p>
            {isManager && (
              <Button size="sm" variant="outline" className="mt-4" onClick={() => setShowUpload(true)}>
                อัปโหลดเอกสารแรก
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                isManager={isManager}
                deleting={deletingId === doc.id}
                onEdit={() => setEditDoc(doc)}
                onDelete={() => handleDelete(doc)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <UploadModal
          open={showUpload}
          onClose={() => setShowUpload(false)}
          onSuccess={handleUploaded}
        />
      )}

      {/* Edit Modal */}
      {editDoc && (
        <EditModal
          doc={editDoc}
          onClose={() => setEditDoc(null)}
          onSuccess={handleUpdated}
        />
      )}
    </div>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────

function DocumentCard({
  doc,
  isManager,
  deleting,
  onEdit,
  onDelete,
}: {
  doc: Document;
  isManager: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <FileText className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <p className="text-sm font-medium leading-snug line-clamp-2">{doc.title}</p>
            {doc.uploader?.full_name && (
              <p className="text-xs text-muted-foreground mt-0.5">
                โดย {doc.uploader.full_name}
              </p>
            )}
          </div>
        </div>
        <span
          className={cn(
            'shrink-0 rounded-md px-2 py-0.5 text-xs font-medium',
            CATEGORY_BADGE[doc.category]
          )}
        >
          {CATEGORY_LABELS[doc.category]}
        </span>
      </div>

      {doc.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{doc.description}</p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        {doc.version && <span>v{doc.version}</span>}
        {doc.file_type && <span className="uppercase">{doc.file_type}</span>}
        {doc.file_size && <span>{formatBytes(doc.file_size)}</span>}
        <span className="ml-auto">{formatDate(doc.created_at)}</span>
      </div>

      <div className="flex items-center gap-2 pt-1 border-t border-border mt-auto">
        <a
          href={doc.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Download className="h-3.5 w-3.5" />
          ดาวน์โหลด
        </a>
        {isManager && (
          <>
            <button
              onClick={onEdit}
              className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
              แก้ไข
            </button>
            <button
              onClick={onDelete}
              disabled={deleting}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {deleting ? '...' : 'ลบ'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
