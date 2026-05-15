import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson, dbError } from '@/lib/http/validation';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

const createBatchSchema = z.object({
  hotel_id: z.string().uuid().optional(),
  vendor: z.string().max(200).optional().nullable(),
  items_count: z.number().int().min(1),
  items_detail: z
    .union([z.string(), z.record(z.any()), z.array(z.any())])
    .optional()
    .nullable(),
  notes: z.string().max(2000).optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
});

const patchBatchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['collected', 'sent', 'returned', 'cancelled']),
  returned_at: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

async function generateBatchNo(admin: any, hotelId: string): Promise<string> {
  const date = new Date();
  const prefix = `LDY-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;

  const { count } = await admin
    .from('laundry_batches')
    .select('id', { count: 'exact', head: true })
    .eq('hotel_id', hotelId)
    .like('batch_no', `${prefix}%`);

  const seq = String((count ?? 0) + 1).padStart(3, '0');
  return `${prefix}-${seq}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotel_id');
  const status = searchParams.get('status');

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();

  let query = admin
    .from('laundry_batches')
    .select(
      `id, hotel_id, batch_no, collected_at, returned_at,
       items_count, items_detail, assigned_to, vendor, status, notes,
       assignee:user_profiles!assigned_to(id, full_name)`
    )
    .eq('hotel_id', ctx.hotelId)
    .order('collected_at', { ascending: false })
    .limit(200);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return dbError(error);

  return NextResponse.json({ batches: data || [] });
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, createBatchSchema);
  if (parsed.error) return parsed.error;

  const ctx = await requireHotelAccess(parsed.data.hotel_id ?? null);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  const batchNo = await generateBatchNo(admin, ctx.hotelId);

  let itemsDetail = parsed.data.items_detail;
  if (typeof itemsDetail === 'string') {
    try {
      itemsDetail = JSON.parse(itemsDetail);
    } catch {
      itemsDetail = { raw: itemsDetail };
    }
  }

  const { data, error } = await admin
    .from('laundry_batches')
    .insert({
      hotel_id: ctx.hotelId,
      batch_no: batchNo,
      collected_at: new Date().toISOString(),
      items_count: parsed.data.items_count,
      items_detail: itemsDetail ?? null,
      vendor: parsed.data.vendor ?? null,
      assigned_to: parsed.data.assigned_to ?? ctx.user.id,
      status: 'collected',
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single();

  if (error || !data) return dbError(error || new Error('Insert failed'));

  return NextResponse.json({ batch: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const parsed = await parseJson(request, patchBatchSchema);
  if (parsed.error) return parsed.error;

  const { id, status, returned_at, notes } = parsed.data;

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('laundry_batches')
    .select('id, hotel_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
  }

  const ctx = await requireHotelAccess(existing.hotel_id, [
    'owner',
    'admin',
    'manager',
    'housekeeping',
    'staff',
  ] as any[]);
  if (ctx.error) return ctx.error;

  const updates: Record<string, any> = { status };
  if (notes !== undefined) updates.notes = notes;
  if (status === 'returned') {
    updates.returned_at = returned_at ?? new Date().toISOString();
  }
  if (status === 'sent' && !existing.returned_at) {
    // No auto date for sent
  }

  const { data, error } = await admin
    .from('laundry_batches')
    .update(updates)
    .eq('id', id)
    .eq('hotel_id', ctx.hotelId)
    .select()
    .single();

  if (error || !data) return dbError(error || new Error('Update failed'));

  return NextResponse.json({ batch: data });
}
