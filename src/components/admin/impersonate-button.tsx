'use client';

import { useState } from 'react';
import { UserCog, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ImpersonateButton({ orgId, orgName }: { orgId: string; orgName: string }) {
  const [loading, setLoading] = useState(false);

  async function impersonate() {
    const reason = window.prompt(`เหตุผลในการ Impersonate "${orgName}":`, 'support');
    if (!reason) return;
    setLoading(true);
    const res = await fetch(`/api/admin/orgs/${orgId}/impersonate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { toast.error(data.error || 'Impersonation failed'); return; }
    toast.success(`Impersonation session started (15 min)`, { description: `Session ID: ${data.session?.id || '?'}` });
    window.open(`/dashboard?impersonate=${data.session?.id}&org=${orgId}`, '_blank');
  }

  return (
    <button
      onClick={impersonate} disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm disabled:opacity-50"
      aria-label={`Impersonate ${orgName}`}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCog className="h-4 w-4" />}
      Impersonate
    </button>
  );
}
