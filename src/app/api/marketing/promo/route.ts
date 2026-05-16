import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const { data, error } = await ctx.supabase
    .from('promo_codes')
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

  const { code, discount_type, discount_value, min_stay, max_uses, valid_from, valid_until } = body;
  if (!code || !discount_type || discount_value == null) {
    return NextResponse.json({ error: 'code, discount_type, discount_value are required' }, { status: 422 });
  }
  if (!['percent', 'fixed'].includes(discount_type)) {
    return NextResponse.json({ error: 'discount_type must be percent or fixed' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('promo_codes')
    .insert({
      hotel_id: ctx.hotelId,
      code: String(code).toUpperCase().trim(),
      discount_type,
      discount_value: Number(discount_value),
      min_stay: min_stay ? Number(min_stay) : null,
      max_uses: max_uses ? Number(max_uses) : null,
      used_count: 0,
      valid_from: valid_from || null,
      valid_until: valid_until || null,
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
    .from('promo_codes')
    .update({ is_active: Boolean(is_active) })
    .eq('id', id)
    .eq('hotel_id', ctx.hotelId)
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ data });
}
