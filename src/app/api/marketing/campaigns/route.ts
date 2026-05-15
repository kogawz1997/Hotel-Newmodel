import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const { data, error } = await ctx.supabase
    .from('marketing_campaigns')
    .select('*')
    .eq('hotel_id', ctx.hotelId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { name, type, channel, audience_segment, description } = body;
  if (!name || !type || !channel) {
    return NextResponse.json({ error: 'name, type, channel are required' }, { status: 422 });
  }

  const VALID_TYPES = ['promotion', 'event', 'loyalty', 'seasonal'];
  const VALID_CHANNELS = ['email', 'LINE', 'sms', 'push'];
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${VALID_TYPES.join(', ')}` }, { status: 422 });
  }
  if (!VALID_CHANNELS.includes(channel)) {
    return NextResponse.json({ error: `channel must be one of: ${VALID_CHANNELS.join(', ')}` }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('marketing_campaigns')
    .insert({
      hotel_id: ctx.hotelId,
      name,
      type,
      channel,
      audience_segment: audience_segment || null,
      status: 'draft',
      stats: { impressions: 0, clicks: 0 },
      content: { description: description || '' },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
