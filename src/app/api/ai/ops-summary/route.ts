import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { askCopilot } from '@/lib/ai/copilot';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { hotelId } = await req.json();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: tasks }, { data: incidents }, { data: attendance }] = await Promise.all([
    supabase.from('work_orders').select('type, status, priority, sla_deadline, created_at').eq('hotel_id', hotelId).gte('created_at', today).order('created_at', { ascending: false }),
    supabase.from('security_incidents').select('type, severity, status').eq('hotel_id', hotelId).gte('created_at', today),
    supabase.from('attendance_records').select('status').eq('hotel_id', hotelId).eq('work_date', today),
  ]);

  const prompt = `Generate a Thai-language morning briefing for hotel GM. Return JSON:
Today's work orders: ${JSON.stringify(tasks)}
Security incidents: ${JSON.stringify(incidents)}
Staff attendance: ${JSON.stringify(attendance)}
Date: ${today}

Return JSON: {
  "headline": "one-sentence summary of today's situation",
  "sla_rate": "X% (Y/Z tasks on time)",
  "key_issues": ["top 3 issues requiring GM attention"],
  "staff_status": "summary of attendance",
  "recommendations": ["2-3 action items for today"],
  "mood": "good|neutral|concern|critical"
}`;

  const result = await askCopilot(prompt);

  try {
    return NextResponse.json(JSON.parse(result));
  } catch {
    return NextResponse.json({ headline: result, key_issues: [], recommendations: [], mood: 'neutral' });
  }
}
