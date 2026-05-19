'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, Bell, Briefcase, User, Hotel, QrCode, Sparkles, Sun, Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';

const NAV_ITEMS = [
  { href: '/portal/home',     icon: Home,      label: 'หน้าแรก' },
  { href: '/portal/messages', icon: Bell,      label: 'ข้อความ' },
  { href: '/portal/trips',   icon: Briefcase, label: 'ทริป'    },
  { href: '/portal/account', icon: User,      label: 'บัญชี'  },
];

const TIER_COLORS: Record<string, string> = {
  bronze:   'text-amber-700 dark:text-amber-500 bg-amber-500/10',
  silver:   'text-slate-500 dark:text-slate-400 bg-slate-500/10',
  gold:     'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10',
  platinum: 'text-sky-500 dark:text-sky-400 bg-sky-500/10',
};

export function PortalSidebar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [hasStay, setHasStay]   = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const [loyalty, setLoyalty]   = useState<{ points: number; tier: string } | null>(null);

  useEffect(() => {
    fetch('/api/guest/active-stay')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.reservation) setHasStay(true); })
      .catch(() => {});
    try { if (localStorage.getItem('maitri_scanned_hotel')) setHasStay(true); } catch {}

    fetch('/api/guest/bookings')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const soon = (d?.reservations || []).filter((b: any) => {
          if (!b.check_in) return false;
          const diff = (new Date(b.check_in).getTime() - Date.now()) / 86400000;
          return diff >= 0 && diff <= 3 && b.status === 'confirmed';
        });
        setMsgCount(soon.length);
      }).catch(() => {});

    fetch('/api/guest/loyalty')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && typeof d.points === 'number') setLoyalty({ points: d.points, tier: d.tier || 'bronze' }); })
      .catch(() => {});
  }, [pathname]);

  const centerActive = pathname.startsWith('/portal/stay') || pathname.startsWith('/portal/scan');
  const tierColor    = TIER_COLORS[loyalty?.tier ?? 'bronze'] ?? TIER_COLORS.bronze;

  function SideNavItem({ href, icon: Icon, label, badge }: {
    href: string; icon: any; label: string; badge?: number;
  }) {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link href={href}>
        <motion.div
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
          className={cn(
            'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors select-none',
            active ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
          )}
        >
          {active && (
            <motion.div
              layoutId="sidebar-active-bg"
              className="absolute inset-0 rounded-xl bg-blue-500/10 dark:bg-blue-400/10"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <div className="relative shrink-0 z-10">
            <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.2 : 1.7} />
            {badge != null && badge > 0 && (
              <span className="absolute -top-1.5 -right-2 h-3.5 w-3.5 rounded-full bg-rose-500 text-white text-[8px] font-bold flex items-center justify-center border border-background">
                {badge > 9 ? '9+' : badge}
              </span>
            )}
          </div>
          <span className="text-sm font-semibold relative z-10">{label}</span>
        </motion.div>
      </Link>
    );
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:z-40 bg-background/95 backdrop-blur-2xl border-r border-border/20">

      {/* ── Brand ── */}
      <div className="px-5 pt-6 pb-5 border-b border-border/20">
        <Link href="/portal/home" className="flex items-center gap-3 group">
          <motion.div
            whileHover={{ rotate: [0, -6, 6, 0] }}
            transition={{ duration: 0.4 }}
            className="h-9 w-9 rounded-[12px] bg-gradient-to-br from-amber-500 to-[#C66A30] flex items-center justify-center shadow-sm shrink-0"
          >
            <span className="font-display font-bold text-white text-sm">M</span>
          </motion.div>
          <div>
            <p className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground leading-none mb-0.5">
              Private Journey
            </p>
            <p className="font-display font-bold text-[15px] text-foreground tracking-tight leading-none">
              Maitri Collection
            </p>
          </div>
        </Link>
      </div>

      {/* ── Nav links ── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <SideNavItem href="/portal/home"     icon={Home}      label="หน้าแรก" />
        <SideNavItem href="/portal/messages" icon={Bell}      label="ข้อความ" badge={msgCount} />
        <SideNavItem href="/portal/trips"   icon={Briefcase} label="ทริป"    />
        <SideNavItem href="/portal/account" icon={User}      label="บัญชี"  />

        {/* Hotel hub / QR scan */}
        <Link href={hasStay ? '/portal/stay' : '/portal/scan'}>
          <motion.div
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            className={cn(
              'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors select-none',
              centerActive ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60',
            )}
          >
            {centerActive && (
              <motion.div
                layoutId="sidebar-active-bg"
                className="absolute inset-0 rounded-xl bg-blue-500/10 dark:bg-blue-400/10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <AnimatePresence mode="wait" initial={false}>
              {hasStay ? (
                <motion.div key="hotel"
                  initial={{ opacity: 0, rotate: -15 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 15 }}
                  className="relative z-10 shrink-0"
                >
                  <Hotel className="h-[18px] w-[18px]" strokeWidth={centerActive ? 2.2 : 1.7} />
                </motion.div>
              ) : (
                <motion.div key="qr"
                  initial={{ opacity: 0, rotate: 15 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -15 }}
                  className="relative z-10 shrink-0"
                >
                  <QrCode className="h-[18px] w-[18px]" strokeWidth={centerActive ? 2.2 : 1.7} />
                </motion.div>
              )}
            </AnimatePresence>
            <span className="text-sm font-semibold relative z-10">{hasStay ? 'โรงแรม' : 'สแกน QR'}</span>
          </motion.div>
        </Link>
      </nav>

      {/* ── Footer: loyalty + theme toggle ── */}
      <div className="px-4 py-4 space-y-2 border-t border-border/20">
        {loyalty !== null && (
          <Link href="/portal/loyalty">
            <motion.div
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/15 hover:bg-amber-500/12 transition-colors"
            >
              <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground leading-none mb-0.5">Maitri Points</p>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300 leading-none">
                  {loyalty.points.toLocaleString()} แต้ม
                </p>
              </div>
              <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0', tierColor)}>
                {loyalty.tier}
              </span>
            </motion.div>
          </Link>
        )}

        <button
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
        >
          <AnimatePresence mode="wait" initial={false}>
            {resolvedTheme === 'dark' ? (
              <motion.div key="sun" initial={{ opacity: 0, rotate: -90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: 90 }} className="shrink-0">
                <Sun className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div key="moon" initial={{ opacity: 0, rotate: 90 }} animate={{ opacity: 1, rotate: 0 }} exit={{ opacity: 0, rotate: -90 }} className="shrink-0">
                <Moon className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
          <span className="text-sm font-medium">{resolvedTheme === 'dark' ? 'โหมดสว่าง' : 'โหมดมืด'}</span>
        </button>
      </div>
    </aside>
  );
}
