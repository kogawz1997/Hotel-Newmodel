import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

interface CohortRow {
  cohort: string;
  period: string;
  period_index: number;
  guests_retained: number;
  cohort_size: number;
  retention_rate: number;
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const hotelId = sp.get('hotel_id');
  const metric = sp.get('metric') || 'retention';
  const period = sp.get('period') || 'month';

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const { data: reservations, error } = await ctx.supabase
    .from('reservations')
    .select('guest_id, check_in')
    .eq('hotel_id', ctx.hotelId)
    .in('status', ['checked_in', 'checked_out', 'completed'])
    .order('check_in', { ascending: true });

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ cohorts: [], metric, period });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!reservations || reservations.length === 0) {
    return NextResponse.json({ cohorts: [], metric, period });
  }

  const truncDate = (d: string): string => {
    const dt = new Date(d);
    if (period === 'month') return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
    if (period === 'quarter') {
      const q = Math.floor(dt.getMonth() / 3) + 1;
      return `${dt.getFullYear()}-Q${q}`;
    }
    return String(dt.getFullYear());
  };

  const guestFirstPeriod: Record<string, string> = {};
  for (const r of reservations) {
    if (r.guest_id && !guestFirstPeriod[r.guest_id]) {
      guestFirstPeriod[r.guest_id] = truncDate(r.check_in);
    }
  }

  const guestStayPeriods: Record<string, Set<string>> = {};
  for (const r of reservations) {
    if (!r.guest_id) continue;
    if (!guestStayPeriods[r.guest_id]) guestStayPeriods[r.guest_id] = new Set();
    guestStayPeriods[r.guest_id].add(truncDate(r.check_in));
  }

  const cohortSizes: Record<string, number> = {};
  const cohortRetention: Record<string, Record<string, number>> = {};

  for (const [guestId, firstPeriod] of Object.entries(guestFirstPeriod)) {
    cohortSizes[firstPeriod] = (cohortSizes[firstPeriod] || 0) + 1;
    if (!cohortRetention[firstPeriod]) cohortRetention[firstPeriod] = {};

    for (const stayPeriod of guestStayPeriods[guestId]) {
      cohortRetention[firstPeriod][stayPeriod] = (cohortRetention[firstPeriod][stayPeriod] || 0) + 1;
    }
  }

  const allPeriods: string[] = Array.from(
    new Set<string>(reservations.map(r => truncDate(String(r.check_in)))),
  ).sort();

  const cohorts = Object.keys(cohortSizes).sort();
  const rows: CohortRow[] = [];

  for (const cohort of cohorts) {
    const size = cohortSizes[cohort];
    const cohortStart = allPeriods.indexOf(cohort);

    for (let i = cohortStart; i < allPeriods.length; i++) {
      const stayPeriod = allPeriods[i];
      const retained = cohortRetention[cohort]?.[stayPeriod] || 0;
      rows.push({
        cohort,
        period: stayPeriod,
        period_index: i - cohortStart,
        guests_retained: retained,
        cohort_size: size,
        retention_rate: size > 0 ? Math.round((retained / size) * 100) : 0,
      });
    }
  }

  const heatmapData = cohorts.map(cohort => {
    const cohortRows = rows.filter(r => r.cohort === cohort);
    return {
      cohort,
      cohort_size: cohortSizes[cohort],
      periods: cohortRows.map(r => ({
        period: r.period,
        period_index: r.period_index,
        guests_retained: r.guests_retained,
        retention_rate: r.retention_rate,
      })),
    };
  });

  return NextResponse.json({
    cohorts: heatmapData,
    all_periods: allPeriods,
    metric,
    period,
  });
}
