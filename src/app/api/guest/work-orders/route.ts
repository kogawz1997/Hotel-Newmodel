import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const schema = z.object({
  type:        z.enum(['room_service', 'housekeeping', 'spa', 'other']),
  title:       z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  notes:       z.string().max(1000).optional(),
});

const SLA_MINUTES: Record<string, number> = {
  room_service: 30,
  housekeeping: 45,
  spa:          0,
  other:        30,
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, hotel_id, rooms(room_number)')
    .eq('guest_id', user.id)
    .eq('status', 'checked_in')
    .order('check_in', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reservation) {
    return NextResponse.json({ error: 'ไม่พบการเข้าพักที่ active' }, { status: 404 });
  }

  const slaMinutes = SLA_MINUTES[parsed.data.type] ?? 30;
  const slaDeadline = slaMinutes > 0 ? new Date(Date.now() + slaMinutes * 60000).toISOString() : null;
  const room = Array.isArray(reservation.rooms) ? reservation.rooms[0] : reservation.rooms as any;

  const { data, error } = await supabase.from('work_orders').insert({
    hotel_id:     reservation.hotel_id,
    requested_by: user.id,
    type:         parsed.data.type,
    title:        parsed.data.title,
    description:  parsed.data.description ?? null,
    room_no:      room?.room_number ?? null,
    priority:     'normal',
    status:       'pending',
    sla_minutes:  slaMinutes,
    sla_deadline: slaDeadline,
    source:       'guest_portal',
    notes:        parsed.data.notes ?? null,
  }).select('id').single();

  if (error) {
    console.error('guest work-order insert error', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }

  return NextResponse.json({ id: data.id, message: 'Request submitted' }, { status: 201 });
}
