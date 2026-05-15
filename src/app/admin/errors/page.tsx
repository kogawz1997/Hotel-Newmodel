'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useAdminLang } from '@/contexts/admin-lang-context';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { th as thLocale, enUS } from 'date-fns/locale';

type ErrorEvent = {
  id: string;
  event_type: string;
  severity: string;
  title: string;
  details: any;
  created_at: string;
  hotels?: { name: string; organizations?: { name: string } | null } | null;
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'bg-red-400',
  high:     'bg-orange-400',
  medium:   'bg-amber-400',
  low:      'bg-blue-400',
  info:     'bg-zinc-500',
};
const SEVERITY_TEXT: Record<string, string> = {
  critical: 'text-red-300',
  high:     'text-orange-300',
  medium:   'text-amber-300',
  low:      'text-blue-300',
  info:     'text-zinc-400',
};

export default function AdminErrorsPage() {
  const { lang, t } = useAdminLang();
  const [events, setEvents] = useState<ErrorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const locale = lang === 'th' ? thLocale : enUS;

  function load() {
    setLoading(true);
    const qs = severity !== 'all' ? `?severity=${severity}` : '';
    fetch(`/api/admin/errors${qs}`)
      .then(r => r.ok ? r.json() : { events: [] })
      .then(d => setEvents(d.events || []))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [severity]);

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const SEVERITIES = ['all', 'critical', 'high', 'medium', 'low', 'info'];

  return (
    <div className="p-4 md:p-8 text-white space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-red-500/15 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{t('errors.title')}</h1>
            <p className="text-white/40 text-sm mt-0.5">{events.length} {t('errors.lastEvents')}</p>
          </div>
        </div>
        <button onClick={load}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-colors">
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {/* Sentry notice */}
      <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 text-sm text-amber-300">
        💡 {t('errors.stackTrace')} —{' '}
        <a href="https://sentry.io" target="_blank" rel="noreferrer" className="font-semibold underline hover:text-amber-200">Sentry →</a>
      </div>

      {/* Severity filter */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {SEVERITIES.map(s => (
          <button key={s} onClick={() => setSeverity(s)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-colors shrink-0',
              severity === s ? 'bg-[#C66A30] text-white' : 'bg-white/5 border border-white/8 text-white/40 hover:text-white/70',
            )}>
            {s}
          </button>
        ))}
      </div>

      {/* Events list */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <RefreshCw className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>{t('errors.noErrors')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(ev => {
            const isOpen = expanded.has(ev.id);
            return (
              <div key={ev.id} className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
                <button onClick={() => toggle(ev.id)}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/5 transition-colors text-left gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn('h-2 w-2 rounded-full shrink-0', SEVERITY_COLOR[ev.severity] || 'bg-zinc-500')} />
                    <div className="min-w-0">
                      <p className="text-sm text-white/80 font-medium truncate">{ev.title}</p>
                      <p className="text-xs text-white/30 mt-0.5">
                        {ev.hotels?.name && `${ev.hotels.name} · `}
                        <code className="font-mono">{ev.event_type}</code>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-2xs font-semibold capitalize', SEVERITY_TEXT[ev.severity] || 'text-zinc-400')}>
                      {ev.severity}
                    </span>
                    <span className="text-xs text-white/25">
                      {format(parseISO(ev.created_at), 'd MMM HH:mm', { locale })}
                    </span>
                    {isOpen ? <ChevronUp className="h-3.5 w-3.5 text-white/30" /> : <ChevronDown className="h-3.5 w-3.5 text-white/30" />}
                  </div>
                </button>
                {isOpen && ev.details && (
                  <div className="border-t border-white/8 px-5 py-3.5">
                    <pre className="text-2xs bg-black/30 text-white/50 rounded-lg p-3 overflow-x-auto">
                      {JSON.stringify(ev.details, null, 2).slice(0, 600)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
