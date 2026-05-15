'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Building2, User, AlertTriangle, CheckCircle2, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_OPTS = ['open','in_progress','resolved','closed'];

export function TicketDetailClient({ ticket }: { ticket: any }) {
  const [status, setStatus] = useState(ticket.status);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (ticket.hotels?.id) {
      fetch(`/api/admin/support/diagnostics?hotelId=${ticket.hotels.id}`)
        .then(r => r.json()).then(setDiagnostics).catch(() => {});
    }
  }, [ticket.hotels?.id]);

  async function updateStatus() {
    setSaving(true);
    const res = await fetch(`/api/admin/support/tickets/${ticket.id}`, {
      method: 'PATCH', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    if (res.ok) toast.success('Status updated');
    else toast.error('Failed to update');
  }

  async function impersonate() {
    const orgId = ticket.hotels?.organization_id;
    if (!orgId) return;
    const res = await fetch(`/api/admin/orgs/${orgId}/impersonate`, {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ reason: 'support ticket #' + ticket.id.slice(0,8) }),
    });
    const data = await res.json();
    if (res.ok && data.redirectTo) { toast.success('Impersonation started'); window.open(data.redirectTo, '_blank'); }
    else toast.error(data.error || 'Failed');
  }

  return (
    <div className="p-4 md:p-8 text-white space-y-6 max-w-4xl">
      <div>
        <p className="text-white/40 text-sm mb-1">Support Ticket</p>
        <h1 className="text-xl md:text-2xl font-bold text-white">{ticket.title}</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="text-xs px-2 py-1 bg-white/8 rounded-lg">{ticket.category}</span>
          <span className="text-xs px-2 py-1 bg-white/8 rounded-lg capitalize">{ticket.priority}</span>
          <span className="text-xs text-white/40">{ticket.hotels?.name}</span>
        </div>
      </div>

      {ticket.description && (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-4">
          <p className="text-white/70 text-sm leading-relaxed">{ticket.description}</p>
        </div>
      )}

      {/* Status update */}
      <div className="flex items-center gap-3">
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="bg-white/8 border border-white/12 text-white rounded-xl px-3 py-2 text-sm">
          {STATUS_OPTS.map(s => <option key={s} value={s} className="bg-zinc-900 capitalize">{s.replace('_',' ')}</option>)}
        </select>
        <button onClick={updateStatus} disabled={saving}
          className="px-4 py-2 bg-[#C66A30] hover:bg-[#B55C26] text-white rounded-xl text-sm font-medium disabled:opacity-50">
          {saving ? 'Saving…' : 'Update Status'}
        </button>
        <button onClick={impersonate}
          className="px-4 py-2 bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 rounded-xl text-sm font-medium flex items-center gap-2">
          <LogIn className="h-4 w-4" /> Impersonate Hotel
        </button>
      </div>

      {/* Hotel diagnostics */}
      {diagnostics && (
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><Building2 className="h-4 w-4 text-[#C66A30]" /> Hotel Diagnostics</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Rooms', value: diagnostics.totalRooms },
              { label: 'Checked-In', value: diagnostics.activeReservations },
              { label: 'Open Tasks', value: diagnostics.openTasks },
              { label: 'Staff Count', value: diagnostics.staffCount },
            ].map(d => (
              <div key={d.label} className="text-center">
                <div className="text-2xl font-bold text-white">{d.value ?? '—'}</div>
                <div className="text-xs text-white/40 mt-1">{d.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
