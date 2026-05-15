'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Layers, ToggleLeft, ToggleRight, FlaskConical, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLOR: Record<string, string> = {
  draft: 'text-zinc-400 bg-zinc-400/10', running: 'text-emerald-400 bg-emerald-400/10',
  paused: 'text-amber-400 bg-amber-400/10', completed: 'text-blue-400 bg-blue-400/10',
};

export function ProductAdminClient({ flags: initial, abTests: initialTests }: { flags: any[]; abTests: any[] }) {
  const [tab, setTab] = useState<'flags'|'abtests'>('flags');
  const [flags, setFlags] = useState(initial);

  async function toggleFlag(flag: any) {
    const newEnabled = !flag.enabled;
    const res = await fetch('/api/admin/flags', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id: flag.id, enabled: newEnabled }) });
    if (res.ok) { setFlags(prev => prev.map(f => f.id === flag.id ? { ...f, enabled: newEnabled } : f)); toast.success(`Flag ${newEnabled ? 'enabled' : 'disabled'}`); }
    else toast.error('Failed');
  }

  async function addFlag() {
    const key = window.prompt('Flag key (snake_case):');
    const name = window.prompt('Display name:');
    if (!key || !name) return;
    const res = await fetch('/api/admin/flags', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ key, name, enabled: false, rollout_percent: 0 }) });
    if (res.ok) { const data = await res.json(); setFlags(prev => [...prev, data]); toast.success('Flag created'); }
    else toast.error('Failed');
  }

  return (
    <div className="p-4 md:p-8 text-white space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl md:text-2xl font-bold flex items-center gap-2"><Layers className="h-5 w-5 text-[#C66A30]" /> Product Admin</h1></div>
        {tab === 'flags' && <button onClick={addFlag} className="px-4 py-2 bg-[#C66A30] hover:bg-[#B55C26] text-white rounded-xl text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Add Flag</button>}
      </div>
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        {[{id:'flags',label:'Feature Flags',icon:Layers},{id:'abtests',label:'A/B Tests',icon:FlaskConical}].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors', tab === t.id ? 'bg-[#C66A30] text-white' : 'text-white/50 hover:text-white')}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'flags' && (
        <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/8">
              {['Key','Name','Enabled','Rollout %',''].map(h => <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>)}
            </tr></thead>
            <tbody>
              {flags.map((flag, i) => (
                <tr key={flag.id} className={cn('border-b border-white/5 hover:bg-white/5', i === flags.length-1 && 'border-0')}>
                  <td className="px-5 py-3 font-mono text-xs text-white/70">{flag.key}</td>
                  <td className="px-5 py-3 font-medium">{flag.name}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => toggleFlag(flag)}>
                      {flag.enabled ? <ToggleRight className="h-5 w-5 text-emerald-400" /> : <ToggleLeft className="h-5 w-5 text-white/30" />}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-white/50">{flag.rollout_percent}%</td>
                  <td className="px-5 py-3 text-xs text-white/30">{flag.description || '—'}</td>
                </tr>
              ))}
              {flags.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-white/30">No flags</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'abtests' && (
        <div className="space-y-3">
          {initialTests.length === 0 && <div className="text-white/40 text-center py-10">No A/B tests</div>}
          {initialTests.map(test => (
            <div key={test.id} className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-white">{test.name}</p>
                  {test.description && <p className="text-xs text-white/40 mt-0.5">{test.description}</p>}
                  <p className="text-xs text-white/30 mt-1">{Array.isArray(test.variants) ? test.variants.length : 0} variants • {test.started_at ? 'Started ' + new Date(test.started_at).toLocaleDateString() : 'Not started'}</p>
                </div>
                <span className={cn('text-xs px-2 py-1 rounded-lg font-medium capitalize', STATUS_COLOR[test.status])}>{test.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
