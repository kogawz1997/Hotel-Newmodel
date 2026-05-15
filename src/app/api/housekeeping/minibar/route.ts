import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson, dbError } from '@/lib/http/validation';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

const chargeSchema = z.object({
  task_id: z.string().uuid(),
  room_no: z.string().min(1).max(20),
  items: z
    .array(
      z.object({
        name: z.string().min(1).max(200),
        qty: z.number().int().min(1),
        price: z.number().min(0),
      })
    )
    .min(1)
    .max(50),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotel_id');
  const roomTypeId = searchParams.get('room_type_id');

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();

  let query = admin
    .from('minibar_templates')
    .select('id, hotel_id, room_type_id, name, items, is_active, created_at')
    .eq('hotel_id', ctx.hotelId)
    .eq('is_active', true)
    .order('name');

  if (roomTypeId) {
    query = query.eq('room_type_id', roomTypeId);
  }

  const { data, error } = await query;
  if (error) return dbError(error);

  return NextResponse.json({ templates: data || [] });
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, chargeSchema);
  if (parsed.error) return parsed.error;

  const { task_id, room_no, items } = parsed.data;

  const admin = createAdminClient();

  // Get task to determine hotel
  const { data: task } = await admin
    .from('housekeeping_tasks')
    .select('id, hotel_id, room_id')
    .eq('id', task_id)
    .single();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  const ctx = await requireHotelAccess(task.hotel_id, [
    'owner',
    'admin',
    'manager',
    'housekeeping',
    'staff',
  ] as any[]);
  if (ctx.error) return ctx.error;

  // Find active reservation for the room to get folio_id
  const { data: room } = await admin
    .from('rooms')
    .select('id, room_no')
    .eq('hotel_id', ctx.hotelId)
    .eq('room_no', room_no)
    .single();

  let folioId: string | null = null;
  if (room) {
    const { data: reservation } = await admin
      .from('reservations')
      .select('id')
      .eq('hotel_id', ctx.hotelId)
      .eq('room_id', room.id)
      .eq('status', 'checked_in')
      .limit(1)
      .single();

    if (reservation) {
      const { data: folio } = await admin
        .from('folios')
        .select('id')
        .eq('reservation_id', reservation.id)
        .eq('status', 'open')
        .limit(1)
        .single();

      folioId = folio?.id ?? null;
    }
  }

  // Insert folio_items for each minibar item
  const totalAmount = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  const folioItems = items.map((item) => ({
    folio_id: folioId,
    hotel_id: ctx.hotelId,
    description: `Minibar: ${item.name}`,
    quantity: item.qty,
    unit_price: item.price,
    amount: item.qty * item.price,
    charge_type: 'minibar',
    reference_id: task_id,
    posted_by: ctx.user.id,
    posted_at: new Date().toISOString(),
    notes: `Room ${room_no} · Task ${task_id}`,
  }));

  const { data: charges, error: chargeError } = await admin
    .from('folio_items')
    .insert(folioItems)
    .select();

  if (chargeError) return dbError(chargeError);

  // Update task minibar_items field
  const { error: taskError } = await admin
    .from('housekeeping_tasks')
    .update({ minibar_items: items })
    .eq('id', task_id)
    .eq('hotel_id', ctx.hotelId);

  if (taskError) {
    console.error('[minibar] Failed to update task minibar_items:', taskError);
  }

  return NextResponse.json({
    charges,
    total_amount: totalAmount,
    folio_id: folioId,
  });
}
