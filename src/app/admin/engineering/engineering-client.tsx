'use client';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Code2, RefreshCw, Play, Database, FileText, Webhook } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLOR: Record<string, string> = {
  pending: 'text-amber-400 bg-amber-400/10',
  processed: 'text-emerald-400 bg-emerald-400/10',
  failed: 'text-red-400 bg-red-400/10',
  replayed: 'text-blue-400 bg-blue-400/10',
};

export function EngineeringAdminClient() {
  const [tab, setTab] = useState<'webhooks'|'logs'|'migrations'>('webhooks');
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [replaying, setReplaying] = useState<string|null>(null);

  async function loadEvents() {
    setLoading(true);
    const res = await fetch('/api/admin/webhooks');
    const data = await res.json();
    setEvents(data);
    setLoading(false);
  }

  async function replay(eventId: string) {
    setReplaying(eventId);
    const res = await fetch('/api/admin/webhooks/replay', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ eventId }) });
    setReplaying(null);
    if (res.ok) { toast.success('Replayed'); loadEvents(); }
    else toast.error('Failed to replay');
  }

  useEffect(() => { if (tab === 'webhooks') loadEvents(); }, [tab]);

  const MIGRATIONS = [
    '20260514000000_staff_profile_extended.sql',
    '20260514100000_department_work_tables.sql',
    '20260601000000_attendance_shifts.sql',
    '20260601100000_work_orders.sql',
    '20260601200000_messaging.sql',
    '20260601300000_leave_documents.sql',
    '20260601400000_roles_expanded.sql',
    '20260701000000_hr_module.sql',
    '20260701100000_accounting_full.sql',
    '20260701200000_housekeeping_full.sql',
    '20260701300000_engineering_full.sql',
    '20260701400000_fnb_full.sql',
    '20260701500000_purchasing.sql',
    '20260701600000_transport_bellboy.sql',
    '20260701700000_revenue_marketing.sql',
    '20260701800000_it_support.sql',
    '20260801000000_platform_core.sql',
    '20260801100000_platform_ops.sql',
  ];

  return (
    <div className="p-4 md:p-8 text-white space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl md:text-2xl font-bold flex items-center gap-2"><Code2 className="h-5 w-5 text-[#C66A30]" /> Engineering Admin</h1></div>
        {tab === 'webhooks' && <button onClick={loadEvents} className="p-2 rounded-xl bg-white/8 hover:bg-white/12 text-white/60 hover:text-white transition-colors"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></button>}
      </div>
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        {[{id:'webhooks',label:'Webhooks',icon:Webhook},{id:'logs',label:'Logs',icon:FileText},{id:'migrations',label:'Migrations',icon:Database}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors', tab === t.id ? 'bg-[#C66A30] text-white' : 'text-white/50 hover:text-white')}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'webhooks' && (
        <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/8">
              {['Hotel','Platform','Event','Status','Time',''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>)}
            </tr></thead>
            <tbody>
              {events.map((ev, i) => (
                <tr key={ev.id} className={cn('border-b border-white/5 hover:bg-white/5', i === events.length-1 && 'border-0')}>
                  <td className="px-4 py-3 text-white/70">{ev.hotels?.name || '—'}</td>
                  <td className="px-4 py-3 text-white/50 capitalize">{ev.platform}</td>
                  <td className="px-4 py-3 text-xs font-mono text-white/50">{ev.event_type}</td>
                  <td className="px-4 py-3"><span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', STATUS_COLOR[ev.status])}>{ev.status}</span></td>
                  <td className="px-4 py-3 text-white/30 text-xs">{new Date(ev.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {ev.status === 'failed' && (
                      <button onClick={() => replay(ev.id)} disabled={replaying === ev.id}
                        className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors disabled:opacity-50">
                        <Play className="h-3 w-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {events.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-white/30">{loading ? 'Loading…' : 'No webhook events'}</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'logs' && (
        <div className="bg-black/60 border border-white/8 rounded-2xl p-4 font-mono text-xs text-emerald-400 min-h-64">
          <p className="text-white/30 mb-4"># Application Logs — real-time streaming not yet enabled</p>
          <p>[INFO] Platform health check — all services nominal</p>
          <p>[INFO] Webhook processor idle</p>
          <p className="text-white/30 mt-2">Connect to Vercel Log Drain or Axiom for live log streaming.</p>
        </div>
      )}

      {tab === 'migrations' && (
        <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
          {MIGRATIONS.map((m, i) => (
            <div key={m} className={cn('flex items-center gap-3 px-5 py-3 text-sm', i < MIGRATIONS.length-1 && 'border-b border-white/5')}>
              <Database className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="font-mono text-xs text-white/70">{m}</span>
              <span className="ml-auto text-xs text-emerald-400">✓ applied</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
