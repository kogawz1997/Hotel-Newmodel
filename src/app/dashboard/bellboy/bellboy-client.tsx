'use client';

import { useState, useMemo } from 'react';
import {
  Plus, X, Package, ArrowRight, CheckCircle2, PlayCircle,
  Clock, Hash, FileText, Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type LuggageType = 'pickup' | 'delivery' | 'storage' | 'airport';
type LuggageStatus = 'pending' | 'claimed' | 'in_progress' | 'completed' | 'cancelled';

type LuggageTask = {
  id: string;
  type: LuggageType;
  room_no?: string | null;
  guest_name: string;
  item_count?: number | null;
  description?: string | null;
  from_location?: string | null;
  to_location?: string | null;
  status: LuggageStatus;
  claimed_at?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  created_at: string;
  assignee?: { id: string; full_name: string } | null;
};

type TabId = 'pending' | 'active' | 'completed';

type NewTask = {
  type: LuggageType;
  room_no: string;
  guest_name: string;
  from_location: string;
  to_location: string;
  item_count: string;
  description: string;
  notes: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<LuggageType, { label: string; color: string; bg: string }> = {
  pickup:   { label: 'รับกระเป๋า',   color: 'text-green-700',  bg: 'bg-green-100 border-green-200' },
  delivery: { label: 'ส่งกระเป๋า',   color: 'text-blue-700',   bg: 'bg-blue-100 border-blue-200' },
  storage:  { label: 'ฝากกระเป๋า',   color: 'text-gray-700',   bg: 'bg-gray-100 border-gray-200' },
  airport:  { label: 'สนามบิน',       color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200' },
};

const STATUS_CONFIG: Record<LuggageStatus, { label: string; color: string }> = {
  pending:     { label: 'รอรับงาน',        color: 'bg-orange-100 text-orange-700 border-orange-200' },
  claimed:     { label: 'รับงานแล้ว',      color: 'bg-blue-100 text-blue-700 border-blue-200' },
  in_progress: { label: 'กำลังดำเนินการ',  color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  completed:   { label: 'เสร็จแล้ว',       color: 'bg-green-100 text-green-700 border-green-200' },
  cancelled:   { label: 'ยกเลิก',           color: 'bg-gray-100 text-gray-500 border-gray-200' },
};

const TYPE_OPTIONS: { value: LuggageType; label: string }[] = [
  { value: 'pickup',   label: 'รับกระเป๋า' },
  { value: 'delivery', label: 'ส่งกระเป๋า' },
  { value: 'storage',  label: 'ฝากกระเป๋า' },
  { value: 'airport',  label: 'สนามบิน' },
];

const DEFAULT_NEW: NewTask = {
  type: 'pickup',
  room_no: '',
  guest_name: '',
  from_location: '',
  to_location: '',
  item_count: '1',
  description: '',
  notes: '',
};

// ─── Tiny UI atoms ────────────────────────────────────────────────────────────

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium', className)}>
      {children}
    </span>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5 text-foreground">{label}</label>
      {children}
    </div>
  );
}

function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring',
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none placeholder:text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <Inbox className="h-10 w-10 mx-auto mb-3 opacity-25" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  currentUserId,
  onAction,
}: {
  task: LuggageTask;
  currentUserId: string;
  onAction: (id: string, action: string, status?: LuggageStatus) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const typeConf = TYPE_CONFIG[task.type] ?? TYPE_CONFIG.pickup;
  const statusConf = STATUS_CONFIG[task.status];

  const isMyTask = task.assignee?.id === currentUserId;
  const isUnassigned = !task.assignee;

  const handleAction = async (action: string, status?: LuggageStatus) => {
    setLoading(true);
    await onAction(task.id, action, status);
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn('border', typeConf.bg, typeConf.color)}>{typeConf.label}</Badge>
          {task.room_no && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium">
              <Hash className="h-3 w-3" />
              ห้อง {task.room_no}
            </span>
          )}
        </div>
        <Badge className={statusConf.color}>{statusConf.label}</Badge>
      </div>

      {/* Guest */}
      <div>
        <p className="font-semibold text-sm text-foreground">{task.guest_name}</p>
        {(task.from_location || task.to_location) && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
            <Package className="h-3 w-3 shrink-0" />
            {task.from_location && <span className="truncate">{task.from_location}</span>}
            {task.from_location && task.to_location && <ArrowRight className="h-3 w-3 shrink-0" />}
            {task.to_location && <span className="truncate">{task.to_location}</span>}
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        {task.item_count != null && task.item_count > 0 && (
          <span className="flex items-center gap-1">
            <Package className="h-3 w-3" />
            {task.item_count} ชิ้น
          </span>
        )}
        {task.description && (
          <span className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            {task.description}
          </span>
        )}
        <span className="flex items-center gap-1 ml-auto">
          <Clock className="h-3 w-3" />
          {new Date(task.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {task.assignee && (
        <p className="text-xs text-muted-foreground">
          รับงานโดย: <span className="font-medium text-foreground">{task.assignee.full_name}</span>
        </p>
      )}

      {task.notes && (
        <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">{task.notes}</p>
      )}

      {/* Action buttons */}
      {task.status !== 'completed' && task.status !== 'cancelled' && (
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {/* Pending: anyone can claim */}
          {task.status === 'pending' && (isUnassigned || isMyTask) && (
            <button
              disabled={loading}
              onClick={() => handleAction('claim')}
              className="flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              รับงาน
            </button>
          )}

          {/* Claimed → start */}
          {task.status === 'claimed' && isMyTask && (
            <button
              disabled={loading}
              onClick={() => handleAction('status', 'in_progress')}
              className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              <PlayCircle className="h-3 w-3 inline mr-1" />
              เริ่มส่ง
            </button>
          )}

          {/* In progress → complete */}
          {task.status === 'in_progress' && isMyTask && (
            <button
              disabled={loading}
              onClick={() => handleAction('status', 'completed')}
              className="flex-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              <CheckCircle2 className="h-3 w-3 inline mr-1" />
              ส่งเสร็จ
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BellboyClient({
  hotel,
  profile,
  initialTasks,
  isManager,
}: {
  hotel: { id: string; name: string };
  profile: { id: string; role: string };
  initialTasks: LuggageTask[];
  isManager: boolean;
}) {
  const [tasks, setTasks] = useState<LuggageTask[]>(initialTasks);
  const [tab, setTab] = useState<TabId>('pending');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState<NewTask>(DEFAULT_NEW);

  // Tab groupings
  const tabTasks = useMemo((): LuggageTask[] => {
    switch (tab) {
      case 'pending':
        return tasks.filter((t) => t.status === 'pending');
      case 'active':
        return tasks.filter((t) => t.status === 'claimed' || t.status === 'in_progress');
      case 'completed':
        return tasks.filter((t) => t.status === 'completed' || t.status === 'cancelled');
    }
  }, [tasks, tab]);

  const counts = useMemo(() => ({
    pending:   tasks.filter((t) => t.status === 'pending').length,
    active:    tasks.filter((t) => t.status === 'claimed' || t.status === 'in_progress').length,
    completed: tasks.filter((t) => t.status === 'completed' || t.status === 'cancelled').length,
  }), [tasks]);

  // ─── API calls ──────────────────────────────────────────────────────────────

  const handleAction = async (id: string, action: string, status?: LuggageStatus) => {
    const body = action === 'claim' ? { action: 'claim' } : { status };
    const res = await fetch(`/api/bellboy/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    }
  };

  const handleCreate = async () => {
    if (!newTask.guest_name.trim()) return;
    setSaving(true);
    const res = await fetch('/api/bellboy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTask,
        item_count: parseInt(newTask.item_count) || 1,
        from_location: newTask.from_location || null,
        to_location: newTask.to_location || null,
        description: newTask.description || null,
        notes: newTask.notes || null,
        room_no: newTask.room_no || null,
      }),
    });
    if (res.ok) {
      const created = await res.json();
      setTasks((prev) => [created, ...prev]);
      setNewTask(DEFAULT_NEW);
      setShowCreate(false);
    }
    setSaving(false);
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  const TABS: { id: TabId; label: string }[] = [
    { id: 'pending',   label: 'รอรับงาน' },
    { id: 'active',    label: 'กำลังทำ' },
    { id: 'completed', label: 'เสร็จแล้ว' },
  ];

  return (
    <main className="space-y-6 p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">งาน Bellboy / Porter</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {hotel.name} ·{' '}
            {new Date().toLocaleDateString('th-TH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            สร้างงาน
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'รอรับงาน',      value: counts.pending,   color: 'bg-orange-50 text-orange-700 dark:bg-orange-950/30' },
          { label: 'กำลังดำเนินการ', value: counts.active,    color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30' },
          { label: 'เสร็จแล้ว',     value: counts.completed, color: 'bg-green-50 text-green-700 dark:bg-green-950/30' },
        ].map((s) => (
          <div key={s.label} className={cn('rounded-xl p-4', s.color)}>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs mt-1 opacity-80">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors',
              tab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {label}
            {counts[id] > 0 && (
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full font-medium',
                  tab === id
                    ? 'bg-primary/10 text-primary'
                    : 'bg-secondary text-muted-foreground'
                )}
              >
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Task list */}
      {tabTasks.length === 0 ? (
        <Empty label={tab === 'pending' ? 'ไม่มีงานที่รอรับ' : tab === 'active' ? 'ไม่มีงานที่กำลังทำ' : 'ยังไม่มีงานที่เสร็จ'} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tabTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentUserId={profile.id}
              onAction={handleAction}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="สร้างงานกระเป๋า" onClose={() => setShowCreate(false)}>
          <FormField label="ประเภทงาน">
            <Select
              value={newTask.type}
              onChange={(e) => setNewTask((p) => ({ ...p, type: e.target.value as LuggageType }))}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="ชื่อแขก *">
              <Input
                value={newTask.guest_name}
                onChange={(e) => setNewTask((p) => ({ ...p, guest_name: e.target.value }))}
                placeholder="ชื่อ-นามสกุลแขก"
              />
            </FormField>
            <FormField label="หมายเลขห้อง">
              <Input
                value={newTask.room_no}
                onChange={(e) => setNewTask((p) => ({ ...p, room_no: e.target.value }))}
                placeholder="เช่น 305"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="จากสถานที่">
              <Input
                value={newTask.from_location}
                onChange={(e) => setNewTask((p) => ({ ...p, from_location: e.target.value }))}
                placeholder="ล็อบบี้ / ห้อง..."
              />
            </FormField>
            <FormField label="ไปสถานที่">
              <Input
                value={newTask.to_location}
                onChange={(e) => setNewTask((p) => ({ ...p, to_location: e.target.value }))}
                placeholder="ห้อง / คลังเก็บของ..."
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="จำนวนชิ้น">
              <Input
                type="number"
                min="1"
                value={newTask.item_count}
                onChange={(e) => setNewTask((p) => ({ ...p, item_count: e.target.value }))}
              />
            </FormField>
            <FormField label="รายละเอียดสัมภาระ">
              <Input
                value={newTask.description}
                onChange={(e) => setNewTask((p) => ({ ...p, description: e.target.value }))}
                placeholder="เช่น กระเป๋าล้อลาก 2 ใบ"
              />
            </FormField>
          </div>

          <FormField label="หมายเหตุ">
            <Textarea
              value={newTask.notes}
              onChange={(e) => setNewTask((p) => ({ ...p, notes: e.target.value }))}
              rows={2}
              placeholder="ข้อมูลเพิ่มเติม..."
            />
          </FormField>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition-colors"
            >
              ยกเลิก
            </button>
            <button
              disabled={saving || !newTask.guest_name.trim()}
              onClick={handleCreate}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {saving ? 'กำลังบันทึก...' : 'สร้างงาน'}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
