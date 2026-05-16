/**
 * GET /api/shifts/conflicts?hotelId=&date=YYYY-MM-DD
 * Detect shift scheduling conflicts for a given date:
 * - Same staff assigned to overlapping shifts
 * - Shifts with no staff assigned
 * - Back-to-back shifts with < 8h rest
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

interface Conflict {
  type:       'overlap' | 'no_staff' | 'insufficient_rest';
  severity:   'warning' | 'error';
  staffId?:   string;
  staffName?: string;
  shiftA?:    string;
  shiftB?:    string;
  message:    string;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  const date    = searchParams.get('date') ?? new Date().toISOString().split('T')[0];

  const ctx = await requireHotelAccess(hotelId, [
    'owner', 'admin', 'manager', 'hr_manager', 'hr_staff',
    'housekeeping_manager', 'maintenance_manager', 'front_office_manager',
  ]);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();

  // Get staff shift assignments for the date
  const { data: assignments } = await admin
    .from('staff_shifts')
    .select('*, shift:shift_id(*), staff:staff_id(id, full_name)')
    .eq('hotel_id', ctx.hotelId)
    .eq('date', date);

  const conflicts: Conflict[] = [];

  // Group by staff to find overlaps
  const byStaff = new Map<string, typeof assignments>();
  for (const a of assignments ?? []) {
    const sid = (a.staff as any)?.id;
    if (!sid) continue;
    if (!byStaff.has(sid)) byStaff.set(sid, []);
    byStaff.get(sid)!.push(a);
  }

  for (const [staffId, staffAssignments] of byStaff.entries()) {
    const staffName = (staffAssignments[0]?.staff as any)?.full_name ?? staffId;

    // Sort by start time
    const sorted = [...staffAssignments].sort((a, b) => {
      const startA = (a.shift as any)?.start_time ?? '';
      const startB = (b.shift as any)?.start_time ?? '';
      return startA.localeCompare(startB);
    });

    for (let i = 0; i < sorted.length - 1; i++) {
      const curr = sorted[i];
      const next = sorted[i + 1];
      const currEnd   = (curr.shift as any)?.end_time ?? '';
      const nextStart = (next.shift as any)?.start_time ?? '';

      // Simple string compare works for HH:MM format
      if (currEnd > nextStart) {
        conflicts.push({
          type:      'overlap',
          severity:  'error',
          staffId,
          staffName,
          shiftA:    (curr.shift as any)?.name,
          shiftB:    (next.shift as any)?.name,
          message:   `${staffName} มีกะซ้อนทับ: ${(curr.shift as any)?.name} (สิ้นสุด ${currEnd}) และ ${(next.shift as any)?.name} (เริ่ม ${nextStart})`,
        });
      }

      // Check insufficient rest (< 8 hours between shifts)
      const [ch, cm] = currEnd.split(':').map(Number);
      const [nh, nm] = nextStart.split(':').map(Number);
      const restMinutes = (nh * 60 + nm) - (ch * 60 + cm);
      if (restMinutes > 0 && restMinutes < 480) {
        conflicts.push({
          type:      'insufficient_rest',
          severity:  'warning',
          staffId,
          staffName,
          message:   `${staffName} พักไม่ถึง 8 ชั่วโมง ระหว่าง ${(curr.shift as any)?.name} และ ${(next.shift as any)?.name}`,
        });
      }
    }
  }

  // Find shifts with no assigned staff
  const { data: allShifts } = await admin
    .from('shifts')
    .select('id, name, dept')
    .eq('hotel_id', ctx.hotelId);

  const assignedShiftIds = new Set((assignments ?? []).map((a: any) => a.shift_id));
  for (const shift of allShifts ?? []) {
    if (!assignedShiftIds.has(shift.id)) {
      conflicts.push({
        type:     'no_staff',
        severity: 'warning',
        shiftA:   shift.name,
        message:  `กะ "${shift.name}" (${shift.dept ?? 'ทุกแผนก'}) วันที่ ${date} ยังไม่มีพนักงาน`,
      });
    }
  }

  return NextResponse.json({
    date,
    conflict_count: conflicts.length,
    errors:   conflicts.filter(c => c.severity === 'error').length,
    warnings: conflicts.filter(c => c.severity === 'warning').length,
    conflicts,
  });
}
