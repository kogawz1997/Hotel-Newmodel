import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

const schema = z.object({
  hotelId: z.string().uuid(),
  groupName: z.string().min(2).max(120),
  reservationIds: z.array(z.string().uuid()).min(2),
});

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { hotelId, groupName, reservationIds } = parsed.data;
  const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager', 'front_desk']);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  const groupCode = `GRP-${new Date().toISOString().slice(2,10).replace(/-/g,'')}-${Math.floor(Math.random()*900+100)}`;

  const { data: reservations } = await admin
    .from('reservations')
    .select('id, internal_notes, total_amount')
    .eq('hotel_id', hotelId)
    .in('id', reservationIds);

  for (const r of reservations || []) {
    const notes = [r.internal_notes, `Group: ${groupName}`, `GroupCode: ${groupCode}`].filter(Boolean).join(' | ');
    await admin.from('reservations').update({ internal_notes: notes }).eq('id', r.id).eq('hotel_id', hotelId);
  }

  const total = (reservations || []).reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0);
  return NextResponse.json({ ok: true, groupCode, groupName, reservationCount: reservations?.length || 0, groupTotal: total });
}
