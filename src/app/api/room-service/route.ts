import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { z } from 'zod';

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['pending', 'preparing', 'ready', 'delivered', 'cancelled']),
  payment_method: z.enum(['cash', 'room_charge', 'card', 'qr']).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotel_id') || ctx.hotelId;
  const status = searchParams.get('status');

  const admin = createAdminClient();
  let query = admin
    .from('fb_orders')
    .select('*, fb_outlets(id, name)')
    .eq('hotel_id', hotelId)
    .eq('order_type', 'room_service')
    .order('created_at', { ascending: false });

  if (status) {
    const statuses = status.split(',');
    query = query.in('status', statuses);
  } else {
    // Default: exclude cancelled
    query = query.neq('status', 'cancelled');
  }

  const { data, error } = await query.limit(100);
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

  const { id, status, payment_method } = parsed.data;
  const admin = createAdminClient();

  // Verify record belongs to hotel
  const { data: existing, error: fetchErr } = await admin
    .from('fb_orders')
    .select('id, hotel_id, order_type, status')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (existing.order_type !== 'room_service') {
    return NextResponse.json({ error: 'Not a room service order' }, { status: 400 });
  }

  const updatePayload: Record<string, unknown> = { status };
  if (payment_method) updatePayload.payment_method = payment_method;

  const { data, error } = await admin
    .from('fb_orders')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
