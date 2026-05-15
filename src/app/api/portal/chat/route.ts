import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  const { message, history = [] } = await req.json();
  if (!message) return NextResponse.json({ error: 'message required' }, { status: 400 });

  const messages = [
    ...history.slice(-6).map((m: any) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: message },
  ];

  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: 'คุณเป็น AI Concierge ของโรงแรม ช่วยตอบคำถามเกี่ยวกับบริการโรงแรม ห้องพัก อาหาร สิ่งอำนวยความสะดวก และสถานที่ท่องเที่ยวใกล้เคียง ตอบภาษาไทย สั้น กระชับ เป็นมิตร ไม่เกิน 60 คำ',
    messages,
  });

  const reply = response.content[0].type === 'text' ? response.content[0].text : 'ขออภัย ไม่สามารถตอบได้';
  return NextResponse.json({ reply });
}
