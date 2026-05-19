'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn, formatCurrency } from '@/lib/utils';
import { Star, ArrowLeft, Gift, Trophy, TrendingUp, ChevronRight, Zap, Cake, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const TIERS = [
  { id: 'bronze',   label: 'Bronze',   minPoints: 0,     color: '#CD7F32', bg: 'bg-amber-500/10 dark:bg-amber-500/10',   border: 'border-amber-500/25',   text: 'text-amber-700 dark:text-amber-400',   emoji: '🥉' },
  { id: 'silver',   label: 'Silver',   minPoints: 1000,  color: '#A8A9AD', bg: 'bg-gray-400/10 dark:bg-gray-400/10',    border: 'border-gray-400/25',    text: 'text-gray-600 dark:text-gray-300',    emoji: '🥈' },
  { id: 'gold',     label: 'Gold',     minPoints: 3000,  color: '#D4AF37', bg: 'bg-yellow-400/10 dark:bg-yellow-400/10',  border: 'border-yellow-400/25',  text: 'text-yellow-700 dark:text-yellow-400',  emoji: '🥇' },
  { id: 'platinum', label: 'Platinum', minPoints: 10000, color: '#94A3B8', bg: 'bg-slate-400/10 dark:bg-slate-400/10',   border: 'border-slate-400/25',   text: 'text-slate-600 dark:text-slate-300',   emoji: '💎' },
];

const BENEFITS: Record<string, string[]> = {
  bronze:   ['คะแนน 1 แต้มต่อ ฿100', 'ส่วนลด 2% ทุกการจอง'],
  silver:   ['คะแนน 1.5 แต้มต่อ ฿100', 'ส่วนลด 5%', 'เช็คอินก่อนเวลา (ถ้ามีห้องว่าง)'],
  gold:     ['คะแนน 2 แต้มต่อ ฿100', 'ส่วนลด 10%', 'เช็คอินก่อนเวลา', 'ห้อง Upgrade (ถ้ามีห้องว่าง)'],
  platinum: ['คะแนน 3 แต้มต่อ ฿100', 'ส่วนลด 15%', 'เช็คอินก่อนเวลา', 'Late checkout', 'ห้อง Upgrade', 'ยกเว้นค่าธรรมเนียมยกเลิก'],
};

const REDEEM_OPTIONS = [
  { id: 'discount_50',  points: 500,  label: 'ส่วนลด ฿50',       desc: 'ใช้กับการจองครั้งถัดไป' },
  { id: 'discount_150', points: 1000, label: 'ส่วนลด ฿150',      desc: 'ใช้กับการจองครั้งถัดไป' },
  { id: 'discount_400', points: 2000, label: 'ส่วนลด ฿400',      desc: 'ใช้กับการจองครั้งถัดไป' },
  { id: 'free_night',   points: 5000, label: 'ห้องพัก 1 คืนฟรี', desc: 'สำหรับห้องเริ่มต้น (มูลค่าสูงสุด ฿1,500)' },
];

const BIRTHDAY_PERKS: Record<string, { discount: number; bonus: number; gift: string }> = {
  bronze:   { discount: 10, bonus: 200,  gift: 'ของที่ระลึกต้อนรับ' },
  silver:   { discount: 15, bonus: 500,  gift: 'เค้กวันเกิดฟรี' },
  gold:     { discount: 20, bonus: 1000, gift: 'เค้กวันเกิด + ดอกไม้' },
  platinum: { discount: 25, bonus: 2000, gift: 'แพ็กเกจ Celebration ครบชุด' },
};

type LoyaltyData = {
  points: number;
  tier: string;
  totalStays?: number;
  transactions?: Array<{ points: number; description: string; type: string; created_at: string }>;
};

function BirthdaySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = value ? value.split('-') : ['', '', ''];
  const yr = parts[0] || '', mo = parts[1] || '', dy = parts[2] || '';
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
  function update(y: string, m: string, d: string) {
    if (y && m && d) onChange(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`); else onChange('');
  }
  const sel = 'flex-1 px-2 py-2.5 bg-card border border-rose-500/20 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-400/30 focus:border-rose-400/50 appearance-none cursor-pointer';
  return (
    <div className="flex gap-2">
      <select value={dy} onChange={e => update(yr, mo, e.target.value)} className={sel}>
        <option value="">วัน</option>
        {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={String(d)}>{d}</option>)}
      </select>
      <select value={mo} onChange={e => update(yr, e.target.value, dy)} className={cn(sel, 'flex-[2]')}>
        <option value="">เดือน</option>
        {months.map((m,i)=><option key={i+1} value={String(i+1).padStart(2,'0')}>{m}</option>)}
      </select>
      <select value={yr} onChange={e => update(e.target.value, mo, dy)} className={cn(sel, 'flex-[1.5]')}>
        <option value="">ปี (พ.ศ.)</option>
        {years.map(y=><option key={y} value={String(y)}>{y + 543}</option>)}
      </select>
    </div>
  );
}

export default function LoyaltyPortalPage() {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [birthday, setBirthday] = useState('');
  const [birthdaySaved, setBirthdaySaved] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemResult, setRedeemResult] = useState<any>(null);

  useEffect(() => {
    fetch('/api/guest/loyalty')
      .then(async r => r.ok ? r.json() : { points: 0, tier: 'bronze', transactions: [] })
      .then(setData)
      .catch(() => setData({ points: 0, tier: 'bronze', transactions: [] }))
      .finally(() => setLoading(false));
    const saved = localStorage.getItem('maitri_birthday');
    if (saved) setBirthday(saved);
  }, []);

  const points    = data?.points ?? 0;
  const tier      = TIERS.find(t => t.id === (data?.tier || 'bronze')) ?? TIERS[0];
  const nextTier  = TIERS[TIERS.indexOf(tier) + 1] ?? null;
  const progress  = nextTier
    ? Math.min(100, Math.round(((points - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100))
    : 100;
  const toNextTier = nextTier ? Math.max(0, nextTier.minPoints - points) : 0;
  const bPerks = BIRTHDAY_PERKS[tier.id];

  async function redeemPoints(redeemId: string) {
    setRedeemLoading(true);
    try {
      const res = await fetch('/api/guest/loyalty/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ redeemId }),
      });
      const d = await res.json();
      if (!res.ok) { toast.error(d.error || 'เกิดข้อผิดพลาด'); return; }
      setRedeemResult(d);
      setData(p => p ? { ...p, points: d.remainingPoints } : null);
      toast.success('แลกคะแนนสำเร็จ!');
    } finally {
      setRedeemLoading(false);
    }
  }

  function saveBirthday() {
    if (!birthday) return;
    localStorage.setItem('maitri_birthday', birthday);
    setBirthdaySaved(true);
    setTimeout(() => setBirthdaySaved(false), 3000);
  }

  return (
    <>
      <nav className="bg-card border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/portal/account" className="p-2 rounded-full hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium text-foreground">Maitri Rewards</span>
        </div>
      </nav>

      <div className="py-8 space-y-5">

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-32 bg-card rounded-2xl animate-pulse border border-border" />)}
          </div>
        ) : (
          <>
            {/* Points card */}
            <div className="rounded-2xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${tier.color}20, ${tier.color}05)`, border: `1px solid ${tier.color}30` }}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">คะแนนสะสม Maitri Rewards</p>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-foreground">{points.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground mb-1">แต้ม</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                      style={{ backgroundColor: `${tier.color}20`, color: tier.color }}>
                      {tier.emoji} {tier.label}
                    </span>
                    {data?.totalStays ? (
                      <p className="text-xs text-muted-foreground mt-1">{data.totalStays} ครั้งที่เข้าพัก</p>
                    ) : null}
                  </div>
                </div>

                {/* Progress to next tier */}
                {nextTier && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                      <span>ระดับปัจจุบัน: {tier.label}</span>
                      <span>เป้าหมาย: {nextTier.label} ({toNextTier.toLocaleString()} แต้ม)</span>
                    </div>
                    <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${progress}%`, backgroundColor: tier.color }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      อีก <strong className="text-foreground">{toNextTier.toLocaleString()} แต้ม</strong> จะขึ้นระดับ {nextTier.label} {nextTier.emoji}
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
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="h-4 w-4 text-[#C66A30]" />
                <h2 className="font-bold text-foreground">สิทธิประโยชน์ระดับ {tier.label}</h2>
              </div>
              <ul className="space-y-2">
                {(BENEFITS[tier.id] || []).map(b => (
                  <li key={b} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: `${tier.color}20` }}>
                      <Zap className="h-3 w-3" style={{ color: tier.color }} />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
              {nextTier && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">เพิ่มเติมเมื่อขึ้นระดับ {nextTier.label}:</p>
                  <ul className="space-y-1.5">
                    {(BENEFITS[nextTier.id] || []).filter(b => !(BENEFITS[tier.id] || []).includes(b)).map(b => (
                      <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="h-4 w-4 rounded-full border border-dashed border-border flex items-center justify-center shrink-0">
                          <Zap className="h-2.5 w-2.5 text-muted-foreground/40" />
                        </div>
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Redeem Points */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-[#C66A30]" />
                  <h2 className="font-bold text-foreground">แลกคะแนน</h2>
                </div>
                <span className="text-sm font-bold text-[#C66A30]">{points.toLocaleString()} แต้มที่แลกได้</span>
              </div>
              <div className="space-y-2">
                {REDEEM_OPTIONS.map(opt => {
                  const canRedeem = points >= opt.points && !redeemLoading;
                  return (
                    <div key={opt.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${canRedeem ? 'border-border hover:border-[#C66A30]/30' : 'border-border opacity-50'}`}>
                      <div>
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.points.toLocaleString()} แต้ม · {opt.desc}</p>
                      </div>
                      <button
                        disabled={!canRedeem}
                        onClick={() => redeemPoints(opt.id)}
                        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#C66A30] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#A4522A] transition-colors">
                        {redeemLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        แลก
                      </button>
                    </div>
                  );
                })}
              </div>
              {redeemResult && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">แลกคะแนนสำเร็จ!</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-1">รางวัล: {redeemResult.label}</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-0.5">โค้ดส่วนลด: <span className="font-mono font-bold tracking-wider">{redeemResult.couponCode}</span></p>
                  <p className="text-xs text-emerald-600/70 dark:text-emerald-400/60 mt-1">นำโค้ดนี้ไปกรอกเมื่อจองครั้งถัดไป</p>
                </div>
              )}
            </div>

            {/* Birthday perks */}
            <div className="bg-gradient-to-br from-rose-500/6 to-pink-500/4 dark:from-rose-500/8 dark:to-pink-500/6 rounded-2xl border border-rose-500/15 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Cake className="h-4 w-4 text-rose-500" />
                <h2 className="font-bold text-foreground">Birthday Privileges</h2>
                <span className="text-xs bg-rose-500/12 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-medium">ระดับ {tier.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-card rounded-xl p-3 text-center border border-rose-500/12">
                  <p className="text-2xl font-bold text-rose-500">{bPerks.discount}%</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">ส่วนลดในเดือนเกิด</p>
                </div>
                <div className="bg-card rounded-xl p-3 text-center border border-rose-500/12">
                  <p className="text-2xl font-bold text-rose-500">{bPerks.bonus.toLocaleString()}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">แต้มโบนัสพิเศษ</p>
                </div>
                <div className="bg-card rounded-xl p-3 text-center border border-rose-500/12">
                  <p className="text-xs font-bold text-rose-500 leading-tight">{bPerks.gift}</p>
                  <p className="text-2xs text-muted-foreground mt-0.5">ของขวัญพิเศษ</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">วันเกิดของคุณ (เพื่อรับสิทธิพิเศษ)</p>
                <BirthdaySelect value={birthday} onChange={setBirthday} />
                <button
                  onClick={saveBirthday}
                  disabled={!birthday}
                  className="mt-3 w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  {birthdaySaved ? '✓ บันทึกแล้ว' : 'บันทึกวันเกิด'}
                </button>
                {birthday && (
                  <p className="text-2xs text-muted-foreground mt-2">
                    ระบบจะส่งโค้ดส่วนลด {bPerks.discount}% ให้ทางอีเมลก่อนวันเกิด 7 วัน
                  </p>
                )}
              </div>
            </div>

            {/* All tiers overview */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Star className="h-4 w-4 text-[#C66A30]" /> ระดับสมาชิก
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {TIERS.map(t => (
                  <div key={t.id}
                    className={cn(
                      'rounded-xl border p-3 transition-all',
                      tier.id === t.id ? `${t.bg} ${t.border}` : 'border-border',
                    )}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-lg">{t.emoji}</span>
                      <span className={cn('text-sm font-bold', tier.id === t.id ? t.text : 'text-muted-foreground')}>{t.label}</span>
                    </div>
                    <p className={cn('text-xs', tier.id === t.id ? t.text + '/70' : 'text-muted-foreground/60')}>
                      {t.minPoints === 0 ? 'เริ่มต้น' : `${t.minPoints.toLocaleString()} แต้ม`}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Transaction history */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <h2 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#C66A30]" /> ประวัติคะแนน
              </h2>
              {(data?.transactions || []).length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการสะสมคะแนน</p>
                  <Link href="/search"
                    className="inline-flex items-center gap-1 mt-3 text-xs text-[#C66A30] hover:underline">
                    จองที่พักเพื่อเริ่มสะสม <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {data?.transactions?.map((tx, i) => (
                    <div key={`${tx.created_at}-${i}`}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                          tx.points >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
                        )}>
                          <Zap className={cn('h-4 w-4', tx.points >= 0 ? 'text-emerald-600' : 'text-red-500')} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{tx.description || tx.type}</p>
                          <p className="text-xs text-muted-foreground">
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
            <div className="relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600 to-[#C66A30]" />
              <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 h-28 w-28 rounded-full bg-white/10" />
              <div className="absolute bottom-0 left-6 translate-y-4 h-16 w-16 rounded-full bg-white/8" />
              <div className="relative flex items-center justify-between p-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-semibold mb-1">Maitri Rewards</p>
                  <p className="text-white font-bold text-base">สะสมแต้มทุกการจอง</p>
                  <p className="text-white/60 text-xs mt-0.5">รับ 1–3 แต้มต่อ ฿100 ตามระดับสมาชิก</p>
                </div>
                <Link href="/portal/home"
                  className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm text-white rounded-2xl text-sm font-bold transition-all">
                  จองเลย
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
