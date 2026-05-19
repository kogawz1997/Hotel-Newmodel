import { CookieConsent } from '@/components/ui/cookie-consent';
import { PortalChatButton } from '@/components/portal/portal-chat-button';
import { PortalBottomNav } from '@/components/portal/PortalBottomNav';
import { PortalSidebar } from '@/components/portal/PortalSidebar';
import { AppInstallBanner } from '@/components/ui/app-install-banner';

export default function PortalShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background text-foreground">
      {/* Desktop sidebar — hidden on mobile */}
      <PortalSidebar />

      {/* Main content — full width on mobile, offset by sidebar on desktop */}
      <main className="w-full pb-24 lg:ml-64 lg:pb-12">
        {children}
      </main>

      {/* Bottom nav — hidden on desktop (sidebar takes over) */}
      <PortalBottomNav />
      <AppInstallBanner />
      <CookieConsent />
      <PortalChatButton />
    </div>
  );
}
