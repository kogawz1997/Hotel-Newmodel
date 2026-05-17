'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Users, Star, Crown, Medal, Award, Search, TrendingUp, AlertTriangle, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TIER_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  bronze: { icon: Medal, color: 'text-amber-600 bg-amber-600/10', label: 'Bronze' },
  silver: { icon: Award, color: 'text-zinc-300 bg-zinc-300/10', label: 'Silver' },
  gold: { icon: Star, color: 'text-yellow-400 bg-yellow-400/10', label: 'Gold' },
  platinum: { icon: Crown, color: 'text-violet-400 bg-violet-400/10', label: 'Platinum' },
};

interface ChurnGuest {
  guest_id: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
  total_stays: number;
  days_since_last_stay: number;
  churn_risk_score: number;
  recommended_action: string;
}

export function CrmClient({ guests, segmentCounts, loyalty, hotelId }: { guests: any[]; segmentCounts: any; loyalty: any[]; hotelId?: string }) {
  const [tab, setTab] = useState<'guests'|'loyalty'|'segments'|'at_risk'>('guests');
  const [q, setQ] = useState('');
  const [churnGuests, setChurnGuests] = useState<ChurnGuest[]>([]);
  const [churnLoading, setChurnLoading] = useState(false);
  const [churnLoaded, setChurnLoaded] = useState(false);

  const fetchChurn = useCallback(async () => {
    if (!hotelId || churnLoaded) return;
    setChurnLoading(true);
    try {
      const res = await fetch(`/api/crm/churn-score?hotel_id=${hotelId}`);
      const data = await res.json();
      setChurnGuests(data.at_risk_guests || []);
      setChurnLoaded(true);
    } catch {
      toast.error('ไม่สามารถโหลดข้อมูลลูกค้าเสี่ยงได้');
    } finally {
      setChurnLoading(false);
    }
  }, [hotelId, churnLoaded]);

  useEffect(() => {
    if (tab === 'at_risk') fetchChurn();
  }, [tab, fetchChurn]);

  const filtered = guests.filter(g => {
    if (!q) return true;
    const name = `${g.first_name || ''} ${g.last_name || ''}`.toLowerCase();
    return name.includes(q.toLowerCase()) || g.email?.toLowerCase().includes(q.toLowerCase());
  });

  const totalPoints = loyalty.reduce((s, l) => s + Number(l.loyalty_points || 0), 0);
  const totalSpent = loyalty.reduce((s, l) => s + Number(l.total_spent || 0), 0);

  const TABS = [
    { id: 'guests', label: 'Guest 360', icon: Users },
    { id: 'loyalty', label: 'Loyalty', icon: Star },
    { id: 'segments', label: 'Segments', icon: TrendingUp },
  ] as const;

  return (
    <div className="p-4 md:p-6 space-y-6 text-white">
      <div>
        <h1 className="text-xl font-bold">Advanced CRM</h1>
        <p className="text-white/50 text-sm mt-1">{guests.length} guests • ฿{totalSpent.toLocaleString()} total lifetime spend</p>
      </div>

      <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors', tab === t.id ? 'bg-violet-600 text-white' : 'text-white/50 hover:text-white')}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Guest 360 */}
      {tab === 'guests' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search guests…"
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/8 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-violet-500/50" />
          </div>
          <div className="bg-white/5 border border-white/8 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-white/8">
                {['Guest','Email','Tier','Stays','Spend','Points'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/30 uppercase tracking-wider">{h}</th>)}
              </tr></thead>
              <tbody>
                {filtered.map((g, i) => {
                  const tier = TIER_CONFIG[g.loyalty_tier] || null;
                  const TierIcon = tier?.icon;
                  return (
                    <tr key={g.id} className={cn('border-b border-white/5 hover:bg-white/5 cursor-pointer', i === filtered.length-1 && 'border-0')}>
                      <td className="px-4 py-3">
                        <div className="font-medium">{g.first_name} {g.last_name}</div>
                        {g.nationality && <div className="text-xs text-white/30">{g.nationality}</div>}
                      </td>
                      <td className="px-4 py-3 text-white/50 text-xs">{g.email || '—'}</td>
                      <td className="px-4 py-3">
                        {tier && TierIcon ? (
                          <span className={cn('flex items-center gap-1.5 text-xs font-medium w-fit px-2 py-0.5 rounded-full', tier.color)}>
                            <TierIcon className="h-3 w-3" /> {tier.label}
                          </span>
                        ) : <span className="text-white/20 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3 text-white/60">{g.total_stays || 0}</td>
                      <td className="px-4 py-3 text-emerald-400 font-medium">฿{Number(g.total_spent || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-white/50">{Number(g.loyalty_points || 0).toLocaleString()}</td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-white/30">No guests found</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Loyalty */}
      {tab === 'loyalty' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(TIER_CONFIG).map(([tier, cfg]) => {
              const count = segmentCounts[tier] || 0;
              const TierIcon = cfg.icon;
              return (
                <div key={tier} className={cn('rounded-2xl p-4 border border-white/5', cfg.color.includes('text-') ? 'bg-white/5' : 'bg-white/5')}>
                  <div className="flex items-center gap-2 mb-2">
                    <TierIcon className={cn('h-4 w-4', cfg.color.split(' ')[0])} />
                    <span className="text-sm font-semibold">{cfg.label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                  <p className="text-xs text-white/40 mt-1">members</p>
                </div>
              );
            })}
          </div>
          <div className="bg-white/5 border border-white/8 rounded-2xl p-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-white/40 text-xs">Total Points Issued</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{totalPoints.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Total Loyalty Spend</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">฿{totalSpent.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Segments */}
      {tab === 'segments' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'VIP Guests', value: segmentCounts.vip, color: 'text-violet-400 bg-violet-400/10', desc: 'Tagged as VIP' },
              { label: 'Repeat Guests', value: guests.filter(g => (g.total_stays || 0) > 1).length, color: 'text-emerald-400 bg-emerald-400/10', desc: '2+ stays' },
              { label: 'High Spenders', value: guests.filter(g => (g.total_spent || 0) > 10000).length, color: 'text-amber-400 bg-amber-400/10', desc: '฿10,000+ lifetime' },
              { label: 'New Guests', value: guests.filter(g => (g.total_stays || 0) === 1).length, color: 'text-blue-400 bg-blue-400/10', desc: 'First stay only' },
              { label: 'Loyalty Members', value: loyalty.length, color: 'text-yellow-400 bg-yellow-400/10', desc: 'Any loyalty tier' },
              { label: 'Total Guests', value: guests.length, color: 'text-white/60 bg-white/5', desc: 'All records' },
            ].map(s => (
              <div key={s.label} className={cn('rounded-2xl p-4 border border-white/5', s.color.includes('bg-') ? s.color.split(' ')[1] : 'bg-white/5')}>
                <p className={cn('text-2xl font-bold', s.color.split(' ')[0])}>{s.value}</p>
                <p className="text-sm font-semibold text-white mt-1">{s.label}</p>
                <p className="text-xs text-white/40 mt-0.5">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
