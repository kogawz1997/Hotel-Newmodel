import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

async function getContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) return { error: NextResponse.json({ error: 'No hotel' }, { status: 404 }) };

  return { admin, user, hotel };
}

// GET /api/it/devices — list device_registry for hotel
export async function GET(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const type = url.searchParams.get('type');

  let q = admin
    .from('device_registry')
    .select('*')
    .eq('hotel_id', hotel.id)
    .order('name');

  if (status) q = (q as any).eq('status', status);
  if (type) q = (q as any).eq('type', type);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

// POST /api/it/devices — add a new device
export async function POST(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const body = await req.json();
  const { name, type, model, serial_no, location, ip_address, mac_address, assigned_to, notes } =
    body;

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const { data, error } = await admin
    .from('device_registry')
    .insert({
      hotel_id: hotel.id,
      name,
      type: type ?? 'other',
      model: model ?? null,
      serial_no: serial_no ?? null,
      location: location ?? null,
      ip_address: ip_address ?? null,
      mac_address: mac_address ?? null,
      status: 'online',
      assigned_to: assigned_to ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/it/devices — update device status or info (body: { id, ...fields })
export async function PATCH(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const { data, error } = await admin
    .from('device_registry')
    .update(updates)
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
