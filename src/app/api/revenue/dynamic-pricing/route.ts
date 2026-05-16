import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const { data, error } = await ctx.supabase
    .from('dynamic_pricing_rules')
    .select('*')
    .eq('hotel_id', ctx.hotelId)
    .order('priority', { ascending: false });

  if (error) return apiError(error);
  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { name, condition, adjustment, priority } = body;
  if (!name || !condition || !adjustment) {
    return NextResponse.json({ error: 'name, condition, adjustment are required' }, { status: 422 });
  }
  if (!['percent', 'fixed'].includes(adjustment.type)) {
    return NextResponse.json({ error: 'adjustment.type must be percent or fixed' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('dynamic_pricing_rules')
    .insert({
      hotel_id: ctx.hotelId,
      name,
      condition,
      adjustment,
      priority: Number(priority ?? 0),
      is_active: true,
    })
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { id, is_active } = body;
  if (!id || is_active === undefined) {
    return NextResponse.json({ error: 'id and is_active are required' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('dynamic_pricing_rules')
    .update({ is_active: Boolean(is_active) })
    .eq('id', id)
    .eq('hotel_id', ctx.hotelId)
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ data });
}
