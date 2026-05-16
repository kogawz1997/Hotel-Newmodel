import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const { data, error } = await ctx.supabase
    .from('abandoned_bookings')
    .select('*')
    .eq('hotel_id', ctx.hotelId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return apiError(error);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('abandoned_bookings')
    .update({ recovery_sent_at: new Date().toISOString() })
    .eq('id', id)
    .eq('hotel_id', ctx.hotelId)
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ data });
}
