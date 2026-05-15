import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { z } from 'zod';

const patchSchema = z.object({
  action: z.enum(['add_items', 'bill', 'pay', 'cancel', 'update_notes']),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    name: z.string(),
    qty: z.number().int().min(1),
    price: z.number().min(0),
    notes: z.string().optional().nullable(),
    allergy_tags: z.array(z.string()).optional(),
  })).optional(),
  payment_method: z.enum(['cash', 'card', 'room_charge', 'qr']).optional(),
  discount: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  service_charge_pct: z.number().min(0).max(1).default(0.1),
  vat_pct: z.number().min(0).max(1).default(0.07),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { action, items, payment_method, discount, notes, service_charge_pct, vat_pct } = parsed.data;
  const admin = createAdminClient();

  // Fetch existing order
  const { data: order, error: fetchErr } = await admin
    .from('restaurant_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.status === 'cancelled') {
    return NextResponse.json({ error: 'Cannot modify a cancelled order' }, { status: 409 });
  }

  let updatePayload: Record<string, unknown> = {};
  const now = new Date().toISOString();

  switch (action) {
    case 'add_items': {
      if (!items || items.length === 0) {
        return NextResponse.json({ error: 'No items provided' }, { status: 422 });
      }
      if (order.status !== 'open') {
        return NextResponse.json({ error: 'Can only add items to open orders' }, { status: 409 });
      }
      const existingItems: any[] = Array.isArray(order.items) ? order.items : [];
      const mergedItems = [...existingItems];
      for (const newItem of items) {
        const existing = mergedItems.find(i => i.menu_item_id === newItem.menu_item_id);
        if (existing) {
          existing.qty += newItem.qty;
        } else {
          mergedItems.push(newItem);
        }
      }
      const subtotal = mergedItems.reduce((s: number, i: any) => s + i.price * i.qty, 0);
      const serviceCharge = Math.round(subtotal * service_charge_pct * 100) / 100;
      const vat = Math.round((subtotal + serviceCharge) * vat_pct * 100) / 100;
      const total = subtotal + serviceCharge + vat - (discount ?? 0);
      updatePayload = { items: mergedItems, subtotal, service_charge: serviceCharge, vat, total };
      break;
    }

    case 'bill': {
      if (order.status !== 'open') {
        return NextResponse.json({ error: 'Can only bill open orders' }, { status: 409 });
      }
      const existingItems: any[] = Array.isArray(order.items) ? order.items : [];
      const subtotal = existingItems.reduce((s: number, i: any) => s + i.price * i.qty, 0);
      const serviceCharge = Math.round(subtotal * service_charge_pct * 100) / 100;
      const vat = Math.round((subtotal + serviceCharge) * vat_pct * 100) / 100;
      const total = subtotal + serviceCharge + vat - (discount ?? 0);
      updatePayload = {
        status: 'billed',
        subtotal,
        service_charge: serviceCharge,
        vat,
        discount: discount ?? 0,
        total,
      };
      break;
    }

    case 'pay': {
      if (!['open', 'billed'].includes(order.status)) {
        return NextResponse.json({ error: 'Order is not payable' }, { status: 409 });
      }
      if (!payment_method) {
        return NextResponse.json({ error: 'payment_method required' }, { status: 422 });
      }
      const existingItems: any[] = Array.isArray(order.items) ? order.items : [];
      const subtotal = existingItems.reduce((s: number, i: any) => s + i.price * i.qty, 0);
      const serviceCharge = Math.round(subtotal * service_charge_pct * 100) / 100;
      const vat = Math.round((subtotal + serviceCharge) * vat_pct * 100) / 100;
      const total = subtotal + serviceCharge + vat - (discount ?? 0);
      updatePayload = {
        status: 'paid',
        payment_method,
        discount: discount ?? 0,
        subtotal,
        service_charge: serviceCharge,
        vat,
        total,
        closed_at: now,
      };
      // Free the table
      if (order.table_id) {
        await admin
          .from('restaurant_tables')
          .update({ status: 'cleaning', updated_at: now })
          .eq('id', order.table_id);
      }
      break;
    }

    case 'cancel': {
      updatePayload = { status: 'cancelled', closed_at: now };
      if (order.table_id) {
        await admin
          .from('restaurant_tables')
          .update({ status: 'available', updated_at: now })
          .eq('id', order.table_id);
      }
      break;
    }

    case 'update_notes': {
      updatePayload = { notes: notes ?? null };
      break;
    }
  }

  const { data, error } = await admin
    .from('restaurant_orders')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
