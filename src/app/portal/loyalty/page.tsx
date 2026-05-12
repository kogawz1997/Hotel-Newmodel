'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn, formatCurrency } from '@/lib/utils';
import { Star, ArrowLeft, Gift, Trophy, TrendingUp, ChevronRight, Zap } from 'lucide-react';
import { PortalBottomNav } from '@/components/portal/PortalBottomNav';

const TIERS = [
  { id: 'bronze',   label: 'Bronze',   minPoints: 0,     color: '#CD7F32', bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   emoji: '🥉' },
  { id: 'silver',   label: 'Silver',   minPoints: 1000,  color: '#A8A9AD', bg: 'bg-gray-50',    border: 'border-gray-200',    text: 'text-gray-600',    emoji: '🥈' },
  { id: 'gold',     label: 'Gold',     minPoints: 3000,  color: '#D4AF37', bg: 'bg-yellow-50',  border: 'border-yellow-200',  text: 'text-yellow-700',  emoji: '🥇' },
  { id: 'platinum', label: 'Platinum', minPoints: 10000, color: '#E5E4E2', bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-600',   emoji: '💎' },
];

const BENEFITS: Record<string, string[]> = {
  bronze:   ['คะแนน 1 แต้มต่อ ฿100', 'ส่วนลด 2% ทุกการจอง'],
  silver:   ['คะแนน 1.5 แต้มต่อ ฿100', 'ส่วนลด 5%', 'เช็คอินก่อนเวลา (ถ้ามีห้องว่าง)'],
  gold:     ['คะแนน 2 แต้มต่อ ฿100', 'ส่วนลด 10%', 'เช็คอินก่อนเวลา', 'ห้อง Upgrade (ถ้ามีห้องว่าง)'],
  platinum: ['คะแนน 3 แต้มต่อ ฿100', 'ส่วนลด 15%', 'เช็คอินก่อนเวลา', 'Late checkout', 'ห้อง Upgrade', 'ยกเว้นค่าธรรมเนียมยกเลิก'],
};

type LoyaltyData = {
  points: number;
  tier: string;
  totalStays?: number;
  transactions?: Array<{ points: number; description: string; type: string; created_at: string }>;
};

export default function LoyaltyPortalPage() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/guest/loyalty')
      .then(async r => r.ok ? r.json() : { points: 0, tier: 'bronze', transactions: [] })
      .then(setData)
      .catch(() => setData({ points: 0, tier: 'bronze', transactions: [] }))
      .finally(() => setLoading(false));
  }, []);

  const points    = data?.points ?? 0;
  const tier      = TIERS.find(t => t.id === (data?.tier || 'bronze')) ?? TIERS[0];
  const nextTier  = TIERS[TIERS.indexOf(tier) + 1] ?? null;
  const progress  = nextTier
    ? Math.min(100, Math.round(((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100))
    : 100;
  const toNextTier = nextTier ? Math.max(0, nextTier.minPoints - points) : 0;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <nav className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/portal/bookings" className="p-2 rounded-full hover:bg-black/5">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium text-[#2A2522]">Maitri Rewards</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-28 space-y-5">

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-black/5" />)}
          </div>
        ) : (
          <>
            {/* Points card */}
            <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${tier.color}20, ${tier.color}05)`, border: `1px solid ${tier.color}30` }}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-[#2A2522]/50 uppercase tracking-wider mb-1">คะแนนสะสม Maitri Rewards</p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-[#2A2522]">{points.toLocaleString()}</span>
                      <span className="text-sm text-[#2A2522]/40 mb-1">แต้ม</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                      style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>
                      {tier.emoji} {tier.label}
                    </span>
                    {data?.totalStays ? (
                      <p className="text-xs text-[#2A2522]/40 mt-1">{data.totalStays} ครั้งที่เข้าพัก</p>
                    ) : null}
                  </div>
                </div>

                {/* Progress to next tier */}
                {nextTier && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#2A2522]/50 mb-1.5">
                      <span>ระดับปัจจุบัน: {tier.label}</span>
                      <span>เป้าหมาย: {nextTier.label} ({toNextTier.toLocaleString()} แต้ม)</span>
                    </div>
                    <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${progress}%`, backgroundColor: tier.color }}
                      />
                    </div>
                    <p className="text-xs text-[#2A2522]/40 mt-1.5">
                      อีก <strong className="text-[#2A2522]">{toNextTier.toLocaleString()} แต้ม</strong> จะขึ้นระดับ {nextTier.label} {nextTier.emoji}
                    </p>
                  </div>
                )}
                {!nextTier && (
                  <p className="text-xs font-semibold" style={{ color: tier.color }}>
                    {tier.emoji} คุณอยู่ในระดับสูงสุดแล้ว!
                  </p>
                )}
              </div>
            </div>

            {/* Benefits */}
            <div className="bg-white rounded-2xl border border-black/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-[#C66A30]" />
                <h2 className="font-bold text-[#2A2522]">สิทธิประโยชน์ระดับ {tier.label}</h2>
              </div>
              <ul className="space-y-2">
                {(BENEFITS[tier.id] || []).map(b => (
                  <li key={b} className="flex items-center gap-2.5 text-sm text-[#2A2522]/70">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${tier.color}20` }}>
                      <Zap className="h-3 w-3" style={{ color: tier.color }} />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
              {nextTier && (
                <div className="mt-4 pt-4 border-t border-black/5">
                  <p className="text-xs text-[#2A2522]/40 mb-2">เพิ่มเติมเมื่อขึ้นระดับ {nextTier.label}:</p>
                  <ul className="space-y-1.5">
                    {(BENEFITS[nextTier.id] || []).filter(b => !(BENEFITS[tier.id] || []).includes(b)).map(b => (
                      <li key={b} className="flex items-center gap-2 text-xs text-[#2A2522]/40">
                        <div className="h-4 w-4 rounded-full border border-dashed border-black/15 flex items-center justify-center shrink-0">
                          <Zap className="h-2.5 w-2.5 text-[#2A2522]/20" />
                        </div>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* All tiers overview */}
            <div className="bg-white rounded-2xl border border-black/5 p-5">
              <h2 className="font-bold text-[#2A2522] mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-[#C66A30]" /> ระดับสมาชิก
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {TIERS.map(t => (
                  <div key={t.id}
                    className={cn(
                      'rounded-xl border p-3 transition-all',
                      tier.id === t.id ? `${t.bg} ${t.border}` : 'border-black/5',
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-lg">{t.emoji}</span>
                      <span className={cn('text-sm font-bold', tier.id === t.id ? t.text : 'text-[#2A2522]/50')}>{t.label}</span>
                    </div>
                    <p className={cn('text-xs', tier.id === t.id ? t.text + '/70' : 'text-[#2A2522]/30')}>
                      {t.minPoints === 0 ? 'เริ่มต้น' : `${t.minPoints.toLocaleString()} แต้ม`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction history */}
            <div className="bg-white rounded-2xl border border-black/5 p-5">
              <h2 className="font-bold text-[#2A2522] mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#C66A30]" /> ประวัติคะแนน
              </h2>
              {(data?.transactions || []).length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="h-8 w-8 text-[#2A2522]/20 mx-auto mb-2" />
                  <p className="text-sm text-[#2A2522]/40">ยังไม่มีประวัติการสะสมคะแนน</p>
                  <Link href="/search"
                    className="inline-flex items-center gap-1 mt-3 text-xs text-[#C66A30] hover:underline">
                    จองที่พักเพื่อเริ่มสะสม <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.transactions?.map((tx, i) => (
                    <div key={`${tx.created_at}-${i}`}
                      className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                          tx.points >= 0 ? 'bg-emerald-50' : 'bg-red-50',
                        )}>
                          <Zap className={cn('h-4 w-4', tx.points >= 0 ? 'text-emerald-600' : 'text-red-500')} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#2A2522]">{tx.description || tx.type}</p>
                          <p className="text-xs text-[#2A2522]/40">
                            {new Date(tx.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <span className={cn('text-sm font-bold', tx.points >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                        {tx.points >= 0 ? '+' : ''}{tx.points.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Earn more CTA */}
            <div className="bg-[#2A2522] rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-white font-bold mb-1">สะสมคะแนนเพิ่ม</p>
                <p className="text-white/50 text-xs">จองที่พักผ่าน Maitri รับคะแนนทุกครั้ง</p>
              </div>
              <Link href="/search"
                className="px-4 py-2.5 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-xl text-sm font-bold transition-colors shrink-0">
                ค้นหาที่พัก
              </Link>
            </div>
          </>
        )}
      </div>
      <PortalBottomNav />
    </div>
  );
}
