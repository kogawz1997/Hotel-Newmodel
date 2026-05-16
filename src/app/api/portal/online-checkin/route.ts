import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { parseJson } from '@/lib/http/validation';
import { apiError } from '@/lib/http/errors';

const schema = z.object({
  reservationCode: z.string().trim().min(1).max(40),
  email: z.string().email().toLowerCase(),
  estimatedArrival: z.string().max(10).optional().nullable(),
  specialRequests: z.string().max(2000).optional().nullable(),
});

export async function POST(request: Request) {
  const limited = await rateLimit(request, 'portal.online-checkin', 10, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;

  const { reservationCode, email, estimatedArrival, specialRequests } = parsed.data;

  const admin = createAdminClient();

  // Look up reservation via guests join — server-side only, no browser client exposure
  const { data: reservation, error } = await admin
    .from('reservations')
    .select('id, reservation_code, status, check_in, check_out, guests!inner(email)')
    .eq('reservation_code', reservationCode.toUpperCase())
    .in('status', ['confirmed', 'pending', 'checked_in'])
    .single();

  const guestEmail = Array.isArray(reservation?.guests)
    ? reservation.guests[0]?.email
    : (reservation?.guests as any)?.email;

  if (error || !reservation || guestEmail?.toLowerCase() !== email) {
    // Uniform error — don't reveal whether code or email is wrong
    return NextResponse.json({ error: 'ไม่พบข้อมูลการจอง' }, { status: 404 });
  }

  const { error: updateError } = await admin
    .from('reservations')
    .update({
      estimated_arrival: estimatedArrival || null,
      special_requests: specialRequests || null,
    })
    .eq('id', reservation.id);

  if (updateError) return apiError(updateError);

  return NextResponse.json({ ok: true, reservationCode: reservation.reservation_code });
}
