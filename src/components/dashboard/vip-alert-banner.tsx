'use client';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props { guestName: string; tier?: string; preferences?: string; pastIssues?: string; }

export function VipAlertBanner({ guestName, tier, preferences, pastIssues }: Props) {
  const tierCls: Record<string, string> = {
    platinum: 'bg-slate-800 text-white border-slate-600',
    gold: 'bg-amber-500 text-white border-amber-400',
    silver: 'bg-slate-200 text-slate-800 border-slate-300',
    bronze: 'bg-orange-600 text-white border-orange-500',
  };
  const cls = tierCls[tier?.toLowerCase() ?? ''] ?? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200';
  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-xl border', cls)}>
      <Star className="h-4 w-4 mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-semibold">VIP Guest: {guestName}{tier && <span className="ml-1 text-xs font-normal opacity-80">({tier.toUpperCase()})</span>}</p>
        {preferences && <p className="text-xs opacity-80 mt-0.5">ความต้องการ: {preferences}</p>}
        {pastIssues && <p className="text-xs font-medium mt-0.5">⚠ ประวัติ: {pastIssues}</p>}
      </div>
    </div>
  );
}
