import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { askCopilot } from '@/lib/ai/copilot';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { taskId, hotelId } = await req.json();

  const [{ data: task }, { data: staff }] = await Promise.all([
    supabase.from('work_orders').select('type, title, priority, room_no, sla_deadline').eq('id', taskId).single(),
    supabase.from('staff_availability').select('*, user_profiles(id, full_name, role)').eq('hotel_id', hotelId).eq('is_available', true),
  ]);

  const prompt = `Suggest best staff assignment for this hotel task. Return JSON:
Task: ${JSON.stringify(task)}
Available staff: ${JSON.stringify(staff)}

Return JSON: {
  "recommended_staff_id": "uuid or null",
  "reason": "Thai explanation of why this staff is best",
  "alternatives": [{"staff_id": "uuid", "reason": "..."}],
  "warning": "any concern (e.g. workload too high)"
}`;

  const result = await askCopilot(prompt);

  try {
    return NextResponse.json(JSON.parse(result));
  } catch {
    return NextResponse.json({ recommended_staff_id: null, reason: result, alternatives: [] });
  }
}
