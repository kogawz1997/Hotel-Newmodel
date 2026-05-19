'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, Heart, User, Shield, Users, LogOut,
  ChevronRight, Sparkles, Trophy, Settings2, Gift,
  Bell, HelpCircle, Tag, Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';

const TIERS = {
  bronze:   { label: 'Bronze',   textCls: 'text-amber-700 dark:text-amber-400', gFrom: 'from-amber-500',   gTo: 'to-orange-600',  emoji: '🥉', minPoints: 0,     next: 1000  },
  silver:   { label: 'Silver',   textCls: 'text-slate-500 dark:text-slate-300', gFrom: 'from-slate-400',   gTo: 'to-slate-600',   emoji: '🥈', minPoints: 1000,  next: 3000  },
  gold:     { label: 'Gold',     textCls: 'text-yellow-600 dark:text-yellow-400',gFrom: 'from-yellow-400', gTo: 'to-amber-500',   emoji: '🥇', minPoints: 3000,  next: 10000 },
  platinum: { label: 'Platinum', textCls: 'text-sky-500 dark:text-sky-300',     gFrom: 'from-sky-400',    gTo: 'to-indigo-500',  emoji: '💎', minPoints: 10000, next: null  },
} as const;
type TierKey = keyof typeof TIERS;

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const v = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease } }),
};

type Guest = { id: string; first_name?: string; last_name?: string; email?: string; phone?: string; [key: string]: any };

const MENU_SECTIONS = [
  {
    title: 'การเดินทาง',
    items: [
      { href: '/portal/trips',    icon: CalendarDays, label: 'การจองทั้งหมด',  desc: 'ดูและจัดการการจองของคุณ',     color: 'bg-amber-500/12 text-amber-700 dark:text-amber-400' },
      { href: '/portal/wishlist', icon: Heart,        label: 'ที่บันทึกไว้',   desc: 'โรงแรมและห้องที่คุณถูกใจ',   color: 'bg-rose-500/12 text-rose-600 dark:text-rose-400' },
      { href: '/portal/loyalty',  icon: Gift,         label: 'แต้มสะสม',       desc: 'Maitri Rewards · แลกของรางวัล', color: 'bg-violet-500/12 text-violet-600 dark:text-violet-400' },
    ],
  },
  {
    title: 'บัญชีของฉัน',
    items: [
      { href: '/portal/profile',   icon: User,     label: 'ข้อมูลส่วนตัว',   desc: 'แก้ไขชื่อ อีเมล โทรศัพท์',    color: 'bg-sky-500/12 text-sky-600 dark:text-sky-400' },
      { href: '/portal/referrals', icon: Users,    label: 'ชวนเพื่อน',       desc: 'รับแต้มพิเศษเมื่อเพื่อนจอง',  color: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' },
      { href: '/portal/coupons',   icon: Tag,      label: 'คูปองส่วนลด',     desc: 'โปรโมชั่นและรหัสส่วนลด',      color: 'bg-rose-500/12 text-rose-600 dark:text-rose-400' },
      { href: '/portal/settings',  icon: Settings, label: 'ตั้งค่า',          desc: 'ธีม การแจ้งเตือน ภาษา',       color: 'bg-gray-500/12 text-gray-600 dark:text-gray-400' },
    ],
  },
];

export function AccountClient({ guest, loyaltyPoints, loyaltyTier }: {
  guest: Guest;
  loyaltyPoints: number;
  loyaltyTier: string;
}) {
  const router  = useRouter();
  const tierKey = (Object.keys(TIERS).includes(loyaltyTier) ? loyaltyTier : 'bronze') as TierKey;
  const tier    = TIERS[tierKey];
  const nextPts = tier.next;
  const progress = nextPts
    ? Math.min(100, Math.round(((loyaltyPoints - tier.minPoints) / (nextPts - tier.minPoints)) * 100))
    : 100;

  const initials = [guest.first_name, guest.last_name]
    .filter(Boolean).map(n => n![0].toUpperCase()).join('') || 'G';
  const fullName = [guest.first_name, guest.last_name].filter(Boolean).join(' ') || 'ผู้ใช้';

  const nextTierLabel = nextPts
    ? Object.values(TIERS).find(t => t.minPoints === nextPts)?.label
    : null;

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/portal/login');
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <h1 className="font-display font-bold text-lg text-foreground tracking-tight">บัญชีของฉัน</h1>
          <PortalThemeToggle />
        </div>
      </div>

      <div className="px-4 pt-5 pb-8 max-w-screen-sm mx-auto space-y-4">

        {/* ── Profile card ── */}
        <motion.div custom={0} variants={v} initial="hidden" animate="show">
          <div className="flex items-center gap-4 rounded-3xl bg-card border border-border/60 p-4 shadow-sm">
            {/* Avatar with tier gradient */}
            <div
              className={cn('h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md shrink-0 bg-gradient-to-br', tier.gFrom, tier.gTo)}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground text-lg leading-tight truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{guest.email || guest.phone || '—'}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-sm">{tier.emoji}</span>
                <span className={cn('text-xs font-bold', tier.textCls)}>{tier.label} Member</span>
              </div>
            </div>
            <Link href="/portal/profile">
              <motion.div whileTap={{ scale: 0.92 }}
                className="h-9 w-9 rounded-xl bg-secondary border border-border/40 flex items-center justify-center shrink-0">
                <Settings2 className="h-4 w-4 text-muted-foreground" />
              </motion.div>
            </Link>
          </div>
        </motion.div>

        {/* ── Loyalty card ── */}
        <motion.div custom={1} variants={v} initial="hidden" animate="show">
          <Link href="/portal/loyalty">
            <motion.div whileTap={{ scale: 0.98 }}
              className={cn('relative rounded-3xl overflow-hidden p-5 bg-gradient-to-br shadow-md', tier.gFrom, tier.gTo)}>

              {/* Background decoration */}
              <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 h-32 w-32 rounded-full bg-white/10" />
              <div className="absolute bottom-0 right-8 translate-y-6 h-20 w-20 rounded-full bg-white/8" />

              <div className="relative">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.25em] text-white/60 font-semibold mb-1">Maitri Rewards</p>
                    <div className="flex items-end gap-2">
                      <span className="font-display text-4xl font-bold text-white leading-none">{loyaltyPoints.toLocaleString()}</span>
                      <span className="text-sm text-white/60 mb-0.5">แต้ม</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl block mb-1">{tier.emoji}</span>
                    <span className="text-xs font-bold text-white/90">{tier.label}</span>
                  </div>
                </div>

                {nextPts ? (
                  <div>
                    <div className="h-1.5 bg-white/20 rounded-full overflow-hidden mb-1.5">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.3 }}
                        className="h-full bg-white/80 rounded-full" />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-white/60">
                      <span>{tier.label}</span>
                      <span>อีก {Math.max(0, nextPts - loyaltyPoints).toLocaleString()} แต้ม → {nextTierLabel}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs font-bold text-white/80">💎 สมาชิกระดับสูงสุด</p>
                )}
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* ── Menu sections ── */}
        {MENU_SECTIONS.map((section, si) => (
          <motion.div key={section.title} custom={si + 2} variants={v} initial="hidden" animate="show">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">{section.title}</p>
            <div className="rounded-2xl bg-card border border-border/60 overflow-hidden shadow-sm divide-y divide-border/40">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href}>
                    <motion.div whileTap={{ scale: 0.985 }}
                      className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-secondary/40 transition-colors">
                      <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', item.color)}>
                        <Icon className="h-4.5 w-4.5" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/35 shrink-0" />
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* ── Logout ── */}
        <motion.div custom={4} variants={v} initial="hidden" animate="show">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-card border border-border/60 shadow-sm hover:bg-red-500/5 hover:border-red-500/20 transition-colors group">
            <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <LogOut className="h-4.5 w-4.5 text-red-500" strokeWidth={1.8} />
            </div>
            <span className="text-sm font-semibold text-red-500">ออกจากระบบ</span>
          </button>
        </motion.div>

        <motion.div custom={5} variants={v} initial="hidden" animate="show">
          <p className="text-center text-[10px] text-muted-foreground/35 pb-1">
            Maitri Collection · Guest Portal v1.0
          </p>
        </motion.div>

      </div>
    </div>
  );
}
