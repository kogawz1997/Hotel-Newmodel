/**
 * GET /api/attendance/overtime?hotelId=&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Calculate overtime for all staff in date range.
 * Standard = 8h/day, overtime = hours beyond 8h.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  const from    = searchParams.get('from') ?? new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0];
  const to      = searchParams.get('to')   ?? new Date().toISOString().split('T')[0];

  const ctx = await requireHotelAccess(hotelId, [
    'owner', 'admin', 'manager', 'hr_manager', 'hr_staff', 'accounting_manager',
  ]);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();

  const { data: records } = await admin
    .from('attendance')
    .select('*, staff:staff_id(id, full_name, role, department)')
    .eq('hotel_id', ctx.hotelId)
    .gte('clock_in', from + 'T00:00:00')
    .lte('clock_in', to + 'T23:59:59')
    .not('clock_out', 'is', null)
    .order('clock_in', { ascending: true });

  // Aggregate by staff
  const byStaff = new Map<string, {
    staffId:       string;
    fullName:      string;
    role:          string;
    totalMinutes:  number;
    overtimeMinutes: number;
    days:          number;
  }>();

  const STANDARD_MINUTES_PER_DAY = 480; // 8 hours

  for (const rec of records ?? []) {
    const staffId   = (rec.staff as any)?.id ?? rec.staff_id;
    const fullName  = (rec.staff as any)?.full_name ?? 'Unknown';
    const role      = (rec.staff as any)?.role ?? '';
    const clockIn   = new Date(rec.clock_in).getTime();
    const clockOut  = new Date(rec.clock_out).getTime();
    const workedMin = Math.round((clockOut - clockIn) / 60_000);
    const overtime  = Math.max(0, workedMin - STANDARD_MINUTES_PER_DAY);

    if (!byStaff.has(staffId)) {
      byStaff.set(staffId, { staffId, fullName, role, totalMinutes: 0, overtimeMinutes: 0, days: 0 });
    }
    const entry = byStaff.get(staffId)!;
    entry.totalMinutes    += workedMin;
    entry.overtimeMinutes += overtime;
    entry.days            += 1;
  }

  const report = Array.from(byStaff.values())
    .sort((a, b) => b.overtimeMinutes - a.overtimeMinutes)
    .map(e => ({
      ...e,
      totalHours:    +(e.totalMinutes / 60).toFixed(1),
      overtimeHours: +(e.overtimeMinutes / 60).toFixed(1),
      avgHoursPerDay: e.days > 0 ? +((e.totalMinutes / 60) / e.days).toFixed(1) : 0,
    }));

  const totalOvertimeHours = report.reduce((s, r) => s + r.overtimeHours, 0);

  return NextResponse.json({
    from,
    to,
    hotel_id:            ctx.hotelId,
    total_staff:         report.length,
    total_overtime_hours: +totalOvertimeHours.toFixed(1),
    staff_with_overtime: report.filter(r => r.overtimeHours > 0).length,
    report,
  });
}
