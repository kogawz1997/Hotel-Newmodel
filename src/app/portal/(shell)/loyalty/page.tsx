'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Star, ArrowLeft, Gift, Trophy, TrendingUp, ChevronRight,
  Zap, Cake, Loader2, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'bronze',   label: 'Bronze',   minPoints: 0,
    from: 'from-amber-500',  to: 'to-orange-600',
    bar: 'bg-amber-500',     ring: 'ring-amber-500/40',
    bg: 'bg-amber-500/10',   border: 'border-amber-500/25',
    text: 'text-amber-700 dark:text-amber-400',
    iconBg: 'bg-amber-500/15', emoji: '🥉',
  },
  {
    id: 'silver',   label: 'Silver',   minPoints: 1000,
    from: 'from-slate-400',  to: 'to-slate-500',
    bar: 'bg-slate-400',     ring: 'ring-slate-400/40',
    bg: 'bg-slate-400/10',   border: 'border-slate-400/25',
    text: 'text-slate-600 dark:text-slate-300',
    iconBg: 'bg-slate-400/15', emoji: '🥈',
  },
  {
    id: 'gold',     label: 'Gold',     minPoints: 3000,
    from: 'from-yellow-400', to: 'to-amber-500',
    bar: 'bg-yellow-500',    ring: 'ring-yellow-400/40',
    bg: 'bg-yellow-400/10',  border: 'border-yellow-400/25',
    text: 'text-yellow-700 dark:text-yellow-400',
    iconBg: 'bg-yellow-400/15', emoji: '🥇',
  },
  {
    id: 'platinum', label: 'Platinum', minPoints: 10000,
    from: 'from-sky-400',    to: 'to-indigo-500',
    bar: 'bg-sky-400',       ring: 'ring-sky-400/40',
    bg: 'bg-sky-400/10',     border: 'border-sky-400/25',
    text: 'text-sky-600 dark:text-sky-300',
    iconBg: 'bg-sky-400/15', emoji: '💎',
  },
];

const BENEFITS: Record<string, string[]> = {
  bronze:   ['1 แต้มต่อ ฿100 ที่ใช้จ่าย', 'ส่วนลด 2% ทุกการจอง'],
  silver:   ['1.5 แต้มต่อ ฿100', 'ส่วนลด 5%', 'เช็คอินก่อนเวลา (ตามห้องว่าง)'],
  gold:     ['2 แต้มต่อ ฿100', 'ส่วนลด 10%', 'เช็คอินก่อนเวลา', 'อัปเกรดห้อง (ตามห้องว่าง)'],
  platinum: ['3 แต้มต่อ ฿100', 'ส่วนลด 15%', 'เช็คอินก่อนเวลา', 'Late checkout', 'อัปเกรดห้อง', 'ยกเว้นค่าธรรมเนียมยกเลิก'],
};

const REDEEM_OPTIONS = [
  { id: 'discount_50',  points: 500,  label: 'ส่วนลด ฿50',       desc: 'ใช้กับการจองครั้งถัดไป',                   icon: '🎟️' },
  { id: 'discount_150', points: 1000, label: 'ส่วนลด ฿150',      desc: 'ใช้กับการจองครั้งถัดไป',                   icon: '🎫' },
  { id: 'discount_400', points: 2000, label: 'ส่วนลด ฿400',      desc: 'ใช้กับการจองครั้งถัดไป',                   icon: '💳' },
  { id: 'free_night',   points: 5000, label: 'ห้องพัก 1 คืนฟรี', desc: 'สำหรับห้องเริ่มต้น (สูงสุด ฿1,500)',       icon: '🏨' },
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

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const v = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.38, ease } }),
};

// ─── Birthday selector ────────────────────────────────────────────────────────

function BirthdaySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = value ? value.split('-') : ['', '', ''];
  const [yr, mo, dy] = [parts[0] || '', parts[1] || '', parts[2] || ''];
  const months = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 80 }, (_, i) => currentYear - i);
  function update(y: string, m: string, d: string) {
    if (y && m && d) onChange(`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`);
    else onChange('');
  }
  const sel = 'flex-1 px-2 py-2.5 bg-card border border-rose-500/20 rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-rose-400/30 appearance-none cursor-pointer';
  return (
    <div className="flex gap-2">
      <select value={dy} onChange={e => update(yr, mo, e.target.value)} className={sel}>
        <option value="">วัน</option>
        {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={String(d)}>{d}</option>)}
      </select>
      <select value={mo} onChange={e => update(yr, e.target.value, dy)} className={cn(sel,'flex-[2]')}>
        <option value="">เดือน</option>
        {months.map((m,i)=><option key={i+1} value={String(i+1).padStart(2,'0')}>{m}</option>)}
      </select>
      <select value={yr} onChange={e => update(e.target.value, mo, dy)} className={cn(sel,'flex-[1.5]')}>
        <option value="">ปี (พ.ศ.)</option>
        {years.map(y=><option key={y} value={String(y)}>{y+543}</option>)}
      </select>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  const points   = data?.points ?? 0;
  const tierObj  = TIERS.find(t => t.id === (data?.tier || 'bronze')) ?? TIERS[0];
  const tierIdx  = TIERS.indexOf(tierObj);
  const nextTier = TIERS[tierIdx + 1] ?? null;
  const progress = nextTier
    ? Math.min(100, Math.round(((points - tierObj.minPoints) / (nextTier.minPoints - tierObj.minPoints)) * 100))
    : 100;
  const toNext   = nextTier ? Math.max(0, nextTier.minPoints - points) : 0;
  const bPerks   = BIRTHDAY_PERKS[tierObj.id];

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
    } finally { setRedeemLoading(false); }
  }

  function saveBirthday() {
    if (!birthday) return;
    localStorage.setItem('maitri_birthday', birthday);
    setBirthdaySaved(true);
    setTimeout(() => setBirthdaySaved(false), 3000);
    toast.success('บันทึกวันเกิดแล้ว');
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto lg:max-w-2xl">
          <Link href="/portal/account">
            <motion.div whileTap={{ scale: 0.9 }}
              className="h-9 w-9 rounded-xl bg-secondary border border-border/40 flex items-center justify-center shrink-0">
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </motion.div>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground tracking-tight flex-1">Maitri Rewards</h1>
          <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
      </div>

      <div className="px-4 pt-5 pb-10 max-w-screen-sm mx-auto lg:max-w-2xl space-y-5">

        {loading ? (
          <div className="space-y-4 pt-4">
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-card rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Hero points card ── */}
            <motion.div custom={0} variants={v} initial="hidden" animate="show">
              <div className={cn('relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br shadow-xl', tierObj.from, tierObj.to)}>
                {/* Decorative circles */}
                <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
                <div className="absolute bottom-0 -left-4 translate-y-6 h-20 w-20 rounded-full bg-white/8" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-[9px] uppercase tracking-[0.3em] text-white/60 font-semibold mb-2">Maitri Rewards</p>
                      <div className="flex items-end gap-2">
                        <motion.span
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
                          className="font-display text-5xl font-bold text-white leading-none">
                          {points.toLocaleString()}
                        </motion.span>
                        <span className="text-sm text-white/60 pb-1">แต้ม</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-4xl block">{tierObj.emoji}</span>
                      <span className="text-xs font-bold text-white/90 mt-1 block">{tierObj.label}</span>
                      {data?.totalStays ? (
                        <span className="text-[10px] text-white/50 block mt-0.5">{data.totalStays} ครั้ง</span>
                      ) : null}
                    </div>
                  </div>

                  {/* Progress bar */}
                  {nextTier ? (
                    <div>
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 1, ease: [0.25,0.46,0.45,0.94], delay: 0.35 }}
                          className="h-full bg-white/80 rounded-full"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-white/55">
                        <span>{tierObj.label}</span>
                        <span>อีก {toNext.toLocaleString()} แต้ม → {nextTier.label}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-white/80">💎 สมาชิกระดับสูงสุด · Platinum Elite</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* ── Tier Journey (Trip.com style) ── */}
            <motion.div custom={1} variants={v} initial="hidden" animate="show">
              <div className="rounded-2xl bg-card border border-border/60 shadow-sm p-5">
                <h2 className="font-display font-bold text-foreground text-sm mb-5 flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" /> เส้นทางสมาชิก
                </h2>

                {/* Tier circles with connecting lines */}
                <div className="flex items-start">
                  {TIERS.map((t, i) => {
                    const achieved = tierIdx >= i;
                    const isCurrent = tierIdx === i;
                    return (
                      <div key={t.id} className="flex items-start flex-1">
                        {/* Circle + label */}
                        <div className="flex flex-col items-center gap-1.5 flex-1">
                          <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1 + i * 0.08, duration: 0.4, type: 'spring', stiffness: 250 }}
                            className={cn(
                              'h-11 w-11 rounded-full flex items-center justify-center text-lg border-2 transition-all',
                              achieved
                                ? `bg-gradient-to-br ${t.from} ${t.to} border-transparent shadow-md`
                                : 'bg-secondary border-border',
                              isCurrent && `ring-2 ring-offset-2 ring-offset-card ${t.ring}`,
                            )}>
                            {achieved ? (
                              <span>{t.emoji}</span>
                            ) : (
                              <span className="text-muted-foreground/30 text-base">○</span>
                            )}
                          </motion.div>
                          <span className={cn(
                            'text-[10px] font-bold text-center leading-none',
                            isCurrent ? t.text : achieved ? 'text-muted-foreground' : 'text-muted-foreground/40',
                          )}>
                            {t.label}
                          </span>
                          <span className={cn(
                            'text-[9px] text-center leading-none',
                            achieved ? 'text-muted-foreground/60' : 'text-muted-foreground/30',
                          )}>
                            {t.minPoints === 0 ? 'เริ่มต้น' : `${t.minPoints.toLocaleString()}`}
                          </span>
                        </div>

                        {/* Connector line (between circles) */}
                        {i < TIERS.length - 1 && (
                          <div className="flex-none w-8 mt-5 px-1">
                            <div className="relative h-0.5 bg-border rounded-full overflow-hidden">
                              {achieved && tierIdx > i && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: '100%' }}
                                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5, ease }}
                                  className={cn('absolute inset-y-0 left-0 bg-gradient-to-r', t.from, t.to)}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Current tier label */}
                <div className={cn(
                  'mt-4 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2',
                  tierObj.bg, tierObj.text,
                )}>
                  <Zap className="h-3.5 w-3.5 shrink-0" />
                  {nextTier
                    ? `สะสมอีก ${toNext.toLocaleString()} แต้ม เพื่อขึ้นระดับ ${nextTier.label} ${nextTier.emoji}`
                    : `${tierObj.emoji} คุณอยู่ในระดับสูงสุดของ Maitri Rewards แล้ว!`
                  }
                </div>
              </div>
            </motion.div>

            {/* ── Benefits ── */}
            <motion.div custom={2} variants={v} initial="hidden" animate="show">
              <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <h2 className="font-display font-bold text-foreground text-sm">สิทธิประโยชน์ระดับ {tierObj.label}</h2>
                </div>
                <ul className="space-y-2.5">
                  {(BENEFITS[tierObj.id] || []).map(b => (
                    <li key={b} className="flex items-center gap-2.5 text-sm text-foreground/80">
                      <div className={cn('h-5 w-5 rounded-full flex items-center justify-center shrink-0', tierObj.iconBg)}>
                        <Zap className={cn('h-3 w-3', tierObj.text)} />
                      </div>
                      {b}
                    </li>
                  ))}
                </ul>
                {nextTier && (
                  <div className="mt-4 pt-4 border-t border-border/40">
                    <p className="text-xs text-muted-foreground mb-2.5 font-medium">
                      เพิ่มเติมเมื่อขึ้นระดับ {nextTier.label} {nextTier.emoji}:
                    </p>
                    <ul className="space-y-2">
                      {(BENEFITS[nextTier.id] || [])
                        .filter(b => !(BENEFITS[tierObj.id] || []).includes(b))
                        .map(b => (
                          <li key={b} className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="h-4 w-4 rounded-full border border-dashed border-border/60 flex items-center justify-center shrink-0">
                              <Zap className="h-2.5 w-2.5 opacity-30" />
                            </div>
                            {b}
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Redeem Points ── */}
            <motion.div custom={3} variants={v} initial="hidden" animate="show">
              <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <h2 className="font-display font-bold text-foreground text-sm">แลกคะแนน</h2>
                  </div>
                  <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', tierObj.bg, tierObj.text)}>
                    {points.toLocaleString()} แต้ม
                  </span>
                </div>
                <div className="space-y-2">
                  {REDEEM_OPTIONS.map(opt => {
                    const canRedeem = points >= opt.points && !redeemLoading;
                    return (
                      <motion.div
                        key={opt.id}
                        whileTap={canRedeem ? { scale: 0.985 } : undefined}
                        className={cn(
                          'flex items-center gap-3 p-3.5 rounded-xl border transition-all',
                          canRedeem
                            ? 'border-border/60 hover:border-blue-500/30 hover:bg-blue-500/4 cursor-pointer'
                            : 'border-border/30 opacity-45',
                        )}>
                        <span className="text-2xl shrink-0">{opt.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {opt.points.toLocaleString()} แต้ม · {opt.desc}
                          </p>
                        </div>
                        <button
                          disabled={!canRedeem}
                          onClick={() => redeemPoints(opt.id)}
                          className={cn(
                            'flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-bold transition-all shrink-0',
                            canRedeem
                              ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm shadow-blue-600/20 hover:opacity-90'
                              : 'bg-secondary text-muted-foreground cursor-not-allowed',
                          )}>
                          {redeemLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                          แลก
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {redeemResult && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden">
                      <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">✅ แลกคะแนนสำเร็จ!</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-1">รางวัล: {redeemResult.label}</p>
                        <p className="text-xs text-emerald-600 dark:text-emerald-400/80 mt-0.5">
                          โค้ดส่วนลด:{' '}
                          <span className="font-mono font-bold tracking-wider">{redeemResult.couponCode}</span>
                        </p>
                        <p className="text-xs text-emerald-600/60 dark:text-emerald-400/50 mt-1">
                          นำโค้ดนี้ไปกรอกเมื่อจองครั้งถัดไป
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* ── Birthday Perks ── */}
            <motion.div custom={4} variants={v} initial="hidden" animate="show">
              <div className="bg-gradient-to-br from-rose-500/6 to-pink-500/4 dark:from-rose-500/10 dark:to-pink-500/6 rounded-2xl border border-rose-500/15 p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Cake className="h-4 w-4 text-rose-500" />
                  <h2 className="font-display font-bold text-foreground text-sm">Birthday Privileges</h2>
                  <span className="text-[10px] bg-rose-500/12 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full font-semibold">
                    {tierObj.label}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 mb-4">
                  {[
                    { label: 'ส่วนลดในเดือนเกิด', value: `${bPerks.discount}%`, color: 'text-rose-500' },
                    { label: 'แต้มโบนัสพิเศษ',    value: bPerks.bonus.toLocaleString(), color: 'text-rose-500' },
                    { label: 'ของขวัญพิเศษ',       value: bPerks.gift, color: 'text-rose-500', small: true },
                  ].map(item => (
                    <div key={item.label} className="bg-card rounded-xl p-3 text-center border border-rose-500/12">
                      <p className={cn('font-bold leading-tight', item.color, item.small ? 'text-xs' : 'text-2xl')}>
                        {item.value}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{item.label}</p>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground mb-2 font-medium">วันเกิดของคุณ (เพื่อรับสิทธิพิเศษ)</p>
                <BirthdaySelect value={birthday} onChange={setBirthday} />
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={saveBirthday}
                  disabled={!birthday}
                  className="mt-3 w-full py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors shadow-sm shadow-rose-600/20">
                  {birthdaySaved ? '✓ บันทึกแล้ว' : 'บันทึกวันเกิด'}
                </motion.button>
                {birthday && (
                  <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
                    ระบบจะส่งโค้ดส่วนลด {bPerks.discount}% ก่อนวันเกิด 7 วัน
                  </p>
                )}
              </div>
            </motion.div>

            {/* ── Transaction history ── */}
            <motion.div custom={5} variants={v} initial="hidden" animate="show">
              <div className="bg-card rounded-2xl border border-border/60 shadow-sm p-5">
                <h2 className="font-display font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" /> ประวัติคะแนน
                </h2>

                {(data?.transactions || []).length === 0 ? (
                  <div className="text-center py-10">
                    <Gift className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground font-medium">ยังไม่มีประวัติการสะสมคะแนน</p>
                    <Link href="/search"
                      className="inline-flex items-center gap-1 mt-3 text-xs text-amber-700 dark:text-amber-400 font-semibold hover:underline">
                      จองที่พักเพื่อเริ่มสะสม <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-1 -mx-1">
                    {data?.transactions?.map((tx, i) => (
                      <div key={`${tx.created_at}-${i}`}
                        className="flex items-center justify-between px-1 py-2.5 border-b border-border/30 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center shrink-0',
                            tx.points >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10',
                          )}>
                            <Zap className={cn('h-3.5 w-3.5', tx.points >= 0 ? 'text-emerald-600' : 'text-red-500')} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{tx.description || tx.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(tx.created_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' })}
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
            </motion.div>

            {/* ── CTA ── */}
            <motion.div custom={6} variants={v} initial="hidden" animate="show">
              <div className={cn('relative overflow-hidden rounded-3xl bg-gradient-to-br', tierObj.from, tierObj.to)}>
                <div className="absolute -top-6 -right-6 h-28 w-28 rounded-full bg-white/10" />
                <div className="absolute bottom-0 left-4 translate-y-6 h-16 w-16 rounded-full bg-white/8" />
                <div className="relative flex items-center justify-between p-5">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-white/55 font-semibold mb-1">Maitri Rewards</p>
                    <p className="text-white font-bold text-base">สะสมแต้มทุกการจอง</p>
                    <p className="text-white/55 text-xs mt-0.5">รับ 1–3 แต้มต่อ ฿100 ตามระดับสมาชิก</p>
                  </div>
                  <Link href="/search"
                    className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 backdrop-blur-sm text-white rounded-2xl text-sm font-bold transition-all">
                    จองเลย
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
