'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAdminLang } from '@/contexts/admin-lang-context';
import { Shield, Menu, X, LayoutDashboard, Building2, TrendingUp, Settings, AlertTriangle, LogOut, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/admin',          icon: LayoutDashboard, labelKey: 'nav.dashboard',     exact: true },
  { href: '/admin/orgs',     icon: Building2,       labelKey: 'nav.organizations' },
  { href: '/admin/ranking',  icon: TrendingUp,      labelKey: 'nav.ranking'       },
  { href: '/admin/settings', icon: Settings,        labelKey: 'nav.appSettings'   },
  { href: '/admin/errors',   icon: AlertTriangle,   labelKey: 'nav.errorLogs'     },
];

export function AdminMobileHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { lang, setLang, t } = useAdminLang();
  const supabase = createClient();

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = '/admin/login';
  }

  return (
    <>
      {/* Top bar (mobile only) */}
      <header className="md:hidden sticky top-0 z-50 bg-[#0f0f11] border-b border-white/8 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-lg bg-[#C66A30] flex items-center justify-center">
            <Shield className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-white text-sm font-bold">Maitri Admin</span>
        </div>
        <button onClick={() => setOpen(true)} className="p-2 text-white/60 hover:text-white transition-colors">
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Drawer overlay */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-72 bg-[#0f0f11] h-full flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-[#C66A30] flex items-center justify-center">
                  <Shield className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold leading-none">Maitri</p>
                  <p className="text-white/40 text-2xs mt-0.5">Admin Panel</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="p-1.5 text-white/40 hover:text-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
              {NAV_ITEMS.map(item => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      active ? 'bg-[#C66A30]/20 text-[#E0813A]' : 'text-white/55 hover:text-white hover:bg-white/5',
                    )}>
                    <Icon className="h-4 w-4 shrink-0" />
                    {t(item.labelKey)}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom controls */}
            <div className="px-3 pb-6 pt-3 border-t border-white/8 space-y-2">
              <div className="flex items-center gap-2 px-4 py-2">
                <Globe className="h-4 w-4 text-white/30" />
                <span className="text-white/40 text-xs flex-1">{lang === 'th' ? 'ภาษา' : 'Language'}</span>
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                  {(['th', 'en'] as const).map(l => (
                    <button key={l} onClick={() => setLang(l)}
                      className={cn('px-3 py-1.5 text-xs font-bold transition-colors', lang === l ? 'bg-[#C66A30] text-white' : 'text-white/40 hover:text-white/70')}>
                      {l === 'th' ? '🇹🇭 TH' : '🇬🇧 EN'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <LogOut className="h-4 w-4" />
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
