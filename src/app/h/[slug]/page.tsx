export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import {
  MapPin, Phone, Mail, Star, Clock, ChevronRight, Bed, Users, Maximize2,
  Wifi, Wind, Coffee, Car, Waves, Dumbbell, UtensilsCrossed, Heart, Tv,
  CheckCircle, ShieldCheck, Tag, Flame, Bath, ConciergeBell, Plane,
  TreePine, Mountain, Sun, Refrigerator, Image as ImageIcon,
} from 'lucide-react';
import { GuestChatWidget } from '@/components/booking/guest-chat-widget';
import { WishlistButton } from '@/components/ui/wishlist-button';
import { HotelGallery } from '@/components/booking/hotel-gallery';
import { HotelCard } from '@/components/public/HotelCard';
import type { Metadata } from 'next';

type GalleryItem = { image_url: string; alt_text?: string | null; display_order: number };
type Review = {
  id: string; rating: number;
  rating_clean?: number | null; rating_service?: number | null;
  rating_location?: number | null; rating_value?: number | null;
  reviewer_name?: string | null; verified_stay?: boolean | null;
  title?: string | null; comment?: string | null; reply_text?: string | null;
};
type RoomTypeLite = { base_rate?: number | null };

// ── Amenity icon + label maps ─────────────────────────────────────────────────
const AMENITY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  wifi: Wifi, 'wi-fi': Wifi, วายฟาย: Wifi, อินเทอร์เน็ต: Wifi, internet: Wifi,
  'air conditioning': Wind, ac: Wind, แอร์: Wind, เครื่องปรับอากาศ: Wind, aircon: Wind,
  breakfast: Coffee, 'อาหารเช้า': Coffee, บุฟเฟ่ต์: Coffee, coffee: Coffee,
  pool: Waves, 'สระว่ายน้ำ': Waves, swimming: Waves, สระ: Waves,
  parking: Car, 'ที่จอดรถ': Car, จอดรถ: Car,
  gym: Dumbbell, ฟิตเนส: Dumbbell, fitness: Dumbbell, exercise: Dumbbell,
  restaurant: UtensilsCrossed, 'ร้านอาหาร': UtensilsCrossed, dining: UtensilsCrossed,
  spa: Heart, สปา: Heart, massage: Heart, นวด: Heart,
  tv: Tv, โทรทัศน์: Tv, television: Tv, cable: Tv,
  bath: Bath, 'อ่างอาบน้ำ': Bath, bathtub: Bath,
  concierge: ConciergeBell, 'คอนเซียร์จ': ConciergeBell,
  airport: Plane, 'รับส่งสนามบิน': Plane, shuttle: Plane, transfer: Plane,
  garden: TreePine, 'สวน': TreePine, nature: TreePine,
  view: Mountain, 'วิวสวย': Mountain, scenic: Mountain,
  terrace: Sun, 'ระเบียง': Sun, balcony: Sun,
  fridge: Refrigerator, 'ตู้เย็น': Refrigerator, minibar: Refrigerator,
};
const AMENITY_TH: Record<string, string> = {
  wifi: 'WiFi ฟรี', 'wi-fi': 'WiFi ฟรี', internet: 'WiFi ฟรี',
  ac: 'แอร์', 'air conditioning': 'ปรับอากาศ', aircon: 'ปรับอากาศ',
  breakfast: 'อาหารเช้า', coffee: 'กาแฟ/ชา',
  pool: 'สระว่ายน้ำ', swimming: 'สระว่ายน้ำ',
  parking: 'ที่จอดรถ',
  gym: 'ฟิตเนส', fitness: 'ฟิตเนส', exercise: 'ฟิตเนส',
  restaurant: 'ร้านอาหาร', dining: 'ห้องอาหาร',
  spa: 'สปา', massage: 'นวด',
  tv: 'โทรทัศน์', cable: 'ทีวีเคเบิล',
  bath: 'อ่างอาบน้ำ', bathtub: 'อ่างอาบน้ำ',
  concierge: 'คอนเซียร์จ',
  airport: 'รับสนามบิน', shuttle: 'รถรับส่ง', transfer: 'รถรับส่ง',
  garden: 'สวน', terrace: 'ระเบียง', balcony: 'ระเบียง',
  fridge: 'ตู้เย็น', minibar: 'มินิบาร์',
};

function amenityIcon(a: string) {
  const key = a.toLowerCase();
  return AMENITY_ICONS[key] ?? AMENITY_ICONS[a] ?? Tag;
}
function amenityTh(a: string): string {
  const key = a.toLowerCase();
  return AMENITY_TH[key] ?? AMENITY_TH[a] ?? a;
}
function scoreLabel(r: number): { th: string; bg: string } {
  if (r >= 4.7) return { th: 'ยอดเยี่ยมมาก', bg: '#1d4ed8' };
  if (r >= 4.3) return { th: 'ยอดเยี่ยม',    bg: '#0284c7' };
  if (r >= 3.8) return { th: 'ดีมาก',        bg: '#059669' };
  if (r >= 3.5) return { th: 'ดี',           bg: '#16a34a' };
  return           { th: 'น่าสนใจ',        bg: '#d97706' };
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://example.com';
  const supabase = createAdminClient();
  const { data: h } = await supabase.from('hotels').select('name,description,hero_image_url,city').eq('slug', slug).single();
  if (!h) return {};
  return {
    metadataBase: new URL(appUrl),
    title: `${h.name} — จองห้องพักออนไลน์`,
    description: h.description || `จองห้องพักที่ ${h.name} ${h.city} ราคาดีที่สุด ยกเลิกฟรี`,
    alternates: { canonical: `/h/${slug}` },
    openGraph: {
      title: h.name,
      description: h.description || `ที่พักใน ${h.city}`,
      url: `/h/${slug}`,
      images: h.hero_image_url ? [{ url: h.hero_image_url, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${h.name} — จองห้องพักออนไลน์`,
      description: h.description || `ที่พักใน ${h.city}`,
      images: h.hero_image_url ? [h.hero_image_url] : [],
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function HotelLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('*, hotel_gallery(id, image_url, alt_text, display_order)')
    .eq('slug', slug)
    .single();
  if (!hotel) notFound();

  const [roomTypesRes, reviewsRes, roomInventoryRes, nearbyRes] = await Promise.all([
    supabase
      .from('room_types')
      .select('*, room_type_images(image_url, display_order)')
      .eq('hotel_id', hotel.id)
      .order('base_rate'),
    supabase
      .from('booking_reviews')
      .select('id, rating, rating_clean, rating_service, rating_location, rating_value, title, comment, reviewer_name, verified_stay, reply_text, created_at')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('rooms')
      .select('room_type_id')
      .eq('hotel_id', hotel.id)
      .not('status', 'in', '("out_of_order","maintenance")'),
    hotel.city
      ? supabase
          .from('hotels')
          .select('id, name, slug, city, hero_image_url, star_rating, hotel_gallery(image_url, display_order)')
          .eq('city', hotel.city)
          .neq('id', hotel.id)
          .limit(4)
      : { data: [] },
  ]);

  const roomTypes    = roomTypesRes.data || [];
  const reviews      = reviewsRes.data   || [];
  const typedReviews = reviews as Review[];
  const nearbyHotels = (nearbyRes.data || []).map((h: any) => ({
    ...h,
    gallery: (h.hotel_gallery || []).sort((a: any, b: any) => a.display_order - b.display_order).slice(0, 3),
  }));

  const roomCountByType: Record<string, number> = {};
  for (const r of (roomInventoryRes.data || [])) {
    roomCountByType[(r as any).room_type_id] = (roomCountByType[(r as any).room_type_id] || 0) + 1;
  }

  const gallery = ((hotel.hotel_gallery || []) as GalleryItem[]).sort((a, b) => a.display_order - b.display_order);
  const avgRating = typedReviews.length
    ? typedReviews.reduce((s, r) => s + r.rating, 0) / typedReviews.length
    : null;

  const ratingBreakdown = typedReviews.length ? {
    clean:    typedReviews.filter(r => r.rating_clean).reduce((s,r)    => s + (r.rating_clean    || 0), 0) / (typedReviews.filter(r => r.rating_clean).length    || 1),
    service:  typedReviews.filter(r => r.rating_service).reduce((s,r)  => s + (r.rating_service  || 0), 0) / (typedReviews.filter(r => r.rating_service).length  || 1),
    location: typedReviews.filter(r => r.rating_location).reduce((s,r) => s + (r.rating_location || 0), 0) / (typedReviews.filter(r => r.rating_location).length || 1),
    value:    typedReviews.filter(r => r.rating_value).reduce((s,r)    => s + (r.rating_value    || 0), 0) / (typedReviews.filter(r => r.rating_value).length    || 1),
  } : null;

  const minRate = roomTypes.length
    ? Math.min(...(roomTypes as RoomTypeLite[]).map(r => Number(r.base_rate) || Infinity))
    : 0;

  // Collect hotel-level amenities from all room types (unique, sorted by freq)
  const amenityFreq: Record<string, number> = {};
  for (const rt of roomTypes) {
    for (const a of ((rt as any).amenities || [])) {
      amenityFreq[a] = (amenityFreq[a] || 0) + 1;
    }
  }
  const allAmenities = Object.keys(amenityFreq).sort((a, b) => amenityFreq[b] - amenityFreq[a]);
  const highlights   = allAmenities.slice(0, 6);

  // Deterministic "viewers" seed from hotel id
  const viewersNow = hotel.id
    ? (parseInt(hotel.id.replace(/-/g, '').slice(0, 4), 16) % 10) + 3
    : 5;

  const score = avgRating ? scoreLabel(avgRating) : null;

  // JSON-LD
  const hotelJsonLd = {
    '@context': 'https://schema.org', '@type': 'Hotel',
    name: hotel.name, description: hotel.description || undefined,
    image: hotel.hero_image_url || undefined,
    telephone: hotel.phone || undefined, email: hotel.email || undefined,
    address: hotel.address ? { '@type': 'PostalAddress', streetAddress: hotel.address, addressLocality: hotel.city || undefined, addressCountry: 'TH' } : undefined,
    aggregateRating: avgRating ? { '@type': 'AggregateRating', ratingValue: Number(avgRating.toFixed(1)), reviewCount: reviews.length } : undefined,
    priceRange: minRate ? `THB ${Math.round(minRate).toLocaleString()}+` : undefined,
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'หน้าแรก',  item: `${process.env.NEXT_PUBLIC_APP_URL || ''}/` },
      { '@type': 'ListItem', position: 2, name: 'โรงแรม',   item: `${process.env.NEXT_PUBLIC_APP_URL || ''}/search` },
      { '@type': 'ListItem', position: 3, name: hotel.name, item: `${process.env.NEXT_PUBLIC_APP_URL || ''}/h/${slug}` },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* ── Sticky nav ── */}
      <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-black/5 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hotel.logo_url && <img src={hotel.logo_url} alt="logo" className="h-8 object-contain" />}
            <div>
              <div className="font-bold text-[#2A2522] text-sm leading-tight">{hotel.name}</div>
              {hotel.city && (
                <div className="text-2xs text-[#2A2522]/50 flex items-center gap-0.5 mt-0.5">
                  <MapPin className="h-3 w-3" />{hotel.city}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Viewer count */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#2A2522]/50 mr-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {viewersNow} คนกำลังดูอยู่
            </div>
            <WishlistButton hotelId={hotel.id} />
            <Link href={`/booking/${slug}`}
              className="px-5 py-2 bg-[#C66A30] text-white rounded-full text-sm font-semibold hover:bg-[#A4522A] transition-colors shadow-sm">
              จองเลย
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Gallery ── */}
      <HotelGallery
        images={gallery.length > 0
          ? gallery.map((g: any) => ({ url: g.image_url, alt: g.alt_text || hotel.name }))
          : hotel.hero_image_url
            ? [{ url: hotel.hero_image_url, alt: hotel.name }]
            : []}
        hotelName={hotel.name}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Header */}
            <div className="border-b border-black/8 pb-8">
              <h1 className="text-2xl font-bold text-[#2A2522] mb-3">{hotel.name}</h1>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                {hotel.city && (
                  <span className="flex items-center gap-1 text-sm text-[#2A2522]/60">
                    <MapPin className="h-4 w-4" />{hotel.city}
                  </span>
                )}
                {avgRating && score && (
                  <div className="flex items-center gap-2">
                    {/* Score badge — Agoda-style */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: score.bg }}>
                      {score.th}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                      <strong className="text-[#2A2522] text-sm">{avgRating.toFixed(1)}</strong>
                      <span className="text-xs text-[#2A2522]/40">({reviews.length} รีวิว)</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-[#2A2522]/60 mb-5">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />เช็คอิน {hotel.check_in_time || '14:00'} น.</span>
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />เช็คเอาท์ {hotel.check_out_time || '12:00'} น.</span>
              </div>

              {/* Highlights chips */}
              {highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {highlights.map(a => {
                    const Icon = amenityIcon(a);
                    return (
                      <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] border border-[#C66A30]/20 text-[#2A2522]/70 text-xs rounded-full font-medium">
                        <Icon className="h-3.5 w-3.5 text-[#C66A30]" />
                        {amenityTh(a)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* About */}
            {hotel.description && (
              <div className="border-b border-black/8 pb-8">
                <h2 className="text-lg font-bold text-[#2A2522] mb-3">เกี่ยวกับที่พัก</h2>
                <p className="text-[#2A2522]/70 leading-relaxed">{hotel.description}</p>
              </div>
            )}

            {/* ── Amenities grid (NEW) ── */}
            {allAmenities.length > 0 && (
              <div className="border-b border-black/8 pb-8">
                <h2 className="text-lg font-bold text-[#2A2522] mb-5">สิ่งอำนวยความสะดวก</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allAmenities.slice(0, 16).map(a => {
                    const Icon = amenityIcon(a);
                    return (
                      <div key={a} className="flex items-center gap-3 p-3 rounded-xl bg-[#FAF7F2] border border-black/5">
                        <div className="h-8 w-8 rounded-lg bg-[#C66A30]/10 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-[#C66A30]" />
                        </div>
                        <span className="text-xs text-[#2A2522]/80 font-medium leading-tight">{amenityTh(a)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Why book direct (NEW) ── */}
            <div className="border-b border-black/8 pb-8">
              <h2 className="text-lg font-bold text-[#2A2522] mb-4">ทำไมต้องจองตรงกับเรา?</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: ShieldCheck, title: 'ราคาดีที่สุด',    desc: 'ราคาเท่ากันหรือดีกว่าทุก OTA รับประกัน Best Rate' },
                  { icon: CheckCircle, title: 'ยกเลิกได้ฟรี',   desc: 'ยกเลิกได้ฟรีก่อน 24 ชั่วโมงสำหรับห้องส่วนใหญ่' },
                  { icon: Phone,       title: 'ติดต่อตรงได้เลย', desc: 'ทีมงานพร้อมตอบ ไม่ผ่านตัวกลาง เร็วกว่าแน่นอน' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="p-4 rounded-xl border border-[#C66A30]/20 bg-[#FDF8F3]">
                    <Icon className="h-5 w-5 text-[#C66A30] mb-2" />
                    <p className="font-semibold text-[#2A2522] text-sm mb-1">{title}</p>
                    <p className="text-xs text-[#2A2522]/60 leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Policies */}
            <div className="border-b border-black/8 pb-8" id="policies">
              <h2 className="text-lg font-bold text-[#2A2522] mb-4">นโยบายที่พัก</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm text-[#2A2522]/70">
                <div className="p-4 rounded-xl bg-[#FAF7F2]">
                  <p className="font-semibold text-[#2A2522] mb-1">เวลาเช็คอิน / เช็คเอาท์</p>
                  <p>เช็คอิน: {hotel.check_in_time || '14:00'} น.</p>
                  <p>เช็คเอาท์: {hotel.check_out_time || '12:00'} น.</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F2]">
                  <p className="font-semibold text-[#2A2522] mb-1">นโยบายการยกเลิก</p>
                  <p>ยกเลิกฟรีก่อนวันเช็คอินอย่างน้อย 24 ชั่วโมง</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F2]">
                  <p className="font-semibold text-[#2A2522] mb-1">เด็กและเตียงเสริม</p>
                  <p>รองรับผู้เข้าพักได้สูงสุดตามประเภทห้องพัก</p>
                </div>
                <div className="p-4 rounded-xl bg-[#FAF7F2]">
                  <p className="font-semibold text-[#2A2522] mb-1">สัตว์เลี้ยง</p>
                  <p>กรุณาติดต่อโรงแรมล่วงหน้าเพื่อยืนยันเงื่อนไข</p>
                </div>
              </div>
            </div>

            {/* Nearby */}
            <div className="border-b border-black/8 pb-8" id="nearby">
              <h2 className="text-lg font-bold text-[#2A2522] mb-4">สถานที่ใกล้เคียง</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  `แหล่งท่องเที่ยวหลักใน${hotel.city || 'พื้นที่ใกล้เคียง'}`,
                  'ร้านอาหารยอดนิยม', 'ศูนย์การค้า', 'สถานีขนส่ง / รถไฟฟ้า',
                ].map(place => (
                  <div key={place} className="p-4 rounded-xl border border-black/10 bg-white text-sm text-[#2A2522]/70">
                    <p className="font-medium text-[#2A2522]">{place}</p>
                    <p className="text-xs mt-1">ระยะทางโดยประมาณ 1–3 กม.</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="border-b border-black/8 pb-8" id="map">
              <h2 className="text-lg font-bold text-[#2A2522] mb-4">ที่ตั้ง</h2>
              <div className="rounded-2xl overflow-hidden border border-black/10">
                <iframe
                  title={`Map of ${hotel.name}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(`${hotel.name} ${hotel.address || hotel.city || ''}`)}&output=embed`}
                  className="w-full h-64"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              {hotel.address && (
                <p className="mt-3 text-sm text-[#2A2522]/60 flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[#C66A30] mt-0.5 shrink-0" />
                  {hotel.address}
                </p>
              )}
            </div>

            {/* ── Room types (UPGRADED) ── */}
            {roomTypes.length > 0 && (
              <div className="border-b border-black/8 pb-8" id="rooms">
                <h2 className="text-lg font-bold text-[#2A2522] mb-1">ห้องพักที่มี</h2>
                <p className="text-sm text-[#2A2522]/50 mb-5">ราคาเริ่มต้น · ยกเลิกฟรี · จองได้ทันที</p>
                <div className="space-y-5">
                  {(roomTypes as any[]).map((rt, idx) => {
                    const imgs = ((rt.room_type_images || []) as any[]).sort((a, b) => a.display_order - b.display_order);
                    const amenities: string[] = rt.amenities || [];
                    const availCount = roomCountByType[rt.id] || 0;
                    const isPopular  = idx === 0;
                    const isLow      = availCount > 0 && availCount <= 3;

                    return (
                      <div key={rt.id} className={`rounded-2xl border overflow-hidden hover:shadow-md transition-shadow ${isPopular ? 'border-[#C66A30]/40 ring-1 ring-[#C66A30]/20' : 'border-black/8'}`}>
                        {/* Popular badge strip */}
                        {isPopular && (
                          <div className="bg-[#C66A30] px-4 py-1.5 flex items-center gap-1.5">
                            <Flame className="h-3.5 w-3.5 text-white" />
                            <span className="text-white text-xs font-semibold">ห้องยอดนิยม — เลือกมากที่สุด</span>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row">
                          {/* Image */}
                          <div className="sm:w-52 h-52 sm:h-auto bg-[#FAF7F2] shrink-0 relative overflow-hidden">
                            {imgs[0]?.image_url
                              ? <img src={imgs[0].image_url} alt={rt.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-[#2A2522]/10"><Bed className="h-12 w-12" /></div>
                            }
                            {imgs.length > 1 && (
                              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-2xs px-2 py-0.5 rounded-full flex items-center gap-1">
                                <ImageIcon className="h-3 w-3" />
                                {imgs.length} รูป
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 p-5 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <h3 className="font-bold text-[#2A2522] text-base leading-tight">{rt.name}</h3>
                                <div className="text-right shrink-0">
                                  <div className="font-bold text-xl text-[#C66A30]">{formatCurrency(rt.base_rate)}</div>
                                  <div className="text-xs text-[#2A2522]/40">/ คืน (ราคาเริ่มต้น)</div>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-3 text-xs text-[#2A2522]/50 mb-3">
                                {rt.size_sqm    && <span className="flex items-center gap-1"><Maximize2 className="h-3.5 w-3.5" />{rt.size_sqm} ตร.ม.</span>}
                                {rt.max_occupancy && <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />สูงสุด {rt.max_occupancy} คน</span>}
                                {rt.bed_type     && <span className="flex items-center gap-1"><Bed className="h-3.5 w-3.5" />{rt.bed_type}</span>}
                              </div>

                              {rt.description && (
                                <p className="text-xs text-[#2A2522]/60 leading-relaxed mb-3 line-clamp-2">{rt.description}</p>
                              )}

                              {amenities.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  {amenities.slice(0, 6).map((a: string) => (
                                    <span key={a} className="text-2xs bg-[#FAF7F2] text-[#2A2522]/60 px-2 py-0.5 rounded-full border border-black/5">
                                      {amenityTh(a)}
                                    </span>
                                  ))}
                                  {amenities.length > 6 && (
                                    <span className="text-2xs text-[#2A2522]/40">+{amenities.length - 6} อื่นๆ</span>
                                  )}
                                </div>
                              )}

                              {/* Status badges */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                <span className="flex items-center gap-1 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                                  <CheckCircle className="h-3.5 w-3.5" />ยกเลิกฟรี 24 ชม.
                                </span>
                                {isLow && (
                                  <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                                    เหลือเพียง {availCount} ห้อง!
                                  </span>
                                )}
                              </div>
                            </div>

                            <Link href={`/booking/${slug}`}
                              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto sm:self-end bg-[#C66A30] hover:bg-[#A4522A] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
                              เลือกห้องนี้ <ChevronRight className="h-4 w-4" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div id="reviews">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-lg font-bold text-[#2A2522]">รีวิวจากแขก</h2>
                  {avgRating && score && (
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: score.bg }}>
                        {avgRating.toFixed(1)}
                      </div>
                      <span className="text-sm font-semibold text-[#2A2522]">{score.th}</span>
                      <span className="text-xs text-[#2A2522]/40">{reviews.length} รีวิว</span>
                    </div>
                  )}
                </div>

                {ratingBreakdown && (
                  <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-[#FAF7F2] rounded-2xl">
                    {[
                      { k: 'clean',    l: 'ความสะอาด' },
                      { k: 'service',  l: 'บริการ' },
                      { k: 'location', l: 'ทำเล' },
                      { k: 'value',    l: 'ความคุ้มค่า' },
                    ].map(({ k, l }) => {
                      const v = (ratingBreakdown as any)[k];
                      if (!v) return null;
                      return (
                        <div key={k} className="flex items-center gap-2">
                          <span className="text-xs text-[#2A2522]/50 w-24">{l}</span>
                          <div className="flex-1 h-2 bg-black/8 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${(v / 5) * 100}%`, backgroundColor: '#C66A30' }} />
                          </div>
                          <span className="text-xs font-semibold text-[#2A2522] w-7 text-right">{v.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {typedReviews.map(r => (
                    <div key={r.id} className="p-4 border border-black/8 rounded-2xl hover:border-black/15 transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="h-9 w-9 rounded-full bg-[#2A2522] text-white flex items-center justify-center text-sm font-bold shrink-0">
                            {(r.reviewer_name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#2A2522]">{r.reviewer_name || 'แขกผู้เข้าพัก'}</p>
                            {r.verified_stay && <p className="text-2xs text-emerald-600 flex items-center gap-0.5"><CheckCircle className="h-3 w-3" />เข้าพักจริง</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-sm font-bold text-[#2A2522]">{r.rating}</span>
                        </div>
                      </div>
                      {r.title && <p className="text-sm font-semibold text-[#2A2522] mb-1">{r.title}</p>}
                      {r.comment && <p className="text-sm text-[#2A2522]/60 line-clamp-3 leading-relaxed">{r.comment}</p>}
                      {r.reply_text && (
                        <div className="mt-3 pl-3 border-l-2 border-[#C66A30]/40 bg-[#FDF8F3] rounded-r-lg py-2 pr-3">
                          <p className="text-2xs text-[#C66A30] font-semibold mb-0.5">ตอบกลับจากโรงแรม</p>
                          <p className="text-xs text-[#2A2522]/60">{r.reply_text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div id="contact" className="border-t border-black/8 pt-8">
              <h2 className="text-lg font-bold text-[#2A2522] mb-4">ติดต่อและที่ตั้ง</h2>
              <div className="space-y-3 text-sm">
                {hotel.address && <div className="flex items-start gap-3"><MapPin className="h-4 w-4 text-[#C66A30] mt-0.5 shrink-0" /><span className="text-[#2A2522]/70">{hotel.address}</span></div>}
                {hotel.phone && <a href={`tel:${hotel.phone}`} className="flex items-center gap-3 hover:text-[#C66A30] transition-colors group"><Phone className="h-4 w-4 text-[#C66A30] shrink-0" /><span className="text-[#2A2522]/70 group-hover:text-[#C66A30]">{hotel.phone}</span></a>}
                {hotel.email && <a href={`mailto:${hotel.email}`} className="flex items-center gap-3 hover:text-[#C66A30] transition-colors group"><Mail className="h-4 w-4 text-[#C66A30] shrink-0" /><span className="text-[#2A2522]/70 group-hover:text-[#C66A30]">{hotel.email}</span></a>}
              </div>
            </div>
          </div>

          {/* ── Sticky sidebar (UPGRADED) ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-black/10 shadow-lg overflow-hidden">

              {/* Price header */}
              <div className="bg-[#2A2522] p-5 text-white">
                <div className="text-xs text-white/50 mb-0.5">ราคาเริ่มต้น</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold">{formatCurrency(minRate)}</span>
                  <span className="text-sm text-white/50">/ คืน</span>
                </div>
                {avgRating && score && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/60 px-2 py-0.5 rounded-md font-semibold" style={{ backgroundColor: score.bg }}>
                      {score.th} {avgRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-white/40">{reviews.length} รีวิว</span>
                  </div>
                )}
              </div>

              <div className="p-5">
                {/* Viewer count */}
                <div className="flex items-center gap-2 text-xs text-[#2A2522]/50 mb-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span><strong className="text-[#2A2522]">{viewersNow} คน</strong> กำลังดูที่พักนี้อยู่ขณะนี้</span>
                </div>

                {/* Date picker */}
                <div className="border border-black/10 rounded-xl overflow-hidden mb-3">
                  <div className="grid grid-cols-2 divide-x divide-black/10">
                    <div className="p-3">
                      <div className="text-2xs font-semibold text-[#2A2522]/40 uppercase tracking-wider mb-1">เช็คอิน</div>
                      <input type="date" className="w-full text-sm text-[#2A2522] bg-transparent focus:outline-none"
                        defaultValue={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} />
                    </div>
                    <div className="p-3">
                      <div className="text-2xs font-semibold text-[#2A2522]/40 uppercase tracking-wider mb-1">เช็คเอาท์</div>
                      <input type="date" className="w-full text-sm text-[#2A2522] bg-transparent focus:outline-none"
                        defaultValue={new Date(Date.now() + 172800000).toISOString().slice(0, 10)} />
                    </div>
                  </div>
                  <div className="border-t border-black/10 p-3">
                    <div className="text-2xs font-semibold text-[#2A2522]/40 uppercase tracking-wider mb-1">ผู้เข้าพัก</div>
                    <select className="w-full text-sm text-[#2A2522] bg-transparent focus:outline-none">
                      {[1,2,3,4].map(n => <option key={n} value={n}>{n} ผู้ใหญ่</option>)}
                    </select>
                  </div>
                </div>

                <Link href={`/booking/${slug}`}
                  className="block w-full text-center bg-[#C66A30] hover:bg-[#A4522A] text-white py-3.5 rounded-xl font-bold text-sm transition-colors mb-4 shadow-sm">
                  ดูห้องว่างและจอง
                </Link>

                {/* Trust strip */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {[
                    { icon: ShieldCheck, label: 'ราคาดีสุด' },
                    { icon: CheckCircle, label: 'ยกเลิกฟรี' },
                    { icon: Tag,         label: 'ไม่มีค่าธรรมเนียม' },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 text-center p-2 bg-[#FAF7F2] rounded-lg">
                      <Icon className="h-4 w-4 text-[#C66A30]" />
                      <span className="text-2xs text-[#2A2522]/60 leading-tight font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Quick info */}
                <div className="space-y-2 text-xs text-[#2A2522]/60 border-t border-black/8 pt-3">
                  <div className="flex justify-between"><span>เช็คอิน</span><span className="font-semibold text-[#2A2522]">{hotel.check_in_time || '14:00'} น.</span></div>
                  <div className="flex justify-between"><span>เช็คเอาท์</span><span className="font-semibold text-[#2A2522]">{hotel.check_out_time || '12:00'} น.</span></div>
                  <div className="flex justify-between"><span>ยกเลิกฟรี</span><span className="font-semibold text-emerald-600">24 ชม.ก่อนเช็คอิน</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky CTA ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-black/8 p-4 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-bold text-[#2A2522] text-lg leading-tight">
              {formatCurrency(minRate)}<span className="text-xs font-normal text-[#2A2522]/50"> / คืน</span>
            </div>
            {avgRating && score ? (
              <div className="text-xs font-semibold mt-0.5" style={{ color: score.bg }}>{score.th} {avgRating.toFixed(1)}</div>
            ) : (
              <div className="text-xs text-emerald-600 font-medium mt-0.5">✓ ยกเลิกได้ฟรี</div>
            )}
          </div>
          <Link href={`/booking/${slug}`}
            className="flex-1 max-w-[180px] text-center bg-[#C66A30] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#A4522A] transition-colors shadow-sm">
            จองเลย
          </Link>
        </div>
        {/* Trust micro-strip */}
        <div className="flex items-center justify-center gap-4 mt-2 text-2xs text-[#2A2522]/40">
          <span>🔒 ปลอดภัย</span>
          <span>·</span>
          <span>✓ ราคาดีที่สุด</span>
          <span>·</span>
          <span>↩ ยกเลิกฟรี</span>
        </div>
      </div>

      <GuestChatWidget hotelId={hotel.id} hotelName={hotel.name} />

      {/* ── Nearby hotels ── */}
      {nearbyHotels.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-[#2A2522]">ที่พักใกล้เคียงใน{hotel.city}</h2>
              <p className="text-sm text-[#2A2522]/40 mt-0.5">ที่พักอื่นๆ ในย่านเดียวกัน</p>
            </div>
            <Link href={`/search?city=${encodeURIComponent(hotel.city || '')}`}
              className="text-sm text-[#C66A30] hover:underline flex items-center gap-1">
              ดูทั้งหมด <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nearbyHotels.map((h: any) => (
              <HotelCard key={h.id} hotel={h} />
            ))}
          </div>
        </section>
      )}

      <footer className="bg-[#2A2522] text-white/40 py-8 mt-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <span>© {new Date().getFullYear()} {hotel.name}</span>
            <div className="flex items-center gap-4">
              <Link href="/search" className="hover:text-white/70 transition-colors">ค้นหาโรงแรม</Link>
              <Link href="/privacy" className="hover:text-white/70 transition-colors">นโยบายความเป็นส่วนตัว</Link>
              <span>Powered by <Link href="/" className="text-[#C66A30] font-semibold hover:text-[#E0813A]">Maitri</Link></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
