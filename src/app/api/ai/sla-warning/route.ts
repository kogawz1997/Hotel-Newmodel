import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { askCopilot } from '@/lib/ai/copilot';

// GET: ดึงงานที่มีความเสี่ยง SLA breach แล้วให้ AI วิเคราะห์
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotel_id');
  if (!hotelId) return NextResponse.json({ error: 'hotel_id required' }, { status: 400 });

  const now = new Date();
  const soon = new Date(now.getTime() + 15 * 60 * 1000); // งานที่จะ breach ใน 15 นาที

  const { data: atRiskTasks } = await supabase
    .from('work_orders')
    .select('id, type, title, priority, sla_deadline, assigned_to, created_at, user_profiles(full_name)')
    .eq('hotel_id', hotelId)
    .in('status', ['pending', 'assigned', 'in_progress'])
    .lte('sla_deadline', soon.toISOString())
    .order('sla_deadline');

  if (!atRiskTasks?.length) return NextResponse.json({ tasks: [], summary: 'ไม่มีงานที่เสี่ยง SLA' });

  const prompt = `Analyze these hotel tasks at risk of SLA breach. Return JSON:
Tasks: ${JSON.stringify(atRiskTasks)}
Current time: ${now.toISOString()}

Return JSON: {
  "summary": "Thai summary of SLA situation",
  "critical": [{"task_id": "uuid", "minutes_left": N, "action": "recommended action in Thai"}],
  "overall_risk": "low|medium|high|critical"
}`;

  const result = await askCopilot(prompt);

  try {
    return NextResponse.json({ tasks: atRiskTasks, ...JSON.parse(result) });
  } catch {
    return NextResponse.json({ tasks: atRiskTasks, summary: result, overall_risk: 'medium' });
  }
}
