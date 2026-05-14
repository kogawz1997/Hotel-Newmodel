import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { DEFAULT_WEIGHTS, computeScore, type RankingWeights } from '@/lib/ranking';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city       = searchParams.get('city') || '';
    const checkIn    = searchParams.get('checkIn') || '';
    const checkOut   = searchParams.get('checkOut') || '';
    const adults     = Number(searchParams.get('adults') || 2);
    const type       = searchParams.get('type') || '';
    const minPrice   = Number(searchParams.get('minPrice') || 0);
    const maxPrice   = Number(searchParams.get('maxPrice') || 999999);
    const minRating  = Number(searchParams.get('minRating') || 0);
    const sort       = searchParams.get('sort') || 'recommended';
    const starsParam = searchParams.get('stars') || '';
    const lat        = searchParams.get('lat') ? Number(searchParams.get('lat')) : null;
    const lng        = searchParams.get('lng') ? Number(searchParams.get('lng')) : null;
    const amenities  = searchParams.get('amenities') || '';
    const cancelType = searchParams.get('cancelType') || '';

    const supabase = createAdminClient();

    // Load platform-configured weights (falls back to defaults silently)
    let weights: RankingWeights = { ...DEFAULT_WEIGHTS };
    try {
      const { data: cfg } = await supabase
        .from('platform_config')
        .select('value')
        .eq('key', 'ranking_weights')
        .single();
      if (cfg?.value) weights = { ...DEFAULT_WEIGHTS, ...(cfg.value as Partial<RankingWeights>) };
    } catch {}

    let query = supabase
      .from('hotels')
      .select(`
        id, name, slug, city, country, type, address, tagline, description,
        hero_image_url, star_rating, total_rooms, amenities,
        latitude, longitude, is_featured, featured_until,
        hotel_gallery(image_url, display_order)
      `)
      .eq('country', 'Thailand');

    if (city) query = query.ilike('city', `%${city}%`);
    if (type) query = query.eq('type', type);

    if (starsParam) {
      const starList = starsParam.split(',').map(Number).filter(n => n >= 1 && n <= 5);
      if (starList.length === 1) query = query.eq('star_rating', starList[0]);
      else if (starList.length > 1) query = query.in('star_rating', starList);
    }

    const { data: hotels, error } = await query.limit(100);
    if (error) return NextResponse.json({ hotels: [], total: 0, warning: error.message }, { status: 200 });

    const now = new Date().toISOString();

    const results = await Promise.all((hotels || []).map(async (hotel: any) => {
      const [{ data: roomTypes }, { data: reviews }, { data: occupiedRooms }] = await Promise.all([
        supabase.from('room_types')
          .select('id, name, base_rate, max_occupancy, cancel_policy, includes_breakfast')
          .eq('hotel_id', hotel.id)
          .gte('max_occupancy', adults)
          .order('base_rate'),

        supabase.from('booking_reviews')
          .select('rating')
          .eq('hotel_id', hotel.id),

        checkIn && checkOut
          ? supabase.from('reservations')
              .select('room_type_id')
              .eq('hotel_id', hotel.id)
              .in('status', ['confirmed', 'checked_in', 'on_hold'])
              .lt('check_in', checkOut)
              .gt('check_out', checkIn)
          : { data: [] },
      ]);

      const availableRoomTypes = (roomTypes || []).filter((rt: any) => {
        if (!checkIn || !checkOut) return true;
        const occupied = (occupiedRooms || []).filter((r: any) => r.room_type_id === rt.id).length;
        return occupied < 10;
      });

      const minRate = availableRoomTypes.length > 0
        ? Math.min(...availableRoomTypes.map((rt: any) => Number(rt.base_rate)))
        : null;

      const avgRating = reviews?.length
        ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
        : null;

      const isFreeCancel = (roomTypes || []).some((rt: any) =>
        String(rt.cancel_policy || '').toLowerCase().includes('free')
      );
      const isBreakfast = (roomTypes || []).some((rt: any) => rt.includes_breakfast === true);

      let distanceKm: number | undefined;
      if (lat !== null && lng !== null && hotel.latitude && hotel.longitude) {
        distanceKm = Math.round(haversineKm(lat, lng, hotel.latitude, hotel.longitude) * 10) / 10;
      }

      const galleryCount = (hotel.hotel_gallery || []).length;
      const isFeatured = hotel.is_featured === true && (!hotel.featured_until || hotel.featured_until > now);
      const hasContent  = !!(hotel.description && hotel.tagline);

      const rankScore = computeScore({
        avg_rating:    avgRating ? Math.round(avgRating * 10) / 10 : null,
        review_count:  reviews?.length || 0,
        gallery_count: galleryCount,
        is_free_cancel: isFreeCancel,
        is_breakfast:  isBreakfast,
        star_rating:   hotel.star_rating,
        is_featured:   isFeatured,
        has_content:   hasContent,
      }, weights);

      return {
        id: hotel.id,
        slug: hotel.slug,
        name: hotel.name,
        city: hotel.city,
        country: hotel.country,
        type: hotel.type,
        tagline: hotel.tagline,
        hero_image_url: hotel.hero_image_url,
        star_rating: hotel.star_rating,
        min_rate: minRate,
        avg_rating: avgRating ? Math.round(avgRating * 10) / 10 : null,
        review_count: reviews?.length || 0,
        is_available: availableRoomTypes.length > 0,
        is_free_cancel: isFreeCancel,
        is_breakfast: isBreakfast,
        is_featured: isFeatured,
        distance_km: distanceKm,
        rank_score: rankScore,
        gallery: (hotel.hotel_gallery || [])
          .sort((a: any, b: any) => a.display_order - b.display_order)
          .slice(0, 5),
      };
    }));

    let filtered = results.filter(h => {
      if (!h.is_available) return false;
      if (h.min_rate !== null && (h.min_rate < minPrice || h.min_rate > maxPrice)) return false;
      if (h.avg_rating !== null && h.avg_rating < minRating) return false;
      if (cancelType === 'free' && !h.is_free_cancel) return false;
      if (amenities) {
        const hotelAmenities = String((results.find(r => r.id === h.id) as any)?.amenities || '').toLowerCase();
        const reqList = amenities.split(',').map(a => a.trim().toLowerCase()).filter(Boolean);
        if (reqList.length && !reqList.every(a => hotelAmenities.includes(a))) return false;
      }
      return true;
    });

    if (sort === 'recommended') filtered.sort((a, b) => b.rank_score - a.rank_score);
    else if (sort === 'price_asc')  filtered.sort((a, b) => (a.min_rate || 0) - (b.min_rate || 0));
    else if (sort === 'price_desc') filtered.sort((a, b) => (b.min_rate || 0) - (a.min_rate || 0));
    else if (sort === 'rating')     filtered.sort((a, b) => (b.avg_rating || 0) - (a.avg_rating || 0));
    else if (sort === 'distance')   filtered.sort((a, b) => (a.distance_km ?? 9999) - (b.distance_km ?? 9999));

    return NextResponse.json({ hotels: filtered, total: filtered.length });
  } catch (error: unknown) {
    return NextResponse.json({
      hotels: [],
      total: 0,
      warning: error instanceof Error ? error.message : 'search unavailable',
    }, { status: 200 });
  }
}
