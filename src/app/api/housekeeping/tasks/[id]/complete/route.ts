import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson } from '@/lib/http/validation';
import { createAdminClient } from '@/lib/supabase/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';
import { onHousekeepingDone } from '@/lib/workflows/room-status';
import { writeAuditLog } from '@/lib/audit';

const schema = z.object({
  notes:     z.string().max(1000).optional().nullable(),
  photoUrls: z.array(z.string().url()).max(10).optional().default([]),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;

  const admin = createAdminClient();
  const { data: task } = await admin.from('housekeeping_tasks').select('*').eq('id', id).single();
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const ctx = await requireHotelAccess(task.hotel_id, [
    'owner', 'admin', 'manager',
    'housekeeping_manager', 'housekeeping', 'housekeeper', 'room_inspector', 'staff',
  ]);
  if (ctx.error) return ctx.error;

  const { data, error } = await admin.from('housekeeping_tasks')
    .update({
      status:       'completed',
      completed_at: new Date().toISOString(),
      completed_by: ctx.user.id,
      notes:        parsed.data.notes ?? task.notes,
      photo_urls:   parsed.data.photoUrls,
    })
    .eq('id', id)
    .eq('hotel_id', task.hotel_id)
    .select()
    .single();

  if (error || !data) return error ? apiError(error) : NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });

  // Trigger room-status workflow: cleaning done → pending_inspection
  // (creates inspection task + notification to room_inspector)
  if (task.room_id && task.task_type !== 'inspection') {
    await onHousekeepingDone(task.hotel_id, task.room_id, ctx.user.id);
  }

  await writeAuditLog({
    hotelId:    task.hotel_id,
    actorId:    ctx.user.id,
    action:     'housekeeping_task_completed',
    entityType: 'housekeeping_task',
    entityId:   id,
    metadata:   { task_type: task.task_type, room_id: task.room_id },
  });

  return NextResponse.json({ task: data });
}
