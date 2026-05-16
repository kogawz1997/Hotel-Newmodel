'use client';

import { useState } from 'react';
import { Trash2, CheckCircle, XCircle, Loader2, Globe } from 'lucide-react';

interface DomainRow {
  id: string;
  domain: string;
  verified: boolean;
  ssl_active: boolean;
  created_at: string;
}

interface Props {
  initialDomains: DomainRow[];
  hotelSlug: string;
  appUrl: string;
}

export function CustomDomainsClient({ initialDomains, hotelSlug, appUrl }: Props) {
  const [domains, setDomains] = useState<DomainRow[]>(initialDomains);
  const [input, setInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState<string | null>(null);

  async function addDomain() {
    if (!input.trim()) return;
    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/settings/custom-domains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: input.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Failed to add domain'); return; }
      setDomains(prev => [data.domain, ...prev]);
      setInput('');
    } catch {
      setError('Network error');
    } finally {
      setAdding(false);
    }
  }

  async function deleteDomain(id: string) {
    if (!confirm('ลบโดเมนนี้?')) return;
    const res = await fetch(`/api/settings/custom-domains?id=${id}`, { method: 'DELETE' });
    if (res.ok) setDomains(prev => prev.filter(d => d.id !== id));
  }

  async function verifyDomain(domain: DomainRow) {
    setVerifying(domain.id);
    try {
      // Simple DNS verification: attempt HEAD request via the domain rewrite path
      // In production, a server-side CNAME check would be done here
      // For now we mark as verified manually (server would check DNS CNAME)
      const res = await fetch(`/api/settings/custom-domains/verify?id=${domain.id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.verified) {
        setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, verified: true } : d));
      } else {
        setError(data.error || 'DNS not yet propagated. Try again in a few minutes.');
      }
    } catch {
      setError('Verification failed. Check DNS settings.');
    } finally {
      setVerifying(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addDomain()}
          placeholder="book.yourhotel.com"
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          disabled={adding}
        />
        <button
          onClick={addDomain}
          disabled={adding || !input.trim()}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-sky-700"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'เพิ่ม'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {domains.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">
          <Globe className="h-8 w-8 mx-auto mb-2 opacity-30" />
          ยังไม่มีโดเมน — เพิ่มโดเมนแรกด้านบน
        </div>
      ) : (
        <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
          {domains.map(d => (
            <div key={d.id} className="flex items-center gap-3 px-4 py-3 bg-white">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{d.domain}</p>
                {d.verified ? (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle className="h-3 w-3" /> Verified{d.ssl_active ? ' · SSL active' : ''}
                  </p>
                ) : (
                  <p className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                    <XCircle className="h-3 w-3" /> รอการยืนยัน DNS
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!d.verified && (
                  <button
                    onClick={() => verifyDomain(d)}
                    disabled={verifying === d.id}
                    className="rounded-md border border-sky-200 px-2 py-1 text-xs text-sky-700 hover:bg-sky-50 disabled:opacity-50"
                  >
                    {verifying === d.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Verify'}
                  </button>
                )}
                {d.verified && (
                  <a
                    href={`https://${d.domain}/h/${hotelSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    เปิด
                  </a>
                )}
                <button
                  onClick={() => deleteDomain(d.id)}
                  className="rounded-md p-1 text-slate-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-400">
        หลังเพิ่มโดเมน ลูกค้าจะสามารถเปิด <code>{`https://[domain]/h/${hotelSlug}`}</code> เพื่อดูหน้าจองห้องพัก
      </p>
    </div>
  );
}
