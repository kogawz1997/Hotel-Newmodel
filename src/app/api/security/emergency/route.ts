import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

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
  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 422 });
  }

  const { data, error } = await admin
    .from('work_orders')
    .insert({
      hotel_id: hotel.id,
      assigned_to: user.id,
      title: `🚨 Emergency Alert: ${body.message.trim()}`,
      description: body.message.trim(),
      location: body.location ?? null,
      type: 'security',
      priority: 'urgent',
      status: 'pending',
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, workOrderId: data.id }, { status: 201 });
}
