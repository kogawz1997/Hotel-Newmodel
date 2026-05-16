'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Tab {
  href: string;
  label: string;
  icon?: React.ElementType;
  badge?: number;
}

interface TabsNavProps {
  tabs: Tab[];
  className?: string;
  variant?: 'underline' | 'pill';
}

export function TabsNav({ tabs, className, variant = 'underline' }: TabsNavProps) {
  const pathname = usePathname();

  return (
    <nav
      role="tablist"
      aria-label="นำทาง"
      className={cn(
        'flex gap-1',
        variant === 'underline' && 'border-b border-border',
        className,
      )}
    >
      {tabs.map(({ href, label, icon: Icon, badge }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            role="tab"
            aria-selected={active}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
              variant === 'underline' && [
                'border-b-2 -mb-px',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
              ],
              variant === 'pill' && [
                'rounded-lg',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              ],
            )}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
            {label}
            {badge != null && badge > 0 && (
              <span
                className="ml-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-2xs font-bold text-destructive-foreground"
                aria-label={`${badge} รายการ`}
              >
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

interface StaticTabsProps {
  tabs: { key: string; label: string; icon?: React.ElementType; badge?: number }[];
  active: string;
  onChange: (key: string) => void;
  className?: string;
  variant?: 'underline' | 'pill';
}

export function StaticTabs({ tabs, active, onChange, className, variant = 'underline' }: StaticTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="แท็บ"
      className={cn(
        'flex gap-1',
        variant === 'underline' && 'border-b border-border',
        className,
      )}
    >
      {tabs.map(({ key, label, icon: Icon, badge }) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={active === key}
          onClick={() => onChange(key)}
          className={cn(
            'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
            variant === 'underline' && [
              'border-b-2 -mb-px',
              active === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border',
            ],
            variant === 'pill' && [
              'rounded-lg',
              active === key
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
            ],
          )}
        >
          {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
          {label}
          {badge != null && badge > 0 && (
            <span className="ml-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-destructive px-1 text-2xs font-bold text-destructive-foreground">
              {badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
