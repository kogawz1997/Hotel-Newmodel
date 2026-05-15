import type { Metadata, Viewport } from 'next';
import { unstable_cache } from 'next/cache';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { PwaRegister } from '@/components/providers/pwa-register';
import './globals.css';

export const dynamic = 'force-dynamic';

const fontVariables = 'font-display-fallback font-sans-fallback font-mono-fallback';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

const DEFAULT_ICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='%23C66A30' d='M4 20V4h4l4 8 4-8h4v16h-3V9l-3 6h-4L7 9v11H4z'/></svg>";
const DEFAULT_DESCRIPTION = 'AI-first property management for Thai hospitality. Multi-language inbox, channel manager, compliance — built for the way modern hotels work.';

const getSiteConfig = unstable_cache(
  async () => {
    try {
      const { createAdminClient } = await import('@/lib/supabase/server');
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('platform_config')
        .select('key, value')
        .in('key', ['general', 'site_content']);
      const map: Record<string, Record<string, string>> = {};
      for (const row of data ?? []) map[row.key] = row.value as Record<string, string>;
      return map;
    } catch {
      return {};
    }
  },
  ['site-config'],
  { revalidate: 60 },
);

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const general = config.general ?? {};
  const content = config.site_content ?? {};
  const appName = general.app_name || 'Maitri';
  const description = content.site_description || DEFAULT_DESCRIPTION;
  const faviconUrl = content.favicon_url || '';

  return {
    metadataBase: new URL(appUrl),
    title: { default: `${appName} — Hotel Operating System`, template: `%s · ${appName}` },
    description,
    keywords: ['hotel management', 'PMS', 'Thailand', 'ระบบโรงแรม', 'hotel software'],
    authors: [{ name: appName }],
    manifest: '/manifest.webmanifest',
    appleWebApp: { capable: true, title: appName, statusBarStyle: 'default' },
    alternates: { canonical: '/' },
    openGraph: {
      title: `${appName} — Hotel Operating System`,
      description,
      type: 'website',
      locale: 'th_TH',
      images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: `${appName} preview` }],
    },
    twitter: { card: 'summary_large_image' },
    icons: {
      icon: faviconUrl || DEFAULT_ICON,
    },
  };
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FAF7F2' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1410' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning
      className={fontVariables}>
      <head>
        {/* Prevent FOUC for dark mode */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('maitri-theme') || 'system';
              var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
              if (isDark) document.documentElement.classList.add('dark');
            } catch(e){}
          })();
        `}} />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <LocaleProvider>
            {children}
            <PwaRegister />
            <Toaster
              position="bottom-right"
              richColors
              toastOptions={{
                style: {
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--card-foreground))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                },
              }}
            />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
