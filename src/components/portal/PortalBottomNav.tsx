'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, Briefcase, User, Hotel, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const LEFT_TABS  = [
  { href: '/portal/home',     icon: Home,      label: 'หน้าแรก' },
  { href: '/portal/messages', icon: Bell,      label: 'ข้อความ' },
];
const RIGHT_TABS = [
  { href: '/portal/trips',   icon: Briefcase, label: 'ทริป'  },
  { href: '/portal/account', icon: User,      label: 'บัญชี' },
];

export function PortalBottomNav() {
  const pathname = usePathname();
  const [hasStay, setHasStay] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    fetch('/api/guest/active-stay')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.reservation) setHasStay(true); })
      .catch(() => {});
    try {
      if (localStorage.getItem('maitri_scanned_hotel')) setHasStay(true);
    } catch {}

    fetch('/api/guest/bookings')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        const soon = (d?.reservations || []).filter((b: any) => {
          if (!b.check_in) return false;
          const diff = (new Date(b.check_in).getTime() - Date.now()) / 86400000;
          return diff >= 0 && diff <= 3 && b.status === 'confirmed';
        });
        // Clear badge if user visited messages recently (within 30 min)
        try {
          const seenAt = Number(localStorage.getItem('maitri_msgs_seen_at') || 0);
          const age = Date.now() - seenAt;
          if (age < 30 * 60 * 1000) { setMsgCount(0); return; }
        } catch {}
        setMsgCount(soon.length);
      }).catch(() => {});
  }, [pathname]);

  const centerActive = pathname.startsWith('/portal/stay') || pathname.startsWith('/portal/scan');

  function NavTab({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    const active = pathname === href || pathname.startsWith(href + '/');
    const isBell = href === '/portal/messages';

    return (
      <Link href={href} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 select-none">
        <motion.div whileTap={{ scale: 0.80 }} className="relative flex flex-col items-center gap-0.5">
          <div className="relative">
            {active && (
              <motion.div
                layoutId="nav-active-bg"
                className="absolute -inset-2 rounded-[14px] bg-blue-500/10 dark:bg-blue-400/10"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <Icon
              className={cn(
                'h-[22px] w-[22px] relative z-10 transition-all duration-200',
                active ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground/65',
              )}
              strokeWidth={active ? 2.4 : 1.7}
            />
            {isBell && msgCount > 0 && (
              <motion.span
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -right-1.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center z-20 border-2 border-background shadow-sm"
              >
                {msgCount > 9 ? '9+' : msgCount}
              </motion.span>
            )}
          </div>
          <span className={cn(
            'text-[10px] font-semibold relative z-10 transition-colors',
            active ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground/60',
          )}>
            {label}
          </span>
        </motion.div>
      </Link>
    );
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pb-safe lg:hidden">
      <div className="bg-white/95 dark:bg-background/95 backdrop-blur-3xl border-t border-gray-200/80 dark:border-border/20 shadow-2xl shadow-black/8">
        <nav className="max-w-lg mx-auto flex items-end px-1">

          {LEFT_TABS.map(t => <NavTab key={t.href} {...t} />)}

          {/* ── Center button ── */}
          <div className="flex-1 flex flex-col items-center pb-2 pt-0.5 gap-0.5">
            <Link href={hasStay ? '/portal/stay' : '/portal/scan'}>
              <motion.div
                whileTap={{ scale: 0.87 }}
                className={cn(
                  'relative flex items-center justify-center rounded-[18px] shadow-xl transition-shadow duration-300',
                  centerActive ? 'shadow-amber-500/45' : 'shadow-amber-600/30',
                )}
                style={{ width: 52, height: 52 }}
              >
                {/* gradient fill */}
                <div className="absolute inset-0 rounded-[18px] bg-gradient-to-br from-amber-500 to-[#C66A30]" />
                {/* top highlight */}
                <div className="absolute inset-0 rounded-[18px] bg-gradient-to-b from-white/20 to-transparent opacity-60" />

                <AnimatePresence mode="wait" initial={false}>
                  {hasStay ? (
                    <motion.div key="hotel"
                      initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="relative z-10"
                    >
                      <Hotel className="h-6 w-6 text-white" strokeWidth={1.8} />
                    </motion.div>
                  ) : (
                    <motion.div key="qr"
                      initial={{ scale: 0.5, opacity: 0, rotate: 20 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotate: -20 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="relative z-10"
                    >
                      <QrCode className="h-6 w-6 text-white" strokeWidth={1.8} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
            <span className={cn(
              'text-[10px] font-semibold transition-colors',
              centerActive ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground/60',
            )}>
              {hasStay ? 'โรงแรม' : 'สแกน QR'}
            </span>
          </div>

          {RIGHT_TABS.map(t => <NavTab key={t.href} {...t} />)}
        </nav>
      </div>
    </div>
  );
}
