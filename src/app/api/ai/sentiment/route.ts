import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { text } = await req.json();
  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 100,
    messages: [{
      role: 'user',
      content: `วิเคราะห์ sentiment ของข้อความนี้และตอบในรูปแบบ JSON เท่านั้น:\n\n"${text}"\n\nตอบ: {"sentiment":"positive"|"neutral"|"negative","score":0-10,"keywords":["คำสำคัญ"]}`,
    }],
  });

  try {
    const raw = msg.content[0].type === 'text' ? msg.content[0].text : '{}';
    const result = JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim());
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ sentiment: 'neutral', score: 5, keywords: [] });
  }
}
