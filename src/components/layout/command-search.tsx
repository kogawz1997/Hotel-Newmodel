'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Search, X, User, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CommandSearchItem = {
  href: string;
  label: string;
  group?: string;
  keywords?: string;
};

type GuestResult = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  href: string;
};

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function CommandSearch({ items }: { items: CommandSearchItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [guests, setGuests] = useState<GuestResult[]>([]);
  const [loadingGuests, setLoadingGuests] = useState(false);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Dynamic guest search for phone/email/name queries
  useEffect(() => {
    const needle = debouncedQuery.trim();
    if (needle.length < 2) {
      setGuests([]);
      return;
    }
    // Only search guests if query looks like email, phone, or doesn't match menu items well
    const looksLikeContactInfo = /[@+\d]/.test(needle) || needle.length >= 4;
    if (!looksLikeContactInfo) return;

    setLoadingGuests(true);
    fetch(`/api/search/guests?q=${encodeURIComponent(needle)}`)
      .then((r) => r.ok ? r.json() : { guests: [] })
      .then((d) => setGuests(d.guests || []))
      .catch(() => setGuests([]))
      .finally(() => setLoadingGuests(false));
  }, [debouncedQuery]);

  const menuResults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items.slice(0, 12);
    return items
      .filter((item) =>
        `${item.label} ${item.group || ''} ${item.keywords || ''} ${item.href}`
          .toLowerCase()
          .includes(needle)
      )
      .slice(0, 10);
  }, [items, query]);

  const hasResults = menuResults.length > 0 || guests.length > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-md hover:bg-secondary transition-colors"
      >
        <Search className="h-3 w-3" />
        <span className="flex-1 text-left">ค้นหาเมนู แขก...</span>
        <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-secondary rounded">⌘K</kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/70 p-4 backdrop-blur-sm"
          onMouseDown={() => setOpen(false)}
        >
          <div
            className="mx-auto mt-16 max-w-xl overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lg)]"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b border-border px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="พิมพ์ชื่อเมนู ชื่อแขก อีเมล เบอร์โทร..."
                className="flex-1 bg-transparent text-sm outline-none"
              />
              {loadingGuests && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {!hasResults && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  ไม่พบเมนูหรือแขกที่ค้นหา
                </div>
              )}

              {/* Guest results */}
              {guests.length > 0 && (
                <div className="mb-2">
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    แขก
                  </p>
                  {guests.map((guest) => (
                    <Link
                      key={guest.id}
                      href={guest.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition hover:bg-secondary"
                    >
                      <User className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{guest.name || '—'}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {[guest.email, guest.phone].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              {/* Menu results */}
              {menuResults.length > 0 && (
                <div>
                  {guests.length > 0 && (
                    <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      เมนู
                    </p>
                  )}
                  {menuResults.map((item, index) => (
                    <Link
                      key={`${item.href}-${index}`}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center justify-between rounded-xl px-3 py-2 text-sm transition hover:bg-secondary',
                        index === 0 && guests.length === 0 && 'bg-secondary/60'
                      )}
                    >
                      <span className="font-medium">{item.label}</span>
                      {item.group && (
                        <span className="text-xs text-muted-foreground">{item.group}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
