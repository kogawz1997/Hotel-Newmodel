import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';
import { onMaintenanceOOO, onMaintenanceFixed } from '@/lib/workflows/room-status';
import { writeAuditLog } from '@/lib/audit';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: wo } = await admin.from('work_orders').select('hotel_id').eq('id', id).single();
  if (!wo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ctx = await requireHotelAccess(wo.hotel_id);
  if (ctx.error) return ctx.error;

  const { data, error } = await admin
    .from('work_orders')
    .select('*, task_attachments(*), assigned_user:assigned_to(full_name,role)')
    .eq('id', id)
    .single();

  if (error) return apiError(error);
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: wo } = await admin
    .from('work_orders')
    .select('hotel_id, room_no, status')
    .eq('id', id)
    .single();

  if (!wo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const ctx = await requireHotelAccess(wo.hotel_id, [
    'owner', 'admin', 'manager',
    'maintenance_manager', 'maintenance', 'technician', 'engineering',
    'front_desk', 'front_office_manager',
  ]);
  if (ctx.error) return ctx.error;

  const body = await req.json();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status) {
    updates.status = body.status;
    if (body.status === 'in_progress' && !body.started_at) updates.started_at = new Date().toISOString();
    if (body.status === 'done') updates.completed_at = new Date().toISOString();
  }
  if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
  if (body.notes !== undefined) updates.notes = body.notes;

  const { data, error } = await admin.from('work_orders').update(updates).eq('id', id).select().single();
  if (error) return apiError(error);

  // Room status automation for OOO
  if (body.status && body.room_id) {
    if (body.status === 'in_progress' && body.ooo === true) {
      await onMaintenanceOOO(wo.hotel_id, body.room_id, ctx.user.id, id);
    } else if (body.status === 'done' && body.ooo === true) {
      await onMaintenanceFixed(wo.hotel_id, body.room_id, ctx.user.id, id);
    }
  }

  await writeAuditLog({
    hotelId:    wo.hotel_id,
    actorId:    ctx.user.id,
    action:     'work_order_updated',
    entityType: 'work_order',
    entityId:   id,
    metadata:   { status: body.status, assigned_to: body.assigned_to },
  });

  return NextResponse.json(data);
}
