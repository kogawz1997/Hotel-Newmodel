'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { TopBar } from '@/components/layout/top-bar';
import { CheckCircle, XCircle, ClipboardList, Star, Clock, ImageIcon, SplitSquareHorizontal } from 'lucide-react';

function PhotoCompare({ before, after }: { before: string; after: string }) {
  const [split, setSplit] = useState(50);
  return (
    <div className="relative w-full h-48 rounded-xl overflow-hidden select-none border border-border">
      <img src={after} alt="หลัง" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}>
        <img src={before} alt="ก่อน" className="absolute inset-0 w-full h-full object-cover" />
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg" style={{ left: `${split}%` }}>
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white shadow-md flex items-center justify-center">
          <SplitSquareHorizontal className="h-4 w-4 text-stone-700" />
        </div>
      </div>
      <input type="range" min={0} max={100} value={split} onChange={e => setSplit(Number(e.target.value))}
        aria-label="เลื่อนเปรียบเทียบก่อน-หลัง"
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" />
      <div className="absolute top-2 left-2 bg-black/50 text-white text-2xs px-1.5 py-0.5 rounded">ก่อน</div>
      <div className="absolute top-2 right-2 bg-black/50 text-white text-2xs px-1.5 py-0.5 rounded">หลัง</div>
    </div>
  );
}

type Task = {
  id: string;
  hotel_id: string;
  room_id: string | null;
  assigned_to: string | null;
  status: string;
  task_type: string | null;
  priority: string | null;
  photo_urls: string[] | null;
  inspection_score: number | null;
  inspection_note: string | null;
  inspected_at: string | null;
  created_at: string;
  rooms: { id: string; room_no: string; floor: string | number | null } | null;
  housekeeper: { id: string; full_name: string } | null;
};

type Stats = { awaiting: number; passed: number; rejected: number };

type Props = {
  hotelId: string;
  userId: string;
  awaiting: Task[];
  passed: Task[];
  rejected: Task[];
  stats: Stats;
};

type Tab = 'awaiting' | 'passed' | 'rejected';

const TABS: { key: Tab; label: string; color: string }[] = [
  { key: 'awaiting', label: 'รอตรวจ', color: 'amber' },
  { key: 'passed', label: 'ผ่านแล้ว', color: 'emerald' },
  { key: 'rejected', label: 'ไม่ผ่าน', color: 'rose' },
];

const TASK_TYPE_LABEL: Record<string, string> = {
  checkout_cleaning: 'ทำความสะอาดหลัง Check-out',
  daily_cleaning: 'ทำความสะอาดประจำวัน',
  deep_cleaning: 'ทำความสะอาดขั้นลึก',
  turndown: 'Turndown Service',
  inspection: 'ตรวจสอบห้อง',
  other: 'อื่นๆ',
};

function timeSince(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} นาทีที่แล้ว`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ชั่วโมงที่แล้ว`;
  return `${Math.floor(hrs / 24)} วันที่แล้ว`;
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              'h-8 w-8 transition-colors',
              n <= (hovered || value)
                ? 'fill-amber-400 text-amber-400'
                : 'text-stone-300'
            )}
          />
        </button>
      ))}
    </div>
  );
}

function TaskCard({
  task,
  onInspect,
}: {
  task: Task;
  onInspect?: (task: Task) => void;
}) {
  const room = task.rooms;
  const housekeeper = task.housekeeper;

  const statusBadge = {
    clean: { label: 'รอตรวจ', variant: 'warning' as const },
    inspected: { label: 'ผ่าน', variant: 'success' as const },
    rejected_inspection: { label: 'ไม่ผ่าน', variant: 'destructive' as const },
  }[task.status] ?? { label: task.status, variant: 'secondary' as const };

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-stone-700 dark:bg-stone-800/60">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl font-bold text-stone-800 dark:text-stone-100">
              ห้อง {room?.room_no ?? '—'}
            </span>
            {room?.floor != null && (
              <span className="text-xs text-stone-500 dark:text-stone-400">
                ชั้น {room.floor}
              </span>
            )}
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-300">
            {TASK_TYPE_LABEL[task.task_type ?? ''] ?? task.task_type ?? 'ทำความสะอาด'}
          </p>
          {housekeeper && (
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              แม่บ้าน: {housekeeper.full_name} · {timeSince(task.created_at)}
            </p>
          )}
          {task.photo_urls && task.photo_urls.length > 0 && (
            <p className="mt-1 flex items-center gap-1 text-xs text-sky-600 dark:text-sky-400">
              <ImageIcon className="h-3 w-3" />
              {task.photo_urls.length} รูปภาพ
            </p>
          )}
          {task.status === 'inspected' && task.inspection_score != null && (
            <div className="mt-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < task.inspection_score!
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-stone-300'
                  )}
                />
              ))}
              {task.inspection_note && (
                <span className="ml-2 text-xs text-stone-500 truncate max-w-[200px]">
                  {task.inspection_note}
                </span>
              )}
            </div>
          )}
        </div>
        {onInspect && (
          <Button size="sm" onClick={() => onInspect(task)}>
            ตรวจห้อง
          </Button>
        )}
      </div>

      {task.photo_urls && task.photo_urls.length >= 2 && (
        <div className="mt-3">
          <p className="text-2xs text-muted-foreground mb-1.5 flex items-center gap-1">
            <SplitSquareHorizontal className="h-3 w-3" />เปรียบเทียบก่อน-หลัง (เลื่อนแถบ)
          </p>
          <PhotoCompare before={task.photo_urls[0]} after={task.photo_urls[task.photo_urls.length - 1]} />
        </div>
      )}
      {task.photo_urls && task.photo_urls.length === 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          <a href={task.photo_urls[0]} target="_blank" rel="noopener noreferrer">
            <img src={task.photo_urls[0]} alt="รูปที่ 1" className="h-16 w-16 flex-shrink-0 rounded-lg object-cover ring-1 ring-stone-200 dark:ring-stone-700" />
          </a>
        </div>
      )}
    </div>
  );
}

export function InspectClient({
  hotelId,
  userId,
  awaiting: initialAwaiting,
  passed: initialPassed,
  rejected: initialRejected,
  stats: initialStats,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('awaiting');
  const [awaiting, setAwaiting] = useState(initialAwaiting);
  const [passed, setPassed] = useState(initialPassed);
  const [rejected, setRejected] = useState(initialRejected);
  const [stats, setStats] = useState(initialStats);

  const [inspecting, setInspecting] = useState<Task | null>(null);
  const [score, setScore] = useState(5);
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();

  function openInspect(task: Task) {
    setInspecting(task);
    setScore(5);
    setNote('');
  }

  function closeInspect() {
    setInspecting(null);
  }

  async function submitInspection(approved: boolean) {
    if (!inspecting) return;

    startTransition(async () => {
      try {
        const res = await fetch('/api/housekeeping/inspect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            task_id: inspecting.id,
            score,
            note: note.trim() || null,
            approved,
          }),
        });

        if (!res.ok) {
          const json = await res.json();
          toast.error(json.error || 'เกิดข้อผิดพลาด');
          return;
        }

        const json = await res.json();
        const updatedTask = { ...inspecting, ...json.task };

        if (approved) {
          setAwaiting((prev) => prev.filter((t) => t.id !== inspecting.id));
          setPassed((prev) => [updatedTask, ...prev]);
          setStats((s) => ({ ...s, awaiting: s.awaiting - 1, passed: s.passed + 1 }));
          toast.success('ห้องผ่านการตรวจ ✓');
        } else {
          setAwaiting((prev) => prev.filter((t) => t.id !== inspecting.id));
          setRejected((prev) => [updatedTask, ...prev]);
          setStats((s) => ({ ...s, awaiting: s.awaiting - 1, rejected: s.rejected + 1 }));
          toast.error('ส่งกลับไปแก้ไข');
        }

        closeInspect();
      } catch {
        toast.error('เกิดข้อผิดพลาดในการส่งข้อมูล');
      }
    });
  }

  const tasksByTab: Record<Tab, Task[]> = {
    awaiting,
    passed,
    rejected,
  };

  const currentTasks = tasksByTab[activeTab];

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar
        title="ตรวจห้อง"
        description="Room Inspector — ตรวจคุณภาพห้องพักหลังทำความสะอาด"
      />

      {/* Stats Bar */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center dark:border-amber-800/50 dark:bg-amber-900/20">
          <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
            {stats.awaiting}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400">รอตรวจ</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-center dark:border-emerald-800/50 dark:bg-emerald-900/20">
          <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
            {stats.passed}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400">ผ่านวันนี้</div>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center dark:border-rose-800/50 dark:bg-rose-900/20">
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-300">
            {stats.rejected}
          </div>
          <div className="text-xs text-rose-600 dark:text-rose-400">ไม่ผ่านวันนี้</div>
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
            <span
              className={cn(
                'ml-2 rounded-full px-1.5 py-0.5 text-xs font-semibold',
                tab.key === 'awaiting'
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                  : tab.key === 'passed'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
              )}
            >
              {tasksByTab[tab.key].length}
            </span>
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="mt-4 grid gap-3">
        {currentTasks.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-stone-200 p-12 text-center dark:border-stone-700">
            <ClipboardList className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-600" />
            <p className="mt-3 text-stone-500 dark:text-stone-400">
              {activeTab === 'awaiting'
                ? 'ไม่มีห้องรอตรวจในขณะนี้'
                : activeTab === 'passed'
                ? 'ยังไม่มีห้องที่ผ่านการตรวจ'
                : 'ไม่มีห้องที่ไม่ผ่านการตรวจ'}
            </p>
          </div>
        ) : (
          currentTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onInspect={activeTab === 'awaiting' ? openInspect : undefined}
            />
          ))
        )}
      </div>

      {/* Inspection Modal */}
      <Dialog open={!!inspecting} onOpenChange={(open) => !open && closeInspect()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              ตรวจห้อง {inspecting?.rooms?.room_no ?? ''}
              {inspecting?.rooms?.floor != null && (
                <span className="ml-2 text-sm font-normal text-stone-500">
                  ชั้น {inspecting.rooms.floor}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Housekeeper info */}
            {inspecting?.housekeeper && (
              <div className="rounded-lg bg-stone-50 p-3 text-sm dark:bg-stone-800">
                <span className="text-stone-500">แม่บ้าน: </span>
                <span className="font-medium text-stone-800 dark:text-stone-100">
                  {inspecting.housekeeper.full_name}
                </span>
                <span className="ml-3 text-stone-400">
                  {inspecting ? timeSince(inspecting.created_at) : ''}
                </span>
              </div>
            )}

            {/* Photo preview */}
            {inspecting?.photo_urls && inspecting.photo_urls.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-stone-700 dark:text-stone-300">
                  รูปภาพจากแม่บ้าน ({inspecting.photo_urls.length} รูป)
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {inspecting.photo_urls.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`รูปที่ ${i + 1}`}
                        className="h-20 w-20 flex-shrink-0 rounded-lg object-cover ring-1 ring-stone-200 dark:ring-stone-700 hover:ring-2 hover:ring-sky-400"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Star score */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                คะแนนความสะอาด
              </label>
              <StarRating value={score} onChange={setScore} />
              <p className="mt-1 text-xs text-stone-500">
                {score === 1
                  ? 'ต้องปรับปรุงมาก'
                  : score === 2
                  ? 'ต้องปรับปรุง'
                  : score === 3
                  ? 'พอใช้'
                  : score === 4
                  ? 'ดี'
                  : 'ดีมาก'}
              </p>
            </div>

            {/* Note */}
            <div>
              <label className="mb-2 block text-sm font-medium text-stone-700 dark:text-stone-300">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="บันทึกข้อสังเกต หรือสิ่งที่ต้องแก้ไข..."
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm placeholder-stone-400 focus:border-stone-500 focus:outline-none focus:ring-2 focus:ring-stone-200 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:placeholder-stone-500 dark:focus:border-stone-400 dark:focus:ring-stone-700"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={closeInspect}
              disabled={isPending}
            >
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={() => submitInspection(false)}
              disabled={isPending}
              className="gap-1"
            >
              <XCircle className="h-4 w-4" />
              ไม่ผ่าน ✗
            </Button>
            <Button
              onClick={() => submitInspection(true)}
              disabled={isPending}
              className="gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <CheckCircle className="h-4 w-4" />
              ผ่าน ✓
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
