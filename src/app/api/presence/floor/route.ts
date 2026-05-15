import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { floor, zone } = await req.json();

  await supabase.from('staff_presence')
    .update({ floor, zone, last_seen_at: new Date().toISOString() })
    .eq('user_id', user.id);

  return NextResponse.json({ ok: true });
}
