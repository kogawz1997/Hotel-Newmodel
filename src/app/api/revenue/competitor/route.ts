import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const sinceStr = since.toISOString().split('T')[0];

  const { data, error } = await ctx.supabase
    .from('competitor_rates')
    .select('*')
    .eq('hotel_id', ctx.hotelId)
    .gte('rate_date', sinceStr)
    .order('rate_date', { ascending: false })
    .limit(200);

  if (error) return apiError(error);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { competitor_name, rate_date, room_type, rate, source } = body;
  if (!competitor_name || !rate_date || !room_type || rate == null) {
    return NextResponse.json({ error: 'competitor_name, rate_date, room_type, rate are required' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('competitor_rates')
    .insert({
      hotel_id: ctx.hotelId,
      competitor_name,
      rate_date,
      room_type,
      rate: Number(rate),
      source: source || 'manual',
    })
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ data }, { status: 201 });
}
