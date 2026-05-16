/**
 * POST /api/housekeeping/tasks/[id]/inspect
 * Body: { passed: boolean; reason?: string }
 *
 * pass  → room available (inspection_pass)
 * fail  → room dirty, re-queue cleaning (inspection_fail)
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson } from '@/lib/http/validation';
import { createAdminClient } from '@/lib/supabase/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { onInspectionPass, onInspectionFail } from '@/lib/workflows/room-status';
import { writeAuditLog } from '@/lib/audit';

const schema = z.object({
  passed: z.boolean(),
  reason: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;

  const admin = createAdminClient();
  const { data: task } = await admin
    .from('housekeeping_tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

  const ctx = await requireHotelAccess(task.hotel_id, [
    'owner', 'admin', 'manager',
    'housekeeping_manager', 'room_inspector',
  ]);
  if (ctx.error) return ctx.error;

  const { passed, reason } = parsed.data;

  await admin.from('housekeeping_tasks')
    .update({
      status:       passed ? 'approved' : 'rejected',
      completed_at: new Date().toISOString(),
      completed_by: ctx.user.id,
      notes:        reason ?? task.notes,
    })
    .eq('id', id)
    .eq('hotel_id', task.hotel_id);

  if (task.room_id) {
    if (passed) {
      await onInspectionPass(task.hotel_id, task.room_id, ctx.user.id);
    } else {
      await onInspectionFail(task.hotel_id, task.room_id, ctx.user.id);
    }
  }

  await writeAuditLog({
    hotelId:    task.hotel_id,
    actorId:    ctx.user.id,
    action:     passed ? 'inspection_passed' : 'inspection_failed',
    entityType: 'housekeeping_task',
    entityId:   id,
    metadata:   { room_id: task.room_id, reason },
  });

  return NextResponse.json({ ok: true, passed });
}
