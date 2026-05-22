'use client';

import { useEffect, useState, useId } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, Gift, ChevronRight, Loader2, Check,
  BellRing, HelpCircle,
} from 'lucide-react';

/* ── Tier config ── */
const TIERS = [
  { id: 'bronze',   label: 'บัตรสีน้ำตาล',  labelEn: 'Bronze',   minPoints: 0,
    hex: { from: '#f59e0b', to: '#ea580c' }, coin: '🥉', textCls: 'text-amber-600',  spendGoal: 100  },
  { id: 'silver',   label: 'บัตรสีเงิน',     labelEn: 'Silver',   minPoints: 1000,
    hex: { from: '#94a3b8', to: '#64748b' }, coin: '🥈', textCls: 'text-slate-500',  spendGoal: 360  },
  { id: 'gold',     label: 'บัตรทอง',        labelEn: 'Gold',     minPoints: 3000,
    hex: { from: '#facc15', to: '#f59e0b' }, coin: '🥇', textCls: 'text-yellow-600', spendGoal: 1000 },
  { id: 'platinum', label: 'บัตรแพลทินัม',  labelEn: 'Platinum', minPoints: 10000,
    hex: { from: '#38bdf8', to: '#6366f1' }, coin: '💎', textCls: 'text-sky-500',    spendGoal: 3000 },
  { id: 'diamond',  label: 'บัตรไดมอนด์',   labelEn: 'Diamond',  minPoints: 30000,
    hex: { from: '#a78bfa', to: '#7c3aed' }, coin: '✨', textCls: 'text-violet-500', spendGoal: null },
];

const BENEFITS: Record<string, { icon: string; title: string; desc: string }[]> = {
  bronze:   [
    { icon: '🪙', title: 'รับ Maitri Coins เพิ่ม 5%',        desc: 'ยอดคงเหลือ Maitri Coins: 0 (≈฿ 0)' },
    { icon: '🎁', title: 'ส่วนลด 2% ทุกการจอง',               desc: 'ส่วนลดที่พักสำหรับสมาชิก Bronze' },
  ],
  silver:   [
    { icon: '🪙', title: 'รับ Maitri Coins เพิ่ม 20%',        desc: 'ยอดคงเหลือ Maitri Coins: 0 (≈฿ 0)' },
    { icon: '🎁', title: 'ส่วนลด 5% ทุกการจอง',               desc: 'ส่วนลดพิเศษสำหรับสมาชิก Silver' },
    { icon: '⏰', title: 'เช็คอินก่อนเวลา',                    desc: 'เหลือ 0 จากทั้งหมด 1' },
  ],
  gold:     [
    { icon: '🪙', title: 'รับ Maitri Coins เพิ่ม 50%',        desc: 'ยอดคงเหลือ Maitri Coins: 0 (≈฿ 0)' },
    { icon: '🛋️', title: 'สิทธิ์เข้าใช้ห้องรับรอง VIP ฟรี',  desc: 'เหลือ 0 จากทั้งหมด 1' },
    { icon: '📶', title: 'แพ็กเกจ eSIM เน็ตทั่วโลกฟรี',       desc: 'เหลือ 0 จากทั้งหมด 1' },
    { icon: '🎂', title: 'ส่วนลดวันเกิด 20%',                  desc: 'สิทธิพิเศษในเดือนวันเกิด' },
  ],
  platinum: [
    { icon: '🪙', title: 'รับ Maitri Coins เพิ่ม 50%',        desc: 'ยอดคงเหลือ Maitri Coins: 0 (≈฿ 0)' },
    { icon: '🛋️', title: 'สิทธิ์เข้าใช้ห้องรับรอง VIP ฟรี',  desc: 'เหลือ 0 จากทั้งหมด 1' },
    { icon: '📶', title: 'แพ็กเกจ eSIM เน็ตทั่วโลกฟรี',       desc: 'เหลือ 0 จากทั้งหมด 1' },
    { icon: '🎂', title: 'ส่วนลดวันเกิด 25%',                  desc: 'สิทธิพิเศษในเดือนวันเกิด' },
    { icon: '🎁', title: 'ยกเว้นค่าธรรมเนียมยกเลิก',          desc: 'ยกเลิกฟรีทุกการจอง' },
  ],
  diamond:  [
    { icon: '🪙', title: 'รับ Maitri Coins เพิ่ม 100%',       desc: 'ยอดคงเหลือ Maitri Coins: 0 (≈฿ 0)' },
    { icon: '🛋️', title: 'สิทธิ์เข้าใช้ห้องรับรอง VIP ไม่จำกัด', desc: 'ทุกสนามบินในเครือ' },
    { icon: '📶', title: 'แพ็กเกจ eSIM เน็ตทั่วโลกฟรี',       desc: 'เหลือ 0 จากทั้งหมด 3' },
    { icon: '🎂', title: 'ส่วนลดวันเกิด 30%',                  desc: 'สิทธิพิเศษในเดือนวันเกิด' },
    { icon: '✈️', title: 'อัปเกรดห้องอัตโนมัติ',              desc: 'เมื่อห้องว่าง' },
  ],
};

type LoyaltyData = {
  points: number; tier: string; totalStays?: number;
  transactions?: Array<{ points: number; description: string; type: string; created_at: string }>;
};

const ease = [0.25, 0.46, 0.45, 0.94] as const;

/* Shared fade-up variants — custom prop = stagger index */
const v = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.3, ease } }),
};

/* ── Hexagonal badge SVG ── */
function HexBadge({ tier }: { tier: typeof TIERS[number] }) {
  const uid = useId();
  const gradId  = `hg-${uid}`;
  const lightId = `hl-${uid}`;
  return (
    <div className="relative w-20 h-20">
      <svg viewBox="0 0 100 115" className="w-full h-full drop-shadow-xl" fill="none">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor={tier.hex.from} />
            <stop offset="100%" stopColor={tier.hex.to} />
          </linearGradient>
          <linearGradient id={lightId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.35)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <polygon points="50,5 95,27.5 95,87.5 50,110 5,87.5 5,27.5" fill={`url(#${gradId})`} />
        <polygon points="50,5 95,27.5 95,87.5 50,110 5,87.5 5,27.5" fill={`url(#${lightId})`} />
        <polygon points="50,12 88,32 88,83 50,103 12,83 12,32" fill="rgba(255,255,255,0.12)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-black text-white drop-shadow-lg select-none">M</span>
      </div>
    </div>
  );
}

/* Points needed before "simulated spend" amounts make sense */
const SPEND_DISPLAY_SCALE = 35;  // converts tier spendGoal → display currency
const SPEND_PROGRESS_RATE = 0.64; // spend progress as fraction of points progress
const STAY_GOAL = 10;

export default function LoyaltyPortalPage() {
  const [data, setData]   = useState<LoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/guest/loyalty')
      .then(async r => r.ok ? r.json() : { points: 0, tier: 'bronze', transactions: [] })
      .then(setData)
      .catch(() => setData({ points: 0, tier: 'bronze', transactions: [] }))
      .finally(() => setLoading(false));
  }, []);

  const points     = data?.points ?? 0;
  const tierObj    = TIERS.find(t => t.id === (data?.tier || 'bronze')) ?? TIERS[0];
  const tierIdx    = TIERS.indexOf(tierObj);
  const nextTier   = TIERS[tierIdx + 1] ?? null;
  const totalStays = data?.totalStays ?? 0;

  const spendGoal    = nextTier?.spendGoal ? nextTier.spendGoal * SPEND_DISPLAY_SCALE : 0;
  const spendCurrent = Math.min(spendGoal, Math.round((points / (nextTier?.minPoints ?? 1)) * spendGoal * SPEND_PROGRESS_RATE));
  const stayProgress = Math.min(STAY_GOAL, totalStays);

  const benefits = BENEFITS[tierObj.id] ?? BENEFITS.bronze;

  return (
    <div className="min-h-screen bg-[#f0f8ff] dark:bg-background">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-[#c8e1f8]/90 dark:bg-background/90 backdrop-blur-xl">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto lg:max-w-2xl">
          <Link href="/portal/account">
            <motion.div whileTap={{ scale: 0.9 }}
              className="h-9 w-9 rounded-full bg-white/40 flex items-center justify-center">
              <ArrowLeft className="h-5 w-5 text-blue-900 dark:text-foreground" />
            </motion.div>
          </Link>
          <motion.div whileTap={{ scale: 0.9 }}
            className="h-9 w-9 rounded-full bg-white/40 flex items-center justify-center">
            <HelpCircle className="h-5 w-5 text-blue-900 dark:text-foreground" />
          </motion.div>
        </div>
      </div>

      {/* ── Hero (light blue section) ── */}
      <div className="bg-gradient-to-b from-[#b8d9f7] to-[#d8edfb] dark:bg-slate-800 dark:from-slate-800 dark:to-slate-800 pb-6 pt-2">
        <div className="px-5 max-w-screen-sm mx-auto lg:max-w-2xl">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 text-blue-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Brand + badge row */}
              <div className="flex items-start justify-between mb-4">
                <div className="pt-1">
                  <p className="text-blue-600 dark:text-blue-400 font-bold text-sm tracking-wide">
                    Maitri{' '}
                    <span className="font-black text-base tracking-[0.12em]">
                      REWAR<span className="text-amber-500">D</span>S
                    </span>
                  </p>
                  <h1 className="text-3xl font-black text-[#1a3a5c] dark:text-white mt-1 leading-tight">
                    {tierObj.label}
                  </h1>
                  <p className="text-sm text-blue-600/70 dark:text-blue-300 mt-0.5">
                    ระดับสมาชิกปัจจุบันของคุณ
                  </p>
                </div>
                <HexBadge tier={tierObj} />
              </div>

              {/* Tier journey circles */}
              <div className="flex items-center mt-2">
                {TIERS.map((t, i) => {
                  const achieved  = tierIdx >= i;
                  const isCurrent = tierIdx === i;
                  return (
                    <div key={t.id} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <motion.div
                          initial={{ scale: 0.7 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: i * 0.07, type: 'spring', stiffness: 300 }}
                          className={cn(
                            'h-9 w-9 rounded-full flex items-center justify-center text-base border-2 transition-all',
                            isCurrent
                              ? 'border-blue-700 bg-white shadow-md scale-110'
                              : achieved
                                ? 'border-transparent bg-white/60'
                                : 'border-blue-300/50 bg-white/30',
                          )}>
                          <span className={cn('text-base', !achieved && 'opacity-40')}>{t.coin}</span>
                        </motion.div>
                        <span className={cn(
                          'text-[9px] font-semibold whitespace-nowrap',
                          isCurrent ? 'text-blue-900 dark:text-white' : 'text-blue-700/60 dark:text-blue-300/60',
                        )}>
                          {t.labelEn}
                        </span>
                      </div>
                      {i < TIERS.length - 1 && (
                        <div className={cn(
                          'flex-1 h-0.5 mx-0.5 mb-4',
                          tierIdx > i ? 'bg-blue-500' : 'bg-blue-300/40',
                        )} />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Content ── */}
      {!loading && (
        <div className="max-w-screen-sm mx-auto lg:max-w-2xl pb-12">

          {/* Progress card */}
          {nextTier && (
            <motion.div custom={0} variants={v} initial="hidden" animate="show"
              className="mx-4 mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <button className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors">
                <div className="flex-1">
                  <p className="text-sm text-gray-800 leading-snug">
                    จองและใช้บริการให้เกิน{' '}
                    <span className="font-bold text-blue-600">
                      ฿ {spendGoal.toLocaleString()}
                    </span>{' '}
                    ภายใน 30 พ.ย. {new Date().getFullYear() + 1} เพื่อปลดล็อคระดับ{nextTier.label}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              </button>
              <div className="px-5 pb-4 space-y-3 border-t border-gray-100">
                {/* Stay progress */}
                <div className="flex items-center gap-3 pt-3">
                  <div className={cn(
                    'h-5 w-5 rounded-full flex items-center justify-center shrink-0',
                    stayProgress >= STAY_GOAL ? 'bg-blue-600' : 'bg-gray-200',
                  )}>
                    <Check className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (stayProgress / STAY_GOAL) * 100)}%` }}
                        transition={{ duration: 1, ease }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">การจอง {stayProgress} ครั้ง</span>
                </div>
                {/* Spend progress */}
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (spendCurrent / spendGoal) * 100)}%` }}
                        transition={{ duration: 1, ease, delay: 0.15 }}
                        className="h-full bg-blue-500 rounded-full"
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 shrink-0">
                    ฿ {spendCurrent.toLocaleString()} / ฿ {spendGoal.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="px-5 pb-4">
                <p className="text-xs text-gray-400 leading-relaxed">
                  ระดับสมาชิก {tierObj.label} จะต่ออายุออกไปอีก 1 ปี หลังจากที่คุณถึงระดับต่อไป{' '}
                  <span className="text-blue-500 cursor-pointer">ⓘ</span>
                </p>
              </div>
            </motion.div>
          )}

          {/* Announcement card */}
          <motion.div custom={1} variants={v} initial="hidden" animate="show"
            className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors">
              <div className="relative shrink-0">
                <BellRing className="h-5 w-5 text-gray-500" />
                <div className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white" />
              </div>
              <p className="flex-1 text-sm text-gray-700 leading-snug line-clamp-2">
                การเปลี่ยนแปลงเงื่อนไขสิทธิ์เข้าใช้ห้องรับรอง VIP ที่สนามบิน
              </p>
              <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
            </button>
          </motion.div>

          {/* Maitri Points balance */}
          <motion.div custom={2} variants={v} initial="hidden" animate="show"
            className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-amber-500 flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white font-black text-lg">M</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Maitri Points</p>
              <p className="text-xs text-gray-500 mt-0.5">
                ยอดคงเหลือ:{' '}
                <span className="text-amber-600 font-bold">{points.toLocaleString()} แต้ม</span>
              </p>
            </div>
            <Link href="/portal/coupons"
              className="text-xs text-blue-600 font-semibold hover:text-blue-700 shrink-0">
              แลกแต้ม
            </Link>
          </motion.div>

          {/* Benefits section */}
          <motion.div custom={3} variants={v} initial="hidden" animate="show" className="mt-5">
            <div className="flex items-center justify-between px-5 mb-3">
              <h2 className="text-sm font-bold text-gray-800">
                สิทธิประโยชน์สมาชิก{tierObj.label}
              </h2>
              <span className="text-[11px] bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                ×{benefits.length}
              </span>
            </div>
            <div className="mx-4 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
              {benefits.map((b, i) => (
                <motion.div
                  key={b.title}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06, duration: 0.25 }}
                  className="flex items-center gap-4 px-4 py-4">
                  <div className="h-11 w-11 rounded-full bg-amber-50 flex items-center justify-center text-xl shrink-0">
                    {b.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{b.title}</p>
                    <p className="text-xs text-amber-600 mt-0.5">{b.desc}</p>
                  </div>
                  <span className="text-blue-400 text-lg shrink-0">✦</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* History */}
          {data?.transactions?.length ? (
            <motion.div custom={4} variants={v} initial="hidden" animate="show" className="mx-4 mt-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-800">ประวัติแต้มสะสม</h2>
                <span className="text-xs text-blue-600 font-medium">ดูทั้งหมด</span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
                {data.transactions.slice(0, 4).map((tx) => (
                  <div key={`${tx.created_at}-${tx.description}`}
                    className="flex items-center justify-between px-4 py-3.5">
                    <div>
                      <p className="text-sm text-gray-800">{tx.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.created_at)}</p>
                    </div>
                    <span className={cn(
                      'text-sm font-bold',
                      tx.type === 'earn' ? 'text-green-600' : 'text-red-500',
                    )}>
                      {tx.type === 'earn' ? '+' : '-'}{Math.abs(tx.points).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : null}

          <div className="h-6" />
        </div>
      )}
    </div>
  );
}
