import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { review, rating, platform, hotelName } = await req.json();
  if (!review) return NextResponse.json({ error: 'review required' }, { status: 400 });

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `คุณเป็นผู้จัดการโรงแรม${hotelName ? ` ${hotelName}` : ''}. เขียนคำตอบสำหรับรีวิวนี้จาก${platform ?? 'แพลตฟอร์มออนไลน์'} (คะแนน ${rating ?? '?'}/5):\n\n"${review}"\n\nตอบภาษาไทย สุภาพ เป็นมืออาชีพ ไม่เกิน 80 คำ`,
    }],
  });

  const reply = msg.content[0].type === 'text' ? msg.content[0].text : '';
  return NextResponse.json({ reply });
}
