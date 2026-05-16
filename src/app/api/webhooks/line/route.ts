import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { translateText, detectLanguage, type Language } from '@/lib/ai';
import { rateLimit } from '@/lib/security/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const limited = await rateLimit(request, 'webhook.inbound', 60, 60_000);
  if (limited) return limited;

  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-line-signature') || '';

    const { lineAdapter } = await import('@/lib/channels/line');

    if (!lineAdapter.verifyWebhook(bodyText, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(bodyText);
    const messages = await lineAdapter.parseWebhook(body, {});

    const supabase = createAdminClient();

    const destination = body.destination;

    const { data: connection } = await supabase
      .from('channel_connections')
      .select('hotel_id')
      .eq('channel', 'line')
      .eq('external_property_id', destination)
      .eq('status', 'active')
      .single();

    let hotelId = connection?.hotel_id;

    if (!hotelId) {
      const { data: hotels } = await supabase.from('hotels').select('id').limit(1);
      hotelId = hotels?.[0]?.id;
    }

    if (!hotelId) {
      return NextResponse.json(
        { error: 'No hotel configured for this LINE' },
        { status: 400 }
      );
    }

    for (const msg of messages) {
      let { data: conversation } = await supabase
        .from('conversations')
        .select('id, guest_language')
        .eq('hotel_id', hotelId)
        .eq('channel', 'line')
        .eq('channel_user_id', msg.channelUserId)
        .single();

      if (!conversation) {
        const profile = await lineAdapter.getUserProfile?.(msg.channelUserId);
        const detectedLang = detectLanguage(msg.text);

        const { data: newConv } = await supabase
          .from('conversations')
          .insert({
            hotel_id: hotelId,
            channel: 'line',
            channel_user_id: msg.channelUserId,
            guest_name: profile?.name || 'LINE User',
            guest_language: detectedLang,
            status: 'open',
          })
          .select('id, guest_language')
          .single();

        conversation = newConv;
      }

      if (!conversation) continue;

      const detectedLang = (conversation.guest_language ||
        detectLanguage(msg.text)) as Language;

      let translatedText = msg.text;

      if (detectedLang !== 'th' && msg.type === 'text') {
        try {
          const result = await translateText({
            text: msg.text,
            fromLang: detectedLang,
            toLang: 'th',
            context: 'guest_inquiry',
          });

          translatedText = result.translated;
        } catch (e) {
          logger.error('Translation failed', { error: e instanceof Error ? e.message : String(e) });
        }
      }

      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        direction: 'inbound',
        sender_type: 'guest',
        original_text: msg.text,
        original_language: detectedLang,
        translated_text: translatedText,
        message_type: msg.type,
        media_url: msg.mediaUrl,
        channel_message_id: msg.channelMessageId,
        status: 'delivered',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('LINE webhook error', { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'LINE webhook failed',
      },
      { status: 500 }
    );
  }
}