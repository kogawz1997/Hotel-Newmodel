import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

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
    .from('cashier_sessions')
    .select('id, status, opened_at, closed_at, opening_balance, closing_balance, discrepancy, notes, staff_id, user_profiles(full_name)')
    .eq('hotel_id', hotel.id)
    .order('opened_at', { ascending: false })
    .limit(20);

  if (error) return apiError(error);
  return NextResponse.json({ sessions: data || [] });
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
  const opening_balance = Number(body.opening_balance ?? 0);

  const { data, error } = await admin
    .from('cashier_sessions')
    .insert({
      hotel_id: hotel.id,
      staff_id: user.id,
      opening_balance,
      status: 'open',
      opened_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ ok: true, session: data }, { status: 201 });
}
