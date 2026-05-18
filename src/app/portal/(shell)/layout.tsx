import Link from 'next/link';
import { CookieConsent } from '@/components/ui/cookie-consent';
import { PortalChatButton } from '@/components/portal/portal-chat-button';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';
import { PortalBottomNav } from '@/components/portal/PortalBottomNav';
import { AppInstallBanner } from '@/components/ui/app-install-banner';

export default function PortalShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Glass header — full width with constrained inner */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-screen-sm items-center justify-between px-5 h-14 md:h-16">
          <Link href="/portal/bookings" className="flex items-center gap-3 group">
            <div className="h-8 w-8 md:h-9 md:w-9 rounded-2xl flex items-center justify-center shrink-0
              bg-gradient-to-br from-amber-500/15 to-amber-700/25
              border border-amber-600/25 dark:border-amber-400/20
              group-hover:border-amber-600/50 dark:group-hover:border-amber-400/40 transition-colors">
              <span className="font-display text-sm font-bold text-amber-700 dark:text-amber-400">M</span>
            </div>
            <div className="leading-none">
              <p className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-medium mb-0.5">Private Journey</p>
              <p className="font-display text-[15px] font-semibold text-foreground">Maitri Collection</p>
            </div>
          </Link>
          <div className="flex items-center gap-1">
            <PortalThemeToggle />
          </div>
        </div>
      </header>

      {/* Content — narrow on mobile, slightly wider on desktop, centered */}
      <main className="mx-auto w-full max-w-screen-sm px-4 py-5 md:py-8 pb-32">
        {children}
      </main>

      <PortalBottomNav />
      <AppInstallBanner />
      <CookieConsent />
      <PortalChatButton />
    </div>
  );
}
