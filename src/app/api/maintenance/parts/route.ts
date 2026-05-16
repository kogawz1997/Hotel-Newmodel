import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

async function getHotelContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

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

  if (!hotel) return { error: NextResponse.json({ error: 'No hotel' }, { status: 404 }) };

  return { supabase, user, profile, hotel };
}

// GET /api/maintenance/parts
// Query params: ?low_stock=true  → only items where quantity <= min_stock
export async function GET(req: NextRequest) {
  const ctx = await getHotelContext();
  if ('error' in ctx) return ctx.error;
  const { supabase, hotel } = ctx;

  const url = new URL(req.url);
  const lowStock = url.searchParams.get('low_stock') === 'true';

  let q = supabase
    .from('parts_inventory')
    .select('*')
    .eq('hotel_id', hotel.id)
    .order('name');

  const { data, error } = await q;
  if (error) return apiError(error);

  const result = lowStock
    ? (data ?? []).filter((p: any) => p.quantity <= p.min_stock)
    : (data ?? []);

  return NextResponse.json(result);
}

// POST /api/maintenance/parts  — add new part or upsert by SKU
export async function POST(req: NextRequest) {
  const ctx = await getHotelContext();
  if ('error' in ctx) return ctx.error;
  const { supabase, hotel } = ctx;

  const body = await req.json();
  const { name, sku, unit, quantity, min_stock, cost, location, supplier } = body;

  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  const { data, error } = await supabase
    .from('parts_inventory')
    .insert({
      hotel_id: hotel.id,
      name,
      sku: sku ?? null,
      unit: unit ?? 'ชิ้น',
      quantity: quantity ?? 0,
      min_stock: min_stock ?? 5,
      cost: cost ?? null,
      location: location ?? null,
      supplier: supplier ?? null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json(data, { status: 201 });
}

// PATCH /api/maintenance/parts  — adjust quantity for a specific part (body: {id, delta})
export async function PATCH(req: NextRequest) {
  const ctx = await getHotelContext();
  if ('error' in ctx) return ctx.error;
  const { supabase, hotel } = ctx;

  const body = await req.json();
  const { id, delta, quantity } = body; // delta = +/- adjustment, or absolute quantity

  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Fetch current
  const { data: part } = await supabase
    .from('parts_inventory')
    .select('quantity')
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .single();

  if (!part) return NextResponse.json({ error: 'Part not found' }, { status: 404 });

  const newQty =
    quantity !== undefined ? quantity : (part.quantity ?? 0) + (delta ?? 0);

  const { data, error } = await supabase
    .from('parts_inventory')
    .update({ quantity: newQty, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json(data);
}
