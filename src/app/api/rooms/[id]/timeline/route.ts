/**
 * GET /api/rooms/{id}/timeline?limit=50
 * Returns chronological maintenance/housekeeping/reservation history for a room.
 */
import { NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get('limit') || '50'), 200);

  const admin = createAdminClient();

  const { data: room } = await admin
    .from('rooms')
    .select('id, hotel_id, room_number')
    .eq('id', roomId)
    .single();

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  const ctx = await requireHotelAccess(room.hotel_id);
  if (ctx.error) return ctx.error;

  const [
    { data: reservations },
    { data: housekeepingTasks },
    { data: workOrders },
    { data: maintenanceLogs },
  ] = await Promise.all([
    admin
      .from('reservations')
      .select('id, reservation_code, status, check_in, check_out, total_amount, guests(first_name, last_name)')
      .eq('room_id', roomId)
      .order('check_in', { ascending: false })
      .limit(limit),
    admin
      .from('housekeeping_tasks')
      .select('id, task_type, status, priority, created_at, completed_at, inspection_score, photo_urls')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(limit),
    admin
      .from('work_orders')
      .select('id, title, type, status, priority, created_at, resolved_at, sla_deadline')
      .eq('room_no', room.room_number)
      .eq('hotel_id', room.hotel_id)
      .order('created_at', { ascending: false })
      .limit(limit),
    admin
      .from('maintenance_records')
      .select('id, description, performed_at, performed_by, cost')
      .eq('room_id', roomId)
      .order('performed_at', { ascending: false })
      .limit(20)
      .then(r => r)
      .catch(() => ({ data: [] })),
  ]);

  const events: any[] = [
    ...(reservations || []).map((r: any) => ({
      id: r.id,
      type: 'reservation',
      label: `จอง ${r.reservation_code} — ${r.guests?.first_name || ''} ${r.guests?.last_name || ''}`,
      status: r.status,
      date: r.check_in,
      endDate: r.check_out,
      meta: { amount: r.total_amount },
    })),
    ...(housekeepingTasks || []).map((t: any) => ({
      id: t.id,
      type: 'housekeeping',
      label: `แม่บ้าน — ${(t.task_type || '').replace('_', ' ')}`,
      status: t.status,
      date: t.created_at,
      endDate: t.completed_at,
      meta: { score: t.inspection_score, photos: (t.photo_urls || []).length },
    })),
    ...(workOrders || []).map((w: any) => ({
      id: w.id,
      type: 'maintenance',
      label: `ซ่อมบำรุง — ${w.title}`,
      status: w.status,
      date: w.created_at,
      endDate: w.resolved_at,
      meta: { priority: w.priority, sla: w.sla_deadline },
    })),
    ...((maintenanceLogs as any[]) || []).map((m: any) => ({
      id: m.id,
      type: 'maintenance_record',
      label: m.description,
      status: 'completed',
      date: m.performed_at,
      meta: { cost: m.cost },
    })),
  ];

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return NextResponse.json({
    roomId,
    roomNumber: room.room_number,
    events: events.slice(0, limit),
  });
}
