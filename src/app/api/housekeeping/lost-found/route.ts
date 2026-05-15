import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson, dbError } from '@/lib/http/validation';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

const createSchema = z.object({
  hotel_id: z.string().uuid().optional(),
  room_no: z.string().max(20).optional().nullable(),
  description: z.string().min(1).max(1000),
  location: z.string().max(300).optional().nullable(),
  photo_url: z.string().url().optional().nullable(),
  found_at: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['stored', 'claimed', 'donated', 'disposed']),
  claimed_by: z.string().max(300).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const hotelId = searchParams.get('hotel_id');
  const status = searchParams.get('status');

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();

  let query = admin
    .from('lost_found')
    .select(
      `id, hotel_id, room_no, description, found_by, found_at,
       location, photo_url, status, claimed_by, claimed_at, notes,
       finder:user_profiles!found_by(id, full_name)`
    )
    .eq('hotel_id', ctx.hotelId)
    .order('found_at', { ascending: false })
    .limit(200);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) return dbError(error);

  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  const parsed = await parseJson(request, createSchema);
  if (parsed.error) return parsed.error;

  const ctx = await requireHotelAccess(parsed.data.hotel_id ?? null);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('lost_found')
    .insert({
      hotel_id: ctx.hotelId,
      room_no: parsed.data.room_no ?? null,
      description: parsed.data.description,
      location: parsed.data.location ?? null,
      photo_url: parsed.data.photo_url ?? null,
      found_by: ctx.user.id,
      found_at: parsed.data.found_at ?? new Date().toISOString(),
      status: 'stored',
      notes: parsed.data.notes ?? null,
    })
    .select()
    .single();

  if (error || !data) return dbError(error || new Error('Insert failed'));

  return NextResponse.json({ item: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const parsed = await parseJson(request, patchSchema);
  if (parsed.error) return parsed.error;

  const { id, status, claimed_by, notes } = parsed.data;

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('lost_found')
    .select('id, hotel_id')
    .eq('id', id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Item not found' }, { status: 404 });
  }

  const ctx = await requireHotelAccess(existing.hotel_id, [
    'owner',
    'admin',
    'manager',
    'front_desk',
    'housekeeping',
    'staff',
  ] as any[]);
  if (ctx.error) return ctx.error;

  const updates: Record<string, any> = { status };
  if (notes !== undefined) updates.notes = notes;
  if (status === 'claimed') {
    updates.claimed_by = claimed_by ?? null;
    updates.claimed_at = new Date().toISOString();
  }

  const { data, error } = await admin
    .from('lost_found')
    .update(updates)
    .eq('id', id)
    .eq('hotel_id', ctx.hotelId)
    .select()
    .single();

  if (error || !data) return dbError(error || new Error('Update failed'));

  return NextResponse.json({ item: data });
}
