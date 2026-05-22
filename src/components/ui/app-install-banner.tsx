'use client';

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'maitri-install-dismissed';

export function AppInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow]                     = useState(false);
  const [isIos, setIsIos]                   = useState(false);
  const [installed, setInstalled]           = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // Already dismissed this session
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    // iOS Safari: no beforeinstallprompt, show manual instructions
    const isIosDevice = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    const isSafari    = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIosDevice && isSafari) {
      setIsIos(true);
      // Show after a small delay so page feels settled
      const t = setTimeout(() => setShow(true), 3500);
      return () => clearTimeout(t);
    }

    // Chrome/Edge/Android: listen for the native prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const t = setTimeout(() => setShow(true), 3500);
      return () => clearTimeout(t);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    sessionStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }

  async function install() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
    setShow(false);
  }

  if (!show || installed) return null;

  return (
    <div
      role="banner"
      className={cn(
        'fixed bottom-[calc(env(safe-area-inset-bottom,0px)+72px)] inset-x-0 z-50 flex justify-center px-4 pointer-events-none',
      )}
    >
      <div
        className={cn(
          'pointer-events-auto w-full max-w-sm',
          'bg-card border border-border rounded-2xl shadow-2xl shadow-black/10',
          'p-4 flex items-start gap-3',
          'animate-in slide-in-from-bottom-4 fade-in duration-300',
        )}
      >
        {/* Icon */}
        <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-amber-500/15 to-amber-700/25 border border-amber-600/25 flex items-center justify-center shrink-0">
          <Smartphone className="h-5 w-5 text-amber-700 dark:text-amber-400" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-[14px] leading-snug">
            เพิ่ม Maitri ลงหน้าจอ
          </p>
          {isIos ? (
            <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
              แตะ <span className="inline-block px-1.5 py-0.5 bg-muted rounded text-[11px] font-medium">แชร์</span> แล้วเลือก <span className="font-medium text-foreground">"เพิ่มในหน้าจอโฮม"</span>
            </p>
          ) : (
            <p className="text-[12px] text-muted-foreground mt-0.5">
              เปิดแอปได้เร็วขึ้น ใช้ได้แบบออฟไลน์
            </p>
          )}

          {!isIos && (
            <button
              onClick={install}
              className="mt-2.5 flex items-center gap-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              <Download className="h-3 w-3" />
              ติดตั้งแอป
            </button>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors shrink-0 -mt-0.5 -mr-0.5"
          aria-label="ปิด"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>
  );
}
