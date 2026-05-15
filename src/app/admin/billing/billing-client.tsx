'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, AlertTriangle, Gift, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_COLOR: Record<string, string> = {
  paid: 'text-emerald-400 bg-emerald-400/10',
  open: 'text-amber-400 bg-amber-400/10',
  void: 'text-zinc-400 bg-zinc-400/10',
  uncollectible: 'text-red-400 bg-red-400/10',
  draft: 'text-blue-400 bg-blue-400/10',
};

export function BillingClient({ invoices, failedSubs, credits }: { invoices: any[]; failedSubs: any[]; credits: any[] }) {
  const [tab, setTab] = useState<'invoices'|'failed'|'credits'>('invoices');
  const [loading, setLoading] = useState<string|null>(null);

  const totalMRR = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);

  async function retryPayment(orgId: string) {
    setLoading(orgId);
    const res = await fetch('/api/admin/billing/retry', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ orgId }) });
    setLoading(null);
    if (res.ok) toast.success('Payment retried');
    else toast.error('Retry failed');
  }

  async function issueCredit() {
    const orgId = window.prompt('Organization ID:');
    const amount = window.prompt('Amount (THB):');
    const reason = window.prompt('Reason:');
    if (!orgId || !amount) return;
    const res = await fetch('/api/admin/billing/credits', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ orgId, amount: Number(amount), reason }) });
    if (res.ok) toast.success('Credit issued');
    else toast.error('Failed to issue credit');
  }

  const TABS = [
    { id: 'invoices', label: 'Invoices', icon: CreditCard, count: invoices.length },
    { id: 'failed', label: 'Failed Payments', icon: AlertTriangle, count: failedSubs.length },
    { id: 'credits', label: 'Credits', icon: Gift, count: credits.length },
  ] as const;

  return (
    <div className="p-4 md:p-8 text-white space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Billing Admin</h1>
          <p className="text-white/50 text-sm mt-1">MRR: ฿{totalMRR.toLocaleString()}</p>
        </div>
        <button onClick={issueCredit} className="px-4 py-2 bg-[#C66A30] hover:bg-[#B55C26] text-white rounded-xl text-sm font-medium transition-colors flex items-center gap-2">
          <Gift className="h-4 w-4" /> Issue Credit
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors', tab === t.id ? 'bg-[#C66A30] text-white' : 'text-white/50 hover:text-white')}>
            <t.icon className="h-4 w-4" /> {t.label}
            {t.count > 0 && <span className="bg-white/20 text-xs px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Invoices */}
      {tab === 'invoices' && (
        <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/8">
              {['Organization','Amount','Status','Due Date','Paid At'].map(h => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {invoices.map((inv, i) => (
                <tr key={inv.id} className={cn('border-b border-white/5 hover:bg-white/5', i === invoices.length-1 && 'border-0')}>
                  <td className="px-5 py-3 font-medium">{inv.organizations?.name || '—'}</td>
                  <td className="px-5 py-3">฿{Number(inv.amount).toLocaleString()}</td>
                  <td className="px-5 py-3"><span className={cn('text-xs px-2 py-1 rounded-lg font-medium capitalize', STATUS_COLOR[inv.status] || 'text-white/50')}>{inv.status}</span></td>
                  <td className="px-5 py-3 text-white/40 text-xs">{inv.due_date || '—'}</td>
                  <td className="px-5 py-3 text-white/40 text-xs">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-white/30">No invoices</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* Failed Payments */}
      {tab === 'failed' && (
        <div className="space-y-3">
          {failedSubs.length === 0 && <div className="text-white/40 text-center py-10">No failed payments</div>}
          {failedSubs.map(sub => (
            <div key={sub.id} className="bg-white/5 border border-red-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{sub.organizations?.name}</p>
                <p className="text-xs text-red-400 mt-0.5">Plan: {sub.plan} — Status: past_due</p>
              </div>
              <button onClick={() => retryPayment(sub.org_id)} disabled={loading === sub.org_id}
                className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                {loading === sub.org_id ? 'Retrying…' : 'Retry Payment'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Credits */}
      {tab === 'credits' && (
        <div className="space-y-3">
          {credits.length === 0 && <div className="text-white/40 text-center py-10">No active credits</div>}
          {credits.map(c => (
            <div key={c.id} className="bg-white/5 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white">{c.organizations?.name}</p>
                <span className="text-emerald-400 font-bold">฿{Number(c.amount).toLocaleString()}</span>
              </div>
              <p className="text-xs text-white/40 mt-1">{c.reason || 'No reason'} • Expires: {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : 'Never'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
