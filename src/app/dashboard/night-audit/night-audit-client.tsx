'use client';
import { useState } from 'react';
import { Moon, Users, Receipt, DollarSign, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_COLOR: Record<string, string> = {
  checked_in: 'text-emerald-400 bg-emerald-400/10',
  due_out: 'text-amber-400 bg-amber-400/10',
  checked_out: 'text-zinc-400 bg-zinc-400/10',
  reserved: 'text-blue-400 bg-blue-400/10',
};

export function NightAuditClient({ reservations, cashierSessions, folios, today }: { reservations: any[]; cashierSessions: any[]; folios: any[]; today: string }) {
  const [tab, setTab] = useState<'overview'|'arrivals'|'cashier'|'folios'>('overview');
  const [running, setRunning] = useState(false);

  const checkedIn = reservations.filter(r => r.status === 'checked_in');
  const dueOut = reservations.filter(r => r.status === 'due_out');
  const totalFolioBalance = folios.reduce((s, f) => s + Number(f.total || 0), 0);
  const openCashier = cashierSessions.find(s => !s.closed_at);

  async function runNightAudit() {
    if (!window.confirm('Run Night Audit for ' + today + '? This will post room charges to all open folios.')) return;
    setRunning(true);
    const res = await fetch('/api/cron/night-audit', { method: 'POST' });
    setRunning(false);
    if (res.ok) toast.success('Night Audit completed successfully');
    else toast.error('Night Audit failed — check logs');
  }

  const TABS = [
    { id: 'overview', label: 'Overview', icon: Moon },
    { id: 'arrivals', label: 'Arrivals/Departures', icon: Users },
    { id: 'cashier', label: 'Cashier Balance', icon: DollarSign },
    { id: 'folios', label: 'Open Folios', icon: Receipt },
  ] as const;

  return (
    <div className="p-4 md:p-6 space-y-6 text-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Moon className="h-5 w-5 text-indigo-400" /> Night Audit</h1>
          <p className="text-white/50 text-sm mt-1">{new Date(today).toLocaleDateString('th-TH', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <button onClick={runNightAudit} disabled={running}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center gap-2">
          {running ? <><Clock className="h-4 w-4 animate-spin" /> Running…</> : <><Moon className="h-4 w-4" /> Run Night Audit</>}
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit overflow-x-auto">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors', tab === t.id ? 'bg-indigo-600 text-white' : 'text-white/50 hover:text-white')}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Checked In', value: checkedIn.length, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { label: 'Due Out', value: dueOut.length, color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { label: 'Open Folios', value: folios.length, color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { label: 'Folio Balance', value: '฿'+totalFolioBalance.toLocaleString(), color: 'text-violet-400', bg: 'bg-violet-400/10' },
            ].map(s => (
              <div key={s.label} className={cn('rounded-2xl p-4', s.bg, 'border border-white/5')}>
                <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
                <p className="text-xs text-white/50 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
            <h3 className="font-semibold mb-3 text-sm">Cashier Status</h3>
            {openCashier ? (
              <div className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Session open — opened {new Date(openCashier.opened_at).toLocaleTimeString()}</span>
                <span className="text-white/40">Opening balance: ฿{Number(openCashier.opening_balance || 0).toLocaleString()}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-sm text-amber-400">
                <AlertTriangle className="h-4 w-4" />
                <span>No open cashier session today</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Arrivals/Departures */}
      {tab === 'arrivals' && (
        <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/8">
              {['Res #','Guest','Room','Check-in','Check-out','Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>)}
            </tr></thead>
            <tbody>
              {reservations.map((r, i) => (
                <tr key={r.id} className={cn('border-b border-white/5 hover:bg-white/5', i === reservations.length-1 && 'border-0')}>
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{r.reservation_no}</td>
                  <td className="px-4 py-3 font-medium">{r.guest_name}</td>
                  <td className="px-4 py-3 text-white/60">{r.room_no}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{r.check_in}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{r.check_out}</td>
                  <td className="px-4 py-3"><span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', STATUS_COLOR[r.status])}>{r.status.replace('_',' ')}</span></td>
                </tr>
              ))}
              {reservations.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-white/30">No reservations</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Cashier Balance */}
      {tab === 'cashier' && (
        <div className="space-y-3">
          {cashierSessions.length === 0 && <div className="text-white/40 text-center py-10">No cashier sessions today</div>}
          {cashierSessions.map(s => (
            <div key={s.id} className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{s.closed_at ? 'Closed Session' : 'Open Session'}</p>
                  <p className="text-xs text-white/40 mt-0.5">Opened: {new Date(s.opened_at).toLocaleTimeString()}{s.closed_at ? ' • Closed: ' + new Date(s.closed_at).toLocaleTimeString() : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-white/50">Opening: <span className="text-white font-medium">฿{Number(s.opening_balance || 0).toLocaleString()}</span></p>
                  {s.closing_balance != null && <p className="text-sm text-white/50">Closing: <span className="text-emerald-400 font-medium">฿{Number(s.closing_balance).toLocaleString()}</span></p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Folios */}
      {tab === 'folios' && (
        <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/8">
              {['Reservation','Guest','Total','Status'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>)}
            </tr></thead>
            <tbody>
              {folios.map((f, i) => (
                <tr key={f.id} className={cn('border-b border-white/5 hover:bg-white/5', i === folios.length-1 && 'border-0')}>
                  <td className="px-4 py-3 font-mono text-xs text-white/60">{f.reservations?.reservation_no || '—'}</td>
                  <td className="px-4 py-3 font-medium">{f.reservations?.guest_name || '—'}</td>
                  <td className="px-4 py-3 text-emerald-400 font-semibold">฿{Number(f.total || 0).toLocaleString()}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-amber-400/10 text-amber-400 rounded-full capitalize">{f.status}</span></td>
                </tr>
              ))}
              {folios.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-white/30">No open folios</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
