'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays, Heart, CreditCard, User, Shield, Users, LogOut,
  ChevronRight, Sparkles, Trophy, Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';

const TIERS: Record<string, { label: string; color: string; emoji: string; minPoints: number }> = {
  bronze:   { label: 'Bronze',   color: '#CD7F32', emoji: '🥉', minPoints: 0     },
  silver:   { label: 'Silver',   color: '#A8A9AD', emoji: '🥈', minPoints: 1000  },
  gold:     { label: 'Gold',     color: '#D4AF37', emoji: '🥇', minPoints: 3000  },
  platinum: { label: 'Platinum', color: '#94A3B8', emoji: '💎', minPoints: 10000 },
};

const TIER_ORDER = ['bronze', 'silver', 'gold', 'platinum'];

const v = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

type Guest = { id: string; first_name?: string; last_name?: string; email?: string; phone?: string; [key: string]: any };

const MENU_ITEMS = [
  { href: '/portal/trips',    icon: CalendarDays, label: 'การจองทั้งหมด',  desc: 'ดูและจัดการการจอง' },
  { href: '/portal/wishlist', icon: Heart,        label: 'ที่บันทึกไว้',   desc: 'โรงแรมที่คุณถูกใจ' },
  { href: '/portal/loyalty',  icon: Sparkles,     label: 'แต้มสะสม',       desc: 'Maitri Rewards' },
  { href: '/portal/profile',  icon: User,         label: 'ข้อมูลส่วนตัว',  desc: 'แก้ไขโปรไฟล์' },
  { href: '/portal/referrals',icon: Users,        label: 'ชวนเพื่อน',      desc: 'รับสิทธิพิเศษ' },
];

export function AccountClient({ guest, loyaltyPoints, loyaltyTier }: {
  guest: Guest;
  loyaltyPoints: number;
  loyaltyTier: string;
}) {
  const router = useRouter();
  const tier = TIERS[loyaltyTier] ?? TIERS.bronze;
  const tierIdx = TIER_ORDER.indexOf(loyaltyTier);
  const nextTierKey = TIER_ORDER[tierIdx + 1];
  const nextTier = nextTierKey ? TIERS[nextTierKey] : null;
  const progress = nextTier
    ? Math.min(100, Math.round(((loyaltyPoints - tier.minPoints) / (nextTier.minPoints - tier.minPoints)) * 100))
    : 100;

  const initials = [guest.first_name, guest.last_name]
    .filter(Boolean).map(n => n![0].toUpperCase()).join('') || 'G';
  const fullName = [guest.first_name, guest.last_name].filter(Boolean).join(' ') || 'ผู้ใช้';

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/portal/login');
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <h1 className="font-display font-bold text-lg text-foreground">บัญชีของฉัน</h1>
          <div className="flex items-center gap-2">
            <PortalThemeToggle />
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 max-w-screen-sm mx-auto space-y-4">

        {/* ── Profile card ── */}
        <motion.div custom={0} variants={v} initial="hidden" animate="show">
          <div className="flex items-center gap-4 rounded-2xl bg-card border border-border p-4">
            {/* Avatar */}
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${tier.color}cc, ${tier.color})` }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground text-lg leading-tight truncate">{fullName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">{guest.email || guest.phone || '—'}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-sm">{tier.emoji}</span>
                <span className="text-xs font-bold" style={{ color: tier.color }}>{tier.label}</span>
                <span className="text-xs text-muted-foreground">Member</span>
              </div>
            </div>
            <Link href="/portal/profile">
              <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center">
                <Settings className="h-4 w-4 text-muted-foreground" />
              </div>
            </Link>
          </div>
        </motion.div>

        {/* ── Loyalty card ── */}
        <motion.div custom={1} variants={v} initial="hidden" animate="show">
          <Link href="/portal/loyalty">
            <motion.div whileTap={{ scale: 0.98 }}
              className="relative rounded-2xl overflow-hidden p-5"
              style={{ background: `linear-gradient(135deg, ${tier.color}18, ${tier.color}08)`, border: `1px solid ${tier.color}25` }}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-1">Maitri Rewards</p>
                  <div className="flex items-end gap-1.5">
                    <span className="font-display text-4xl font-bold text-foreground">{loyaltyPoints.toLocaleString()}</span>
                    <span className="text-sm text-muted-foreground mb-1">แต้ม</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-2xl">{tier.emoji}</span>
                  <span className="text-xs font-bold" style={{ color: tier.color }}>{tier.label}</span>
                </div>
              </div>

              {nextTier ? (
                <div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1.5">
                    <span>{tier.label}</span>
                    <span>อีก {Math.max(0, nextTier.minPoints - loyaltyPoints).toLocaleString()} แต้ม → {nextTier.label}</span>
                  </div>
                  <div className="h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${progress}%`, backgroundColor: tier.color }} />
                  </div>
                </div>
              ) : (
                <p className="text-xs font-semibold" style={{ color: tier.color }}>
                  {tier.emoji} คุณอยู่ในระดับสูงสุดแล้ว!
                </p>
              )}

              <div className="absolute top-4 right-4 opacity-10">
                <Trophy className="h-16 w-16" style={{ color: tier.color }} />
              </div>
            </motion.div>
          </Link>
        </motion.div>

        {/* ── Menu ── */}
        <motion.div custom={2} variants={v} initial="hidden" animate="show">
          <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border/60">
            {MENU_ITEMS.map((item, i) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-secondary/50 transition-colors">
                    <div className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      <Icon className="h-4.5 w-4.5 text-foreground/70" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* ── Logout ── */}
        <motion.div custom={3} variants={v} initial="hidden" animate="show">
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl bg-card border border-border hover:bg-red-500/5 hover:border-red-500/20 transition-colors group">
            <div className="h-9 w-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <LogOut className="h-4 w-4 text-red-500" strokeWidth={1.8} />
            </div>
            <span className="text-sm font-semibold text-red-500">ออกจากระบบ</span>
          </button>
        </motion.div>

        {/* ── App version ── */}
        <motion.div custom={4} variants={v} initial="hidden" animate="show">
          <p className="text-center text-[10px] text-muted-foreground/40 pb-2">
            Maitri Collection · v1.0
          </p>
        </motion.div>

        <div className="h-2" />
      </div>
    </div>
  );
}
