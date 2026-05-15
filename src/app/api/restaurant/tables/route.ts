import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { z } from 'zod';

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['available', 'occupied', 'reserved', 'cleaning']),
});

export async function GET(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotel_id') || ctx.hotelId;
  const outletId = searchParams.get('outlet_id');

  const admin = createAdminClient();
  let query = admin
    .from('restaurant_tables')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('floor')
    .order('table_no');

  if (outletId) query = query.eq('outlet_id', outletId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { id, status } = parsed.data;
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('restaurant_tables')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
