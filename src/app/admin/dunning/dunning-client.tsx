'use client';

import { useState } from 'react';
import { RefreshCw, Ban, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  past_due:  { label: 'ค้างชำระ', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  unpaid:    { label: 'ไม่ชำระ', color: 'text-red-400 bg-red-500/10 border-red-500/20' },
  canceled:  { label: 'ยกเลิกแล้ว', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' },
  trialing:  { label: 'Trial', color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
};

export function DunningClient({ orgs: initOrgs }: { orgs: any[] }) {
  const [orgs, setOrgs] = useState(initOrgs);
  const [loading, setLoading] = useState<string | null>(null);

  async function retryBilling(orgId: string) {
    setLoading(orgId + '_retry');
    const res = await fetch('/api/admin/billing/retry', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId: orgId }),
    });
    setLoading(null);
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || 'Retry ไม่สำเร็จ'); return; }
    setOrgs(p => p.map(o => o.id === orgId ? { ...o, subscription_status: 'active' } : o));
    toast.success('Retry billing สำเร็จ');
  }

  async function suspendOrg(orgId: string) {
    if (!confirm('ระงับบัญชีนี้?')) return;
    setLoading(orgId + '_suspend');
    const res = await fetch(`/api/admin/orgs/${orgId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription_status: 'canceled' }),
    });
    setLoading(null);
    if (!res.ok) { toast.error('ระงับไม่สำเร็จ'); return; }
    setOrgs(p => p.map(o => o.id === orgId ? { ...o, subscription_status: 'canceled' } : o));
    toast.success('ระงับบัญชีแล้ว');
  }

  const byStatus = {
    past_due: orgs.filter(o => o.subscription_status === 'past_due'),
    unpaid: orgs.filter(o => o.subscription_status === 'unpaid'),
    trialing_expired: orgs.filter(o => o.subscription_status === 'trialing' && new Date(o.trial_ends_at) < new Date()),
    canceled: orgs.filter(o => o.subscription_status === 'canceled'),
  };

  if (orgs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-white/40 gap-3">
        <CheckCircle className="h-10 w-10 text-emerald-500" />
        <p className="text-sm">ทุกบัญชีชำระเงินครบถ้วน</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(byStatus).map(([status, list]) => {
        if (list.length === 0) return null;
        const cfg = STATUS_CFG[status === 'trialing_expired' ? 'trialing' : status];
        return (
          <div key={status} className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h2 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              {cfg?.label || status} ({list.length})
            </h2>
            <div className="space-y-2">
              {list.map(o => (
                <div key={o.id} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{o.name}</p>
                    <p className="text-xs text-white/40">{o.subscription_plan} · {o.id.slice(0, 8)}</p>
                    {status === 'trialing_expired' && (
                      <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" />Trial หมด {new Date(o.trial_ends_at).toLocaleDateString('th-TH')}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {status !== 'canceled' && (
                      <>
                        <button
                          onClick={() => retryBilling(o.id)}
                          disabled={loading === o.id + '_retry'}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50">
                          <RefreshCw className={cn('h-3 w-3', loading === o.id + '_retry' && 'animate-spin')} />Retry
                        </button>
                        <button
                          onClick={() => suspendOrg(o.id)}
                          disabled={loading === o.id + '_suspend'}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-colors disabled:opacity-50">
                          <Ban className="h-3 w-3" />Suspend
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
