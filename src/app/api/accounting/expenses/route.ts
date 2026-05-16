import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  let query = admin
    .from('expense_items')
    .select('id, title, amount, expense_date, category, notes, receipt_url, status, submitted_by, approved_by, approved_at, created_at, user_profiles!expense_items_submitted_by_fkey(full_name)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return apiError(error);
  return NextResponse.json({ expenses: data || [] });
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
  if (!body.title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 422 });

  const { data, error } = await admin
    .from('expense_items')
    .insert({
      hotel_id: hotel.id,
      submitted_by: user.id,
      title: body.title.trim(),
      amount: Number(body.amount ?? 0),
      expense_date: body.expense_date ?? new Date().toISOString().slice(0, 10),
      category: body.category ?? null,
      notes: body.notes ?? null,
      receipt_url: body.receipt_url ?? null,
      status: 'pending',
    })
    .select('*')
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ ok: true, expense: data }, { status: 201 });
}
