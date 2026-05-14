'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Calendar, Heart, User, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/search',          icon: Search,     label: 'ค้นหา' },
  { href: '/portal/bookings', icon: Calendar,   label: 'การจอง' },
  { href: '/portal/wishlist', icon: Heart,      label: 'Wishlist' },
  { href: '/portal/profile',  icon: User,       label: 'โปรไฟล์' },
  { href: '/portal/support',  icon: HelpCircle, label: 'ช่วยเหลือ' },
];

export function PortalBottomNav() {
  const pathname = usePathname();
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-black/8 pb-safe">
      <nav className="max-w-lg mx-auto flex items-center">
        {TABS.map(tab => {
          const active = pathname === tab.href || pathname.startsWith(tab.href + '/');
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 text-2xs font-medium transition-colors',
                active ? 'text-[#C66A30]' : 'text-[#2A2522]/40 hover:text-[#2A2522]/70',
              )}
            >
              <Icon className={cn('h-5 w-5 transition-transform', active && 'scale-110')} strokeWidth={active ? 2.5 : 1.8} />
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
