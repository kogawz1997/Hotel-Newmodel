import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: segmentId } = await params;
  const sp = request.nextUrl.searchParams;
  const hotelId = sp.get('hotel_id');

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  const page = Math.max(1, parseInt(sp.get('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') || '20', 10)));
  const sortBy = sp.get('sort_by') || 'total_stays';
  const offset = (page - 1) * limit;

  const allowedSorts = new Set(['total_stays', 'total_spent', 'last_stay_date', 'first_name']);
  const sort = allowedSorts.has(sortBy) ? sortBy : 'total_stays';

  const { data: segment } = await ctx.supabase
    .from('crm_segment_definitions')
    .select('id')
    .eq('id', segmentId)
    .eq('hotel_id', ctx.hotelId)
    .single();

  if (!segment) return NextResponse.json({ error: 'Segment not found' }, { status: 404 });

  const { data: memberRows, error: memberError } = await ctx.supabase
    .from('crm_segment_members')
    .select('guest_id, entered_at, score')
    .eq('segment_id', segmentId);

  if (memberError) {
    if (memberError.code === '42P01') return NextResponse.json({ members: [], page, limit, total: 0 });
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  if (!memberRows || memberRows.length === 0) {
    return NextResponse.json({ members: [], page, limit, total: 0 });
  }

  const guestIds = memberRows.map((r: any) => r.guest_id);

  const { data: lastStays } = await ctx.supabase
    .from('reservations')
    .select('guest_id, check_out')
    .eq('hotel_id', ctx.hotelId)
    .in('guest_id', guestIds)
    .in('status', ['checked_out', 'completed'])
    .order('check_out', { ascending: false });

  const lastStayByGuest: Record<string, string> = {};
  for (const row of lastStays || []) {
    if (row.guest_id && !lastStayByGuest[row.guest_id]) {
      lastStayByGuest[row.guest_id] = row.check_out;
    }
  }

  const { data: guests, error: guestError } = await ctx.supabase
    .from('guests')
    .select('id, first_name, last_name, email, total_stays, total_revenue, loyalty_tier')
    .in('id', guestIds);

  if (guestError) return NextResponse.json({ error: guestError.message }, { status: 500 });

  const memberMap: Record<string, any> = {};
  for (const row of memberRows) {
    memberMap[row.guest_id] = row;
  }

  let enriched = (guests || []).map((g: any) => ({
    guest_id: g.id,
    first_name: g.first_name,
    last_name: g.last_name,
    email: g.email,
    total_stays: g.total_stays ?? 0,
    total_spent: Number(g.total_revenue ?? 0),
    last_stay_date: lastStayByGuest[g.id] || null,
    loyalty_tier: g.loyalty_tier,
    entered_at: memberMap[g.id]?.entered_at,
    score: memberMap[g.id]?.score ?? null,
  }));

  enriched.sort((a, b) => {
    if (sort === 'total_stays') return b.total_stays - a.total_stays;
    if (sort === 'total_spent') return b.total_spent - a.total_spent;
    if (sort === 'last_stay_date') {
      return (b.last_stay_date || '').localeCompare(a.last_stay_date || '');
    }
    return (a.first_name || '').localeCompare(b.first_name || '');
  });

  const total = enriched.length;
  const paged = enriched.slice(offset, offset + limit);

  return NextResponse.json({ members: paged, page, limit, total });
}
