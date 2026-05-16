/**
 * Centralized notification system.
 * Writes to notification_queue for async delivery and to
 * a staff_notifications table for in-app display.
 */
import { createAdminClient } from '@/lib/supabase/server';
import type { StaffRole } from '@/lib/auth/roles';

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

export interface NotificationPayload {
  hotelId:   string;
  type:      string;
  priority:  NotificationPriority;
  roles:     StaffRole[];             // which roles should see this
  title:     string;
  body:      string;
  metadata?: Record<string, unknown>;
  actorId?:  string;
  deepLink?: string;                  // e.g. /dashboard/housekeeping
}

/**
 * Queue an in-app notification for all staff with matching roles.
 * Non-throwing — notification failure must never crash main flow.
 */
export async function queueNotification(payload: NotificationPayload): Promise<void> {
  try {
    const admin = createAdminClient();

    // Find all active staff in this hotel with matching roles
    const { data: hotel } = await admin
      .from('hotels')
      .select('organization_id')
      .eq('id', payload.hotelId)
      .single();

    if (!hotel) return;

    const { data: staff } = await admin
      .from('user_profiles')
      .select('id')
      .eq('organization_id', hotel.organization_id)
      .eq('active', true)
      .in('role', payload.roles as string[]);

    if (!staff?.length) return;

    const rows = staff.map(s => ({
      hotel_id:   payload.hotelId,
      user_id:    s.id,
      type:       payload.type,
      priority:   payload.priority,
      title:      payload.title,
      body:       payload.body,
      metadata:   payload.metadata ?? {},
      deep_link:  payload.deepLink ?? null,
      actor_id:   payload.actorId ?? null,
      is_read:    false,
      created_at: new Date().toISOString(),
    }));

    await admin.from('staff_notifications').insert(rows);
  } catch (err) {
    console.error('[notifications] queueNotification failed:', err);
  }
}

/**
 * Mark a notification as read.
 */
export async function markNotificationRead(notificationId: string, userId: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from('staff_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId);
}
