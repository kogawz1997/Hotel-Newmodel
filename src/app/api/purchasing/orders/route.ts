import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

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

function generatePoNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PO${yy}${mm}${dd}-${rand}`;
}

export async function GET(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel } = ctx;

  const url = new URL(req.url);
  const status = url.searchParams.get('status');
  const supplierId = url.searchParams.get('supplier_id');

  let query = admin
    .from('purchase_orders')
    .select('*, supplier:supplier_id(id, name, contact_name, phone), requester:requested_by(id, full_name), approver:approved_by(id, full_name)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (supplierId) query = query.eq('supplier_id', supplierId);

  const { data, error } = await query;
  if (error) return apiError(error);
  return NextResponse.json({ orders: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await getContext();
  if ('error' in ctx) return ctx.error;
  const { admin, hotel, user } = ctx;

  const body = await req.json();
  const { supplier_id, items, notes, currency } = body as {
    supplier_id: string;
    items: Array<{ name: string; qty: number; unit?: string; unit_price: number }>;
    notes?: string;
    currency?: string;
  };

  if (!supplier_id || !items?.length) {
    return NextResponse.json({ error: 'กรุณาระบุผู้ขายและรายการสินค้า' }, { status: 400 });
  }

  const total = items.reduce((sum, item) => sum + (item.qty ?? 0) * (item.unit_price ?? 0), 0);

  const { data, error } = await admin
    .from('purchase_orders')
    .insert({
      hotel_id: hotel.id,
      supplier_id,
      po_number: generatePoNumber(),
      items,
      total_amount: total,
      currency: currency ?? 'THB',
      status: 'draft',
      requested_by: user.id,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ order: data }, { status: 201 });
}
