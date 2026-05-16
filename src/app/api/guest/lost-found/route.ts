import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

const schema = z.object({
  reservationId: z.string().uuid(),
  category: z.string().min(1),
  description: z.string().min(5),
  lostDate: z.string().optional(),
  location: z.string().optional(),
  contactPhone: z.string().optional(),
  reward: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid data' }, { status: 400 });

  const { reservationId, category, description, lostDate, location, contactPhone, reward } = parsed.data;

  // Verify reservation belongs to user
  const { data: res } = await supabase
    .from('reservations')
    .select('id, hotel_id')
    .eq('id', reservationId)
    .eq('guest_account_id', user.id)
    .single();
  if (!res) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });

  const admin = createAdminClient();
  const { data, error } = await admin.from('work_orders').insert({
    hotel_id: res.hotel_id,
    type: 'other',
    title: `Lost & Found: ${category}`,
    description: `${description}\n\nสถานที่: ${location || 'ไม่ระบุ'}\nวันที่หาย: ${lostDate || 'ไม่ระบุ'}\nเบอร์ติดต่อ: ${contactPhone || 'ไม่ระบุ'}\nรางวัล: ${reward || 'ไม่มี'}`,
    source: 'guest_portal',
    priority: 'normal',
    status: 'pending',
    sla_minutes: 1440,
    notes: `Guest account: ${user.id}`,
  }).select('id').single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
