/**
 * GET /api/guests/check-duplicate?hotelId=&email=&phone=&firstName=&lastName=
 * Returns potential duplicate guests before creating a new guest record.
 * Matches on: exact email, exact phone, or same first+last name.
 * Used by the front desk check-in / new booking forms.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId   = searchParams.get('hotelId');
  const email     = (searchParams.get('email') ?? '').trim().toLowerCase();
  const phone     = (searchParams.get('phone') ?? '').trim().replace(/\s/g, '');
  const firstName = (searchParams.get('firstName') ?? '').trim();
  const lastName  = (searchParams.get('lastName') ?? '').trim();

  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  if (!email && !phone && !(firstName && lastName)) {
    return NextResponse.json({ duplicates: [] });
  }

  // Build OR conditions for matching
  const orParts: string[] = [];
  if (email)               orParts.push(`email.eq.${email}`);
  if (phone)               orParts.push(`phone.eq.${phone}`);
  if (firstName && lastName) orParts.push(`first_name.ilike.${firstName},last_name.ilike.${lastName}`);

  const { data, error } = await ctx.supabase
    .from('guests')
    .select('id, first_name, last_name, email, phone, nationality, created_at')
    .eq('hotel_id', ctx.hotelId)
    .or(orParts.join(','))
    .limit(5);

  if (error) return NextResponse.json({ duplicates: [] });

  // Score each match
  const scored = (data ?? []).map(g => {
    let score = 0;
    if (email && g.email?.toLowerCase() === email)       score += 3;
    if (phone && g.phone?.replace(/\s/g, '') === phone)  score += 3;
    if (firstName && g.first_name?.toLowerCase() === firstName.toLowerCase()) score += 1;
    if (lastName  && g.last_name?.toLowerCase()  === lastName.toLowerCase())  score += 1;
    return { ...g, match_score: score };
  }).sort((a, b) => b.match_score - a.match_score);

  return NextResponse.json({
    has_duplicates: scored.length > 0,
    duplicates:     scored,
  });
}
