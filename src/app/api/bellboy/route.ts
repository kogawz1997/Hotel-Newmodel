import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json([]);

  const admin = createAdminClient();
  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const assignedTo = url.searchParams.get('assigned_to'); // 'me' or a user id

  let q = admin
    .from('luggage_tasks')
    .select('*, assignee:assigned_to(id, full_name)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (status) q = q.eq('status', status);
  if (assignedTo === 'me') q = q.eq('assigned_to', user.id);
  else if (assignedTo) q = q.eq('assigned_to', assignedTo);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json({ error: 'No hotel' }, { status: 400 });

  const body = await req.json();

  if (!body.type || !body.guest_name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('luggage_tasks')
    .insert({
      hotel_id: hotel.id,
      type: body.type,
      room_no: body.room_no ?? null,
      guest_name: body.guest_name,
      guest_id: body.guest_id ?? null,
      reservation_id: body.reservation_id ?? null,
      item_count: body.item_count ?? 1,
      description: body.description ?? null,
      from_location: body.from_location ?? null,
      to_location: body.to_location ?? null,
      status: 'pending',
      notes: body.notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
