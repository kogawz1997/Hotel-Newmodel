'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Hotel } from 'lucide-react';
import { cn } from '@/lib/utils';

const STAGES = [
  { id: 'prospecting', label: 'Prospecting', color: 'border-zinc-500/30 bg-zinc-500/5' },
  { id: 'demo_scheduled', label: 'Demo Scheduled', color: 'border-sky-500/30 bg-sky-500/5' },
  { id: 'trial', label: 'Trial', color: 'border-violet-500/30 bg-violet-500/5' },
  { id: 'negotiation', label: 'Negotiation', color: 'border-amber-500/30 bg-amber-500/5' },
  { id: 'closed_won', label: 'Won', color: 'border-emerald-500/30 bg-emerald-500/5' },
  { id: 'closed_lost', label: 'Lost', color: 'border-red-500/30 bg-red-500/5' },
] as const;

const SIZE_COLOR: Record<string, string> = {
  small: 'bg-zinc-500/20 text-zinc-300', medium: 'bg-sky-500/20 text-sky-300',
  large: 'bg-violet-500/20 text-violet-300', chain: 'bg-amber-500/20 text-amber-300',
};

export function SalesAdminClient({ leads: initial }: { leads: any[] }) {
  const [leads, setLeads] = useState(initial);

  async function addLead() {
    const hotelName = window.prompt('Hotel Name:');
    const email = window.prompt('Contact Email:');
    if (!hotelName || !email) return;
    const contactName = window.prompt('Contact Name:') || '';
    const res = await fetch('/api/admin/sales/leads', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ hotel_name: hotelName, contact_email: email, contact_name: contactName }),
    });
    if (res.ok) { const data = await res.json(); setLeads(prev => [data, ...prev]); toast.success('Lead added'); }
    else toast.error('Failed');
  }

  async function moveStage(id: string, stage: string) {
    await fetch('/api/admin/sales/leads', { method: 'PATCH', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ id, stage }) });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));
  }

  return (
    <div className="p-4 md:p-8 text-white space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl md:text-2xl font-bold">Sales CRM</h1><p className="text-white/50 text-sm mt-1">{leads.length} leads</p></div>
        <button onClick={addLead} className="px-4 py-2 bg-[#C66A30] hover:bg-[#B55C26] text-white rounded-xl text-sm font-medium flex items-center gap-2"><Plus className="h-4 w-4" /> Add Lead</button>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.stage === stage.id);
          return (
            <div key={stage.id} className={cn('border rounded-2xl p-4 min-w-[220px] shrink-0 flex-1', stage.color)}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white/80">{stage.label}</h3>
                <span className="text-xs text-white/40 bg-white/8 px-2 py-0.5 rounded-full">{stageLeads.length}</span>
              </div>
              <div className="space-y-3">
                {stageLeads.map(lead => (
                  <div key={lead.id} className="bg-black/30 border border-white/8 rounded-xl p-3">
                    <div className="flex items-start gap-2 mb-2">
                      <Hotel className="h-3.5 w-3.5 text-white/40 mt-0.5 shrink-0" />
                      <p className="text-sm font-medium text-white leading-tight">{lead.hotel_name}</p>
                    </div>
                    {lead.contact_name && <p className="text-xs text-white/50 mb-1">{lead.contact_name}</p>}
                    <p className="text-xs text-white/30 truncate mb-2">{lead.contact_email}</p>
                    {lead.hotel_size && <span className={cn('text-2xs px-2 py-0.5 rounded-full font-medium capitalize', SIZE_COLOR[lead.hotel_size] || SIZE_COLOR.small)}>{lead.hotel_size}</span>}
                    <select value={lead.stage} onChange={e => moveStage(lead.id, e.target.value)}
                      className="mt-2 w-full text-xs bg-white/5 border border-white/10 text-white/60 rounded-lg px-2 py-1">
                      {STAGES.map(s => <option key={s.id} value={s.id} className="bg-zinc-900">{s.label}</option>)}
                    </select>
                  </div>
                ))}
                {stageLeads.length === 0 && <div className="text-xs text-white/20 text-center py-4">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
