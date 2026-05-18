import { CookieConsent } from '@/components/ui/cookie-consent';
import { PortalChatButton } from '@/components/portal/portal-chat-button';
import { PortalBottomNav } from '@/components/portal/PortalBottomNav';
import { AppInstallBanner } from '@/components/ui/app-install-banner';

export default function PortalShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto w-full max-w-screen-sm pb-24">
        {children}
      </main>
      <PortalBottomNav />
      <AppInstallBanner />
      <CookieConsent />
      <PortalChatButton />
    </div>
  );
}
