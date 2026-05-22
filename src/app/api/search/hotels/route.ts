import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Thai ↔ English city aliases so guests can search in either language
const CITY_ALIASES: Record<string, string[]> = {
  Bangkok:              ['กรุงเทพ', 'กรุงเทพฯ', 'กรุงเทพมหานคร', 'bkk', 'bangkok'],
  'Chiang Mai':         ['เชียงใหม่', 'chiang mai', 'chiangmai'],
  Phuket:               ['ภูเก็ต', 'phuket'],
  'Koh Samui':          ['เกาะสมุย', 'สมุย', 'samui', 'koh samui', 'ko samui'],
  Krabi:                ['กระบี่', 'krabi'],
  'Hua Hin':            ['หัวหิน', 'hua hin', 'huahin'],
  Ayutthaya:            ['อยุธยา', 'พระนครศรีอยุธยา', 'ayutthaya'],
  'Koh Phi Phi':        ['เกาะพีพี', 'พีพี', 'phi phi', 'koh phi phi'],
  'Khao Yai':           ['เขาใหญ่', 'khao yai', 'khaoyai'],
  'Chiang Rai':         ['เชียงราย', 'chiang rai', 'chiangrai'],
  'Cha-am':             ['ชะอำ', 'cha am', 'cha-am'],
  'Koh Lanta':          ['เกาะลันตา', 'ลันตา', 'koh lanta', 'ko lanta'],
  Pattaya:              ['พัทยา', 'pattaya'],
  'Nakhon Ratchasima':  ['นครราชสีมา', 'โคราช', 'korat', 'nakhon ratchasima'],
  Pai:                  ['ปาย', 'pai'],
  'Khao Lak':           ['เขาหลัก', 'khao lak', 'khaolak'],
};

// Also support Thai brand name search for "Maitri" → "ไมตรี"
const BRAND_ALIASES: Record<string, string[]> = {
  Maitri: ['ไมตรี', 'maitri'],
};

function resolveQuery(q: string): { searchTerms: string[]; cityFilters: string[] } {
  const lower = q.toLowerCase().trim();
  const cityFilters: string[] = [];
  const searchTerms: string[] = [q];

  // Check if query matches any Thai/English city alias → add English city name to filter
  for (const [city, aliases] of Object.entries(CITY_ALIASES)) {
    if (aliases.some(a => lower.includes(a.toLowerCase()) || a.toLowerCase().includes(lower))
      || city.toLowerCase().includes(lower)) {
      cityFilters.push(city);
    }
  }

  // Check brand aliases
  for (const [brand, aliases] of Object.entries(BRAND_ALIASES)) {
    if (aliases.some(a => lower.includes(a.toLowerCase()))) {
      searchTerms.push(brand);
    }
  }

  return { searchTerms, cityFilters };
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (q.length < 1) return NextResponse.json({ hotels: [] });

  const admin = createAdminClient();
  const { searchTerms, cityFilters } = resolveQuery(q);

  // Build OR conditions: name/city matches the raw query OR city is in resolved English city list
  const conditions: string[] = [];
  for (const term of searchTerms) {
    conditions.push(`name.ilike.%${term}%`, `city.ilike.%${term}%`);
  }
  for (const city of cityFilters) {
    conditions.push(`city.eq.${city}`);
  }

  const { data, error } = await admin
    .from('hotels')
    .select('id, name, slug, city, country, hero_image_url, room_types(base_rate)')
    .or(conditions.join(','))
    .order('name')
    .limit(8);

  if (error) return NextResponse.json({ hotels: [] }, { status: 500 });

  // Deduplicate by id (different conditions may return same hotel)
  const seen = new Set<string>();
  const hotels = (data ?? [])
    .filter((h: any) => { if (seen.has(h.id)) return false; seen.add(h.id); return true; })
    .map((h: any) => {
      const rates = (h.room_types ?? [])
        .map((rt: any) => rt.base_rate)
        .filter((r: any) => r != null && r > 0);
      return {
        id: h.id,
        name: h.name,
        slug: h.slug,
        city: h.city,
        city_th: Object.entries(CITY_ALIASES).find(([en]) => en === h.city)?.[1]?.[0] ?? null,
        country: h.country,
        hero_image_url: h.hero_image_url,
        min_rate: rates.length ? Math.min(...rates) : null,
      };
    });

  return NextResponse.json({ hotels });
}
