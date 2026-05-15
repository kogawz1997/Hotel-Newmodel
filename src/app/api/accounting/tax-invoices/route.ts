import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const { data, error } = await admin
    .from('tax_invoices')
    .select('id, buyer_name, buyer_tax_id, buyer_address, amount, vat_rate, vat_amount, total_amount, issued_at, issued_by, created_at')
    .eq('hotel_id', hotel.id)
    .order('issued_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ invoices: data || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();
  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const body = await request.json();
  if (!body.buyer_name?.trim()) return NextResponse.json({ error: 'buyer_name is required' }, { status: 422 });

  const amount = Number(body.amount ?? 0);
  const vat_rate = Number(body.vat_rate ?? 7);
  const vat_amount = amount * (vat_rate / 100);
  const total_amount = amount + vat_amount;

  const { data, error } = await admin
    .from('tax_invoices')
    .insert({
      hotel_id: hotel.id,
      issued_by: user.id,
      buyer_name: body.buyer_name.trim(),
      buyer_tax_id: body.buyer_tax_id ?? null,
      buyer_address: body.buyer_address ?? null,
      amount,
      vat_rate,
      vat_amount,
      total_amount,
      issued_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, invoice: data }, { status: 201 });
}
