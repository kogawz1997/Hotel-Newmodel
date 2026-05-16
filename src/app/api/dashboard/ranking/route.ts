import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_WEIGHTS, computeScore } from '@/lib/ranking';
import { apiError } from '@/lib/http/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('organization_id').eq('id', user.id).single();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name, slug, description, tagline, star_rating, is_featured, featured_until, hotel_gallery(id)')
    .eq('organization_id', profile?.organization_id)
    .limit(1).single();

  if (!hotel) return NextResponse.json({ error: 'hotel not found' }, { status: 404 });

  const [{ data: reviews }, { data: roomTypes }] = await Promise.all([
    supabase.from('booking_reviews').select('rating').eq('hotel_id', hotel.id),
    supabase.from('room_types').select('cancel_policy, includes_breakfast').eq('hotel_id', hotel.id),
  ]);

  const now = new Date().toISOString();
  const avgRating = reviews?.length
    ? reviews.reduce((s, r: any) => s + r.rating, 0) / reviews.length : null;
  const isFreeCancel = (roomTypes || []).some((rt: any) =>
    String(rt.cancel_policy || '').toLowerCase().includes('free'));
  const isBreakfast = (roomTypes || []).some((rt: any) => rt.includes_breakfast === true);
  const galleryCount = (hotel.hotel_gallery || []).length;
  const isFeatured = hotel.is_featured === true && (!hotel.featured_until || hotel.featured_until > now);
  const hasContent = !!(hotel.description && hotel.tagline);

  const signals = {
    avg_rating:    avgRating ? Math.round(avgRating * 10) / 10 : null,
    review_count:  reviews?.length || 0,
    gallery_count: galleryCount,
    is_free_cancel: isFreeCancel,
    is_breakfast:  isBreakfast,
    star_rating:   hotel.star_rating,
    is_featured:   isFeatured,
    has_content:   hasContent,
  };

  const score = computeScore(signals, DEFAULT_WEIGHTS);
  const maxScore = DEFAULT_WEIGHTS.rating + DEFAULT_WEIGHTS.reviews + DEFAULT_WEIGHTS.photos +
    DEFAULT_WEIGHTS.freeCancel + DEFAULT_WEIGHTS.stars + DEFAULT_WEIGHTS.content + DEFAULT_WEIGHTS.breakfast;

  return NextResponse.json({
    hotel: { id: hotel.id, name: hotel.name, slug: hotel.slug, is_featured: isFeatured, featured_until: hotel.featured_until },
    score,
    maxScore,
    signals,
    weights: DEFAULT_WEIGHTS,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles').select('organization_id').eq('id', user.id).single();

  const body = await req.json();
  const { is_featured, featured_until } = body;

  const { error } = await supabase
    .from('hotels')
    .update({ is_featured, featured_until: featured_until || null })
    .eq('organization_id', profile?.organization_id);

  if (error) return apiError(error);
  return NextResponse.json({ ok: true });
}
