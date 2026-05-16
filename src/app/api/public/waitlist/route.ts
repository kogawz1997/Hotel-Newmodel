import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  hotelId:    z.string().uuid(),
  roomTypeId: z.string().uuid(),
  checkIn:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  checkOut:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  email:      z.string().email().max(320),
  name:       z.string().max(200).optional(),
});

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'public.waitlist', 10, 60_000);
  if (limited) return limited;

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { hotelId, roomTypeId, checkIn, checkOut, email, name } = parsed.data;
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from('waitlist_entries')
    .select('id')
    .eq('hotel_id', hotelId)
    .eq('room_type_id', roomTypeId)
    .eq('check_in', checkIn)
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (existing) return NextResponse.json({ message: 'Already on waitlist', id: existing.id });

  const { data, error } = await admin.from('waitlist_entries').insert({
    hotel_id:    hotelId,
    room_type_id: roomTypeId,
    check_in:    checkIn,
    check_out:   checkOut,
    email:       email.toLowerCase(),
    guest_name:  name ?? null,
    status:      'waiting',
  }).select('id').single();

  if (error) {
    console.error('waitlist insert error', error);
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 });
  }

  return NextResponse.json({ message: 'Added to waitlist', id: data.id }, { status: 201 });
}
