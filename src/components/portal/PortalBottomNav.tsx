'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Mail, Hotel, Briefcase, User, QrCode, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const LEFT_TABS  = [
  { href: '/portal/home',     icon: Home,      label: 'หน้าแรก' },
  { href: '/portal/messages', icon: Mail,      label: 'ข้อความ' },
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
    fetch('/api/guest/active-stay')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.reservation) setHasStay(true); })
      .catch(() => {});
    try {
      if (localStorage.getItem('maitri_scanned_hotel')) setHasStay(true);
    } catch {}
    // unread notifications badge: count upcoming reservations in next 3 days
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
    const isMsg  = href === '/portal/messages';
    return (
      <Link href={href} className="flex-1 relative flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium">
        <div className="relative">
          {active && (
            <motion.div layoutId="nav-pill"
              className="absolute -inset-2 rounded-xl bg-amber-500/12 dark:bg-amber-400/10"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
          )}
          <Icon className={cn('h-5 w-5 relative z-10 transition-all duration-200',
            active ? 'text-amber-700 dark:text-amber-400 scale-110' : 'text-muted-foreground')}
            strokeWidth={active ? 2.5 : 1.8} />
          {isMsg && msgCount > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center z-20">
              {msgCount}
            </span>
          )}
        </div>
        <span className={cn('relative z-10 transition-colors', active ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
          {label}
        </span>
      </Link>
    );
  }

  const centerActive = pathname.startsWith('/portal/stay');

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pb-safe">
      <div className="bg-background/92 backdrop-blur-2xl border-t border-border/40">
        <nav className="max-w-lg mx-auto flex items-end px-1">
          {LEFT_TABS.map(t => <NavTab key={t.href} {...t} />)}

          {/* Centre action button */}
          <div className="flex-1 flex flex-col items-center pb-2 pt-1">
            <Link href={hasStay ? '/portal/stay' : '/portal/scan'}>
              <motion.div
                whileTap={{ scale: 0.92 }}
                className={cn(
                  'h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-all',
                  centerActive
                    ? 'bg-gradient-to-br from-amber-500 to-amber-700 shadow-amber-500/40'
                    : 'bg-gradient-to-br from-amber-600 to-amber-800 dark:from-amber-500 dark:to-amber-700 shadow-amber-600/30',
                )}
              >
                <AnimatePresence mode="wait">
                  {hasStay
                    ? <motion.div key="hotel" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                        <Hotel className="h-5 w-5 text-white" strokeWidth={2} />
                      </motion.div>
                    : <motion.div key="plus" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }}>
                        <Plus className="h-5 w-5 text-white" strokeWidth={2.5} />
                      </motion.div>
                  }
                </AnimatePresence>
              </motion.div>
            </Link>
            <span className={cn('text-[10px] font-medium mt-0.5',
              centerActive ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground')}>
              {hasStay ? 'โรงแรม' : 'สแกน QR'}
            </span>
          </div>

          {RIGHT_TABS.map(t => <NavTab key={t.href} {...t} />)}
        </nav>
      </div>
    </div>
  );
}
