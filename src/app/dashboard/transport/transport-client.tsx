'use client';

import { useState, useMemo } from 'react';
import {
  Plus, X, Car, Plane, MapPin, Users, Clock, ChevronRight,
  CheckCircle2, PlayCircle, CircleDot, XCircle, CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type TransportType = 'airport_pickup' | 'airport_dropoff' | 'local_transfer' | 'tour' | 'other';
type TransportStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

type TransportTask = {
  id: string;
  type: TransportType;
  guest_name: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  vehicle?: string | null;
  flight_no?: string | null;
  passengers?: number | null;
  status: TransportStatus;
  started_at?: string | null;
  completed_at?: string | null;
  notes?: string | null;
  driver?: { id: string; full_name: string } | null;
};

type Driver = { id: string; full_name: string };

type TabId = 'today' | 'in_progress' | 'completed' | 'all';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<TransportType, { label: string; color: string; bg: string }> = {
  airport_pickup:  { label: 'รับสนามบิน',   color: 'text-purple-700', bg: 'bg-purple-100 border-purple-200' },
  airport_dropoff: { label: 'ส่งสนามบิน',   color: 'text-blue-700',   bg: 'bg-blue-100 border-blue-200' },
  local_transfer:  { label: 'รับ-ส่งในเมือง', color: 'text-green-700',  bg: 'bg-green-100 border-green-200' },
  tour:            { label: 'ทัวร์',          color: 'text-orange-700', bg: 'bg-orange-100 border-orange-200' },
  other:           { label: 'อื่นๆ',           color: 'text-gray-700',   bg: 'bg-gray-100 border-gray-200' },
};

const STATUS_CONFIG: Record<TransportStatus, { label: string; color: string; icon: React.ElementType }> = {
  scheduled:   { label: 'กำหนดการ',       color: 'bg-yellow-100 text-yellow-700 border-yellow-200',  icon: CalendarDays },
  confirmed:   { label: 'ยืนยันแล้ว',     color: 'bg-blue-100 text-blue-700 border-blue-200',        icon: CircleDot },
  in_progress: { label: 'กำลังเดินทาง',   color: 'bg-indigo-100 text-indigo-700 border-indigo-200',  icon: PlayCircle },
  completed:   { label: 'เสร็จแล้ว',      color: 'bg-green-100 text-green-700 border-green-200',     icon: CheckCircle2 },
  cancelled:   { label: 'ยกเลิก',          color: 'bg-gray-100 text-gray-500 border-gray-200',        icon: XCircle },
};

const TYPE_OPTIONS: { value: TransportType; label: string }[] = [
  { value: 'airport_pickup',  label: 'รับจากสนามบิน' },
  { value: 'airport_dropoff', label: 'ส่งไปสนามบิน' },
  { value: 'local_transfer',  label: 'รับ-ส่งในเมือง' },
  { value: 'tour',            label: 'ทัวร์' },
  { value: 'other',           label: 'อื่นๆ' },
];

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

function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatThaiTime(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isToday(iso: string) {
  const d = new Date(iso).toISOString().slice(0, 10);
  return d === new Date().toISOString().slice(0, 10);
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  currentUserId,
  isDriver,
  onStatusChange,
}: {
  task: TransportTask;
  currentUserId: string;
  isDriver: boolean;
  onStatusChange: (id: string, status: TransportStatus) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const typeConf = TYPE_CONFIG[task.type] ?? TYPE_CONFIG.other;
  const statusConf = STATUS_CONFIG[task.status];
  const StatusIcon = statusConf.icon;

  const handleAction = async (nextStatus: TransportStatus) => {
    setLoading(true);
    await onStatusChange(task.id, nextStatus);
    setLoading(false);
  };

  const canAct =
    !isDriver || task.driver?.id === currentUserId || !task.driver;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3 hover:border-primary/30 transition-colors">
      {/* Top row: type + status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={cn('border', typeConf.bg, typeConf.color)}>{typeConf.label}</Badge>
          {task.flight_no && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Plane className="h-3 w-3" />
              {task.flight_no}
            </span>
          )}
        </div>
        <Badge className={statusConf.color}>
          <StatusIcon className="h-3 w-3" />
          {statusConf.label}
        </Badge>
      </div>

      {/* Guest + route */}
      <div>
        <p className="font-semibold text-sm text-foreground">{task.guest_name}</p>
        <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{task.pickup_location}</span>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="truncate">{task.dropoff_location}</span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatThaiTime(task.pickup_time)}
        </span>
        {task.passengers && task.passengers > 0 && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {task.passengers} คน
          </span>
        )}
        {task.vehicle && (
          <span className="flex items-center gap-1">
            <Car className="h-3 w-3" />
            {task.vehicle}
          </span>
        )}
        {task.driver?.full_name && (
          <span className="text-muted-foreground">
            คนขับ: <span className="font-medium text-foreground">{task.driver.full_name}</span>
          </span>
        )}
      </div>

      {task.notes && (
        <p className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">{task.notes}</p>
      )}

      {/* Action buttons */}
      {canAct && task.status !== 'completed' && task.status !== 'cancelled' && (
        <div className="flex items-center gap-2 pt-1 flex-wrap">
          {task.status === 'scheduled' && (
            <button
              disabled={loading}
              onClick={() => handleAction('confirmed')}
              className="flex-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
            >
              ยืนยัน
            </button>
          )}
          {task.status === 'confirmed' && (
            <button
              disabled={loading}
              onClick={() => handleAction('in_progress')}
              className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
            >
              เริ่มเดินทาง
            </button>
          )}
          {task.status === 'in_progress' && (
            <button
              disabled={loading}
              onClick={() => handleAction('completed')}
              className="flex-1 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              ถึงจุดหมาย
            </button>
          )}
          {task.status !== 'cancelled' && (
            <button
              disabled={loading}
              onClick={() => handleAction('cancelled')}
              className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-red-600 hover:border-red-300 disabled:opacity-60 transition-colors"
            >
              ยกเลิก
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function Empty({ label }: { label: string }) {
  return (
    <div className="text-center py-16 text-muted-foreground">
      <Car className="h-10 w-10 mx-auto mb-3 opacity-25" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type NewTask = {
  type: TransportType;
  guest_name: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_time: string;
  vehicle: string;
  flight_no: string;
  passengers: string;
  notes: string;
  driver_id: string;
};

const DEFAULT_NEW: NewTask = {
  type: 'airport_pickup',
  guest_name: '',
  pickup_location: '',
  dropoff_location: '',
  pickup_time: '',
  vehicle: '',
  flight_no: '',
  passengers: '1',
  notes: '',
  driver_id: '',
};

export function TransportClient({
  hotel,
  profile,
  todayTasks: initialToday,
  upcomingTasks: initialUpcoming,
  drivers,
  isManager,
}: {
  hotel: { id: string; name: string };
  profile: { id: string; role: string };
  todayTasks: TransportTask[];
  upcomingTasks: TransportTask[];
  drivers: Driver[];
  isManager: boolean;
}) {
  const isDriver = profile.role === 'transport_driver';

  // Combine today + upcoming for "all" view; handle locally
  const [tasks, setTasks] = useState<TransportTask[]>([
    ...initialToday,
    ...initialUpcoming,
  ]);

  const [tab, setTab] = useState<TabId>('today');
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTask, setNewTask] = useState<NewTask>(DEFAULT_NEW);

  // Filter tasks based on driver role
  const visibleTasks = useMemo(() => {
    if (isDriver) return tasks.filter((t) => t.driver?.id === profile.id);
    return tasks;
  }, [tasks, isDriver, profile.id]);

  const tabTasks = useMemo((): TransportTask[] => {
    switch (tab) {
      case 'today':
        return visibleTasks.filter((t) => isToday(t.pickup_time) && t.status !== 'cancelled');
      case 'in_progress':
        return visibleTasks.filter((t) => t.status === 'in_progress');
      case 'completed':
        return visibleTasks.filter((t) => t.status === 'completed');
      case 'all':
        return visibleTasks;
    }
  }, [visibleTasks, tab]);

  const counts = useMemo(() => ({
    today: visibleTasks.filter((t) => isToday(t.pickup_time) && t.status !== 'cancelled').length,
    in_progress: visibleTasks.filter((t) => t.status === 'in_progress').length,
    completed: visibleTasks.filter((t) => t.status === 'completed').length,
    all: visibleTasks.length,
  }), [visibleTasks]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleStatusChange = async (id: string, status: TransportStatus) => {
    const res = await fetch(`/api/transport/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updated } : t)));
    }
  };

  const handleCreate = async () => {
    if (!newTask.guest_name.trim() || !newTask.pickup_location.trim() || !newTask.dropoff_location.trim() || !newTask.pickup_time) {
      return;
    }
    setSaving(true);
    const res = await fetch('/api/transport', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTask,
        passengers: parseInt(newTask.passengers) || 1,
        driver_id: newTask.driver_id || null,
        flight_no: newTask.flight_no || null,
        vehicle: newTask.vehicle || null,
        notes: newTask.notes || null,
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
    { id: 'today', label: 'วันนี้' },
    { id: 'in_progress', label: 'กำลังดำเนินการ' },
    { id: 'completed', label: 'เสร็จแล้ว' },
    { id: 'all', label: 'ทั้งหมด' },
  ];

  return (
    <main className="space-y-6 p-6 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl font-semibold text-foreground">งานรับ-ส่ง</h1>
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
            สร้างงานรับ-ส่ง
          </button>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'วันนี้',             value: counts.today,       color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/30' },
          { label: 'กำลังเดินทาง',       value: counts.in_progress, color: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/30' },
          { label: 'เสร็จแล้ว',          value: counts.completed,   color: 'bg-green-50 text-green-700 dark:bg-green-950/30' },
          { label: 'ทั้งหมด',            value: counts.all,         color: 'bg-gray-50 text-gray-700 dark:bg-gray-800/50' },
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
        <Empty label="ไม่มีงานในหมวดนี้" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {tabTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              currentUserId={profile.id}
              isDriver={isDriver}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <Modal title="สร้างงานรับ-ส่ง" onClose={() => setShowCreate(false)}>
          <FormField label="ประเภทงาน">
            <Select
              value={newTask.type}
              onChange={(e) => setNewTask((p) => ({ ...p, type: e.target.value as TransportType }))}
            >
              {TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="ชื่อแขก *">
            <Input
              value={newTask.guest_name}
              onChange={(e) => setNewTask((p) => ({ ...p, guest_name: e.target.value }))}
              placeholder="ชื่อ-นามสกุลแขก"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="จุดรับ *">
              <Input
                value={newTask.pickup_location}
                onChange={(e) => setNewTask((p) => ({ ...p, pickup_location: e.target.value }))}
                placeholder="สนามบิน / โรงแรม..."
              />
            </FormField>
            <FormField label="จุดส่ง *">
              <Input
                value={newTask.dropoff_location}
                onChange={(e) => setNewTask((p) => ({ ...p, dropoff_location: e.target.value }))}
                placeholder="โรงแรม / ที่หมาย..."
              />
            </FormField>
          </div>

          <FormField label="วัน-เวลารับ *">
            <Input
              type="datetime-local"
              value={newTask.pickup_time}
              onChange={(e) => setNewTask((p) => ({ ...p, pickup_time: e.target.value }))}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="เที่ยวบิน">
              <Input
                value={newTask.flight_no}
                onChange={(e) => setNewTask((p) => ({ ...p, flight_no: e.target.value }))}
                placeholder="เช่น TG302"
              />
            </FormField>
            <FormField label="จำนวนผู้โดยสาร">
              <Input
                type="number"
                min="1"
                value={newTask.passengers}
                onChange={(e) => setNewTask((p) => ({ ...p, passengers: e.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="ยานพาหนะ">
            <Input
              value={newTask.vehicle}
              onChange={(e) => setNewTask((p) => ({ ...p, vehicle: e.target.value }))}
              placeholder="เช่น Toyota Camry / Van"
            />
          </FormField>

          {drivers.length > 0 && (
            <FormField label="คนขับ">
              <Select
                value={newTask.driver_id}
                onChange={(e) => setNewTask((p) => ({ ...p, driver_id: e.target.value }))}
              >
                <option value="">-- ไม่ระบุ --</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.full_name}</option>
                ))}
              </Select>
            </FormField>
          )}

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
              disabled={saving || !newTask.guest_name.trim() || !newTask.pickup_location.trim() || !newTask.dropoff_location.trim() || !newTask.pickup_time}
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
