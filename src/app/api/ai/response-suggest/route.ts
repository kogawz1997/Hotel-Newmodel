import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth/guards';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic();

function detectLanguage(text: string): 'th' | 'en' {
  const thaiPattern = /[฀-๿]/;
  return thaiPattern.test(text) ? 'th' : 'en';
}

function sentimentToTone(sentiment: string): string {
  if (sentiment === 'negative') return 'empathetic and apologetic';
  if (sentiment === 'positive') return 'warm and appreciative';
  return 'professional and helpful';
}

export async function POST(req: NextRequest) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  if (!ctx.profile) return NextResponse.json({ error: 'Profile not found' }, { status: 403 });

  const { conversation_id, message_id, hotel_id } = await req.json();
  if (!conversation_id || !hotel_id) {
    return NextResponse.json({ error: 'conversation_id and hotel_id required' }, { status: 400 });
  }

  const supabase = ctx.supabase;

  let messageText = '';
  let sentiment = 'neutral';

  if (message_id) {
    const { data: message } = await supabase
      .from('messages')
      .select('original_text, translated_text, sentiment')
      .eq('id', message_id)
      .single();

    if (!message) return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    messageText = message.original_text ?? message.translated_text ?? '';
    sentiment = message.sentiment ?? 'neutral';
  } else {
    const { data: conversation } = await supabase
      .from('conversations')
      .select('last_message, sentiment')
      .eq('id', conversation_id)
      .single();

    if (!conversation) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    messageText = conversation.last_message ?? '';
    sentiment = conversation.sentiment ?? 'neutral';
  }

  if (!messageText) return NextResponse.json({ error: 'No message content found' }, { status: 400 });

  const language = detectLanguage(messageText);
  const tone = sentimentToTone(sentiment);
  const langInstruction = language === 'th'
    ? 'ตอบเป็นภาษาไทยเท่านั้น'
    : 'Reply in English only';

  const msg = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are a hotel concierge. Guest message: "${messageText}". Sentiment: ${sentiment}. Draft a professional response in the same language with a ${tone} tone. ${langInstruction}. Reply with only the draft message text, no preamble.`,
    }],
  });

  const draft = msg.content[0].type === 'text' ? msg.content[0].text.trim() : '';

  return NextResponse.json({ draft, language, tone });
}
