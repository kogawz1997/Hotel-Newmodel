'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Bell, Briefcase, User, Hotel, QrCode, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const LEFT_TABS  = [
  { href: '/portal/home',     icon: Home,     label: 'หน้าแรก' },
  { href: '/portal/messages', icon: Bell,     label: 'ข้อความ' },
];
const RIGHT_TABS = [
  { href: '/portal/trips',    icon: Briefcase, label: 'ทริป'   },
  { href: '/portal/account',  icon: User,      label: 'บัญชี'  },
];

export function PortalBottomNav() {
  const pathname = usePathname();
  const [hasStay, setHasStay] = useState(false);
  const [msgCount, setMsgCount] = useState(0);

  useEffect(() => {
    // Check for active stay
    fetch('/api/guest/active-stay')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.reservation) setHasStay(true); })
      .catch(() => {});
    try {
      if (localStorage.getItem('maitri_scanned_hotel')) setHasStay(true);
    } catch {}

    // Unread count: upcoming check-ins within 3 days
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
  }, [pathname]);

  function NavTab({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
    const active = pathname === href || pathname.startsWith(href + '/');
    const isBell = href === '/portal/messages';
    return (
      <Link href={href} className="flex-1 relative flex flex-col items-center gap-0.5 py-2.5 select-none">
        <div className="relative">
          {active && (
            <motion.div layoutId="nav-indicator"
              className="absolute -inset-2 rounded-xl bg-amber-500/12 dark:bg-amber-400/10"
              transition={{ type: 'spring', stiffness: 420, damping: 32 }} />
          )}
          <Icon
            className={cn(
              'h-5 w-5 relative z-10 transition-all duration-200',
              active ? 'text-amber-700 dark:text-amber-400 scale-110' : 'text-muted-foreground',
            )}
            strokeWidth={active ? 2.5 : 1.8}
          />
          {isBell && msgCount > 0 && (
            <span className="absolute -top-1 -right-1.5 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center z-20 border-2 border-background">
              {msgCount > 9 ? '9+' : msgCount}
            </span>
          )}
        </div>
        <span className={cn(
          'text-[10px] font-medium relative z-10 transition-colors',
          active ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground',
        )}>
          {label}
        </span>
      </Link>
    );
  }

  const centerActive = pathname.startsWith('/portal/stay') || pathname.startsWith('/portal/scan');

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pb-safe">
      <div className="bg-background/94 backdrop-blur-2xl border-t border-border/40 shadow-xl">
        <nav className="max-w-lg mx-auto flex items-end px-2">
          {LEFT_TABS.map(t => <NavTab key={t.href} {...t} />)}

          {/* ── Center action button ── */}
          <div className="flex-1 flex flex-col items-center pb-2 pt-1">
            <Link href={hasStay ? '/portal/stay' : '/portal/scan'}>
              <motion.div
                whileTap={{ scale: 0.90 }}
                className={cn(
                  'h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200',
                  centerActive
                    ? 'bg-gradient-to-br from-amber-500 to-[#C66A30] shadow-amber-500/35'
                    : 'bg-gradient-to-br from-amber-600 to-[#C66A30] dark:from-amber-500 dark:to-[#C66A30] shadow-amber-600/25',
                )}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {hasStay ? (
                    <motion.div key="hotel"
                      initial={{ scale: 0.5, opacity: 0, rotate: -15 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotate: 15 }}
                      transition={{ duration: 0.2 }}>
                      <Hotel className="h-5 w-5 text-white" strokeWidth={2} />
                    </motion.div>
                  ) : (
                    <motion.div key="plus"
                      initial={{ scale: 0.5, opacity: 0, rotate: 15 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      exit={{ scale: 0.5, opacity: 0, rotate: -15 }}
                      transition={{ duration: 0.2 }}>
                      <QrCode className="h-5 w-5 text-white" strokeWidth={2} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
            <span className={cn(
              'text-[10px] font-medium mt-0.5 transition-colors',
              centerActive ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground',
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
