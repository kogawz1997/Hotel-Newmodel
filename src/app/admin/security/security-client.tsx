'use client';
import { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function SecurityAdminClient() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/admin/security/sessions');
    const data = await res.json();
    setLogs(data);
    setLoading(false);
  }

  async function revokeSession(userId: string) {
    const res = await fetch('/api/admin/security/sessions', { method: 'DELETE', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId }) });
    if (res.ok) { toast.success('Session revoked'); load(); }
    else toast.error('Failed to revoke');
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4 md:p-8 text-white space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl md:text-2xl font-bold flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-[#C66A30]" /> Security Admin</h1><p className="text-white/50 text-sm mt-1">Access logs & session management</p></div>
        <button onClick={load} className="p-2 rounded-xl bg-white/8 hover:bg-white/12 text-white/60 hover:text-white transition-colors"><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /></button>
      </div>
      <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/8">
              {['User','Action','Resource','IP Address','Time',''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {logs.map((log, i) => (
                <tr key={log.id} className={cn('border-b border-white/5 hover:bg-white/5', i === logs.length-1 && 'border-0')}>
                  <td className="px-4 py-3 text-white/80">{log.user_profiles?.email || '—'}</td>
                  <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 bg-white/8 rounded-lg font-mono">{log.action}</span></td>
                  <td className="px-4 py-3 text-white/50 font-mono text-xs">{log.resource}</td>
                  <td className="px-4 py-3 text-white/40 text-xs font-mono">{log.ip_address || '—'}</td>
                  <td className="px-4 py-3 text-white/30 text-xs">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {log.user_id && (
                      <button onClick={() => revokeSession(log.user_id)} className="text-red-400 hover:text-red-300 transition-colors"><LogOut className="h-3.5 w-3.5" /></button>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-white/30">{loading ? 'Loading…' : 'No logs'}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
