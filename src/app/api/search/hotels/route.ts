import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 1) return NextResponse.json({ hotels: [] });

  const admin = createAdminClient();

  const { data, error } = await admin
    .from('hotels')
    .select('id, name, slug, city, country, hero_image_url, room_types(base_rate)')
    .or(`name.ilike.%${q}%,city.ilike.%${q}%`)
    .order('name')
    .limit(8);

  if (error) return NextResponse.json({ hotels: [] }, { status: 500 });

  const hotels = (data ?? []).map((h: any) => {
    const rates = (h.room_types ?? [])
      .map((rt: any) => rt.base_rate)
      .filter((r: any) => r != null && r > 0);
    return {
      id: h.id,
      name: h.name,
      slug: h.slug,
      city: h.city,
      country: h.country,
      hero_image_url: h.hero_image_url,
      min_rate: rates.length ? Math.min(...rates) : null,
    };
  });

  return NextResponse.json({ hotels });
}
