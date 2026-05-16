import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const updates: Record<string, unknown> = {};

  if (body.status) {
    const validStatuses = ['confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 422 });
    }
    updates.status = body.status;

    if (body.status === 'in_progress') {
      updates.started_at = new Date().toISOString();
    }
    if (body.status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }
  }

  if (body.driver_id !== undefined) updates.driver_id = body.driver_id;
  if (body.vehicle !== undefined) updates.vehicle = body.vehicle;
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.pickup_time !== undefined) updates.pickup_time = body.pickup_time;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('transport_tasks')
    .update(updates)
    .eq('id', id)
    .select('*, driver:driver_id(id, full_name)')
    .single();

  if (error) return apiError(error);
  return NextResponse.json(data);
}
