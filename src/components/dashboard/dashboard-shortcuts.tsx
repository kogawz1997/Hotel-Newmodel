'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const SHORTCUTS = [
  { key: 'n', label: 'New Booking', href: '/dashboard/reservations' },
  { key: 'c', label: 'Check-in Queue', href: '/dashboard/front-desk' },
  { key: 'i', label: 'Inbox', href: '/dashboard/inbox' },
];

export function DashboardShortcuts() {
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;

      const shortcut = SHORTCUTS.find((item) => item.key === e.key.toLowerCase());
      if (!shortcut) return;
      e.preventDefault();
      router.push(shortcut.href);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-sm font-medium">Keyboard shortcuts</p>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
        {SHORTCUTS.map((item) => (
          <span key={item.key} className="rounded-full border px-2.5 py-1">
            <kbd className="font-semibold uppercase">{item.key}</kbd> = {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
