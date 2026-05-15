'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { ChefHat, Clock, CheckCheck, Send, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────────────────

type KQStatus = 'new' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

interface KQItem {
  name: string;
  qty: number;
  notes?: string | null;
  allergy_tags?: string[];
}

interface KitchenQueueRow {
  id: string;
  order_id: string;
  outlet_id?: string | null;
  items: KQItem[];
  priority: number;
  status: KQStatus;
  kitchen_note?: string | null;
  started_at?: string | null;
  ready_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
}

interface Outlet {
  id: string;
  name: string;
  type?: string;
}

interface Props {
  hotelId: string;
  initialQueue: KitchenQueueRow[];
  outlets: Outlet[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeSince(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  const m = Math.floor(diff / 60);
  if (m < 60) return `${m} นาที`;
  const h = Math.floor(m / 60);
  return `${h} ชม. ${m % 60} นาที`;
}

function isUrgent(iso: string, thresholdMin = 15): boolean {
  return (Date.now() - new Date(iso).getTime()) / 60000 > thresholdMin;
}

function shortId(id: string) {
  return id.slice(-6).toUpperCase();
}

const COLUMN_CONFIG = {
  new: {
    label: 'รอเริ่มทำ',
    bg: 'bg-slate-50 dark:bg-slate-900/50',
    border: 'border-slate-200 dark:border-slate-700',
    dot: 'bg-slate-400',
    headerBg: 'bg-slate-100 dark:bg-slate-800',
    headerText: 'text-slate-700 dark:text-slate-200',
  },
  preparing: {
    label: 'กำลังปรุง',
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800',
    dot: 'bg-amber-400',
    headerBg: 'bg-amber-100 dark:bg-amber-900/40',
    headerText: 'text-amber-800 dark:text-amber-200',
  },
  ready: {
    label: 'พร้อมเสิร์ฟ',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800',
    dot: 'bg-emerald-400',
    headerBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    headerText: 'text-emerald-800 dark:text-emerald-200',
  },
} as const;

const NEXT_STATUS: Record<KQStatus, { label: string; next: KQStatus } | null> = {
  new: { label: 'เริ่มทำ', next: 'preparing' },
  preparing: { label: 'พร้อมเสิร์ฟ', next: 'ready' },
  ready: { label: 'ส่งแล้ว', next: 'delivered' },
  delivered: null,
  cancelled: null,
};

const BUTTON_COLOR: Record<string, string> = {
  new: 'bg-amber-500 hover:bg-amber-600 text-white',
  preparing: 'bg-emerald-500 hover:bg-emerald-600 text-white',
  ready: 'bg-sky-500 hover:bg-sky-600 text-white',
};

// ─── Ticket Card ─────────────────────────────────────────────────────────────

function TicketCard({
  ticket,
  outlets,
  onAction,
  now,
}: {
  ticket: KitchenQueueRow;
  outlets: Outlet[];
  onAction: (id: string, nextStatus: KQStatus) => Promise<void>;
  now: number;
}) {
  const [loading, setLoading] = useState(false);
  const next = NEXT_STATUS[ticket.status];
  const outlet = outlets.find(o => o.id === ticket.outlet_id);
  const urgent = isUrgent(ticket.created_at);

  const elapsed = Math.floor((now - new Date(ticket.created_at).getTime()) / 1000);
  const elapsedLabel = elapsed < 60
    ? `${elapsed}s`
    : elapsed < 3600
    ? `${Math.floor(elapsed / 60)} นาที`
    : `${Math.floor(elapsed / 3600)} ชม.`;

  async function handleAction() {
    if (!next) return;
    setLoading(true);
    await onAction(ticket.id, next.next);
    setLoading(false);
  }

  return (
    <div
      className={cn(
        'rounded-xl border p-4 flex flex-col gap-3 shadow-sm transition-all',
        urgent && ticket.status === 'new' ? 'border-red-400 bg-red-50 dark:bg-red-950/20' : 'bg-card border-border'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono font-bold text-base tracking-wider">
            #{shortId(ticket.order_id)}
          </span>
          {outlet && (
            <Badge variant="secondary" className="text-xs shrink-0">
              {outlet.name}
            </Badge>
          )}
          {ticket.priority >= 8 && (
            <Badge variant="destructive" className="text-xs shrink-0">URGENT</Badge>
          )}
        </div>
        <div className={cn(
          'flex items-center gap-1 text-xs shrink-0',
          urgent ? 'text-red-600 font-semibold' : 'text-muted-foreground'
        )}>
          <Clock className="h-3 w-3" />
          {elapsedLabel}
        </div>
      </div>

      {/* Items */}
      <ul className="space-y-1.5">
        {ticket.items.map((item, i) => (
          <li key={i} className="text-sm">
            <div className="flex items-start gap-2">
              <span className="font-semibold text-foreground min-w-[1.5rem] text-right">
                {item.qty}×
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-medium">{item.name}</span>
                {item.notes && (
                  <p className="text-xs text-muted-foreground italic mt-0.5">{item.notes}</p>
                )}
                {item.allergy_tags && item.allergy_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.allergy_tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border border-amber-300 dark:border-amber-700"
                      >
                        ⚠ {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Kitchen note */}
      {ticket.kitchen_note && (
        <div className="text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded px-2 py-1.5 text-amber-800 dark:text-amber-300 italic">
          📝 {ticket.kitchen_note}
        </div>
      )}

      {/* Action */}
      {next && (
        <button
          disabled={loading}
          onClick={handleAction}
          className={cn(
            'w-full rounded-lg py-2 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50',
            BUTTON_COLOR[ticket.status] ?? 'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          {loading ? 'กำลังอัพเดท…' : next.label}
        </button>
      )}
    </div>
  );
}

// ─── Column ──────────────────────────────────────────────────────────────────

function Column({
  status,
  tickets,
  outlets,
  onAction,
  now,
}: {
  status: 'new' | 'preparing' | 'ready';
  tickets: KitchenQueueRow[];
  outlets: Outlet[];
  onAction: (id: string, nextStatus: KQStatus) => Promise<void>;
  now: number;
}) {
  const cfg = COLUMN_CONFIG[status];
  return (
    <div className={cn('rounded-xl border flex flex-col min-h-0', cfg.border)}>
      {/* Column header */}
      <div className={cn('px-4 py-3 rounded-t-xl flex items-center gap-2 shrink-0', cfg.headerBg)}>
        <span className={cn('h-2.5 w-2.5 rounded-full', cfg.dot)} />
        <span className={cn('font-semibold text-sm', cfg.headerText)}>{cfg.label}</span>
        <span className={cn(
          'ml-auto text-xs font-bold px-2 py-0.5 rounded-full',
          cfg.headerBg, cfg.headerText, 'border', cfg.border
        )}>
          {tickets.length}
        </span>
      </div>
      {/* Cards */}
      <div className={cn('flex-1 overflow-y-auto p-3 space-y-3', cfg.bg)}>
        {tickets.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-8">ไม่มีรายการ</p>
        ) : (
          tickets.map(t => (
            <TicketCard
              key={t.id}
              ticket={t}
              outlets={outlets}
              onAction={onAction}
              now={now}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Client ─────────────────────────────────────────────────────────────

export function KitchenClient({ hotelId, initialQueue, outlets }: Props) {
  const [queue, setQueue] = useState<KitchenQueueRow[]>(initialQueue);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer tick every 30s
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(tick);
  }, []);

  // Auto-refresh queue every 30s
  const fetchQueue = useCallback(async (showLoader = false) => {
    if (showLoader) setRefreshing(true);
    try {
      const params = new URLSearchParams({
        hotel_id: hotelId,
        status: 'new,preparing,ready',
      });
      if (selectedOutlet !== 'all') params.set('outlet_id', selectedOutlet);
      const res = await fetch(`/api/kitchen?${params}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      setQueue(json.data ?? []);
    } catch {
      // silent on background refresh
    } finally {
      if (showLoader) setRefreshing(false);
    }
  }, [hotelId, selectedOutlet]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => fetchQueue(false), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchQueue]);

  // Refetch when outlet filter changes
  useEffect(() => {
    fetchQueue(false);
  }, [selectedOutlet]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleAction(id: string, nextStatus: KQStatus) {
    try {
      const res = await fetch(`/api/kitchen/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast.error(json.error ?? 'อัพเดทไม่สำเร็จ');
        return;
      }
      const { data } = await res.json();
      if (nextStatus === 'delivered') {
        // Remove from board
        setQueue(q => q.filter(t => t.id !== id));
        toast.success('ส่งแล้ว ✓');
      } else {
        setQueue(q => q.map(t => t.id === id ? { ...t, ...data } : t));
        toast.success(nextStatus === 'preparing' ? 'เริ่มปรุงแล้ว' : 'พร้อมเสิร์ฟ');
      }
    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    }
  }

  // Filter
  const filtered = selectedOutlet === 'all'
    ? queue
    : queue.filter(t => t.outlet_id === selectedOutlet);

  const byStatus = (status: KQStatus) =>
    filtered.filter(t => t.status === status);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b bg-card shrink-0">
        <div className="flex items-center gap-2">
          <ChefHat className="h-5 w-5 text-primary" />
          <h1 className="font-display text-lg font-semibold">Kitchen Display System</h1>
          <span className="text-xs text-muted-foreground hidden sm:block">— อัพเดทอัตโนมัติทุก 30 วินาที</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Outlet filter */}
          {outlets.length > 1 && (
            <div className="flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedOutlet}
                onChange={e => setSelectedOutlet(e.target.value)}
                className="h-8 rounded-lg border border-input bg-card px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">ทุก Outlet</option>
                {outlets.map(o => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchQueue(true)}
            disabled={refreshing}
            className="gap-1.5"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            รีเฟรช
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-6 px-4 py-2 bg-muted/40 border-b text-sm shrink-0">
        <span className="text-muted-foreground">รวมทั้งหมด <strong className="text-foreground">{filtered.length}</strong> รายการ</span>
        <span className="text-slate-600 dark:text-slate-400">รอ: <strong>{byStatus('new').length}</strong></span>
        <span className="text-amber-600 dark:text-amber-400">กำลังปรุง: <strong>{byStatus('preparing').length}</strong></span>
        <span className="text-emerald-600 dark:text-emerald-400">พร้อม: <strong>{byStatus('ready').length}</strong></span>
      </div>

      {/* 3-column KDS board */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 p-3 overflow-hidden min-h-0">
        {(['new', 'preparing', 'ready'] as const).map(status => (
          <Column
            key={status}
            status={status}
            tickets={byStatus(status)}
            outlets={outlets}
            onAction={handleAction}
            now={now}
          />
        ))}
      </div>
    </div>
  );
}
