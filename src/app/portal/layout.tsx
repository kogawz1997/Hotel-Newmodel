import Link from 'next/link';
import { CookieConsent } from '@/components/ui/cookie-consent';
import { PortalChatButton } from '@/components/portal/portal-chat-button';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';
import { PortalBottomNav } from '@/components/portal/PortalBottomNav';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Glass header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-5 h-16">
          <Link href="/portal/bookings" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-2xl flex items-center justify-center shrink-0
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

      <main className="mx-auto max-w-2xl px-4 py-6 pb-28">
        {children}
      </main>

      <PortalBottomNav />
      <CookieConsent />
      <PortalChatButton />
    </div>
  );
}
