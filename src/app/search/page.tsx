'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatCurrency } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import {
  Search, MapPin, Star, X, Users, Calendar, SlidersHorizontal,
  Locate, Check, Tag, ChevronDown, ChevronUp, Wifi, Car,
  Coffee, CheckCircle, Dumbbell, Flame, Waves,
} from 'lucide-react';
import { HotelCard } from '@/components/public/HotelCard';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Constants ─── */
const HOTEL_TYPES = [
  { value: '',                   label: 'ทุกประเภท',    emoji: '🏠' },
  { value: 'hotel',              label: 'Hotel',         emoji: '🏨' },
  { value: 'resort',             label: 'Resort',        emoji: '🌴' },
  { value: 'boutique',           label: 'Boutique',      emoji: '🏡' },
  { value: 'pool_villa',         label: 'Pool Villa',    emoji: '🏊' },
  { value: 'hostel',             label: 'Hostel',        emoji: '🎒' },
  { value: 'serviced_apartment', label: 'Serviced Apt.', emoji: '🏢' },
];

const AMENITY_CHIPS = [
  { value: 'wifi',       label: 'Wifi ฟรี',    Icon: Wifi },
  { value: 'pool',       label: 'สระว่ายน้ำ',  Icon: Waves },
  { value: 'gym',        label: 'ฟิตเนส',      Icon: Dumbbell },
  { value: 'spa',        label: 'สปา',          Icon: Star },
  { value: 'parking',   label: 'ที่จอดรถ',    Icon: Car },
  { value: 'restaurant', label: 'ร้านอาหาร',  Icon: Coffee },
];

const QUICK_FILTER_CHIPS = [
  { key: 'all',        label: 'ทุกประเภท' },
  { key: 'freeCancel', label: 'ยกเลิกได้ฟรี' },
  { key: 'breakfast',  label: 'อาหารเช้าฟรี' },
  { key: 'pool',       label: 'สระว่ายน้ำ' },
  { key: 'wifi',       label: 'WiFi' },
  { key: 'parking',    label: 'ที่จอดรถ' },
];

/* ─── Types ─── */
type Query = {
  city: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  type: string;
  sort: string;
  minPrice: number;
  maxPrice: number;
  minRating: number;
  stars: number[];
  freeCancel: boolean;
  breakfast: boolean;
  amenities: string[];
};

/* ─── Score label helper ─── */
function scoreLabel(r: number): string {
  if (r >= 4.7) return 'ยอดเยี่ยมมาก';
  if (r >= 4.3) return 'ยอดเยี่ยม';
  if (r >= 3.8) return 'ดีมาก';
  if (r >= 3.5) return 'ดี';
  return 'น่าสนใจ';
}

/* ─── Trip.com-style horizontal hotel row card ─── */
interface TripCardProps {
  hotel: any;
  nights: number;
  checkIn: string;
  checkOut: string;
  onTrack: (h: any) => void;
}

function TripHotelCard({ hotel, nights, checkIn, checkOut, onTrack }: TripCardProps) {
  const price    = hotel.min_rate ?? hotel.min_price ?? 0;
  const origPrice = hotel.original_price && hotel.original_price > price ? hotel.original_price : null;
  const savings  = origPrice ? origPrice - price : (hotel.deal_percent ? Math.round(price * hotel.deal_percent / (100 - hotel.deal_percent)) : 0);
  const stars    = Math.min(5, Math.max(0, hotel.star_rating || 0));
  const rating   = hotel.avg_rating ?? null;
  const tripCoins = price > 0 ? Math.round(price * 0.05) : 0;
  const bookHref = `/h/${hotel.slug}${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`;
  const heroSrc  = (hotel.gallery?.[0]?.image_url) || hotel.hero_image_url;

  const amenityIcons: { label: string; Icon: React.FC<{ className?: string }> }[] = [];
  if (hotel.amenities?.includes('wifi') || hotel.amenities?.includes('free_wifi'))
    amenityIcons.push({ label: 'WiFi ฟรี', Icon: Wifi });
  if (hotel.amenities?.includes('pool') || hotel.amenities?.includes('swimming_pool'))
    amenityIcons.push({ label: 'สระว่ายน้ำ', Icon: Waves });
  if (hotel.amenities?.includes('parking') || hotel.amenities?.includes('free_parking'))
    amenityIcons.push({ label: 'ที่จอดรถ', Icon: Car });
  if (hotel.amenities?.includes('gym') || hotel.amenities?.includes('fitness'))
    amenityIcons.push({ label: 'ฟิตเนส', Icon: Dumbbell });

  return (
    <Link href={bookHref} onClick={() => onTrack(hotel)} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden flex flex-col sm:flex-row">

        {/* ── Left: Image ── */}
        <div className="relative sm:w-[240px] sm:min-w-[240px] h-52 sm:h-auto flex-shrink-0 bg-gray-100">
          {heroSrc ? (
            <Image
              src={heroSrc}
              alt={hotel.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <span className="text-6xl text-gray-300">{hotel.name?.charAt(0)}</span>
            </div>
          )}

          {/* Deal badge */}
          {hotel.deal_percent && hotel.deal_percent > 0 && (
            <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-md">
              -{hotel.deal_percent}%
            </div>
          )}
          {hotel.is_last_minute && !hotel.deal_percent && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Flame className="h-3 w-3" />ดีลวันนี้
            </div>
          )}
        </div>

        {/* ── Right: Info ── */}
        <div className="flex-1 flex flex-col p-4 min-w-0 relative">

          {/* Score badge — top right */}
          {rating !== null && rating !== undefined && (
            <div className="absolute top-4 right-4 flex flex-col items-end gap-0.5 shrink-0">
              <div className="bg-blue-600 text-white text-sm font-bold px-2.5 py-1.5 rounded-lg leading-none min-w-[3rem] text-center">
                {rating.toFixed(1)}
                <span className="text-[10px] font-normal opacity-70">/10</span>
              </div>
              <span className="text-[11px] text-gray-500 whitespace-nowrap">{scoreLabel(rating)}</span>
              {hotel.review_count && (
                <span className="text-[10px] text-gray-400">{hotel.review_count.toLocaleString()} รีวิว</span>
              )}
            </div>
          )}

          {/* Hotel name */}
          <h3 className="font-bold text-gray-900 text-[15px] leading-snug line-clamp-1 pr-20 group-hover:text-blue-600 transition-colors mb-0.5">
            {hotel.name}
          </h3>

          {/* Stars */}
          {stars > 0 && (
            <div className="flex items-center gap-px mb-1.5">
              {Array.from({ length: stars }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
              ))}
              <span className="text-xs text-gray-400 ml-1">{stars} ดาว</span>
            </div>
          )}

          {/* Location */}
          <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
            <span className="line-clamp-1">
              {hotel.city || 'Thailand'}
              {hotel.distance_km !== undefined && hotel.distance_km > 0 && (
                <span className="opacity-70">
                  {' '}·{' '}
                  {hotel.distance_km < 1
                    ? `${Math.round(hotel.distance_km * 1000)} ม. จากใจกลางเมือง`
                    : `${hotel.distance_km.toFixed(1)} กม. จากใจกลางเมือง`}
                </span>
              )}
            </span>
          </p>

          {/* Amenity pills */}
          {amenityIcons.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {amenityIcons.slice(0, 3).map(({ label, Icon }) => (
                <span key={label} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[11px] px-2 py-0.5 rounded border border-blue-100">
                  <Icon className="h-2.5 w-2.5" />
                  {label}
                </span>
              ))}
            </div>
          )}

          {/* Free cancel / breakfast tags */}
          <div className="flex flex-wrap gap-2 mb-2">
            {hotel.is_free_cancel && (
              <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                <CheckCircle className="h-3 w-3" />
                ยกเลิกได้ฟรี
              </span>
            )}
            {hotel.is_breakfast && (
              <span className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                <Coffee className="h-3 w-3" />
                รวมอาหารเช้า
              </span>
            )}
          </div>

          {/* Price section */}
          <div className="mt-auto pt-3 border-t border-gray-100">
            <div className="flex items-end justify-between">
              <div>
                {/* Strikethrough original price */}
                {origPrice && (
                  <p className="text-xs text-gray-400 line-through leading-none mb-0.5">
                    {formatCurrency(origPrice)}
                  </p>
                )}
                {/* Bold price */}
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-orange-500 leading-none">
                    {formatCurrency(price)}
                  </span>
                  <span className="text-xs text-gray-400">/ คืน</span>
                </div>
                {/* Total with tax */}
                {nights > 0 && price > 0 && (
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    ฿{Math.round(price * nights * 1.07).toLocaleString()} รวมภาษีและค่าธรรมเนียม
                  </p>
                )}
                {/* Savings */}
                {savings > 0 && (
                  <p className="text-[11px] text-red-500 font-medium mt-0.5">
                    ประหยัด {formatCurrency(savings)}
                  </p>
                )}
                {/* Trip Coins */}
                {tripCoins > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-3.5 w-3.5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                      <span className="text-[7px] font-bold text-amber-900">T</span>
                    </div>
                    <span className="text-[11px] text-amber-600 font-medium">+{tripCoins} Trip Coins</span>
                  </div>
                )}
              </div>
              <button className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-sm shrink-0 ml-3">
                ดูห้องพัก
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ─── Filter Panel ─── */
interface FilterPanelProps {
  query: Query;
  setQuery: React.Dispatch<React.SetStateAction<Query>>;
  onApply: () => void;
  onClear: () => void;
}

function FilterPanel({ query, setQuery, onApply, onClear }: FilterPanelProps) {
  const [showAmenities, setShowAmenities] = useState(false);

  const activeCount =
    query.stars.length +
    (query.minPrice > 0 || query.maxPrice < 50000 ? 1 : 0) +
    (query.minRating > 0 ? 1 : 0) +
    (query.freeCancel ? 1 : 0) +
    (query.breakfast ? 1 : 0) +
    query.amenities.length;

  function toggleStar(s: number) {
    setQuery(p => ({
      ...p,
      stars: p.stars.includes(s) ? p.stars.filter(x => x !== s) : [...p.stars, s],
    }));
  }
  function toggleAmenity(a: string) {
    setQuery(p => ({
      ...p,
      amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a],
    }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-800 text-sm">
          ตัวกรอง
          {activeCount > 0 && (
            <span className="ml-1.5 text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">{activeCount}</span>
          )}
        </h3>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs text-blue-600 hover:underline">ล้างทั้งหมด</button>
        )}
      </div>

      {/* Price range */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">ราคาต่อคืน (บาท)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={query.minPrice || ''}
            onChange={e => setQuery(p => ({ ...p, minPrice: Number(e.target.value) }))}
            placeholder="0"
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-800 placeholder:text-gray-400"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="number"
            value={query.maxPrice < 50000 ? query.maxPrice : ''}
            onChange={e => setQuery(p => ({ ...p, maxPrice: Number(e.target.value) || 50000 }))}
            placeholder="ไม่จำกัด"
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 text-gray-800 placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Star rating */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">ระดับดาวโรงแรม</p>
        <div className="flex flex-wrap gap-2">
          {[5, 4, 3, 2, 1].map(s => (
            <button
              key={s}
              onClick={() => toggleStar(s)}
              className={cn(
                'flex items-center gap-0.5 px-3 py-1.5 rounded-full border text-xs transition-all',
                query.stars.includes(s)
                  ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                  : 'border-gray-200 text-gray-500 hover:border-blue-300',
              )}
            >
              {Array.from({ length: s }).map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 fill-current" />
              ))}
            </button>
          ))}
        </div>
      </div>

      {/* Guest rating */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">คะแนนผู้เข้าพัก</p>
        <div className="space-y-1">
          {[
            { v: 4.5, label: 'ยอดเยี่ยมมาก', sub: '4.5+' },
            { v: 4.0, label: 'ยอดเยี่ยม',    sub: '4.0+' },
            { v: 3.5, label: 'ดีมาก',         sub: '3.5+' },
            { v: 3.0, label: 'ดี',            sub: '3.0+' },
            { v: 0,   label: 'ทั้งหมด',       sub: ''     },
          ].map(r => {
            const active = query.minRating === r.v;
            return (
              <button
                key={r.v}
                onClick={() => setQuery(p => ({ ...p, minRating: r.v }))}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all text-left',
                  active
                    ? 'bg-blue-50 text-blue-700 font-medium border border-blue-200'
                    : 'hover:bg-gray-50 text-gray-600',
                )}
              >
                <span>{r.label}</span>
                {r.sub && <span className="text-xs text-gray-400">{r.sub}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Popular filters */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">ฟิลเตอร์ยอดนิยม</p>
        <div className="space-y-2.5">
          {([
            { key: 'freeCancel' as const, label: 'ยกเลิกฟรี' },
            { key: 'breakfast'  as const, label: 'รวมอาหารเช้า' },
          ] as const).map(item => (
            <label key={item.key} className="flex items-center gap-3 cursor-pointer group py-0.5">
              <div
                onClick={() => setQuery(p => ({ ...p, [item.key]: !p[item.key] }))}
                className={cn(
                  'w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer',
                  query[item.key]
                    ? 'bg-blue-600 border-blue-600'
                    : 'border-gray-300 group-hover:border-blue-400',
                )}
              >
                {query[item.key] && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm text-gray-600 select-none">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={() => setShowAmenities(p => !p)}
          className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3"
        >
          <span>สิ่งอำนวยความสะดวก</span>
          {showAmenities ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        <AnimatePresence>
          {showAmenities && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-2 pb-1">
                {AMENITY_CHIPS.map(a => (
                  <button
                    key={a.value}
                    onClick={() => toggleAmenity(a.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-xs transition-all flex items-center gap-1',
                      query.amenities.includes(a.value)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-200 text-gray-600 hover:border-blue-300',
                    )}
                  >
                    <a.Icon className="h-3 w-3" />
                    {a.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={onApply}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-sm"
      >
        ค้นหา
      </button>
    </div>
  );
}

/* ─── Loading skeleton for horizontal card ─── */
function TripCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col sm:flex-row animate-pulse">
      <div className="sm:w-[260px] sm:min-w-[260px] h-52 sm:h-auto bg-gray-200" />
      <div className="flex-1 p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-3 bg-gray-100 rounded w-2/3" />
        <div className="flex gap-2">
          <div className="h-5 w-16 bg-gray-100 rounded-full" />
          <div className="h-5 w-16 bg-gray-100 rounded-full" />
        </div>
        <div className="flex items-end justify-between pt-4 mt-auto">
          <div className="h-6 w-28 bg-gray-200 rounded" />
          <div className="h-9 w-24 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main search content ─── */
function SearchContent() {
  const router      = useRouter();
  const searchParams = useSearchParams();

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dayAfter  = format(addDays(new Date(), 2), 'yyyy-MM-dd');

  const [query, setQuery] = useState<Query>({
    city:      searchParams.get('city')    || '',
    checkIn:   searchParams.get('checkIn') || tomorrow,
    checkOut:  searchParams.get('checkOut')|| dayAfter,
    adults:    Number(searchParams.get('adults') || 2),
    type:      searchParams.get('type')    || '',
    sort:      'recommended',
    minPrice:  0,
    maxPrice:  50000,
    minRating: 0,
    stars:     [],
    freeCancel: false,
    breakfast:  false,
    amenities:  [],
  });

  const [hotels,       setHotels]       = useState<any[]>([]);
  const [loading,      setLoading]      = useState(false);
  const [searched,     setSearched]     = useState(false);
  const [total,        setTotal]        = useState(0);
  const [visibleCount, setVisibleCount] = useState(12);
  const [showFilter,   setShowFilter]   = useState(false);
  const [userLat,      setUserLat]      = useState<number | null>(null);
  const [userLng,      setUserLng]      = useState<number | null>(null);
  const [geoLoading,   setGeoLoading]   = useState(false);
  const [recentViewed, setRecentViewed] = useState<any[]>([]);
  const [activeQuickFilter, setActiveQuickFilter] = useState('all');

  const nights = Math.max(1, Math.round(
    (new Date(query.checkOut).getTime() - new Date(query.checkIn).getTime()) / 86400000,
  ));

  const search = useCallback(async (
    q: Query           = query,
    lat: number | null = userLat,
    lng: number | null = userLng,
  ) => {
    setLoading(true);
    setSearched(true);
    const params = new URLSearchParams({
      city:      q.city,
      checkIn:   q.checkIn,
      checkOut:  q.checkOut,
      adults:    String(q.adults),
      type:      q.type,
      sort:      q.sort,
      minPrice:  String(q.minPrice),
      maxPrice:  String(q.maxPrice),
      minRating: String(q.minRating),
    });
    if (q.stars.length)     params.set('stars', q.stars.join(','));
    if (q.freeCancel)       params.set('cancelType', 'free');
    if (q.amenities.length) params.set('amenities', q.amenities.join(','));
    if (lat !== null)       params.set('lat', String(lat));
    if (lng !== null)       params.set('lng', String(lng));

    try {
      const res  = await fetch(`/api/public/search?${params}`);
      const data = await res.json();
      let list: any[] = data.hotels || [];
      if (q.breakfast) list = list.filter((h: any) => h.is_breakfast);
      setHotels(list);
      setTotal(data.total || 0);
    } catch {
      setHotels([]);
      setTotal(0);
    }
    setVisibleCount(12);
    setLoading(false);
  }, [query, userLat, userLng]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (searchParams.get('city') || searchParams.get('checkIn')) search();
    try {
      const raw = localStorage.getItem('recent_hotels');
      if (raw) setRecentViewed(JSON.parse(raw));
    } catch {}
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function doSearch(q: Query = query) {
    const p = new URLSearchParams({
      city: q.city, checkIn: q.checkIn, checkOut: q.checkOut, adults: String(q.adults),
    });
    router.push(`/search?${p}`, { scroll: false });
    search(q);
  }

  async function handleGeolocate() {
    if (!navigator.geolocation) return;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setUserLat(lat);
        setUserLng(lng);
        let city = query.city;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=th`,
            { headers: { 'User-Agent': 'MaitriHotel/1.0' } },
          );
          const d = await res.json();
          city = d.address?.city || d.address?.town || d.address?.county
               || d.address?.state_district || d.address?.state || city;
        } catch {}
        const nq: Query = { ...query, city, sort: 'distance' };
        setQuery(nq);
        setGeoLoading(false);
        search(nq, lat, lng);
      },
      () => setGeoLoading(false),
    );
  }

  function trackRecent(h: any) {
    const next = [h, ...recentViewed.filter((x: any) => x.id !== h.id)].slice(0, 5);
    setRecentViewed(next);
    try { localStorage.setItem('recent_hotels', JSON.stringify(next)); } catch {}
  }

  function clearAllFilters() {
    setQuery(p => ({
      ...p, stars: [], minPrice: 0, maxPrice: 50000, minRating: 0,
      freeCancel: false, breakfast: false, amenities: [],
    }));
  }

  function handleQuickFilter(key: string) {
    setActiveQuickFilter(key);
    if (key === 'all') {
      const nq = { ...query, freeCancel: false, breakfast: false, amenities: [] };
      setQuery(nq);
      search(nq);
    } else if (key === 'freeCancel') {
      const nq = { ...query, freeCancel: true, breakfast: false };
      setQuery(nq);
      search(nq);
    } else if (key === 'breakfast') {
      const nq = { ...query, breakfast: true, freeCancel: false };
      setQuery(nq);
      search(nq);
    } else {
      const nq = {
        ...query,
        freeCancel: false,
        breakfast: false,
        amenities: [key],
      };
      setQuery(nq);
      search(nq);
    }
  }

  const activeFilterCount =
    query.stars.length +
    (query.minPrice > 0 || query.maxPrice < 50000 ? 1 : 0) +
    (query.minRating > 0 ? 1 : 0) +
    (query.freeCancel ? 1 : 0) +
    (query.breakfast ? 1 : 0) +
    query.amenities.length;

  const daysToCheckIn = Math.max(0, Math.round((new Date(query.checkIn).getTime() - Date.now()) / 86400000));
  const isLastMinute  = daysToCheckIn <= 3;
  const nearby        = userLat ? hotels.filter(h => h.distance_km !== undefined && h.distance_km <= 10).slice(0, 4) : [];
  const deals         = hotels.filter(h => h.min_rate && h.min_rate < 3000).slice(0, 4);
  const visibleHotels = hotels.slice(0, visibleCount);

  const SORT_TABS = [
    { value: 'recommended', label: 'แนะนำ' },
    { value: 'price_asc',   label: 'ราคาต่ำ→สูง' },
    { value: 'rating',      label: 'คะแนนสูงสุด' },
    ...(userLat ? [{ value: 'distance', label: 'ใกล้ที่สุด' }] : []),
  ];

  return (
    <div className="min-h-screen bg-[#F5F7FA]">

      {/* ── Sticky top search bar (Trip.com style: blue background) ── */}
      <div className="bg-blue-600 sticky top-0 z-40 shadow-md">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2">

            {/* Logo */}
            <Link href="/" className="hidden md:flex items-center gap-2 shrink-0 mr-2">
              <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="font-bold text-sm text-white">M</span>
              </div>
              <span className="font-bold text-white text-sm hidden lg:block">Maitri</span>
            </Link>

            {/* Search form row */}
            <div className="flex-1 flex items-center bg-white rounded-lg overflow-hidden shadow-sm max-w-4xl">

              {/* Destination */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-r border-gray-200 flex-1 min-w-0">
                <MapPin className="h-4 w-4 text-blue-500 shrink-0" />
                <input
                  value={query.city}
                  onChange={e => setQuery(p => ({ ...p, city: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && doSearch()}
                  placeholder="ปลายทาง, โรงแรม, เขต..."
                  className="bg-transparent text-sm focus:outline-none min-w-0 w-full text-gray-800 placeholder:text-gray-400"
                />
                <button
                  onClick={handleGeolocate}
                  disabled={geoLoading}
                  title="ค้นหาใกล้ฉัน"
                  className="shrink-0 p-1 rounded hover:bg-blue-50 text-blue-500 transition-colors disabled:opacity-50"
                >
                  {geoLoading
                    ? <div className="h-4 w-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                    : <Locate className="h-4 w-4" />}
                </button>
              </div>

              {/* Check-in */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-2.5 border-r border-gray-200 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-gray-400 mb-0.5">เช็คอิน</span>
                  <input
                    type="date"
                    value={query.checkIn}
                    onChange={e => setQuery(p => ({ ...p, checkIn: e.target.value }))}
                    className="text-xs bg-transparent focus:outline-none text-gray-700 w-28"
                  />
                </div>
              </div>

              {/* Check-out */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-2.5 border-r border-gray-200 shrink-0">
                <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-gray-400 mb-0.5">เช็คเอาท์</span>
                  <input
                    type="date"
                    value={query.checkOut}
                    onChange={e => setQuery(p => ({ ...p, checkOut: e.target.value }))}
                    className="text-xs bg-transparent focus:outline-none text-gray-700 w-28"
                  />
                </div>
              </div>

              {/* Guests */}
              <div className="hidden md:flex items-center gap-1.5 px-3 py-2.5 border-r border-gray-200 shrink-0">
                <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <div className="flex flex-col leading-none">
                  <span className="text-[10px] text-gray-400 mb-0.5">ผู้เข้าพัก</span>
                  <select
                    value={query.adults}
                    onChange={e => setQuery(p => ({ ...p, adults: Number(e.target.value) }))}
                    className="text-xs bg-transparent focus:outline-none text-gray-700 cursor-pointer"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} คน</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search button */}
              <button
                onClick={() => doSearch()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors flex items-center gap-2 shrink-0 h-full"
              >
                <Search className="h-4 w-4" />
                <span className="hidden md:block">ค้นหา</span>
              </button>
            </div>

            <Link href="/portal/login" className="hidden lg:block text-sm text-white/80 hover:text-white shrink-0 ml-2">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>

        {/* ── Quick filter chips row (below search bar, still in blue bar) ── */}
        <div className="max-w-screen-xl mx-auto px-4 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none]">
            {QUICK_FILTER_CHIPS.map(chip => (
              <button
                key={chip.key}
                onClick={() => handleQuickFilter(chip.key)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all shrink-0 whitespace-nowrap border',
                  activeQuickFilter === chip.key
                    ? 'bg-white text-blue-600 border-white shadow-sm'
                    : 'bg-transparent text-white/80 border-white/40 hover:bg-white/10 hover:text-white',
                )}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-screen-xl mx-auto px-4">

        {/* Hotel type pills row */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 [scrollbar-width:none]">
          {HOTEL_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => { const nq = { ...query, type: t.value }; setQuery(nq); search(nq); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all shrink-0 whitespace-nowrap',
                query.type === t.value
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600',
              )}
            >
              <span>{t.emoji}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Main layout: sidebar + results ── */}
        <div className="flex gap-6 pb-28">

          {/* ── Filter sidebar (desktop) ── */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-[104px] bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <FilterPanel
                query={query}
                setQuery={setQuery}
                onApply={() => search(query)}
                onClear={clearAllFilters}
              />
            </div>
          </aside>

          {/* ── Results pane ── */}
          <div className="flex-1 min-w-0">

            {/* Sort tabs + filter controls */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">

              {/* Sort tabs (Trip.com tab style) */}
              <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {SORT_TABS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => { const nq = { ...query, sort: s.value }; setQuery(nq); search(nq); }}
                    className={cn(
                      'px-4 py-2.5 text-sm font-medium transition-colors border-r border-gray-200 last:border-0 whitespace-nowrap relative',
                      query.sort === s.value
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-600 hover:bg-gray-50',
                    )}
                  >
                    {s.label}
                    {query.sort === s.value && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </button>
                ))}
              </div>

              {/* Mobile filter button */}
              <button
                onClick={() => setShowFilter(true)}
                className="lg:hidden flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
              >
                <SlidersHorizontal className="h-4 w-4" />
                ตัวกรอง
                {activeFilterCount > 0 && (
                  <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">{activeFilterCount}</span>
                )}
              </button>

              {/* Result count */}
              {searched && !loading && (
                <p className="ml-auto text-sm text-gray-500 shrink-0">
                  <strong className="text-gray-800">{total}</strong> ที่พัก
                  {query.city && <span className="text-gray-600"> ใน {query.city}</span>}
                  <span className="text-gray-400"> · {nights} คืน</span>
                </p>
              )}
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {query.stars.map(s => (
                  <span key={s} className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full">
                    {s}★
                    <button onClick={() => setQuery(p => ({ ...p, stars: p.stars.filter(x => x !== s) }))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {(query.minPrice > 0 || query.maxPrice < 50000) && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full">
                    ฿{query.minPrice.toLocaleString()}–{query.maxPrice < 50000 ? `฿${query.maxPrice.toLocaleString()}` : 'ไม่จำกัด'}
                    <button onClick={() => setQuery(p => ({ ...p, minPrice: 0, maxPrice: 50000 }))}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {query.minRating > 0 && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs rounded-full">
                    คะแนน ≥{query.minRating}
                    <button onClick={() => setQuery(p => ({ ...p, minRating: 0 }))}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {query.freeCancel && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-full">
                    ยกเลิกฟรี
                    <button onClick={() => setQuery(p => ({ ...p, freeCancel: false }))}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {query.breakfast && (
                  <span className="flex items-center gap-1 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-full">
                    รวมอาหารเช้า
                    <button onClick={() => setQuery(p => ({ ...p, breakfast: false }))}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {query.amenities.map(a => (
                  <span key={a} className="flex items-center gap-1 px-3 py-1 bg-gray-50 border border-gray-200 text-gray-600 text-xs rounded-full">
                    {AMENITY_CHIPS.find(c => c.value === a)?.label ?? a}
                    <button onClick={() => setQuery(p => ({ ...p, amenities: p.amenities.filter(x => x !== a) }))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                <button onClick={clearAllFilters} className="text-xs text-blue-600 hover:underline">ล้างทั้งหมด</button>
              </div>
            )}

            {/* ── Loading skeletons ── */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5, 6].map(i => <TripCardSkeleton key={i} />)}
              </div>

            ) : !searched ? (
              /* ── Pre-search state ── */
              <div>
                <div className="text-center py-20 mb-8">
                  <div className="text-7xl mb-5">🏨</div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">ค้นหาที่พักในฝัน</h2>
                  <p className="text-gray-500 mb-6">ระบุปลายทางและวันที่เพื่อดูห้องว่าง</p>
                  <button
                    onClick={handleGeolocate}
                    disabled={geoLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {geoLoading
                      ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Locate className="h-4 w-4" />}
                    ค้นหาโรงแรมใกล้ฉัน
                  </button>
                </div>

                {recentViewed.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-bold text-gray-800 mb-3 text-base">ที่พักที่ดูล่าสุด</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {recentViewed.map(h => (
                        <Link key={h.id} href={`/h/${h.slug}`}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow group">
                          {h.hero_image_url && (
                            <div className="relative w-full h-24">
                              <Image src={h.hero_image_url} alt={h.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                            </div>
                          )}
                          <div className="p-3">
                            <p className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-blue-600">{h.name}</p>
                            <p className="text-xs text-gray-400">{h.city}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            ) : hotels.length === 0 ? (
              /* ── No results ── */
              <div className="text-center py-24 bg-white rounded-xl border border-gray-200">
                <div className="text-5xl mb-4">😔</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่พบที่พักในช่วงนี้</h2>
                <p className="text-gray-500 text-sm mb-5">ลองเปลี่ยนวันที่หรือเงื่อนไขการค้นหา</p>
                <button
                  onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  ล้างตัวกรอง
                </button>
              </div>

            ) : (
              /* ── Results list ── */
              <div className="space-y-3">

                {/* Nearby section */}
                {nearby.length > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <h3 className="font-semibold text-gray-800">โรงแรมใกล้คุณ</h3>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">ภายใน 10 กม.</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      {nearby.map(hotel => (
                        <div key={hotel.id}>
                          <HotelCard hotel={hotel} nights={nights} checkIn={query.checkIn} checkOut={query.checkOut} />
                        </div>
                      ))}
                    </div>
                    <div className="my-4 border-t border-gray-200" />
                  </div>
                )}

                {/* Last-minute deals */}
                {isLastMinute && deals.length > 0 && (
                  <div className="mb-2 rounded-xl bg-gradient-to-r from-orange-50 to-red-50 border border-orange-100 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-orange-500" />
                      <h3 className="font-semibold text-gray-800">ดีลวันนี้เท่านั้น!</h3>
                      <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                        เช็คอิน {daysToCheckIn === 0 ? 'วันนี้' : `${daysToCheckIn} วัน`}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {deals.map(hotel => (
                        <div key={hotel.id}>
                          <HotelCard hotel={hotel} nights={nights} checkIn={query.checkIn} checkOut={query.checkOut} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result count header */}
                <div className="flex items-center justify-between py-2">
                  <p className="text-sm text-gray-600">
                    แสดง <strong className="text-gray-800">{Math.min(visibleCount, hotels.length)}</strong> จาก{' '}
                    <strong className="text-gray-800">{hotels.length}</strong> ที่พัก
                    {query.city && <span className="text-blue-600 font-medium"> ใน {query.city}</span>}
                  </p>
                </div>

                {/* Horizontal hotel cards */}
                {visibleHotels.map(hotel => (
                  <TripHotelCard
                    key={hotel.id}
                    hotel={hotel}
                    nights={nights}
                    checkIn={query.checkIn}
                    checkOut={query.checkOut}
                    onTrack={trackRecent}
                  />
                ))}

                {/* Load more */}
                {hotels.length > visibleCount && (
                  <div className="mt-6 flex justify-center">
                    <button
                      onClick={() => setVisibleCount(n => n + 12)}
                      className="px-10 py-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm"
                    >
                      โหลดเพิ่ม ({Math.min(12, hotels.length - visibleCount)} รายการ)
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter bottom sheet ── */}
      <AnimatePresence>
        {showFilter && (
          <div className="fixed inset-0 z-50 flex items-end lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setShowFilter(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative bg-white w-full max-h-[88vh] overflow-y-auto rounded-t-2xl p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-800">ตัวกรอง</h2>
                <button onClick={() => setShowFilter(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <FilterPanel
                query={query}
                setQuery={setQuery}
                onApply={() => { search(query); setShowFilter(false); }}
                onClear={clearAllFilters}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Mobile sticky bottom bar ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md px-4 py-3 lg:hidden shadow-lg">
        <div className="max-w-screen-xl mx-auto grid grid-cols-2 gap-3">
          <button
            onClick={() => doSearch()}
            className="py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <Search className="h-4 w-4" />
            ค้นหา
          </button>
          <button
            onClick={() => setShowFilter(true)}
            className="py-3 border border-gray-200 bg-white rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            ตัวกรอง{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page export ─── */
export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F5F7FA] animate-pulse" />}>
      <SearchContent />
    </Suspense>
  );
}
