/**
 * POST /api/work-orders/ooo — request out-of-order for a room
 * Creates work_order + approval request for manager to approve
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { createApproval } from '@/lib/approvals';
import { writeAuditLog } from '@/lib/audit';

const schema = z.object({
  hotelId:     z.string().uuid(),
  roomId:      z.string().uuid(),
  reason:      z.string().min(10).max(500),
  estimatedDays: z.number().int().min(1).max(90).default(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const ctx = await requireHotelAccess(parsed.data.hotelId, [
    'owner', 'admin', 'manager',
    'maintenance_manager', 'maintenance', 'technician', 'engineering',
  ]);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();

  // Get room number for context
  const { data: room } = await admin
    .from('rooms')
    .select('room_number')
    .eq('id', parsed.data.roomId)
    .eq('hotel_id', ctx.hotelId)
    .single();

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });

  // Create work order for the repair
  const { data: workOrder, error: woError } = await admin
    .from('work_orders')
    .insert({
      hotel_id:    ctx.hotelId,
      type:        'maintenance',
      title:       `OOO Request — ห้อง ${room.room_number}`,
      description: parsed.data.reason,
      priority:    'high',
      status:      'pending',
      requested_by: ctx.user.id,
      source:      'manual',
      sla_minutes: parsed.data.estimatedDays * 24 * 60,
    })
    .select()
    .single();

  if (woError || !workOrder) return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });

  // Create approval request (manager must approve OOO)
  const approval = await createApproval({
    hotelId:       ctx.hotelId,
    type:          'out_of_order',
    title:         `ขออนุมัติปิดห้อง ${room.room_number} (OOO)`,
    description:   `${parsed.data.reason}\n\nระยะเวลาโดยประมาณ: ${parsed.data.estimatedDays} วัน`,
    requestedBy:   ctx.user.id,
    referenceType: 'work_order',
    referenceId:   workOrder.id,
    slaMinutes:    120,
  });

  await writeAuditLog({
    hotelId:    ctx.hotelId,
    actorId:    ctx.user.id,
    action:     'ooo_requested',
    entityType: 'room',
    entityId:   parsed.data.roomId,
    metadata:   { room_number: room.room_number, work_order_id: workOrder.id, approval_id: approval.id },
  });

  return NextResponse.json({ workOrder, approval }, { status: 201 });
}
