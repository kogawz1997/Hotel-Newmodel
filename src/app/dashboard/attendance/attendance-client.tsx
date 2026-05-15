'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Coffee, LogOut, LogIn, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type AttendanceRecord = {
  id: string;
  work_date: string;
  clock_in_at: string | null;
  clock_out_at: string | null;
  break_start: string | null;
  break_end: string | null;
  status: string;
  late_minutes: number;
  shifts?: { name: string; start_time: string; end_time: string } | null;
};

type ShiftAssignment = {
  shifts: { name: string; start_time: string; end_time: string; color: string } | null;
} | null;

type Props = {
  hotel: { id: string; name: string };
  profile: { id: string; full_name: string | null; role: string } | null;
  todayRecord: AttendanceRecord | null;
  history: AttendanceRecord[];
  todayShift: ShiftAssignment;
};

function fmt(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function statusBadge(status: string) {
  const map: Record<string, { label: string; cls: string }> = {
    clocked_in:  { label: 'กำลังทำงาน', cls: 'bg-emerald-500/15 text-emerald-400' },
    on_break:    { label: 'พักอยู่',     cls: 'bg-amber-500/15 text-amber-400' },
    clocked_out: { label: 'ออกงานแล้ว', cls: 'bg-slate-500/15 text-slate-400' },
    absent:      { label: 'ขาดงาน',     cls: 'bg-red-500/15 text-red-400' },
    late:        { label: 'มาสาย',       cls: 'bg-orange-500/15 text-orange-400' },
    pending:     { label: 'ยังไม่มา',   cls: 'bg-slate-500/10 text-slate-500' },
  };
  const s = map[status] ?? { label: status, cls: 'bg-slate-500/10 text-slate-500' };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

export function AttendanceClient({ hotel, profile, todayRecord: initialRecord, history, todayShift }: Props) {
  const [record, setRecord] = useState<AttendanceRecord | null>(initialRecord);
  const [loading, setLoading] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const doAction = useCallback(async (action: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecord(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const status = record?.status ?? 'pending';
  const canClockIn  = !record?.clock_in_at;
  const canBreak    = status === 'clocked_in';
  const canEndBreak = status === 'on_break';
  const canClockOut = status === 'clocked_in';

  const shift = todayShift?.shifts;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Header */}
      <div>
        <p className="text-sm text-muted-foreground">{hotel.name}</p>
        <h1 className="text-2xl font-semibold">บันทึกเวลา</h1>
        <p className="text-sm text-muted-foreground">สวัสดี, {profile?.full_name ?? 'พนักงาน'}</p>
      </div>

      {/* Live clock */}
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-5xl font-bold tabular-nums tracking-tight">
          {now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {now.toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        {shift && (
          <p className="mt-2 text-sm font-medium" style={{ color: shift.color }}>
            กะ {shift.name} · {shift.start_time.slice(0, 5)} – {shift.end_time.slice(0, 5)}
          </p>
        )}
      </div>

      {/* Today status */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">สถานะวันนี้</span>
          {statusBadge(status)}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center text-sm">
          <div>
            <p className="text-muted-foreground">เข้างาน</p>
            <p className="font-semibold">{fmt(record?.clock_in_at ?? null)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">พัก</p>
            <p className="font-semibold">{fmt(record?.break_start ?? null)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">ออกงาน</p>
            <p className="font-semibold">{fmt(record?.clock_out_at ?? null)}</p>
          </div>
        </div>
        {(record?.late_minutes ?? 0) > 0 && (
          <p className="mt-2 text-center text-xs text-orange-400">มาสาย {record!.late_minutes} นาที</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={!canClockIn || loading}
          onClick={() => doAction('clock_in')}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          <LogIn className="h-4 w-4" /> เข้างาน
        </button>
        <button
          disabled={!canClockOut || loading}
          onClick={() => doAction('clock_out')}
          className="flex items-center justify-center gap-2 rounded-xl bg-slate-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          <LogOut className="h-4 w-4" /> ออกงาน
        </button>
        <button
          disabled={!canBreak || loading}
          onClick={() => doAction('break_start')}
          className="flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-400 disabled:opacity-40"
        >
          <Coffee className="h-4 w-4" /> เริ่มพัก
        </button>
        <button
          disabled={!canEndBreak || loading}
          onClick={() => doAction('break_end')}
          className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-400 disabled:opacity-40"
        >
          <Clock className="h-4 w-4" /> กลับมาทำงาน
        </button>
      </div>

      {/* History */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Calendar className="h-4 w-4" /> ประวัติ 14 วันล่าสุด
        </h2>
        <div className="space-y-2">
          {history.length === 0 && (
            <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              ไม่มีประวัติ
            </p>
          )}
          {history.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                {r.status === 'clocked_out' ? (
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                ) : r.status === 'absent' ? (
                  <XCircle className="h-4 w-4 text-red-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                )}
                <span className="font-medium">
                  {new Date(r.work_date).toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>{fmt(r.clock_in_at)} – {fmt(r.clock_out_at)}</span>
                {statusBadge(r.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
