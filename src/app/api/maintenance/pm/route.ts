import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getHotelContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) return { error: NextResponse.json({ error: 'No hotel' }, { status: 404 }) };

  return { supabase, user, hotel };
}

// GET /api/maintenance/pm
// Query: ?overdue=true  → only items where next_due_at <= today
export async function GET(req: NextRequest) {
  const ctx = await getHotelContext();
  if ('error' in ctx) return ctx.error;
  const { supabase, hotel } = ctx;

  const url = new URL(req.url);
  const overdue = url.searchParams.get('overdue') === 'true';

  let q = supabase
    .from('preventive_maintenance')
    .select('*, assigned_staff:user_profiles!assigned_to(id, full_name)')
    .eq('hotel_id', hotel.id)
    .eq('is_active', true)
    .order('next_due_at', { ascending: true });

  if (overdue) {
    const today = new Date().toISOString().split('T')[0];
    q = (q as any).lte('next_due_at', today);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

// POST /api/maintenance/pm — create a new PM task
export async function POST(req: NextRequest) {
  const ctx = await getHotelContext();
  if ('error' in ctx) return ctx.error;
  const { supabase, hotel } = ctx;

  const body = await req.json();
  const {
    title,
    description,
    equipment_type,
    location,
    frequency_days,
    assigned_to,
    checklist,
  } = body;

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
  if (!frequency_days || frequency_days <= 0)
    return NextResponse.json({ error: 'frequency_days must be > 0' }, { status: 400 });

  // Compute first next_due_at = today + frequency_days
  const today = new Date();
  const nextDue = new Date(today);
  nextDue.setDate(today.getDate() + Number(frequency_days));

  const { data, error } = await supabase
    .from('preventive_maintenance')
    .insert({
      hotel_id: hotel.id,
      title,
      description: description ?? null,
      equipment_type: equipment_type ?? null,
      location: location ?? null,
      frequency_days: Number(frequency_days),
      last_done_at: null,
      next_due_at: nextDue.toISOString().split('T')[0],
      assigned_to: assigned_to ?? null,
      checklist: checklist ?? null,
      is_active: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/maintenance/pm — mark a task as done (body: { id })
export async function PATCH(req: NextRequest) {
  const ctx = await getHotelContext();
  if ('error' in ctx) return ctx.error;
  const { supabase, hotel } = ctx;

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Fetch frequency_days to compute next_due_at
  const { data: pm } = await supabase
    .from('preventive_maintenance')
    .select('frequency_days')
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .single();

  if (!pm) return NextResponse.json({ error: 'PM task not found' }, { status: 404 });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const nextDue = new Date(today);
  nextDue.setDate(today.getDate() + pm.frequency_days);
  const nextDueStr = nextDue.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('preventive_maintenance')
    .update({
      last_done_at: todayStr,
      next_due_at: nextDueStr,
      ...updates,
    })
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
