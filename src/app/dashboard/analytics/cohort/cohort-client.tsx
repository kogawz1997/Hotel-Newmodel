'use client';

import { useState, useEffect, useCallback } from 'react';
import { TopBar } from '@/components/layout/top-bar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Users, TrendingUp, Award } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────
interface CohortPeriod {
  period: string;
  period_index: number;
  guests_retained: number;
  retention_rate: number;
}

interface CohortData {
  cohort: string;
  cohort_size: number;
  periods: CohortPeriod[];
}

interface ApiResponse {
  cohorts: CohortData[];
  all_periods: string[];
  metric: string;
  period: string;
}

type PeriodType = 'month' | 'quarter' | 'year';

const PERIOD_OPTIONS: { value: PeriodType; label: string }[] = [
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' },
];

// ── Cell color based on retention rate ──────────────────────────────────────
function retentionCellClass(rate: number): string {
  if (rate === 0) return 'bg-gray-50 text-gray-400';
  if (rate <= 25) return 'bg-blue-100 text-blue-800';
  if (rate <= 50) return 'bg-blue-300 text-blue-900';
  if (rate <= 75) return 'bg-blue-500 text-white';
  return 'bg-blue-700 text-white';
}

// ── Period column label ───────────────────────────────────────────────────────
function periodLabel(index: number, periodType: PeriodType): string {
  if (periodType === 'month') return `เดือนที่ ${index}`;
  if (periodType === 'quarter') return `ไตรมาสที่ ${index}`;
  return `ปีที่ ${index}`;
}

// ── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded-2xl" />
        ))}
      </div>
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="space-y-3">
          {[0, 1, 2].map(row => (
            <div key={row} className="flex gap-2">
              {[0, 1, 2, 3, 4].map(col => (
                <div key={col} className="h-10 bg-gray-200 rounded flex-1" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
export function CohortClient({ hotelId }: { hotelId: string }) {
  const [period, setPeriod] = useState<PeriodType>('month');
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/analytics/cohort?hotel_id=${hotelId}&metric=retention&period=${period}`
      );
      if (!res.ok) throw new Error('โหลดข้อมูลไม่สำเร็จ');
      const json: ApiResponse = await res.json();
      setData(json);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, [hotelId, period]);

  useEffect(() => { load(); }, [load]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const cohorts = data?.cohorts ?? [];

  // Find the max period_index across all cohorts
  const maxPeriodIndex = cohorts.reduce((max, c) =>
    Math.max(max, ...c.periods.map(p => p.period_index), 0), 0
  );
  const periodIndexes = Array.from({ length: maxPeriodIndex + 1 }, (_, i) => i);

  // Build lookup: cohort -> period_index -> CohortPeriod
  const lookup = new Map<string, Map<number, CohortPeriod>>();
  for (const c of cohorts) {
    const inner = new Map<number, CohortPeriod>();
    for (const p of c.periods) {
      inner.set(p.period_index, p);
    }
    lookup.set(c.cohort, inner);
  }

  // Summary: avg 1-month retention (period_index=1)
  const p1Rates = cohorts
    .map(c => lookup.get(c.cohort)?.get(1)?.retention_rate)
    .filter((r): r is number => r !== undefined);
  const avg1MonthRetention =
    p1Rates.length > 0
      ? Math.round(p1Rates.reduce((s, r) => s + r, 0) / p1Rates.length)
      : null;

  // Best performing cohort: highest avg retention across all periods
  const bestCohort = cohorts.length > 0
    ? cohorts.reduce<{ cohort: string; avg: number } | null>((best, c) => {
        const rates = c.periods.map(p => p.retention_rate);
        const avg = rates.length > 0
          ? rates.reduce((s, r) => s + r, 0) / rates.length
          : 0;
        if (!best || avg > best.avg) return { cohort: c.cohort, avg };
        return best;
      }, null)
    : null;

  // ── Empty state ────────────────────────────────────────────────────────────
  const isEmpty = !loading && cohorts.length < 2;

  return (
    <div className="container max-w-7xl py-8 animate-fade-in">
      <TopBar
        title="Cohort Analysis"
        description="วิเคราะห์การกลับมาของลูกค้าตาม Cohort"
      />

      {/* Period selector */}
      <div className="flex gap-2 mb-6">
        {PERIOD_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={cn(
              'px-4 py-1.5 text-sm font-medium rounded-lg border transition-colors',
              period === opt.value
                ? 'border-accent bg-accent/10 text-foreground'
                : 'border-border bg-white text-muted-foreground hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      ) : isEmpty ? (
        <div className="text-center py-20 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-base">ไม่มีข้อมูลเพียงพอ</p>
          <p className="text-sm mt-1">ต้องการข้อมูลการจองอย่างน้อย 2 Cohort เพื่อแสดงการวิเคราะห์</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">Total Cohorts</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">{cohorts.length}</p>
                  <p className="mt-1 text-xs text-muted-foreground">กลุ่มลูกค้าทั้งหมด</p>
                </div>
                <div className="rounded-xl border bg-muted/50 p-2">
                  <Users className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">Avg 1-Month Retention</p>
                  <p className="mt-2 text-2xl font-semibold tracking-tight">
                    {avg1MonthRetention !== null ? `${avg1MonthRetention}%` : '—'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">อัตราการกลับมาเฉลี่ยเดือนที่ 1</p>
                </div>
                <div className="rounded-xl border bg-muted/50 p-2">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="flex items-start justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">Best Performing Cohort</p>
                  <p className="mt-2 text-xl font-semibold tracking-tight truncate max-w-[160px]">
                    {bestCohort?.cohort ?? '—'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {bestCohort ? `Avg ${bestCohort.avg.toFixed(1)}% retention` : 'ยังไม่มีข้อมูล'}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/50 p-2">
                  <Award className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Heatmap Table */}
          <div className="rounded-2xl border border-border bg-white p-5 overflow-x-auto">
            <p className="text-sm font-semibold text-foreground mb-4">Retention Heatmap</p>
            <table className="w-full text-xs border-separate border-spacing-1 min-w-max">
              <thead>
                <tr>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium whitespace-nowrap">
                    Cohort
                  </th>
                  <th className="text-center px-2 py-2 text-muted-foreground font-medium whitespace-nowrap">
                    ขนาด
                  </th>
                  {periodIndexes.map(idx => (
                    <th
                      key={idx}
                      className="text-center px-2 py-2 text-muted-foreground font-medium whitespace-nowrap"
                    >
                      {periodLabel(idx, period)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cohorts.map(cohort => {
                  const innerMap = lookup.get(cohort.cohort);
                  return (
                    <tr key={cohort.cohort}>
                      {/* Cohort label */}
                      <td className="px-3 py-1 font-medium text-foreground whitespace-nowrap">
                        {cohort.cohort}
                      </td>
                      {/* Cohort size */}
                      <td className="px-2 py-1 text-center text-muted-foreground">
                        {cohort.cohort_size.toLocaleString()}
                      </td>
                      {/* Period cells */}
                      {periodIndexes.map(idx => {
                        const cell = innerMap?.get(idx);
                        if (!cell) {
                          // No data for this period (future or no activity)
                          return (
                            <td key={idx} className="px-2 py-1">
                              <div className="min-w-[80px] h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300">
                                —
                              </div>
                            </td>
                          );
                        }
                        if (idx === 0) {
                          // First column: show cohort_size as "100% (N คน)"
                          return (
                            <td key={idx} className="px-2 py-1">
                              <div className="min-w-[80px] h-9 rounded-lg bg-blue-700 text-white flex flex-col items-center justify-center leading-tight">
                                <span className="font-semibold">100%</span>
                                <span className="text-2xs opacity-80">
                                  ({cohort.cohort_size} คน)
                                </span>
                              </div>
                            </td>
                          );
                        }
                        return (
                          <td key={idx} className="px-2 py-1">
                            <div
                              className={cn(
                                'min-w-[80px] h-9 rounded-lg flex flex-col items-center justify-center leading-tight',
                                retentionCellClass(cell.retention_rate)
                              )}
                            >
                              <span className="font-semibold">{cell.retention_rate}%</span>
                              <span className="text-2xs opacity-70">
                                ({cell.guests_retained} คน)
                              </span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className="text-xs text-muted-foreground">ความหนาแน่น:</span>
              {[
                { cls: 'bg-gray-50 border border-gray-200', label: '0%' },
                { cls: 'bg-blue-100', label: '1–25%' },
                { cls: 'bg-blue-300', label: '26–50%' },
                { cls: 'bg-blue-500', label: '51–75%' },
                { cls: 'bg-blue-700', label: '76–100%' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <div className={cn('h-3.5 w-6 rounded', item.cls)} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
