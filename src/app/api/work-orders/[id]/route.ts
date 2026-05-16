import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const { data, error } = await supabase.from('work_orders')
    .select('*, task_photos(*), assigned_user:assigned_to(full_name,role)')
    .eq('id', id).single();
  if (error) return apiError(error);
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const updates: any = { updated_at: new Date().toISOString() };
  if (body.status) {
    updates.status = body.status;
    if (body.status === 'in_progress' && !body.started_at) updates.started_at = new Date().toISOString();
    if (body.status === 'done') updates.completed_at = new Date().toISOString();
  }
  if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to;
  if (body.notes !== undefined) updates.notes = body.notes;
  const { data, error } = await supabase.from('work_orders').update(updates).eq('id', id).select().single();
  if (error) return apiError(error);
  return NextResponse.json(data);
}
