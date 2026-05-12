export const dynamic = 'force-dynamic';

import { createAdminClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';
import {
  Bed, Maximize2, Users, Wifi, Waves, Dumbbell, Wind, Tv,
  Bath, Coffee, Car, Wine, Tag, ArrowLeft, CheckCircle,
  Clock, Shield, type LucideIcon,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
type GalleryImage = { image_url: string; display_order: number };

type RoomType = {
  id: string;
  name: string;
  description: string | null;
  size_sqm: number | null;
  bed_type: string | null;
  max_occupancy: number | null;
  base_rate: number | null;
  amenities: string[] | null;
  cancel_policy: string | null;
  includes_breakfast: boolean | null;
  hotel_gallery: GalleryImage[];
};

type SimilarRoom = {
  id: string;
  name: string;
  size_sqm: number | null;
  bed_type: string | null;
  max_occupancy: number | null;
  base_rate: number | null;
};

type Hotel = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  star_rating: number | null;
  check_in_time: string | null;
  check_out_time: string | null;
  phone: string | null;
};

// ── Amenity icon map ──────────────────────────────────────────────────────────
const AMENITY_ICONS: Record<string, LucideIcon> = {
  wifi: Wifi, 'wi-fi': Wifi, internet: Wifi, วายฟาย: Wifi,
  pool: Waves, สระ: Waves, 'สระว่ายน้ำ': Waves, swimming: Waves,
  gym: Dumbbell, fitness: Dumbbell, ฟิตเนส: Dumbbell,
  ac: Wind, 'air conditioning': Wind, aircon: Wind, แอร์: Wind,
  tv: Tv, television: Tv, โทรทัศน์: Tv,
  bath: Bath, bathtub: Bath, 'อ่างอาบน้ำ': Bath,
  breakfast: Coffee, 'อาหารเช้า': Coffee, coffee: Coffee,
  parking: Car, 'ที่จอดรถ': Car, จอดรถ: Car,
  minibar: Wine, wine: Wine, มินิบาร์: Wine, fridge: Wine,
};

const AMENITY_TH: Record<string, string> = {
  wifi: 'WiFi ฟรี', 'wi-fi': 'WiFi ฟรี', internet: 'WiFi ฟรี',
  pool: 'สระว่ายน้ำ', swimming: 'สระว่ายน้ำ',
  gym: 'ฟิตเนส', fitness: 'ฟิตเนส',
  ac: 'ปรับอากาศ', 'air conditioning': 'ปรับอากาศ', aircon: 'ปรับอากาศ',
  tv: 'โทรทัศน์', television: 'โทรทัศน์',
  bath: 'อ่างอาบน้ำ', bathtub: 'อ่างอาบน้ำ',
  breakfast: 'อาหารเช้า', coffee: 'กาแฟ/ชา',
  parking: 'ที่จอดรถ',
  minibar: 'มินิบาร์', fridge: 'ตู้เย็น',
};

function amenityIcon(a: string): LucideIcon {
  const key = a.toLowerCase();
  return AMENITY_ICONS[key] ?? AMENITY_ICONS[a] ?? Tag;
}

function amenityLabel(a: string): string {
  const key = a.toLowerCase();
  return AMENITY_TH[key] ?? AMENITY_TH[a] ?? a;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ slug: string; roomId: string }>;
}) {
  const { slug, roomId } = await params;
  const supabase = createAdminClient();

  // Fetch hotel + room in parallel
  const [hotelRes, roomRes] = await Promise.all([
    supabase
      .from('hotels')
      .select('id, name, slug, city, star_rating, check_in_time, check_out_time, phone')
      .eq('slug', slug)
      .single(),
    supabase
      .from('room_types')
      .select(
        'id, name, description, size_sqm, bed_type, max_occupancy, base_rate, amenities, cancel_policy, includes_breakfast, hotel_gallery(image_url, display_order)'
      )
      .eq('id', roomId)
      .single(),
  ]);

  const hotel = hotelRes.data as Hotel | null;
  const room = roomRes.data as RoomType | null;

  if (!hotel || !room) notFound();

  // Fetch similar rooms
  const { data: similarData } = await supabase
    .from('room_types')
    .select('id, name, size_sqm, bed_type, max_occupancy, base_rate')
    .eq('hotel_id', hotel.id)
    .neq('id', roomId)
    .limit(3);

  const similarRooms: SimilarRoom[] = (similarData as SimilarRoom[] | null) ?? [];

  // Sort gallery images
  const gallery = [...(room.hotel_gallery ?? [])].sort(
    (a, b) => a.display_order - b.display_order
  );

  const amenities: string[] = room.amenities ?? [];

  return (
    <div style={{ backgroundColor: '#FAF7F2', minHeight: '100vh' }}>
      {/* ── Sticky nav ──────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white border-b border-black/5 px-4 py-3">
        <div className="max-w-5xl mx-auto">
          <Link
            href={`/h/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium hover:opacity-70 transition-opacity"
            style={{ color: '#C66A30' }}
          >
            <ArrowLeft className="w-4 h-4" />
            ห้องพัก {hotel.name}
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* ── Left column (main content) ─────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Image gallery ──────────────────────────────────────────── */}
            <div className="rounded-2xl overflow-hidden border border-black/5">
              {/* Hero image */}
              {gallery.length > 0 ? (
                <div className="relative w-full h-72 md:h-96 bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={gallery[0].image_url}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-72 md:h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">ไม่มีรูปภาพ</span>
                </div>
              )}

              {/* Thumbnails row */}
              {gallery.length > 1 && (
                <div className="grid grid-cols-3 gap-0.5 bg-gray-200">
                  {gallery.slice(1, 4).map((img, i) => (
                    <div key={i} className="relative h-24 bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.image_url}
                        alt={`${room.name} ${i + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Room header ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-black/5 p-5">
              <h1 className="text-2xl font-bold mb-3" style={{ color: '#2A2522' }}>
                {room.name}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm" style={{ color: '#2A2522' }}>
                {room.size_sqm != null && (
                  <span className="flex items-center gap-1.5">
                    <Maximize2 className="w-4 h-4" style={{ color: '#C66A30' }} />
                    {room.size_sqm} ตร.ม.
                  </span>
                )}
                {room.bed_type && (
                  <span className="flex items-center gap-1.5">
                    <Bed className="w-4 h-4" style={{ color: '#C66A30' }} />
                    {room.bed_type}
                  </span>
                )}
                {room.max_occupancy != null && (
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4" style={{ color: '#C66A30' }} />
                    สูงสุด {room.max_occupancy} คน
                  </span>
                )}
              </div>
            </div>

            {/* ── Urgency strip ───────────────────────────────────────────── */}
            <div
              className="rounded-2xl border border-amber-200 px-5 py-4 flex items-center gap-3"
              style={{ backgroundColor: '#FFFBEB' }}
            >
              <span className="text-lg">⚡</span>
              <p className="text-sm font-medium text-amber-800">
                เหลือเพียง 2 ห้อง · มีผู้เข้าชม 18 คนในขณะนี้
              </p>
            </div>

            {/* ── Amenities ───────────────────────────────────────────────── */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <h2 className="text-base font-semibold mb-4" style={{ color: '#2A2522' }}>
                  สิ่งอำนวยความสะดวก
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenities.map((a) => {
                    const Icon = amenityIcon(a);
                    return (
                      <div
                        key={a}
                        className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 text-sm"
                        style={{ color: '#2A2522' }}
                      >
                        <Icon className="w-4 h-4 shrink-0" style={{ color: '#C66A30' }} />
                        <span>{amenityLabel(a)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Description ─────────────────────────────────────────────── */}
            {room.description && (
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <h2 className="text-base font-semibold mb-3" style={{ color: '#2A2522' }}>
                  รายละเอียดห้องพัก
                </h2>
                <p className="text-sm leading-relaxed text-gray-600">{room.description}</p>
              </div>
            )}

            {/* ── Policies card ───────────────────────────────────────────── */}
            <div className="bg-white rounded-2xl border border-black/5 p-5 space-y-4">
              <h2 className="text-base font-semibold" style={{ color: '#2A2522' }}>
                นโยบายและข้อมูลห้องพัก
              </h2>
              <div className="space-y-3 text-sm">
                {room.cancel_policy && (
                  <div className="flex gap-3">
                    <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#C66A30' }} />
                    <div>
                      <p className="font-medium" style={{ color: '#2A2522' }}>นโยบายยกเลิก</p>
                      <p className="text-gray-500 mt-0.5">{room.cancel_policy}</p>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <Coffee className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#C66A30' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#2A2522' }}>อาหารเช้า</p>
                    <p className="text-gray-500 mt-0.5">
                      {room.includes_breakfast ? 'รวมอาหารเช้าแล้ว' : 'ไม่รวมอาหารเช้า'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#C66A30' }} />
                  <div>
                    <p className="font-medium" style={{ color: '#2A2522' }}>เวลาเช็คอิน / เช็คเอาท์</p>
                    <p className="text-gray-500 mt-0.5">
                      เช็คอิน {hotel.check_in_time ?? '14:00'} · เช็คเอาท์ {hotel.check_out_time ?? '12:00'}
                    </p>
                  </div>
                </div>
                {room.max_occupancy != null && (
                  <div className="flex gap-3">
                    <Users className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#C66A30' }} />
                    <div>
                      <p className="font-medium" style={{ color: '#2A2522' }}>จำนวนผู้เข้าพักสูงสุด</p>
                      <p className="text-gray-500 mt-0.5">{room.max_occupancy} คน</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Similar rooms ───────────────────────────────────────────── */}
            {similarRooms.length > 0 && (
              <div>
                <h2 className="text-base font-semibold mb-4" style={{ color: '#2A2522' }}>
                  ห้องอื่นๆ ที่คุณอาจชอบ
                </h2>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {similarRooms.map((sr) => (
                    <Link
                      key={sr.id}
                      href={`/h/${slug}/rooms/${sr.id}`}
                      className="flex-none w-56 bg-white rounded-2xl border border-black/5 p-4 hover:shadow-md transition-shadow"
                    >
                      <p className="font-semibold text-sm mb-2 line-clamp-2" style={{ color: '#2A2522' }}>
                        {sr.name}
                      </p>
                      <div className="space-y-1 text-xs text-gray-500">
                        {sr.size_sqm != null && (
                          <span className="flex items-center gap-1">
                            <Maximize2 className="w-3 h-3" />
                            {sr.size_sqm} ตร.ม.
                          </span>
                        )}
                        {sr.bed_type && (
                          <span className="flex items-center gap-1">
                            <Bed className="w-3 h-3" />
                            {sr.bed_type}
                          </span>
                        )}
                        {sr.max_occupancy != null && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {sr.max_occupancy} คน
                          </span>
                        )}
                      </div>
                      {sr.base_rate != null && (
                        <p className="mt-3 font-bold text-sm" style={{ color: '#C66A30' }}>
                          {formatCurrency(sr.base_rate)}
                          <span className="text-xs font-normal text-gray-400"> /คืน</span>
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right column: Price card (sticky) ─────────────────────────── */}
          <div className="mt-6 lg:mt-0">
            <div className="lg:sticky lg:top-20 bg-white rounded-2xl border border-black/5 p-5 space-y-4">
              {/* Price */}
              <div>
                {room.base_rate != null ? (
                  <>
                    <p className="text-2xl font-bold" style={{ color: '#C66A30' }}>
                      {formatCurrency(room.base_rate)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">/คืน · ราคารวมภาษี</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">ติดต่อสอบถามราคา</p>
                )}
              </div>

              {/* Breakfast badge */}
              {room.includes_breakfast && (
                <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  รวมอาหารเช้าแล้ว
                </div>
              )}

              {/* CTA */}
              <Link
                href={`/booking/${slug}?roomTypeId=${roomId}`}
                className="block w-full text-center rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: '#C66A30' }}
              >
                จองห้องนี้
              </Link>

              {/* Hotel info */}
              <div className="pt-2 border-t border-black/5 text-xs text-gray-400 space-y-1">
                {hotel.phone && (
                  <p>โทร: {hotel.phone}</p>
                )}
                {hotel.city && (
                  <p>{hotel.city}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
