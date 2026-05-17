import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';
import { autoRouteConversation } from '@/lib/sentiment/auto-router';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { text, conversation_id, hotel_id, context } = await req.json();
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

  const contextHint = context
    ? `\nบริบทแขก: เคยเข้าพัก ${context.guest_stays ?? 0} ครั้ง${context.is_vip ? ', เป็น VIP' : ''}`
    : '';

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 150,
    messages: [{
      role: 'user',
      content: `วิเคราะห์ sentiment ของข้อความนี้และตอบในรูปแบบ JSON เท่านั้น:${contextHint}\n\n"${text}"\n\nตอบ: {"sentiment":"positive"|"neutral"|"negative","score":0-10,"keywords":["คำสำคัญ"]}`,
    }],
  });

  let result: { sentiment: string; score: number; keywords: string[] };
  try {
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    result = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
  } catch {
    result = { sentiment: 'neutral', score: 5, keywords: [] };
  }

  let routing: { assigned_role: string; sla_deadline: string; rule_name: string } | null = null;

  if (conversation_id && hotel_id) {
    const admin = createAdminClient();
    const decision = await autoRouteConversation(
      conversation_id,
      hotel_id,
      result.sentiment,
      result.score,
      admin
    );

    if (decision) {
      const { data: rule } = await admin
        .from('conversation_routing_rules')
        .select('name')
        .eq('id', decision.rule_id)
        .single();

      routing = {
        assigned_role: decision.assigned_role,
        sla_deadline: decision.sla_deadline.toISOString(),
        rule_name: rule?.name ?? 'Default Negative',
      };
    }
  }

  return NextResponse.json({ ...result, routing });
}
