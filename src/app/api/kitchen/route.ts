import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { z } from 'zod';

const createQueueSchema = z.object({
  hotelId: z.string().uuid(),
  orderId: z.string().uuid(),
  outletId: z.string().uuid().optional().nullable(),
  items: z.array(z.object({
    name: z.string(),
    qty: z.number().int().min(1),
    notes: z.string().optional().nullable(),
    allergy_tags: z.array(z.string()).optional(),
  })).min(1),
  priority: z.number().int().min(0).max(10).default(5),
  kitchen_note: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotel_id') || ctx.hotelId;
  const status = searchParams.get('status');
  const outletId = searchParams.get('outlet_id');

  const admin = createAdminClient();
  let query = admin
    .from('kitchen_queue')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (status) {
    const statuses = status.split(',');
    query = query.in('status', statuses);
  }
  if (outletId) {
    query = query.eq('outlet_id', outletId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const body = await req.json().catch(() => null);
  const parsed = createQueueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { hotelId, orderId, outletId, items, priority, kitchen_note } = parsed.data;

  const admin = createAdminClient();

  // Verify hotel access
  const { data: hotel } = await admin
    .from('hotels')
    .select('id, organization_id')
    .eq('id', hotelId)
    .single();

  if (!hotel || hotel.organization_id !== ctx.profile.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await admin
    .from('kitchen_queue')
    .insert({
      hotel_id: hotelId,
      order_id: orderId,
      outlet_id: outletId ?? null,
      items,
      priority,
      status: 'new',
      kitchen_note: kitchen_note ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
