'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAdminLang } from '@/contexts/admin-lang-context';
import {
  LayoutDashboard, Building2, TrendingUp, Settings, AlertTriangle,
  LogOut, Globe, ChevronRight, Shield,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV = [
  {
    groupKey: 'nav.overview',
    items: [
      { href: '/admin', icon: LayoutDashboard, labelKey: 'nav.dashboard', exact: true },
    ],
  },
  {
    groupKey: 'nav.tenants',
    items: [
      { href: '/admin/orgs', icon: Building2, labelKey: 'nav.organizations' },
    ],
  },
  {
    groupKey: 'nav.search',
    items: [
      { href: '/admin/ranking', icon: TrendingUp, labelKey: 'nav.ranking' },
    ],
  },
  {
    groupKey: 'nav.settings',
    items: [
      { href: '/admin/settings', icon: Settings, labelKey: 'nav.appSettings' },
    ],
  },
  {
    groupKey: 'nav.system',
    items: [
      { href: '/admin/errors', icon: AlertTriangle, labelKey: 'nav.errorLogs' },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { lang, setLang, t } = useAdminLang();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  }

  return (
    <aside className="w-56 shrink-0 hidden md:flex flex-col bg-[#0f0f11] border-r border-white/8 min-h-screen sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/8">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-[#C66A30] flex items-center justify-center shrink-0">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-white text-sm font-bold leading-none">Maitri</p>
            <p className="text-white/40 text-2xs mt-0.5">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {NAV.map(group => (
          <div key={group.groupKey}>
            <p className="text-white/30 text-2xs font-semibold uppercase tracking-widest px-2 mb-1.5">
              {t(group.groupKey)}
            </p>
            {group.items.map(item => {
              const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                    active
                      ? 'bg-[#C66A30]/20 text-[#E0813A]'
                      : 'text-white/50 hover:text-white/90 hover:bg-white/5',
                  )}>
                  <Icon className="h-4 w-4 shrink-0" />
                  {t(item.labelKey)}
                  {active && <ChevronRight className="h-3 w-3 ml-auto opacity-60" />}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom controls */}
      <div className="px-3 pb-4 border-t border-white/8 pt-3 space-y-1">
        {/* Language toggle */}
        <div className="flex items-center gap-2 px-3 py-2">
          <Globe className="h-4 w-4 text-white/30" />
          <div className="flex rounded-lg overflow-hidden border border-white/10 ml-auto">
            {(['th', 'en'] as const).map(l => (
              <button key={l} onClick={() => setLang(l)}
                className={cn(
                  'px-2.5 py-1 text-2xs font-bold transition-colors',
                  lang === l ? 'bg-[#C66A30] text-white' : 'text-white/40 hover:text-white/70',
                )}>
                {l === 'th' ? '🇹🇭 TH' : '🇬🇧 EN'}
              </button>
            ))}
          </div>
        </div>

        <button onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="h-4 w-4" />
          {t('nav.logout')}
        </button>
      </div>
    </aside>
  );
}
