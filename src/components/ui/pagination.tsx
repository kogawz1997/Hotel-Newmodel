import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  pageSize?: number;
  onPage: (p: number) => void;
  className?: string;
  showEdges?: boolean;
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPage, className, showEdges = false }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | '...')[] = [];
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i);
    if (page < totalPages - 2) pages.push('...');
    pages.push(totalPages);
  }

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 text-sm', className)}>
      {totalItems != null && pageSize != null && (
        <p className="text-xs text-muted-foreground">
          แสดง {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} จาก {totalItems} รายการ
        </p>
      )}

      <nav role="navigation" aria-label="หน้า" className="flex items-center gap-0.5 ml-auto">
        {showEdges && (
          <PageBtn label="หน้าแรก" disabled={page === 1} onClick={() => onPage(1)}>
            <ChevronsLeft className="h-3.5 w-3.5" />
          </PageBtn>
        )}
        <PageBtn label="หน้าก่อน" disabled={page === 1} onClick={() => onPage(page - 1)}>
          <ChevronLeft className="h-3.5 w-3.5" />
        </PageBtn>

        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-muted-foreground">…</span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p as number)}
              aria-label={`หน้า ${p}`}
              aria-current={page === p ? 'page' : undefined}
              className={cn(
                'h-8 min-w-[2rem] rounded-lg px-2 text-xs font-medium transition',
                page === p
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-secondary text-muted-foreground hover:text-foreground',
              )}
            >
              {p}
            </button>
          )
        )}

        <PageBtn label="หน้าถัดไป" disabled={page === totalPages} onClick={() => onPage(page + 1)}>
          <ChevronRight className="h-3.5 w-3.5" />
        </PageBtn>
        {showEdges && (
          <PageBtn label="หน้าสุดท้าย" disabled={page === totalPages} onClick={() => onPage(totalPages)}>
            <ChevronsRight className="h-3.5 w-3.5" />
          </PageBtn>
        )}
      </nav>
    </div>
  );
}

function PageBtn({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="h-8 w-8 flex items-center justify-center rounded-lg transition hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground"
    >
      {children}
    </button>
  );
}
