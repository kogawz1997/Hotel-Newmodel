import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';

export async function POST(req: NextRequest) {
  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager', 'front_desk']);
  if (ctx.error) return ctx.error;

  const body = await req.json();
  const { reservation_id, room_no, action, reason } = body;

  if (!reservation_id || !room_no || !action) {
    return NextResponse.json(
      { error: 'กรุณาระบุ reservation_id, room_no และ action' },
      { status: 422 }
    );
  }

  const validActions = ['issue', 'reissue', 'deactivate'];
  if (!validActions.includes(action)) {
    return NextResponse.json(
      { error: `action ต้องเป็น: ${validActions.join(', ')}` },
      { status: 422 }
    );
  }

  // Verify reservation belongs to this hotel
  const { data: reservation } = await ctx.supabase
    .from('reservations')
    .select('id, hotel_id, status')
    .eq('id', reservation_id)
    .eq('hotel_id', ctx.hotelId)
    .single();

  if (!reservation) {
    return NextResponse.json({ error: 'ไม่พบการจองนี้ในโรงแรม' }, { status: 404 });
  }

  const { data, error } = await ctx.supabase
    .from('keycard_log')
    .insert({
      hotel_id: ctx.hotelId,
      reservation_id,
      room_no,
      action,
      issued_by: ctx.user.id,
      reason: reason ?? null,
      issued_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return apiError(error);

  return NextResponse.json({ ok: true, log: data }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ctx = await requireHotelAccess(searchParams.get('hotelId'));
  if (ctx.error) return ctx.error;

  const date = searchParams.get('date') || new Date().toISOString().slice(0, 10);

  const { data, error } = await ctx.supabase
    .from('keycard_log')
    .select('*, issued_by_user:issued_by(full_name, role)')
    .eq('hotel_id', ctx.hotelId)
    .gte('issued_at', `${date}T00:00:00.000Z`)
    .lte('issued_at', `${date}T23:59:59.999Z`)
    .order('issued_at', { ascending: false })
    .limit(200);

  if (error) return apiError(error);
  return NextResponse.json(data ?? []);
}
