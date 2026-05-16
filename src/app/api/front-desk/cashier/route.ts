import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { apiError } from '@/lib/http/errors';

/**
 * Front Desk Cashier convenience route.
 * GET  — list open cashier_sessions for the hotel
 * POST — open or close a cashier session (delegates to cashier_sessions table)
 */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ctx = await requireHotelAccess(searchParams.get('hotelId'));
  if (ctx.error) return ctx.error;

  const status = searchParams.get('status') || 'open';

  const { data, error } = await ctx.supabase
    .from('cashier_sessions')
    .select('*, cashier:opened_by(full_name, role)')
    .eq('hotel_id', ctx.hotelId)
    .eq('status', status)
    .order('opened_at', { ascending: false })
    .limit(50);

  if (error) return apiError(error);
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const ctx = await requireHotelAccess(null, ['owner', 'admin', 'manager', 'front_desk']);
  if (ctx.error) return ctx.error;

  const body = await req.json();
  const { action } = body; // 'open' | 'close'

  if (!action || !['open', 'close'].includes(action)) {
    return NextResponse.json({ error: 'action ต้องเป็น open หรือ close' }, { status: 422 });
  }

  if (action === 'open') {
    const { opening_balance, notes } = body;

    // Check if there's already an open session
    const { data: existing } = await ctx.supabase
      .from('cashier_sessions')
      .select('id')
      .eq('hotel_id', ctx.hotelId)
      .eq('status', 'open')
      .limit(1)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'มีกะที่เปิดอยู่แล้ว' }, { status: 409 });
    }

    const { data, error } = await ctx.supabase
      .from('cashier_sessions')
      .insert({
        hotel_id: ctx.hotelId,
        opened_by: ctx.user.id,
        opening_balance: opening_balance ?? 0,
        status: 'open',
        opened_at: new Date().toISOString(),
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) return apiError(error);
    return NextResponse.json({ ok: true, session: data }, { status: 201 });
  }

  // action === 'close'
  const { session_id, closing_balance, cash_breakdown, notes } = body;

  if (!session_id) {
    return NextResponse.json({ error: 'กรุณาระบุ session_id' }, { status: 422 });
  }

  const { data: session } = await ctx.supabase
    .from('cashier_sessions')
    .select('id, hotel_id, status')
    .eq('id', session_id)
    .eq('hotel_id', ctx.hotelId)
    .single();

  if (!session) {
    return NextResponse.json({ error: 'ไม่พบ session นี้' }, { status: 404 });
  }

  if (session.status !== 'open') {
    return NextResponse.json({ error: 'session นี้ปิดแล้ว' }, { status: 409 });
  }

  const { data, error } = await ctx.supabase
    .from('cashier_sessions')
    .update({
      status: 'closed',
      closed_by: ctx.user.id,
      closing_balance: closing_balance ?? 0,
      cash_breakdown: cash_breakdown ?? null,
      closed_at: new Date().toISOString(),
      notes: notes ?? null,
    })
    .eq('id', session_id)
    .select()
    .single();

  if (error) return apiError(error);
  return NextResponse.json({ ok: true, session: data });
}
