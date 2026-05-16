import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

const MANAGER_ROLES = ['owner', 'admin', 'manager'];

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();
  if (!hotel) return NextResponse.json([], { status: 200 });

  const url = new URL(req.url);
  const status = url.searchParams.get('status');

  const isManager = MANAGER_ROLES.includes(profile.role);

  let q = supabase
    .from('internal_requests')
    .select('*, requester:user_profiles!requester_id(id, full_name, role), approver:user_profiles!approved_by(id, full_name)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(200);

  // Staff only see their own requests
  if (!isManager) {
    q = q.eq('requester_id', user.id);
  }

  if (status) q = q.eq('status', status);

  const { data, error } = await q;
  if (error) return apiError(error);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();
  if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();
  if (!hotel) return NextResponse.json({ error: 'No hotel found' }, { status: 400 });

  const body = await req.json();
  const { type, title, dept, details } = body;

  if (!type || !title) {
    return NextResponse.json({ error: 'type and title are required' }, { status: 422 });
  }

  const { data, error } = await supabase
    .from('internal_requests')
    .insert({
      hotel_id: hotel.id,
      requester_id: user.id,
      type,
      title,
      dept: dept ?? null,
      details: details ?? {},
      status: 'pending',
    })
    .select('*, requester:user_profiles!requester_id(id, full_name, role)')
    .single();

  if (error) return apiError(error);
  return NextResponse.json(data, { status: 201 });
}
