/**
 * SLA Tracking — P1.4
 * Check breached SLAs and escalate. Called by cron or on-demand.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { queueNotification } from '@/lib/notifications';
import { MGMT_ROLES } from '@/lib/auth/roles';

export async function checkSLABreaches(hotelId: string): Promise<{ breached: number }> {
  const admin = createAdminClient();
  const now = new Date();

  // Check overdue work orders
  const { data: overdueOrders } = await admin
    .from('work_orders')
    .select('id, title, hotel_id, sla_minutes, created_at, assigned_to')
    .eq('hotel_id', hotelId)
    .in('status', ['pending', 'assigned', 'in_progress'])
    .not('sla_minutes', 'is', null);

  let breached = 0;

  for (const order of overdueOrders ?? []) {
    const created = new Date(order.created_at);
    const slaDeadline = new Date(created.getTime() + order.sla_minutes * 60_000);

    if (now > slaDeadline) {
      breached++;
      await queueNotification({
        hotelId:  order.hotel_id,
        type:     'sla_breach',
        priority: 'high',
        roles:    MGMT_ROLES,
        title:    `SLA เกินเวลา: ${order.title}`,
        body:     `Work order "${order.title}" เกิน SLA ${order.sla_minutes} นาทีแล้ว`,
        deepLink: `/dashboard/work-orders`,
        metadata: { work_order_id: order.id, sla_minutes: order.sla_minutes },
      });
    }
  }

  // Check overdue approvals
  const { data: overdueApprovals } = await admin
    .from('approvals')
    .select('id, title, hotel_id, due_at')
    .eq('hotel_id', hotelId)
    .eq('status', 'pending')
    .not('due_at', 'is', null);

  for (const approval of overdueApprovals ?? []) {
    if (approval.due_at && now > new Date(approval.due_at)) {
      breached++;
      await queueNotification({
        hotelId:  approval.hotel_id,
        type:     'approval_sla_breach',
        priority: 'high',
        roles:    MGMT_ROLES,
        title:    `อนุมัติเกินเวลา: ${approval.title}`,
        body:     `คำขออนุมัติ "${approval.title}" เกินกำหนดเวลาแล้ว`,
        deepLink: '/dashboard/notifications',
        metadata: { approval_id: approval.id },
      });

      // Escalate
      await admin
        .from('approvals')
        .update({ status: 'escalated' })
        .eq('id', approval.id)
        .eq('status', 'pending');
    }
  }

  return { breached };
}
