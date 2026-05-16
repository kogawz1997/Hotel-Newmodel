import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

const ALLOWED_ROLES = ['owner', 'admin', 'manager', 'hr_manager', 'hr_staff', 'general_manager'];

async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) return { error: NextResponse.json({ error: 'Hotel not found' }, { status: 404 }) };

  return { user, profile, hotel, admin };
}

export async function GET(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const url = new URL(req.url);
  const staffId = url.searchParams.get('staff_id');
  const completed = url.searchParams.get('completed');

  let query = admin
    .from('onboarding_tasks')
    .select('*, staff:staff_id(id, full_name, role), assignee:assigned_to(id, full_name)')
    .eq('hotel_id', hotel.id)
    .order('due_date', { ascending: true });

  if (staffId) query = query.eq('staff_id', staffId);
  if (completed !== null) query = query.eq('completed', completed === 'true');

  const { data, error } = await query;
  if (error) return apiError(error);
  return NextResponse.json({ tasks: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel, user } = ctx;

  const url = new URL(req.url);
  const taskId = url.searchParams.get('id');

  // PATCH-style: mark complete via POST with ?id=
  if (taskId) {
    const body = await req.json();
    const { completed } = body as { completed: boolean };

    const updates: Record<string, unknown> = { completed };
    if (completed) {
      updates.completed_at = new Date().toISOString();
    } else {
      updates.completed_at = null;
    }

    const { data, error } = await admin
      .from('onboarding_tasks')
      .update(updates)
      .eq('id', taskId)
      .eq('hotel_id', hotel.id)
      .select()
      .single();

    if (error) return apiError(error);
    return NextResponse.json({ task: data });
  }

  // Create new task
  const body = await req.json();
  const { staff_id, title, category, due_date, assigned_to, notes } = body;

  if (!staff_id || !title) {
    return NextResponse.json({ error: 'กรุณาระบุพนักงานและชื่องาน' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('onboarding_tasks')
    .insert({
      hotel_id: hotel.id,
      staff_id,
      title,
      category: category ?? 'general',
      due_date: due_date ?? null,
      completed: false,
      assigned_to: assigned_to ?? user.id,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ task: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const url = new URL(req.url);
  const taskId = url.searchParams.get('id');
  if (!taskId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await req.json();
  const { completed } = body as { completed: boolean };

  const updates: Record<string, unknown> = { completed };
  if (completed) {
    updates.completed_at = new Date().toISOString();
  } else {
    updates.completed_at = null;
  }

  const { data, error } = await admin
    .from('onboarding_tasks')
    .update(updates)
    .eq('id', taskId)
    .eq('hotel_id', hotel.id)
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ task: data });
}
