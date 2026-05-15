import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('user_profiles').select('organization_id, role').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) return NextResponse.json([]);
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');
  const assignedToMe = url.searchParams.get('assigned_to') === 'me';
  let q = supabase.from('work_orders')
    .select('*, assigned_user:assigned_to(full_name, role)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(100);
  if (status) q = q.eq('status', status);
  if (type) q = q.eq('type', type);
  if (assignedToMe) q = q.eq('assigned_to', user.id);
  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) return NextResponse.json({ error: 'No hotel' }, { status: 400 });
  const body = await req.json();
  const slaMap: Record<string, number> = { housekeeping:45, maintenance:60, room_service:30, concierge:20, security:10, transport:15, bellboy:10, fnb:25, spa:0, other:30 };
  const slaMinutes = slaMap[body.type] ?? 30;
  const slaDeadline = slaMinutes > 0 ? new Date(Date.now() + slaMinutes * 60000).toISOString() : null;
  const { data, error } = await supabase.from('work_orders').insert({
    hotel_id: hotel.id, requested_by: user.id,
    type: body.type ?? 'other', title: body.title, description: body.description ?? null,
    room_no: body.room_no ?? null, priority: body.priority ?? 'normal',
    status: 'pending', sla_minutes: slaMinutes, sla_deadline: slaDeadline,
    source: body.source ?? 'manual', notes: body.notes ?? null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
