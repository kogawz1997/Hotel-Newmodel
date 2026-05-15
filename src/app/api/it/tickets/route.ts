import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/it/tickets — list support_tickets_internal for hotel
export async function GET(_req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json([]);

  const url = new URL(_req.url);
  const status = url.searchParams.get('status');
  const category = url.searchParams.get('category');

  let q = admin
    .from('support_tickets_internal')
    .select(
      '*, requester:user_profiles!requester_id(id, full_name), assignee:user_profiles!assigned_to(id, full_name)'
    )
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (status) q = (q as any).eq('status', status);
  if (category) q = (q as any).eq('category', category);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

// POST /api/it/tickets — create a new support ticket
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json({ error: 'No hotel' }, { status: 404 });

  const body = await req.json();
  const { category, title, description, priority, assigned_to } = body;

  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });

  const { data, error } = await admin
    .from('support_tickets_internal')
    .insert({
      hotel_id: hotel.id,
      requester_id: user.id,
      category: category ?? 'other',
      title,
      description: description ?? null,
      priority: priority ?? 'normal',
      status: 'open',
      assigned_to: assigned_to ?? null,
    })
    .select(
      '*, requester:user_profiles!requester_id(id, full_name), assignee:user_profiles!assigned_to(id, full_name)'
    )
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
