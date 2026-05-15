'use client';
import { useEffect, useState } from 'react';
import { Activity, RefreshCw, Wifi, Database, CreditCard, Mail, HardDrive } from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICE_ICON: Record<string, any> = {
  database: Database, api: Activity, websocket: Wifi,
  stripe: CreditCard, sendgrid: Mail, storage: HardDrive,
};
const STATUS_COLOR = { healthy: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400', degraded: 'border-amber-500/30 bg-amber-500/10 text-amber-400', down: 'border-red-500/30 bg-red-500/10 text-red-400' };

export function OperationsClient() {
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/ops/health');
    const data = await res.json();
    setHealth(data);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 md:p-8 text-white space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl md:text-2xl font-bold">Platform Operations</h1><p className="text-white/50 text-sm mt-1">System health overview</p></div>
        <button onClick={load} className="p-2 rounded-xl bg-white/8 hover:bg-white/12 text-white/60 hover:text-white transition-colors"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></button>
      </div>
      {health && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {health.services?.map((s: any) => {
              const Icon = SERVICE_ICON[s.service] || Activity;
              const color = STATUS_COLOR[s.status as keyof typeof STATUS_COLOR] || STATUS_COLOR.healthy;
              return (
                <div key={s.service} className={cn('border rounded-2xl p-4', color)}>
                  <div className="flex items-center gap-2 mb-2"><Icon className="h-4 w-4" /><span className="text-sm font-semibold capitalize">{s.service}</span></div>
                  <div className="text-xs opacity-70 capitalize">{s.status}{s.latency_ms ? ` • ${s.latency_ms}ms` : ''}</div>
                </div>
              );
            })}
          </div>
          <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
            <p className="text-sm font-semibold mb-3">Recent Health Checks</p>
            {health.history?.length === 0 && <p className="text-white/40 text-sm">No history yet</p>}
            <div className="space-y-1.5">
              {health.history?.slice(0,10).map((h: any) => (
                <div key={h.id} className="flex items-center gap-3 text-xs text-white/50">
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', h.status === 'healthy' ? 'bg-emerald-400' : h.status === 'degraded' ? 'bg-amber-400' : 'bg-red-400')} />
                  <span className="capitalize font-medium text-white/70 w-20">{h.service}</span>
                  <span>{h.status}</span>
                  {h.latency_ms && <span>{h.latency_ms}ms</span>}
                  <span className="ml-auto">{new Date(h.checked_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      {loading && !health && <div className="flex items-center justify-center py-20 text-white/40">Loading…</div>}
    </div>
  );
}
