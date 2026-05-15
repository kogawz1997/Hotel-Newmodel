import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { askCopilot } from '@/lib/ai/copilot';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { guestId } = await req.json();

  const { data: guest } = await supabase
    .from('guests').select('first_name, last_name, nationality, phone, email, notes')
    .eq('id', guestId).single();

  const guestName = `${(guest as any)?.first_name ?? ''} ${(guest as any)?.last_name ?? ''}`.trim();

  const [{ data: stays }, { data: requests }] = await Promise.all([
    supabase.from('reservations').select('check_in, check_out, room_types(name), status, special_requests').eq('guest_id', guestId).order('check_in', { ascending: false }).limit(5),
    supabase.from('work_orders').select('type, title, status, created_at').eq('guest_name', guestName).order('created_at', { ascending: false }).limit(10),
  ]);

  const prompt = `Analyze this hotel guest and return a JSON summary:
Guest: ${JSON.stringify(guest)}
Stay history (last 5): ${JSON.stringify(stays)}
Service requests (last 10): ${JSON.stringify(requests)}

Return JSON: {
  "summary": "2-3 sentence Thai summary of guest profile",
  "preferences": ["list of inferred preferences"],
  "alerts": ["any concerns or issues to flag"],
  "vip_score": 0-100,
  "recommended_actions": ["actions staff should take on arrival"]
}`;

  const result = await askCopilot(prompt);

  try {
    return NextResponse.json(JSON.parse(result));
  } catch {
    return NextResponse.json({ summary: result, preferences: [], alerts: [], vip_score: 50, recommended_actions: [] });
  }
}
