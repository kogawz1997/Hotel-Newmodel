'use client';
import { useState } from 'react';
import Link from 'next/link';
import { LifeBuoy, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const PRIORITY_COLOR: Record<string, string> = {
  low: 'text-zinc-400 bg-zinc-400/10',
  normal: 'text-blue-400 bg-blue-400/10',
  high: 'text-amber-400 bg-amber-400/10',
  urgent: 'text-red-400 bg-red-400/10',
};
const STATUS_COLOR: Record<string, string> = {
  open: 'text-amber-400 bg-amber-400/10',
  in_progress: 'text-blue-400 bg-blue-400/10',
  resolved: 'text-emerald-400 bg-emerald-400/10',
  closed: 'text-zinc-400 bg-zinc-400/10',
};

export function SupportAdminClient({ tickets }: { tickets: any[] }) {
  const [tab, setTab] = useState<'all'|'open'|'in_progress'|'resolved'>('all');
  const filtered = tab === 'all' ? tickets : tickets.filter(t => t.status === tab);
  const TABS = ['all','open','in_progress','resolved'] as const;

  return (
    <div className="p-4 md:p-8 text-white space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-white">Support Admin</h1>
        <p className="text-white/50 text-sm mt-1">{tickets.filter(t => t.status === 'open').length} open tickets</p>
      </div>
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={cn('px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize', tab === t ? 'bg-[#C66A30] text-white' : 'text-white/50 hover:text-white')}>
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 && <div className="text-white/40 text-center py-10">No tickets</div>}
        {filtered.map(ticket => (
          <Link key={ticket.id} href={`/admin/support/${ticket.id}`}
            className="block bg-white/5 border border-white/8 hover:border-[#C66A30]/40 rounded-2xl p-4 transition-colors group">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs text-white/40">{ticket.hotels?.name}</span>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium capitalize', PRIORITY_COLOR[ticket.priority])}>{ticket.priority}</span>
                  <span className="text-xs text-white/30 capitalize">{ticket.category}</span>
                </div>
                <p className="font-semibold text-white group-hover:text-[#E0813A] transition-colors">{ticket.title}</p>
                <p className="text-xs text-white/40 mt-1">by {ticket.user_profiles?.full_name || ticket.user_profiles?.email} • {new Date(ticket.created_at).toLocaleDateString()}</p>
              </div>
              <span className={cn('shrink-0 text-xs px-2 py-1 rounded-lg font-medium capitalize', STATUS_COLOR[ticket.status])}>{ticket.status.replace('_',' ')}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
