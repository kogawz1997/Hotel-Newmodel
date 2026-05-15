import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ctx = await requireHotelAccess(searchParams.get('hotelId'));
  if (ctx.error) return ctx.error;

  const status = searchParams.get('status');
  const type = searchParams.get('type');

  let q = ctx.supabase
    .from('concierge_requests')
    .select(
      'id, hotel_id, guest_id, reservation_id, type, description, status, assigned_to, created_at, guests(first_name, last_name, phone), assigned_user:assigned_to(full_name, role)'
    )
    .eq('hotel_id', ctx.hotelId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (status) q = q.eq('status', status);
  if (type) q = q.eq('type', type);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager', 'front_desk', 'staff']);
  if (ctx.error) return ctx.error;

  const body = await req.json();
  const { guest_id, reservation_id, type, description, assigned_to } = body;

  if (!type || !description) {
    return NextResponse.json({ error: 'กรุณาระบุ type และ description' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('concierge_requests')
    .insert({
      hotel_id: ctx.hotelId,
      guest_id: guest_id ?? null,
      reservation_id: reservation_id ?? null,
      type,
      description,
      status: 'pending',
      assigned_to: assigned_to ?? null,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, request: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager', 'front_desk', 'staff']);
  if (ctx.error) return ctx.error;

  const body = await req.json();
  const { id, status, assigned_to } = body;

  if (!id) return NextResponse.json({ error: 'กรุณาระบุ id' }, { status: 422 });

  const updates: Record<string, any> = {};
  if (status) updates.status = status;
  if (assigned_to !== undefined) updates.assigned_to = assigned_to;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'ไม่มีข้อมูลที่ต้องการอัปเดต' }, { status: 422 });
  }

  const { data, error } = await ctx.supabase
    .from('concierge_requests')
    .update(updates)
    .eq('id', id)
    .eq('hotel_id', ctx.hotelId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, request: data });
}
