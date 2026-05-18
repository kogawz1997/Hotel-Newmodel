'use client';

import { AppProgressBar } from 'next-nprogress-bar';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <AppProgressBar
        height="2px"
        color="#D4A055"
        options={{ showSpinner: false }}
        shallowRouting
      />
      {children}
    </div>
  );
}
