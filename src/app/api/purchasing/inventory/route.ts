import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const ALLOWED_ROLES = [
  'owner', 'admin', 'manager', 'purchasing_manager', 'purchasing_staff',
  'accounting_manager', 'general_manager',
];

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
  const lowStock = url.searchParams.get('low_stock') === 'true';
  const category = url.searchParams.get('category');
  const itemId = url.searchParams.get('id');

  // PATCH by query param
  if (itemId && req.method !== 'GET') {
    // handled by PATCH handler
  }

  let query = admin
    .from('inventory_items')
    .select('*, supplier:supplier_id(id, name)')
    .eq('hotel_id', hotel.id)
    .order('name');

  if (lowStock) {
    // Supabase doesn't support column comparison in filter directly,
    // fetch all and filter client-side
    const { data: all, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const filtered = (all ?? []).filter((i: any) => i.quantity <= i.min_stock);
    return NextResponse.json({ items: filtered });
  }

  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const body = await req.json();
  const { name, sku, category, unit, quantity, min_stock, cost_per_unit, location, supplier_id } = body;

  if (!name) {
    return NextResponse.json({ error: 'กรุณาระบุชื่อสินค้า' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('inventory_items')
    .insert({
      hotel_id: hotel.id,
      name,
      sku: sku ?? null,
      category: category ?? null,
      unit: unit ?? null,
      quantity: quantity ?? 0,
      min_stock: min_stock ?? 0,
      cost_per_unit: cost_per_unit ?? null,
      location: location ?? null,
      supplier_id: supplier_id ?? null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel, user } = ctx;

  const url = new URL(req.url);
  const itemId = url.searchParams.get('id');
  if (!itemId) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const body = await req.json();
  const { adjustment, note, type } = body as {
    adjustment: number; // positive = add, negative = remove
    note?: string;
    type?: 'in' | 'out' | 'adjustment' | 'loss';
  };

  const { data: item } = await admin
    .from('inventory_items')
    .select('quantity')
    .eq('id', itemId)
    .eq('hotel_id', hotel.id)
    .single();

  if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

  const newQty = Math.max(0, (item.quantity ?? 0) + adjustment);

  const now = new Date().toISOString();

  // Create stock transaction
  await admin.from('stock_transactions').insert({
    hotel_id: hotel.id,
    item_id: itemId,
    type: type ?? (adjustment >= 0 ? 'adjustment' : 'adjustment'),
    quantity: Math.abs(adjustment),
    reference_type: 'manual',
    reference_id: null,
    performed_by: user.id,
    note: note ?? null,
    created_at: now,
  });

  const { data: updated, error } = await admin
    .from('inventory_items')
    .update({ quantity: newQty, updated_at: now })
    .eq('id', itemId)
    .eq('hotel_id', hotel.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ item: updated });
}
