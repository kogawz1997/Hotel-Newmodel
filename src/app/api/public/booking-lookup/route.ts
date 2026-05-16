import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { z } from 'zod';

const schema = z.object({
  code: z.string().trim().min(3).max(50),
  email: z.string().trim().email(),
});

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'public.booking-lookup', 10, 60_000);
  if (limited) return limited;

  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'กรุณากรอกรหัสการจองและอีเมลให้ถูกต้อง' }, { status: 422 });
  }

  const { code, email } = parsed.data;
  const admin = createAdminClient();

  const { data: reservation, error } = await admin
    .from('reservations')
    .select(`
      id, reservation_code, status, check_in, check_out,
      num_adults, num_children, total_amount, special_requests,
      created_at, updated_at,
      guests(first_name, last_name, email, phone),
      room_types(name, description),
      hotels(name, address, phone, email, check_in_time, check_out_time, currency)
    `)
    .eq('reservation_code', code.toUpperCase())
    .maybeSingle();

  if (error) return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 });

  if (!reservation) {
    return NextResponse.json({ error: 'ไม่พบการจองนี้ กรุณาตรวจสอบรหัสการจองและอีเมล' }, { status: 404 });
  }

  const guest = reservation.guests as any;
  if (!guest || guest.email?.toLowerCase() !== email.toLowerCase()) {
    return NextResponse.json({ error: 'ไม่พบการจองนี้ กรุณาตรวจสอบรหัสการจองและอีเมล' }, { status: 404 });
  }

  return NextResponse.json({ reservation });
}
