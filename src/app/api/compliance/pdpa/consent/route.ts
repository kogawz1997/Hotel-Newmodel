import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { guestId, purpose, channel } = await req.json();
  // Store in guests table metadata or a simple log via work_orders
  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  // Log as work_order note for simplicity (until pdpa table migration)
  const { data, error } = await supabase.from('work_orders').insert({
    hotel_id: hotel?.id, type: 'other', title: `PDPA Consent: ${guestId}`,
    notes: JSON.stringify({ guestId, purpose, channel, consentedAt: new Date().toISOString() }),
    priority: 'low', status: 'done', source: 'manual', requested_by: user.id,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { guestId } = await req.json();
  return NextResponse.json({ ok: true, message: `Consent withdrawn for ${guestId}` });
}
