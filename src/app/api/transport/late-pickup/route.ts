/**
 * GET /api/transport/late-pickup?hotelId=&windowMinutes=15
 * Returns transport tasks whose pickup_time is within the next N minutes
 * but status is still 'pending' (driver not confirmed).
 * Also sends a high-priority notification to concierge / transport_driver.
 *
 * Intended to be called by a cron/scheduled job every 5 minutes.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { queueNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId       = searchParams.get('hotelId');
  const windowMinutes = Math.min(Number(searchParams.get('windowMinutes') ?? 15), 120);

  const ctx = await requireHotelAccess(hotelId, [
    'owner', 'admin', 'manager', 'concierge', 'transport_driver',
  ]);
  if (ctx.error) return ctx.error;

  const admin    = createAdminClient();
  const now      = new Date();
  const cutoff   = new Date(now.getTime() + windowMinutes * 60_000);

  const { data: tasks, error } = await admin
    .from('transport_tasks')
    .select('id, guest_name, pickup_location, dropoff_location, pickup_time, driver_id, vehicle_plate, notes')
    .eq('hotel_id', ctx.hotelId)
    .eq('status', 'pending')
    .gte('pickup_time', now.toISOString())
    .lte('pickup_time', cutoff.toISOString())
    .order('pickup_time', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const late = tasks ?? [];

  if (late.length > 0) {
    for (const task of late) {
      const pickupTime = new Date(task.pickup_time).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
      await queueNotification({
        hotelId:  ctx.hotelId!,
        type:     'transport_late_pickup',
        priority: 'high',
        roles:    ['concierge', 'transport_driver', 'manager'],
        title:    `รับส่งใกล้ถึงเวลา — ${task.guest_name ?? 'แขก'}`,
        body:     `Pick-up ${pickupTime} → ${task.dropoff_location ?? '-'} ยังไม่ยืนยัน`,
        deepLink: '/dashboard/transport',
        metadata: { task_id: task.id, pickup_time: task.pickup_time },
      });
    }
  }

  return NextResponse.json({
    hotel_id:       ctx.hotelId,
    window_minutes: windowMinutes,
    late_count:     late.length,
    tasks:          late,
    notified:       late.length > 0,
  });
}
