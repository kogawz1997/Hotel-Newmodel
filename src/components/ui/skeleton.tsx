import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border p-4 space-y-3', className)} aria-busy="true" aria-label="กำลังโหลด">
      <Skeleton className="h-4 w-2/5" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-border overflow-hidden', className)} aria-busy="true" aria-label="กำลังโหลด">
      <div className="grid border-b border-border bg-secondary/40 px-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} className="h-3 w-3/5" />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid border-b border-border/50 last:border-0 px-4 py-3" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-3', c === 0 ? 'w-4/5' : 'w-3/5')} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)} aria-busy="true" aria-label="กำลังโหลด">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl p-3 border border-border">
          <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-2.5 w-3/5" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStat({ className }: { className?: string }) {
  return (
    <div className={cn('p-4 rounded-xl border border-border space-y-2', className)} aria-busy="true">
      <Skeleton className="h-3 w-2/5" />
      <Skeleton className="h-7 w-3/5" />
      <Skeleton className="h-2 w-full" />
    </div>
  );
}
