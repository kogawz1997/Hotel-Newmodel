'use client';

import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T extends Record<string, any>> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  rowKey?: (row: T) => string;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  pageSize = 20,
  searchable = false,
  searchPlaceholder = 'ค้นหา...',
  emptyMessage = 'ไม่พบข้อมูล',
  className,
  rowKey,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(row =>
      Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q))
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), 'th', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const slice = sorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  }

  function SortIcon({ colKey }: { colKey: string }) {
    if (sortKey !== colKey) return <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      : <ChevronDown className="h-3.5 w-3.5 text-primary" aria-hidden="true" />;
  }

  return (
    <div className={cn('space-y-3', className)}>
      {searchable && (
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-secondary border-0 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}

      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label="ตารางข้อมูล">
          <thead>
            <tr className="border-b border-border bg-secondary/40">
              {columns.map(col => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-left font-medium text-muted-foreground',
                    col.sortable && 'cursor-pointer select-none hover:text-foreground transition-colors',
                    col.className,
                  )}
                  onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  aria-sort={sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : col.sortable ? 'none' : undefined}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {col.header}
                    {col.sortable && <SortIcon colKey={col.key} />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              slice.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row) : i}
                  className="border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-colors"
                >
                  {columns.map(col => (
                    <td key={col.key} className={cn('px-4 py-3', col.className)}>
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filtered.length > 0 && `แสดง ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} จาก ${filtered.length} รายการ`}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              aria-label="หน้าก่อนหน้า"
              className="rounded p-1.5 hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 font-medium text-foreground">{page} / {totalPages}</span>
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              aria-label="หน้าถัดไป"
              className="rounded p-1.5 hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
