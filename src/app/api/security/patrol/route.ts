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

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data, error } = await admin
    .from('work_orders')
    .select('id, title, description, location, status, created_at, assigned_to')
    .eq('hotel_id', hotel.id)
    .eq('type', 'security')
    .like('title', 'Patrol:%')
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString())
    .order('created_at', { ascending: false });

  if (error) return apiError(error);
  return NextResponse.json({ patrols: data || [] });
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
  if (!body.checkpoint_name?.trim()) {
    return NextResponse.json({ error: 'checkpoint_name is required' }, { status: 422 });
  }

  const { data, error } = await admin
    .from('work_orders')
    .insert({
      hotel_id: hotel.id,
      assigned_to: user.id,
      title: `Patrol: ${body.checkpoint_name.trim()}`,
      description: body.notes ?? null,
      location: body.location ?? null,
      type: 'security',
      status: 'completed',
      priority: 'low',
    })
    .select('*')
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ ok: true, patrol: data }, { status: 201 });
}
