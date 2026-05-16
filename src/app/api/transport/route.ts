import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

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
  const driverId = url.searchParams.get('driver_id');
  const date = url.searchParams.get('date'); // YYYY-MM-DD

  let q = admin
    .from('transport_tasks')
    .select(
      '*, driver:driver_id(id, full_name, role)'
    )
    .eq('hotel_id', hotel.id)
    .order('pickup_time', { ascending: true })
    .limit(200);

  if (status) q = q.eq('status', status);
  if (driverId) q = q.eq('driver_id', driverId);
  if (date) {
    q = q
      .gte('pickup_time', `${date}T00:00:00.000Z`)
      .lt('pickup_time', `${date}T23:59:59.999Z`);
  }

  const { data, error } = await q;
  if (error) return apiError(error);
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

  if (!body.guest_name || !body.pickup_location || !body.dropoff_location || !body.pickup_time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('transport_tasks')
    .insert({
      hotel_id: hotel.id,
      type: body.type ?? 'other',
      guest_name: body.guest_name,
      guest_id: body.guest_id ?? null,
      reservation_id: body.reservation_id ?? null,
      pickup_location: body.pickup_location,
      dropoff_location: body.dropoff_location,
      pickup_time: body.pickup_time,
      vehicle: body.vehicle ?? null,
      driver_id: body.driver_id ?? null,
      passengers: body.passengers ?? 1,
      flight_no: body.flight_no ?? null,
      status: 'scheduled',
      notes: body.notes ?? null,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json(data, { status: 201 });
}
