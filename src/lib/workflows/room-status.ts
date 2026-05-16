/**
 * Room Status Automation — P1.6
 *
 * All room status transitions go through this module.
 * Each transition writes: room_status_event + audit_log + notification (if needed).
 *
 * Triggers:
 *  check_in          → occupied
 *  checkout          → dirty  + checkout HK tasks
 *  housekeeping_done → pending_inspection
 *  inspection_pass   → available
 *  inspection_fail   → dirty  (re-queue)
 *  ooo_request       → out_of_order (blocks inventory)
 *  ooo_resolved      → pending_inspection
 */
import { createAdminClient } from '@/lib/supabase/server';
import { createHousekeepingTask } from '@/lib/housekeeping/auto-tasks';
import { writeAuditLog } from '@/lib/audit';
import { queueNotification } from '@/lib/notifications';

export type RoomStatus =
  | 'available'
  | 'occupied'
  | 'dirty'
  | 'cleaning'
  | 'pending_inspection'
  | 'out_of_order'
  | 'blocked';

type TransitionTrigger =
  | 'check_in'
  | 'checkout'
  | 'housekeeping_start'
  | 'housekeeping_done'
  | 'inspection_pass'
  | 'inspection_fail'
  | 'maintenance_ooo'
  | 'maintenance_fixed'
  | 'manual'
  | 'system';

interface TransitionOptions {
  hotelId: string;
  roomId: string;
  trigger: TransitionTrigger;
  actorId?: string;
  reservationId?: string;
  workOrderId?: string;
  notes?: string;
}

const TRIGGER_TARGET: Record<TransitionTrigger, RoomStatus> = {
  check_in:           'occupied',
  checkout:           'dirty',
  housekeeping_start: 'cleaning',
  housekeeping_done:  'pending_inspection',
  inspection_pass:    'available',
  inspection_fail:    'dirty',
  maintenance_ooo:    'out_of_order',
  maintenance_fixed:  'pending_inspection',
  manual:             'available',
  system:             'available',
};

export async function transitionRoomStatus(opts: TransitionOptions): Promise<{ ok: boolean; newStatus: RoomStatus }> {
  const admin = createAdminClient();

  const { data: room } = await admin
    .from('rooms')
    .select('id, room_number, status, hotel_id')
    .eq('id', opts.roomId)
    .eq('hotel_id', opts.hotelId)
    .single();

  if (!room) throw new Error(`Room ${opts.roomId} not found`);

  const fromStatus = room.status as RoomStatus;
  const toStatus = TRIGGER_TARGET[opts.trigger];

  // Update room status
  await admin
    .from('rooms')
    .update({ status: toStatus, updated_at: new Date().toISOString() })
    .eq('id', opts.roomId);

  // Write room_status_event
  await admin.from('room_status_events').insert({
    hotel_id:       opts.hotelId,
    room_id:        opts.roomId,
    from_status:    fromStatus,
    to_status:      toStatus,
    triggered_by:   opts.trigger,
    actor_id:       opts.actorId || null,
    reservation_id: opts.reservationId || null,
    work_order_id:  opts.workOrderId || null,
    notes:          opts.notes || null,
  });

  // Write audit log
  await writeAuditLog({
    hotelId:    opts.hotelId,
    actorId:    opts.actorId,
    action:     'room_status_changed',
    entityType: 'room',
    entityId:   opts.roomId,
    metadata:   { from: fromStatus, to: toStatus, trigger: opts.trigger, room_number: room.room_number },
  });

  // Side-effects per trigger
  await handleSideEffects(opts, toStatus, admin);

  return { ok: true, newStatus: toStatus };
}

async function handleSideEffects(
  opts: TransitionOptions,
  newStatus: RoomStatus,
  admin: ReturnType<typeof createAdminClient>
) {
  const now = new Date().toISOString();

  switch (opts.trigger) {
    case 'checkout': {
      // Create housekeeping tasks (checkout_clean + lost_found_check)
      await createHousekeepingTask({
        hotelId: opts.hotelId,
        roomId:  opts.roomId,
        type:    'checkout_clean',
        priority: 'high',
        reservationId: opts.reservationId,
        scheduledFor: now,
      });
      await createHousekeepingTask({
        hotelId: opts.hotelId,
        roomId:  opts.roomId,
        type:    'lost_found_check',
        reservationId: opts.reservationId,
      });
      // Notify housekeeping manager
      await queueNotification({
        hotelId:  opts.hotelId,
        type:     'room_dirty',
        priority: 'high',
        roles:    ['housekeeping_manager', 'housekeeper', 'housekeeping'],
        title:    'ห้องรอทำความสะอาด',
        body:     `ห้อง ${opts.roomId} ต้องการทำความสะอาดหลัง checkout`,
        metadata: { room_id: opts.roomId, trigger: 'checkout' },
      });
      break;
    }

    case 'housekeeping_done': {
      // Create inspection task
      await createHousekeepingTask({
        hotelId: opts.hotelId,
        roomId:  opts.roomId,
        type:    'inspection',
        priority: 'normal',
        scheduledFor: now,
      });
      await queueNotification({
        hotelId:  opts.hotelId,
        type:     'room_ready_inspect',
        priority: 'normal',
        roles:    ['housekeeping_manager', 'room_inspector'],
        title:    'ห้องรอตรวจ',
        body:     `ห้อง ${opts.roomId} ทำความสะอาดเสร็จแล้ว รอการตรวจ`,
        metadata: { room_id: opts.roomId },
      });
      break;
    }

    case 'inspection_pass': {
      await queueNotification({
        hotelId:  opts.hotelId,
        type:     'room_available',
        priority: 'normal',
        roles:    ['front_desk', 'front_office_manager', 'receptionist'],
        title:    'ห้องพร้อมแล้ว',
        body:     `ห้อง ${opts.roomId} ผ่านการตรวจแล้ว พร้อม check-in`,
        metadata: { room_id: opts.roomId },
      });
      break;
    }

    case 'inspection_fail': {
      // Re-queue for housekeeping
      await createHousekeepingTask({
        hotelId: opts.hotelId,
        roomId:  opts.roomId,
        type:    'checkout_clean',
        priority: 'high',
        notes:   'ไม่ผ่านการตรวจ ต้องทำซ้ำ',
        scheduledFor: now,
      });
      break;
    }

    case 'maintenance_ooo': {
      // Block room from availability
      await admin.from('rooms').update({ is_blocked: true }).eq('id', opts.roomId);
      await queueNotification({
        hotelId:  opts.hotelId,
        type:     'room_ooo',
        priority: 'high',
        roles:    ['front_desk', 'front_office_manager', 'manager', 'admin'],
        title:    'ห้องปิดซ่อม (OOO)',
        body:     `ห้อง ${opts.roomId} ถูกปิดเพื่อซ่อมบำรุง`,
        metadata: { room_id: opts.roomId, work_order_id: opts.workOrderId },
      });
      break;
    }

    case 'maintenance_fixed': {
      // Unblock room, create inspection task
      await admin.from('rooms').update({ is_blocked: false }).eq('id', opts.roomId);
      await createHousekeepingTask({
        hotelId: opts.hotelId,
        roomId:  opts.roomId,
        type:    'maintenance_clean',
        priority: 'high',
        scheduledFor: now,
      });
      break;
    }
  }
}

/** Convenience wrappers */
export const onCheckIn = (hotelId: string, roomId: string, actorId: string, reservationId: string) =>
  transitionRoomStatus({ hotelId, roomId, trigger: 'check_in', actorId, reservationId });

export const onCheckout = (hotelId: string, roomId: string, actorId: string, reservationId: string) =>
  transitionRoomStatus({ hotelId, roomId, trigger: 'checkout', actorId, reservationId });

export const onHousekeepingDone = (hotelId: string, roomId: string, actorId: string) =>
  transitionRoomStatus({ hotelId, roomId, trigger: 'housekeeping_done', actorId });

export const onInspectionPass = (hotelId: string, roomId: string, actorId: string) =>
  transitionRoomStatus({ hotelId, roomId, trigger: 'inspection_pass', actorId });

export const onInspectionFail = (hotelId: string, roomId: string, actorId: string) =>
  transitionRoomStatus({ hotelId, roomId, trigger: 'inspection_fail', actorId });

export const onMaintenanceOOO = (hotelId: string, roomId: string, actorId: string, workOrderId: string) =>
  transitionRoomStatus({ hotelId, roomId, trigger: 'maintenance_ooo', actorId, workOrderId });

export const onMaintenanceFixed = (hotelId: string, roomId: string, actorId: string, workOrderId: string) =>
  transitionRoomStatus({ hotelId, roomId, trigger: 'maintenance_fixed', actorId, workOrderId });
