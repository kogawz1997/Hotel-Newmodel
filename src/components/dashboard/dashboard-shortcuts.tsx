'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UserCheck, MessageSquare, CreditCard, FileText } from 'lucide-react';

const SHORTCUTS = [
  { key: 'n', label: 'New Booking', href: '/dashboard/reservations' },
  { key: 'c', label: 'Check-in Queue', href: '/dashboard/front-desk' },
  { key: 'i', label: 'Inbox', href: '/dashboard/inbox' },
  { key: 'p', label: 'Payment', href: '/dashboard/accounting' },
];

const QUICK_ACTIONS = [
  {
    label: 'สร้างการจอง',
    icon: Plus,
    href: '/dashboard/reservations',
    color: 'bg-primary text-primary-foreground hover:bg-primary/90',
  },
  {
    label: 'เช็คอิน',
    icon: UserCheck,
    href: '/dashboard/front-desk',
    color: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  },
  {
    label: 'รับเงิน',
    icon: CreditCard,
    href: '/dashboard/accounting',
    color: 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600',
  },
  {
    label: 'ออก Invoice',
    icon: FileText,
    href: '/dashboard/accounting?tab=invoices',
    color: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  },
  {
    label: 'เปิด Inbox',
    icon: MessageSquare,
    href: '/dashboard/inbox',
    color: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  },
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
    <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
      {/* Quick action buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map(({ label, icon: Icon, href, color }) => (
          <Link
            key={label}
            href={href}
            className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${color}`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        ))}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground border-t border-border pt-3">
        {SHORTCUTS.map((item) => (
          <span key={item.key} className="rounded-full border px-2.5 py-1">
            <kbd className="font-semibold uppercase">{item.key}</kbd> = {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
