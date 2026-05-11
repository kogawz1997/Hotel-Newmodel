import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

const schema = z.object({
  hotelId: z.string().uuid(),
  primaryGuestId: z.string().uuid(),
  duplicateGuestId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { hotelId, primaryGuestId, duplicateGuestId } = parsed.data;
  if (primaryGuestId === duplicateGuestId) return NextResponse.json({ error: 'เลือกแขกซ้ำคนเดิมไม่ได้' }, { status: 400 });

  const ctx = await requireHotelAccess(hotelId, ['owner', 'admin', 'manager', 'front_desk']);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  const { data: guests } = await admin.from('guests').select('*').in('id', [primaryGuestId, duplicateGuestId]).eq('hotel_id', hotelId);
  const primary = guests?.find((g: any) => g.id === primaryGuestId);
  const duplicate = guests?.find((g: any) => g.id === duplicateGuestId);
  if (!primary || !duplicate) return NextResponse.json({ error: 'ไม่พบ guest ที่เลือก' }, { status: 404 });

  await admin.from('reservations').update({ guest_id: primaryGuestId }).eq('guest_id', duplicateGuestId).eq('hotel_id', hotelId);

  const merged = {
    loyalty_points: Number(primary.loyalty_points || 0) + Number(duplicate.loyalty_points || 0),
    total_revenue: Number(primary.total_revenue || 0) + Number(duplicate.total_revenue || 0),
    total_stays: Number(primary.total_stays || 0) + Number(duplicate.total_stays || 0),
    phone: primary.phone || duplicate.phone,
    nationality: primary.nationality || duplicate.nationality,
  };
  await admin.from('guests').update(merged).eq('id', primaryGuestId).eq('hotel_id', hotelId);
  await admin.from('guests').delete().eq('id', duplicateGuestId).eq('hotel_id', hotelId);

  return NextResponse.json({ ok: true, mergedInto: primaryGuestId, removed: duplicateGuestId });
}
