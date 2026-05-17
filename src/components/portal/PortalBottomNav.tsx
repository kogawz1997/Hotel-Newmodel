'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, ClipboardCheck, ConciergeBell, Heart, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/portal/bookings',  icon: CalendarDays,   label: 'การจอง' },
  { href: '/portal/check-in',  icon: ClipboardCheck, label: 'Check-in' },
  { href: '/portal/services',  icon: ConciergeBell,  label: 'บริการ' },
  { href: '/portal/wishlist',  icon: Heart,          label: 'Wishlist' },
  { href: '/portal/profile',   icon: User,           label: 'โปรไฟล์' },
];

export function PortalBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 inset-x-0 z-40 pb-safe
      bg-background/90 backdrop-blur-xl border-t border-border/50">
      <nav className="max-w-2xl mx-auto flex items-center px-2">
        {TABS.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 relative flex flex-col items-center gap-0.5 py-3 text-[10px] font-medium transition-colors duration-200',
                active
                  ? 'text-amber-700 dark:text-amber-400'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {active && (
                <motion.div
                  layoutId="portal-nav-pill"
                  className="absolute inset-x-1 top-1 h-8 rounded-xl bg-amber-500/10 dark:bg-amber-400/10"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Icon
                className={cn('h-5 w-5 relative z-10 transition-transform duration-200', active && 'scale-110')}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className="relative z-10">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
