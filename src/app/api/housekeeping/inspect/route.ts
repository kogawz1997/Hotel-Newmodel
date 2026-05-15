import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson, dbError } from '@/lib/http/validation';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

const inspectSchema = z.object({
  task_id: z.string().uuid(),
  score: z.number().int().min(1).max(5),
  note: z.string().max(2000).optional().nullable(),
  approved: z.boolean(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotel_id');

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await admin
    .from('housekeeping_tasks')
    .select(
      `id, hotel_id, room_id, assigned_to, status, task_type, priority,
       photo_urls, inspector_id, inspection_score, inspection_note,
       inspected_at, created_at,
       rooms(id, room_no, floor),
       housekeeper:user_profiles!assigned_to(id, full_name)`
    )
    .eq('hotel_id', ctx.hotelId)
    .in('status', ['clean', 'inspected', 'rejected_inspection'])
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return dbError(error);

  // Separate into awaiting and done
  const awaiting = (data || []).filter(
    (t: any) => t.status === 'clean' && t.inspection_score === null
  );
  const passed = (data || []).filter((t: any) => t.status === 'inspected');
  const rejected = (data || []).filter(
    (t: any) => t.status === 'rejected_inspection'
  );

  // Today counts across all
  const all = data || [];
  const todayPassed = all.filter(
    (t: any) =>
      t.status === 'inspected' &&
      t.inspected_at &&
      t.inspected_at.startsWith(today)
  ).length;
  const todayRejected = all.filter(
    (t: any) =>
      t.status === 'rejected_inspection' &&
      t.inspected_at &&
      t.inspected_at.startsWith(today)
  ).length;

  return NextResponse.json({
    tasks: data || [],
    awaiting,
    passed,
    rejected,
    stats: {
      awaiting: awaiting.length,
      passed: todayPassed,
      rejected: todayRejected,
    },
  });
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, inspectSchema);
  if (parsed.error) return parsed.error;

  const { task_id, score, note, approved } = parsed.data;

  const admin = createAdminClient();

  const { data: task } = await admin
    .from('housekeeping_tasks')
    .select('id, hotel_id, status')
    .eq('id', task_id)
    .single();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const ctx = await requireHotelAccess(task.hotel_id, [
    'owner',
    'admin',
    'manager',
    'housekeeping',
    'staff',
  ] as any[]);
  if (ctx.error) return ctx.error;

  const newStatus = approved ? 'inspected' : 'rejected_inspection';

  const { data, error } = await admin
    .from('housekeeping_tasks')
    .update({
      status: newStatus,
      inspection_score: score,
      inspection_note: note ?? null,
      inspector_id: ctx.user.id,
      inspected_at: new Date().toISOString(),
    })
    .eq('id', task_id)
    .eq('hotel_id', ctx.hotelId)
    .select()
    .single();

  if (error || !data) return dbError(error || new Error('Update failed'));

  return NextResponse.json({ task: data });
}
