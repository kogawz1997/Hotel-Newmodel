import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const status = body.status ?? 'online';

  const { data: profile } = await supabase
    .from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotel } = await supabase
    .from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) return NextResponse.json({ ok: false });

  await supabase.from('staff_presence').upsert({
    user_id:      user.id,
    hotel_id:     hotel.id,
    status,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });

  return NextResponse.json({ ok: true });
}
