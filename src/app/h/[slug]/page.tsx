export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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
import { RoomCompareSection } from '@/components/public/RoomCompareSection';
import { PriceGraph } from '@/components/booking/price-graph';
import { TrackHotelView } from '@/components/public/TrackHotelView';
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
    alternates: {
      canonical: `/h/${slug}`,
      languages: { 'th': `/h/${slug}`, 'en': `/h/${slug}`, 'x-default': `/h/${slug}` },
    },
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
    <div className="min-h-screen bg-[#f5f7fa]">
      <TrackHotelView
        id={hotel.id} slug={slug} name={hotel.name}
        city={hotel.city ?? undefined}
        hero_image_url={hotel.hero_image_url ?? undefined}
        min_rate={minRate || undefined}
        avg_rating={avgRating ?? undefined}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(hotelJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* ── Sticky nav ── */}
      <nav className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-border/60 shadow-[0_1px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {hotel.logo_url && (
              <div className="relative h-8 w-24">
                <Image src={hotel.logo_url} alt="logo" fill className="object-contain" />
              </div>
            )}
            <div>
              <div className="font-semibold text-foreground text-[15px] leading-tight">{hotel.name}</div>
              {hotel.city && (
                <div className="text-[11px] text-muted-foreground flex items-center gap-0.5 mt-0.5">
                  <MapPin className="h-3 w-3" />{hotel.city}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground mr-2 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">{viewersNow} คนกำลังดูอยู่</span>
            </div>
            <WishlistButton hotelId={hotel.id} />
            <Link href={`/booking/${slug}`}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-full text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-600/25">
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

      {/* ── Breadcrumb ── */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-0">
        <nav className="flex items-center gap-1.5 text-xs text-gray-500" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-blue-600 transition-colors">หน้าแรก</Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <Link href="/search" className="hover:text-blue-600 transition-colors">ค้นหา</Link>
          <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-700 font-medium truncate max-w-[200px]">{hotel.name}</span>
        </nav>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-10">

          {/* ── Main content ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Header */}
            <div className="border-b border-border/60 pb-8">
              <h1 className="font-display text-3xl font-semibold text-foreground mb-3 tracking-tight">{hotel.name}</h1>

              <div className="flex flex-wrap items-center gap-3 mb-4">
                {hotel.city && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />{hotel.city}
                  </span>
                )}
                {avgRating && score && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-white text-sm font-bold shadow-sm" style={{ backgroundColor: score.bg }}>
                      <Star className="h-3.5 w-3.5 fill-white/80 text-white/80" />
                      {avgRating.toFixed(1)} <span className="font-normal opacity-85 text-[12px]">{score.th}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">({reviews.length} รีวิว)</span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-5">
                <span className="flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-lg">
                  <Clock className="h-3.5 w-3.5" />เช็คอิน {hotel.check_in_time || '14:00'} น.
                </span>
                <span className="flex items-center gap-1.5 bg-muted/30 px-3 py-1.5 rounded-lg">
                  <Clock className="h-3.5 w-3.5" />เช็คเอาท์ {hotel.check_out_time || '12:00'} น.
                </span>
              </div>

              {/* Highlights chips */}
              {highlights.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {highlights.map(a => {
                    const Icon = amenityIcon(a);
                    return (
                      <span key={a} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                        <Icon className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                        {amenityTh(a)}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* About */}
            {hotel.description && (
              <div className="border-b border-border/60 pb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">เกี่ยวกับที่พัก</h2>
                <p className="text-muted-foreground leading-[1.8] text-[15px]">{hotel.description}</p>
              </div>
            )}

            {/* ── Amenities grid ── */}
            {allAmenities.length > 0 && (
              <div className="border-b border-border/60 pb-8">
                <h2 className="font-display text-xl font-semibold text-foreground mb-5">สิ่งอำนวยความสะดวก</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {allAmenities.slice(0, 16).map(a => {
                    const Icon = amenityIcon(a);
                    return (
                      <div key={a} className="flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border/50 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm transition-all group/amenity">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 group-hover/amenity:bg-blue-100 dark:group-hover/amenity:bg-blue-900/30 transition-colors">
                          <Icon className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-[13px] text-foreground/80 font-medium leading-snug">{amenityTh(a)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Why book direct ── */}
            <div className="border-b border-border/60 pb-8">
              <h2 className="font-display text-xl font-semibold text-foreground mb-5">ทำไมต้องจองตรงกับเรา?</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { icon: ShieldCheck, title: 'ราคาดีที่สุด',    desc: 'ราคาเท่ากันหรือดีกว่าทุก OTA รับประกัน Best Rate' },
                  { icon: CheckCircle, title: 'ยกเลิกได้ฟรี',   desc: 'ยกเลิกได้ฟรีก่อน 24 ชั่วโมงสำหรับห้องส่วนใหญ่' },
                  { icon: Phone,       title: 'ติดต่อตรงได้เลย', desc: 'ทีมงานพร้อมตอบ ไม่ผ่านตัวกลาง เร็วกว่าแน่นอน' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="p-5 rounded-2xl border border-gray-100 bg-gray-50 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                      <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="font-semibold text-foreground text-sm mb-1.5">{title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Policies */}
            <div className="border-b border-border/60 pb-8" id="policies">
              <h2 className="text-lg font-bold text-foreground mb-4">นโยบายที่พัก</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="font-semibold text-foreground mb-1">เวลาเช็คอิน / เช็คเอาท์</p>
                  <p>เช็คอิน: {hotel.check_in_time || '14:00'} น.</p>
                  <p>เช็คเอาท์: {hotel.check_out_time || '12:00'} น.</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="font-semibold text-foreground mb-1">นโยบายการยกเลิก</p>
                  <p>ยกเลิกฟรีก่อนวันเช็คอินอย่างน้อย 24 ชั่วโมง</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="font-semibold text-foreground mb-1">เด็กและเตียงเสริม</p>
                  <p>รองรับผู้เข้าพักได้สูงสุดตามประเภทห้องพัก</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/30">
                  <p className="font-semibold text-foreground mb-1">สัตว์เลี้ยง</p>
                  <p>กรุณาติดต่อโรงแรมล่วงหน้าเพื่อยืนยันเงื่อนไข</p>
                </div>
              </div>
            </div>

            {/* Nearby */}
            <div className="border-b border-border/60 pb-8" id="nearby">
              <h2 className="text-lg font-bold text-foreground mb-4">สถานที่ใกล้เคียง</h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { name: `แหล่งท่องเที่ยวหลักใน${hotel.city || 'พื้นที่ใกล้เคียง'}`, dist: '0.5 กม.' },
                  { name: 'ร้านอาหารยอดนิยม', dist: '0.3 กม.' },
                  { name: 'ศูนย์การค้า', dist: '1.2 กม.' },
                  { name: 'สถานีขนส่ง / รถไฟฟ้า', dist: '1.8 กม.' },
                ].map(({ name, dist }) => (
                  <div key={name} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-white text-sm">
                    <div className="flex items-center gap-2.5">
                      <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
                      <p className="font-medium text-gray-800">{name}</p>
                    </div>
                    <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-lg shrink-0 ml-2">{dist}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map */}
            <div className="border-b border-border/60 pb-8" id="map">
              <h2 className="text-lg font-bold text-foreground mb-4">ที่ตั้ง</h2>
              <div className="rounded-2xl overflow-hidden border border-border">
                <iframe
                  title={`Map of ${hotel.name}`}
                  src={`https://www.google.com/maps?q=${encodeURIComponent(`${hotel.name} ${hotel.address || hotel.city || ''}`)}&output=embed`}
                  className="w-full h-64"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              {hotel.address && (
                <p className="mt-3 text-sm text-muted-foreground flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                  {hotel.address}
                </p>
              )}
            </div>

            {/* ── Price calendar ── */}
            {roomTypes.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-foreground mb-3">ปฏิทินราคา</h2>
                <PriceGraph hotelId={hotel.id} roomTypeId={(roomTypes[0] as any).id} />
              </div>
            )}

            {/* ── Room types with comparison ── */}
            {roomTypes.length > 0 && (
              <RoomCompareSection roomTypes={roomTypes as any} slug={slug} roomCountByType={roomCountByType} />
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div id="reviews">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-lg font-bold text-foreground">รีวิวจากแขก</h2>
                  {avgRating && score && (
                    <div className="flex items-center gap-2">
                      <div className="px-3 py-1 rounded-lg text-white text-sm font-bold" style={{ backgroundColor: score.bg }}>
                        {avgRating.toFixed(1)}
                      </div>
                      <span className="text-sm font-semibold text-foreground">{score.th}</span>
                      <span className="text-xs text-muted-foreground">{reviews.length} รีวิว</span>
                    </div>
                  )}
                </div>

                {ratingBreakdown && (
                  <div className="grid grid-cols-2 gap-3 mb-6 p-4 bg-muted/30 rounded-2xl">
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
                          <span className="text-xs text-muted-foreground w-24">{l}</span>
                          <div className="flex-1 h-2 bg-black/8 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${(v / 5) * 100}%`, backgroundColor: '#2563eb' }} />
                          </div>
                          <span className="text-xs font-semibold text-foreground w-7 text-right">{v.toFixed(1)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  {typedReviews.map(r => (
                    <div key={r.id} className="p-5 border border-border/50 rounded-2xl bg-card hover:border-border hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500/30 to-blue-500/10 border border-blue-300/30 dark:border-blue-700/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-sm font-bold shrink-0">
                            {(r.reviewer_name || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{r.reviewer_name || 'แขกผู้เข้าพัก'}</p>
                            {r.verified_stay && (
                              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 mt-0.5 font-medium">
                                <CheckCircle className="h-3 w-3" />เข้าพักจริง
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-1 rounded-lg shrink-0">
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                          <span className="text-sm font-bold text-amber-700 dark:text-amber-400">{r.rating}</span>
                        </div>
                      </div>
                      {r.title && <p className="text-sm font-semibold text-foreground mb-1.5">{r.title}</p>}
                      {r.comment && (
                        <p className="text-sm text-muted-foreground line-clamp-4 leading-relaxed">
                          &ldquo;{r.comment}&rdquo;
                        </p>
                      )}
                      {r.reply_text && (
                        <div className="mt-3 pl-3 border-l-2 border-blue-400/50 bg-blue-50 dark:bg-blue-900/20 rounded-r-xl py-2.5 pr-3">
                          <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide mb-1">ตอบกลับจากโรงแรม</p>
                          <p className="text-xs text-muted-foreground leading-relaxed">{r.reply_text}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div id="contact" className="border-t border-border/60 pt-8">
              <h2 className="text-lg font-bold text-foreground mb-4">ติดต่อและที่ตั้ง</h2>
              <div className="space-y-3 text-sm">
                {hotel.address && <div className="flex items-start gap-3"><MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" /><span className="text-muted-foreground">{hotel.address}</span></div>}
                {hotel.phone && <a href={`tel:${hotel.phone}`} className="flex items-center gap-3 hover:text-blue-600 dark:text-blue-400 transition-colors group"><Phone className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" /><span className="text-muted-foreground group-hover:text-blue-600 dark:text-blue-400">{hotel.phone}</span></a>}
                {hotel.email && <a href={`mailto:${hotel.email}`} className="flex items-center gap-3 hover:text-blue-600 dark:text-blue-400 transition-colors group"><Mail className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" /><span className="text-muted-foreground group-hover:text-blue-600 dark:text-blue-400">{hotel.email}</span></a>}
              </div>
            </div>
          </div>

          {/* ── Sticky sidebar ── */}
          <div className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-blue-100 shadow-xl shadow-black/8 overflow-hidden bg-white">

              {/* Price header — white card with blue accent */}
              <div className="p-6 border-b border-gray-100">
                <div className="text-xs text-gray-500 mb-1">ราคาเริ่มต้น</div>
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-3xl font-bold text-gray-900 tracking-tight">{formatCurrency(minRate)}</span>
                </div>
                <div className="text-xs text-gray-400 mb-3">ต่อคืน</div>
                {avgRating && score && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-white text-xs font-bold bg-blue-600">
                      <Star className="h-3 w-3 fill-white/70 text-white/70" />
                      {avgRating.toFixed(1)} · {score.th}
                    </div>
                    <span className="text-xs text-gray-400">{reviews.length} รีวิว</span>
                  </div>
                )}
              </div>

              <div className="p-5">
                {/* Viewer count */}
                <div className="flex items-center gap-2 text-xs mb-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl px-3 py-2.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="text-emerald-700 dark:text-emerald-400">
                    <strong className="font-semibold">{viewersNow} คน</strong> กำลังดูที่พักนี้อยู่
                  </span>
                </div>

                {/* Date picker */}
                <div className="border border-border rounded-2xl overflow-hidden mb-4 shadow-sm">
                  <div className="grid grid-cols-2 divide-x divide-border">
                    <div className="p-3.5 hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.12em] mb-1">เช็คอิน</div>
                      <input type="date" className="w-full text-sm font-semibold text-foreground bg-transparent focus:outline-none cursor-pointer"
                        defaultValue={new Date(Date.now() + 86400000).toISOString().slice(0, 10)} />
                    </div>
                    <div className="p-3.5 hover:bg-muted/30 transition-colors cursor-pointer">
                      <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.12em] mb-1">เช็คเอาท์</div>
                      <input type="date" className="w-full text-sm font-semibold text-foreground bg-transparent focus:outline-none cursor-pointer"
                        defaultValue={new Date(Date.now() + 172800000).toISOString().slice(0, 10)} />
                    </div>
                  </div>
                  <div className="border-t border-border p-3.5 hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.12em] mb-1">ผู้เข้าพัก</div>
                    <select className="w-full text-sm font-semibold text-foreground bg-transparent focus:outline-none cursor-pointer">
                      {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} ผู้ใหญ่</option>)}
                    </select>
                  </div>
                </div>

                <Link href={`/booking/${slug}`}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-4 rounded-2xl font-bold text-[15px] transition-all mb-3 shadow-lg shadow-blue-600/25">
                  จองเลย
                </Link>
                <p className="text-center text-[11px] text-gray-400 mb-4">ไม่มีค่าธรรมเนียมจอง · ยกเลิกได้ฟรี</p>

                {/* Quick info */}
                <div className="space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex justify-between items-center">
                    <span>เช็คอิน</span>
                    <span className="font-semibold text-foreground">{hotel.check_in_time || '14:00'} น.</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>เช็คเอาท์</span>
                    <span className="font-semibold text-foreground">{hotel.check_out_time || '12:00'} น.</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>ยกเลิกฟรี</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">24 ชม.ก่อนเช็คอิน</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile sticky CTA ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-card/97 backdrop-blur-xl border-t border-border p-4 z-30 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="font-bold text-foreground text-xl leading-none">{formatCurrency(minRate)}</span>
              <span className="text-xs text-muted-foreground">/ คืน</span>
            </div>
            {avgRating && score ? (
              <div className="flex items-center gap-1 mt-1 text-xs font-semibold" style={{ color: score.bg }}>
                <Star className="h-3 w-3 fill-current" />{avgRating.toFixed(1)} · {score.th}
              </div>
            ) : (
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">✓ ยกเลิกได้ฟรี</div>
            )}
          </div>
          <Link href={`/booking/${slug}`}
            className="flex-1 max-w-[200px] text-center bg-blue-600 text-white py-3.5 rounded-2xl font-bold text-sm hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-600/25">
            จองเลย
          </Link>
        </div>
      </div>

      <GuestChatWidget hotelId={hotel.id} hotelName={hotel.name} />

      {/* ── Nearby hotels ── */}
      {nearbyHotels.length > 0 && (
        <section className="bg-muted/20 border-t border-border/50 mt-12">
          <div className="max-w-6xl mx-auto px-4 py-14">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-blue-600 dark:text-blue-400 mb-1.5">สำรวจเพิ่มเติม</p>
                <h2 className="font-display text-2xl font-semibold text-foreground">ที่พักใกล้เคียงใน{hotel.city}</h2>
              </div>
              <Link href={`/search?city=${encodeURIComponent(hotel.city || '')}`}
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                ดูทั้งหมด <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {nearbyHotels.map((h: any) => (
                <HotelCard key={h.id} hotel={h} />
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-[#1C1410] text-white/40 py-8 mt-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
            <span>© {new Date().getFullYear()} {hotel.name}</span>
            <div className="flex items-center gap-4">
              <Link href="/search" className="hover:text-white/70 transition-colors">ค้นหาโรงแรม</Link>
              <Link href="/privacy" className="hover:text-white/70 transition-colors">นโยบายความเป็นส่วนตัว</Link>
              <span>Powered by <Link href="/" className="text-blue-600 dark:text-blue-400 font-semibold hover:text-[#E0813A]">Maitri</Link></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
