/**
 * GET /api/search/guests?q=&hotelId=
 * Search guests by name, email, or phone for the global command search.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { rateLimit } from '@/lib/security/rate-limit';

export async function GET(request: NextRequest) {
  const limited = await rateLimit(request, 'search.guests', 60, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();

  if (q.length < 2) return NextResponse.json({ guests: [] });

  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const needle = `%${q}%`;

  // Search by name, email, or phone
  const { data, error } = await ctx.supabase
    .from('guests')
    .select('id, first_name, last_name, email, phone')
    .eq('hotel_id', ctx.hotelId)
    .or(
      `first_name.ilike.${needle},last_name.ilike.${needle},email.ilike.${needle},phone.ilike.${needle}`
    )
    .limit(8);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const guests = (data || []).map((g: any) => ({
    id: g.id,
    name: `${g.first_name || ''} ${g.last_name || ''}`.trim(),
    email: g.email,
    phone: g.phone,
    href: `/dashboard/guests/${g.id}`,
  }));

  return NextResponse.json({ guests });
}
