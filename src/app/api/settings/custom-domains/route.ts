import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id || !['owner', 'admin'].includes(profile.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const { data: domains } = await supabase
    .from('custom_domains')
    .select('id, domain, verified, ssl_active, created_at')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ domains: domains || [] });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id || !['owner', 'admin'].includes(profile.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const body = await request.json();
  const domain = (body.domain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');

  if (!domain || !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)) {
    return NextResponse.json({ error: 'Invalid domain name' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('custom_domains')
    .insert({ hotel_id: hotel.id, domain, verified: false, ssl_active: false })
    .select('id, domain, verified, ssl_active, created_at')
    .single();

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ domain: data }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id || !['owner', 'admin'].includes(profile.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const { error } = await supabase
    .from('custom_domains')
    .delete()
    .eq('id', id)
    .eq('hotel_id', hotel.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
