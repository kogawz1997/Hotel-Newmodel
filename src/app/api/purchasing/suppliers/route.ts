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
  const isActive = url.searchParams.get('active');
  const category = url.searchParams.get('category');

  let query = admin
    .from('suppliers')
    .select('*')
    .eq('hotel_id', hotel.id)
    .order('name');

  if (isActive !== null) query = query.eq('is_active', isActive === 'true');
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ suppliers: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const body = await req.json();
  const { name, contact_name, phone, email, address, tax_id, category, notes } = body;

  if (!name) {
    return NextResponse.json({ error: 'กรุณาระบุชื่อผู้ขาย' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('suppliers')
    .insert({
      hotel_id: hotel.id,
      name,
      contact_name: contact_name ?? null,
      phone: phone ?? null,
      email: email ?? null,
      address: address ?? null,
      tax_id: tax_id ?? null,
      category: category ?? null,
      rating: null,
      is_active: true,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ supplier: data }, { status: 201 });
}
