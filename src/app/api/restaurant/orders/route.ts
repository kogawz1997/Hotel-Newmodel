import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { z } from 'zod';

const createOrderSchema = z.object({
  hotelId: z.string().uuid(),
  tableId: z.string().uuid(),
  outletId: z.string().uuid().optional().nullable(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    name: z.string(),
    qty: z.number().int().min(1),
    price: z.number().min(0),
    notes: z.string().optional().nullable(),
    allergy_tags: z.array(z.string()).optional(),
  })).min(1),
  notes: z.string().optional().nullable(),
  room_no: z.string().optional().nullable(),
  reservation_id: z.string().uuid().optional().nullable(),
  service_charge_pct: z.number().min(0).max(1).default(0.1),
  vat_pct: z.number().min(0).max(1).default(0.07),
});

export async function GET(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotel_id') || ctx.hotelId;
  const status = searchParams.get('status');
  const tableId = searchParams.get('table_id');
  const outletId = searchParams.get('outlet_id');

  const admin = createAdminClient();
  let query = admin
    .from('restaurant_orders')
    .select('*, restaurant_tables(table_no, floor, section)')
    .eq('hotel_id', hotelId)
    .order('opened_at', { ascending: false });

  if (status) {
    const statuses = status.split(',');
    query = query.in('status', statuses);
  } else {
    query = query.not('status', 'in', '("cancelled")');
  }
  if (tableId) query = query.eq('table_id', tableId);
  if (outletId) query = query.eq('outlet_id', outletId);

  const { data, error } = await query.limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const body = await req.json().catch(() => null);
  const parsed = createOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const {
    hotelId, tableId, outletId, items, notes, room_no, reservation_id,
    service_charge_pct, vat_pct,
  } = parsed.data;

  const admin = createAdminClient();

  // Verify hotel
  const { data: hotel } = await admin
    .from('hotels')
    .select('id, organization_id')
    .eq('id', hotelId)
    .single();

  if (!hotel || hotel.organization_id !== ctx.profile.organization_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const serviceCharge = Math.round(subtotal * service_charge_pct * 100) / 100;
  const vat = Math.round((subtotal + serviceCharge) * vat_pct * 100) / 100;
  const total = subtotal + serviceCharge + vat;

  // Create order
  const { data: order, error: orderErr } = await admin
    .from('restaurant_orders')
    .insert({
      hotel_id: hotelId,
      table_id: tableId,
      outlet_id: outletId ?? null,
      items,
      subtotal,
      service_charge: serviceCharge,
      vat,
      total,
      status: 'open',
      server_id: ctx.user.id,
      notes: notes ?? null,
      room_no: room_no ?? null,
      reservation_id: reservation_id ?? null,
      opened_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (orderErr || !order) {
    return NextResponse.json({ error: orderErr?.message ?? 'Failed to create order' }, { status: 500 });
  }

  // Update table to occupied
  await admin
    .from('restaurant_tables')
    .update({ status: 'occupied', updated_at: new Date().toISOString() })
    .eq('id', tableId);

  return NextResponse.json({ data: order }, { status: 201 });
}
