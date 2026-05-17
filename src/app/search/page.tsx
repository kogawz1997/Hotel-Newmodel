'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatCurrency } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import {
  Search, MapPin, Star, X, Users, Calendar, SlidersHorizontal,
  Locate, Check, Tag, ChevronDown, ChevronUp,
} from 'lucide-react';
import { HotelCard } from '@/components/public/HotelCard';

const HOTEL_TYPES = [
  { value: '',                    label: 'ทุกประเภท',     emoji: '🏠' },
  { value: 'hotel',               label: 'Hotel',          emoji: '🏨' },
  { value: 'resort',              label: 'Resort',         emoji: '🌴' },
  { value: 'boutique',            label: 'Boutique',       emoji: '🏡' },
  { value: 'pool_villa',          label: 'Pool Villa',     emoji: '🏊' },
  { value: 'hostel',              label: 'Hostel',         emoji: '🎒' },
  { value: 'serviced_apartment',  label: 'Serviced Apt.',  emoji: '🏢' },
];

const AMENITY_CHIPS = [
  { value: 'wifi',        label: 'Wifi ฟรี' },
  { value: 'pool',        label: 'สระว่ายน้ำ' },
  { value: 'gym',         label: 'ฟิตเนส' },
  { value: 'spa',         label: 'สปา' },
  { value: 'parking',     label: 'ที่จอดรถ' },
  { value: 'restaurant',  label: 'ร้านอาหาร' },
];

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

/* ─── Filter panel (used both in sidebar and mobile sheet) ─── */
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
    setQuery(p => ({ ...p, stars: p.stars.includes(s) ? p.stars.filter(x => x !== s) : [...p.stars, s] }));
  }
  function toggleAmenity(a: string) {
    setQuery(p => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities.filter(x => x !== a) : [...p.amenities, a] }));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-foreground">
          ตัวกรอง
          {activeCount > 0 && (
            <span className="ml-1.5 text-xs bg-[#C66A30] text-white px-1.5 py-0.5 rounded-full">{activeCount}</span>
          )}
        </h3>
        {activeCount > 0 && (
          <button onClick={onClear} className="text-xs text-[#C66A30] hover:underline">ล้างทั้งหมด</button>
        )}
      </div>

      {/* Price range */}
      <div className="border-t border-border/50 pt-4">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/70 mb-3">ราคาต่อคืน (บาท)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={query.minPrice || ''}
            onChange={e => setQuery(p => ({ ...p, minPrice: Number(e.target.value) }))}
            placeholder="0"
            className="flex-1 px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-[#C66A30]/20"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <input
            type="number"
            value={query.maxPrice < 50000 ? query.maxPrice : ''}
            onChange={e => setQuery(p => ({ ...p, maxPrice: Number(e.target.value) || 50000 }))}
            placeholder="ไม่จำกัด"
            className="flex-1 px-3 py-2 bg-muted/30 border border-border/50 rounded-lg text-sm focus:outline-none text-foreground placeholder:text-muted-foreground/40 focus:ring-2 focus:ring-[#C66A30]/20"
          />
        </div>
      </div>

      {/* Star rating */}
      <div className="border-t border-border/50 pt-4">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/70 mb-3">ระดับดาวโรงแรม</p>
        <div className="flex flex-wrap gap-2">
          {[5, 4, 3, 2, 1].map(s => (
            <button
              key={s}
              onClick={() => toggleStar(s)}
              className={cn(
                'flex items-center gap-0.5 px-3 py-1.5 rounded-full border text-xs transition-all',
                query.stars.includes(s)
                  ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-400 text-amber-700 dark:text-amber-400 shadow-sm'
                  : 'border-border text-muted-foreground hover:border-amber-300',
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
      <div className="border-t border-border/50 pt-4">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/70 mb-3">คะแนนผู้เข้าพัก</p>
        <div className="space-y-1">
          {[
            { v: 4.5, label: 'ยอดเยี่ยมมาก', sub: '4.5+' },
            { v: 4.0, label: 'ยอดเยี่ยม',    sub: '4.0+' },
            { v: 3.5, label: 'ดีมาก',         sub: '3.5+' },
            { v: 3.0, label: 'ดี',            sub: '3.0+' },
            { v: 0,   label: 'ทั้งหมด',       sub: ''     },
          ].map(r => (
            <button
              key={r.v}
              onClick={() => setQuery(p => ({ ...p, minRating: r.v }))}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm transition-all text-left',
                query.minRating === r.v
                  ? 'bg-foreground text-background rounded-xl'
                  : 'hover:bg-muted/50 text-muted-foreground rounded-xl',
              )}
            >
              <span>{r.label}</span>
              {r.sub && <span className="text-xs opacity-60">{r.sub}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Popular filters */}
      <div className="border-t border-border/50 pt-4">
        <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-muted-foreground/70 mb-3">ฟิลเตอร์ยอดนิยม</p>
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
                    ? 'bg-[#C66A30] border-[#C66A30]'
                    : 'border-black/20 group-hover:border-[#C66A30]/50',
                )}
              >
                {query[item.key] && <Check className="h-3 w-3 text-white" />}
              </div>
              <span className="text-sm text-muted-foreground select-none">{item.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Amenities */}
      <div className="border-t border-border/50 pt-4">
        <button
          onClick={() => setShowAmenities(p => !p)}
          className="w-full flex items-center justify-between text-[10px] font-bold text-muted-foreground/70 uppercase tracking-[0.15em] mb-3"
        >
          <span>สิ่งอำนวยความสะดวก</span>
          {showAmenities ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
        {showAmenities && (
          <div className="flex flex-wrap gap-2">
            {AMENITY_CHIPS.map(a => (
              <button
                key={a.value}
                onClick={() => toggleAmenity(a.value)}
                className={cn(
                  'px-3 py-1.5 rounded-full border text-xs transition-all',
                  query.amenities.includes(a.value)
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:border-[#2A2522]/20',
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onApply}
        className="w-full py-3 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-xl text-sm font-bold transition-colors shadow-lg shadow-[#C66A30]/20"
      >
        ค้นหา
      </button>
    </div>
  );
}

/* ─── Main search component ─── */
function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tomorrow = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const dayAfter  = format(addDays(new Date(), 2), 'yyyy-MM-dd');

  const [query, setQuery] = useState<Query>({
    city:       searchParams.get('city') || '',
    checkIn:    searchParams.get('checkIn') || tomorrow,
    checkOut:   searchParams.get('checkOut') || dayAfter,
    adults:     Number(searchParams.get('adults') || 2),
    type:       searchParams.get('type') || '',
    sort:       'recommended',
    minPrice:   0,
    maxPrice:   50000,
    minRating:  0,
    stars:      [],
    freeCancel: false,
    breakfast:  false,
    amenities:  [],
  });

  const [hotels,      setHotels]      = useState<any[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [searched,    setSearched]    = useState(false);
  const [total,       setTotal]       = useState(0);
  const [visibleCount,setVisibleCount]= useState(12);
  const [showFilter,  setShowFilter]  = useState(false);
  const [userLat,     setUserLat]     = useState<number | null>(null);
  const [userLng,     setUserLng]     = useState<number | null>(null);
  const [geoLoading,  setGeoLoading]  = useState(false);
  const [recentViewed,setRecentViewed]= useState<any[]>([]);

  const nights = Math.max(1, Math.round(
    (new Date(query.checkOut).getTime() - new Date(query.checkIn).getTime()) / 86400000,
  ));

  const search = useCallback(async (
    q: Query          = query,
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
    if (q.stars.length)    params.set('stars', q.stars.join(','));
    if (q.freeCancel)      params.set('cancelType', 'free');
    if (q.amenities.length)params.set('amenities', q.amenities.join(','));
    if (lat !== null)      params.set('lat', String(lat));
    if (lng !== null)      params.set('lng', String(lng));

    try {
      const res  = await fetch(`/api/public/search?${params}`);
      const data = await res.json();
      let list: any[] = data.hotels || [];
      // client-side breakfast filter (server returns is_breakfast)
      if (q.breakfast) list = list.filter(h => h.is_breakfast);
      setHotels(list);
      setTotal(data.total || 0);
    } catch { setHotels([]); setTotal(0); }
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
    setQuery(p => ({ ...p, stars: [], minPrice: 0, maxPrice: 50000, minRating: 0, freeCancel: false, breakfast: false, amenities: [] }));
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
    { value: 'price_asc',   label: 'ราคาต่ำสุด' },
    { value: 'rating',      label: 'คะแนนสูงสุด' },
    ...(userLat ? [{ value: 'distance', label: 'ใกล้ที่สุด' }] : []),
  ];

  return (
    <div className="min-h-screen bg-muted/30">

      {/* ── Sticky nav ── */}
      <nav className="bg-card border-b border-border/50 sticky top-0 z-40 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden md:flex items-center gap-2 group shrink-0">
              <div className="h-8 w-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="font-display text-sm font-bold text-amber-700 dark:text-amber-400">M</span>
              </div>
              <span className="font-semibold text-foreground text-sm">Maitri</span>
            </Link>

            {/* Search form */}
            <div className="flex-1 flex items-center bg-muted/30 border border-border rounded-2xl overflow-hidden max-w-4xl">
              {/* Destination */}
              <div className="flex items-center gap-2 px-4 py-2.5 border-r border-border/60 flex-1 min-w-0">
                <MapPin className="h-4 w-4 text-[#C66A30] shrink-0" />
                <input
                  value={query.city}
                  onChange={e => setQuery(p => ({ ...p, city: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && doSearch()}
                  placeholder="ค้นหาเมือง, โรงแรม..."
                  className="bg-transparent text-sm focus:outline-none min-w-0 w-full"
                />
                <button
                  onClick={handleGeolocate}
                  disabled={geoLoading}
                  title="ค้นหาใกล้ฉัน"
                  className="shrink-0 p-1.5 rounded-lg hover:bg-[#C66A30]/10 text-[#C66A30] transition-colors disabled:opacity-50"
                >
                  {geoLoading
                    ? <div className="h-4 w-4 border-2 border-[#C66A30]/30 border-t-[#C66A30] rounded-full animate-spin" />
                    : <Locate className="h-4 w-4" />}
                </button>
              </div>

              {/* Dates */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2.5 border-r border-border/60">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input type="date" value={query.checkIn}
                  onChange={e => setQuery(p => ({ ...p, checkIn: e.target.value }))}
                  className="text-xs bg-transparent focus:outline-none w-28 text-muted-foreground" />
              </div>
              <div className="hidden md:flex items-center gap-2 px-4 py-2.5 border-r border-border/60">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input type="date" value={query.checkOut}
                  onChange={e => setQuery(p => ({ ...p, checkOut: e.target.value }))}
                  className="text-xs bg-transparent focus:outline-none w-28 text-muted-foreground" />
              </div>

              {/* Guests */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2.5 border-r border-border/60">
                <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <select
                  value={query.adults}
                  onChange={e => setQuery(p => ({ ...p, adults: Number(e.target.value) }))}
                  className="text-xs bg-transparent focus:outline-none text-muted-foreground cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} คน</option>)}
                </select>
              </div>

              <button
                onClick={() => doSearch()}
                className="px-5 py-2.5 bg-[#C66A30] hover:bg-[#A4522A] text-white font-bold text-sm transition-colors flex items-center gap-2 shrink-0"
              >
                <Search className="h-4 w-4" />
                <span className="hidden md:block">ค้นหา</span>
              </button>
            </div>

            <Link href="/portal/login" className="hidden lg:block text-sm text-[#C66A30] hover:underline shrink-0">
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-screen-xl mx-auto px-4">

        {/* ── Property type pills ── */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 [scrollbar-width:none]">
          {HOTEL_TYPES.map(t => (
            <button
              key={t.value}
              onClick={() => { const nq = { ...query, type: t.value }; setQuery(nq); search(nq); }}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all shrink-0 whitespace-nowrap',
                query.type === t.value
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card border-border text-muted-foreground hover:border-[#2A2522]/30',
              )}
            >
              <span>{t.emoji}</span>{t.label}
            </button>
          ))}
        </div>

        {/* ── Main layout: sidebar + results ── */}
        <div className="flex gap-6 pb-28">

          {/* ── Filter sidebar (desktop) ── */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-20 bg-card rounded-2xl border border-border/50 p-5">
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

            {/* Sort + filter controls */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {/* Sort tabs */}
              <div className="flex items-center bg-card border border-border/60 rounded-xl overflow-hidden">
                {SORT_TABS.map(s => (
                  <button
                    key={s.value}
                    onClick={() => { const nq = { ...query, sort: s.value }; setQuery(nq); search(nq); }}
                    className={cn(
                      'px-4 py-2 text-xs font-medium transition-colors border-r border-border/60 last:border-0 whitespace-nowrap',
                      query.sort === s.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:bg-muted/50',
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Mobile filter button */}
              <button
                onClick={() => setShowFilter(true)}
                className="lg:hidden flex items-center gap-1.5 px-4 py-2 bg-card border border-border/60 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                ตัวกรอง
                {activeFilterCount > 0 && (
                  <span className="bg-[#C66A30] text-white text-2xs px-1.5 py-0.5 rounded-full">{activeFilterCount}</span>
                )}
              </button>

              {searched && !loading && (
                <p className="ml-auto text-sm text-muted-foreground shrink-0">
                  พบ <strong className="text-foreground">{total}</strong> ที่พัก
                  {query.city && ` · ${query.city}`}
                  {` · ${nights} คืน`}
                </p>
              )}
            </div>

            {/* Active filter chips */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {query.stars.map(s => (
                  <span key={s} className="flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-full">
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
                    ≥{query.minRating}⭐
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
                  <span className="flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 text-xs rounded-full">
                    รวมอาหารเช้า
                    <button onClick={() => setQuery(p => ({ ...p, breakfast: false }))}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {query.amenities.map(a => (
                  <span key={a} className="flex items-center gap-1 px-3 py-1 bg-muted/20 border border-[#2A2522]/10 text-muted-foreground text-xs rounded-full">
                    {AMENITY_CHIPS.find(c => c.value === a)?.label ?? a}
                    <button onClick={() => setQuery(p => ({ ...p, amenities: p.amenities.filter(x => x !== a) }))}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                <button onClick={clearAllFilters} className="text-xs text-[#C66A30] hover:underline">ล้างทั้งหมด</button>
              </div>
            )}

            {/* ── Loading skeletons ── */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border/50">
                    <div className="h-52 bg-muted/20 animate-pulse" />
                    <div className="p-4 space-y-2.5">
                      <div className="h-3 bg-muted/20 rounded animate-pulse w-1/3" />
                      <div className="h-4 bg-muted/30 rounded animate-pulse" />
                      <div className="h-3 bg-muted/20 rounded animate-pulse w-2/3" />
                      <div className="h-3 bg-muted/20 rounded animate-pulse w-1/2" />
                      <div className="h-8 bg-muted/20 rounded-xl animate-pulse mt-3" />
                    </div>
                  </div>
                ))}
              </div>

            ) : !searched ? (
              /* ── Pre-search (empty) state ── */
              <div>
                <div className="text-center py-20 mb-8">
                  <div className="text-7xl mb-5">🏨</div>
                  <h2 className="text-3xl font-display font-semibold text-foreground mb-2">ค้นหาที่พักในฝัน</h2>
                  <p className="text-muted-foreground mb-6">ระบุปลายทางและวันที่เพื่อดูห้องว่าง</p>
                  <button
                    onClick={handleGeolocate}
                    disabled={geoLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background hover:opacity-80 rounded-2xl text-sm font-semibold transition-opacity disabled:opacity-50"
                  >
                    {geoLoading
                      ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <Locate className="h-4 w-4" />}
                    ค้นหาโรงแรมใกล้ฉัน
                  </button>
                </div>

                {recentViewed.length > 0 && (
                  <div className="mb-8">
                    <h3 className="font-bold text-foreground mb-3">ดูล่าสุด</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {recentViewed.map(h => (
                        <Link key={h.id} href={`/h/${h.slug}`}
                          className="bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-md transition-shadow">
                          {h.hero_image_url && (
                            <div className="relative w-full h-20">
                              <Image src={h.hero_image_url} alt={h.name} fill className="object-cover" />
                            </div>
                          )}
                          <div className="p-3">
                            <p className="text-xs font-semibold text-foreground line-clamp-1">{h.name}</p>
                            <p className="text-xs text-muted-foreground">{h.city}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            ) : hotels.length === 0 ? (
              /* ── No results ── */
              <div className="text-center py-24">
                <div className="text-5xl mb-4">😔</div>
                <h2 className="text-xl font-display font-semibold text-foreground mb-2">ไม่พบที่พักในช่วงนี้</h2>
                <p className="text-muted-foreground text-sm mb-5">ลองเปลี่ยนวันที่หรือเงื่อนไขการค้นหา</p>
                <button onClick={clearAllFilters}
                  className="px-5 py-2.5 bg-[#C66A30] text-white rounded-xl text-sm font-semibold">
                  ล้างตัวกรอง
                </button>
              </div>

            ) : (
              /* ── Results ── */
              <div>

                {/* Nearby section (when geolocated) */}
                {nearby.length > 0 && (
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-[#C66A30]" />
                      <h3 className="font-semibold text-foreground">โรงแรมใกล้คุณ</h3>
                      <span className="text-xs text-muted-foreground bg-muted/20 px-2 py-0.5 rounded-full">ภายใน 10 กม.</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {nearby.map(hotel => (
                        <div key={hotel.id} onClick={() => trackRecent(hotel)}>
                          <HotelCard hotel={hotel} nights={nights} checkIn={query.checkIn} checkOut={query.checkOut} />
                        </div>
                      ))}
                    </div>
                    <div className="my-6 border-t border-border/50" />
                  </div>
                )}

                {/* Last-minute deals */}
                {isLastMinute && deals.length > 0 && (
                  <div className="mb-8 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Tag className="h-4 w-4 text-red-600" />
                      <h3 className="font-semibold text-foreground">ดีลวันนี้เท่านั้น!</h3>
                      <span className="text-xs text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                        เช็คอิน {daysToCheckIn === 0 ? 'วันนี้' : `${daysToCheckIn} วัน`}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                      {deals.map(hotel => (
                        <div key={hotel.id} onClick={() => trackRecent(hotel)}>
                          <HotelCard hotel={hotel} nights={nights} checkIn={query.checkIn} checkOut={query.checkOut} />
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 border-t border-red-100" />
                  </div>
                )}

                {/* Full results grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {visibleHotels.map(hotel => (
                    <div key={hotel.id} onClick={() => trackRecent(hotel)}>
                      <HotelCard hotel={hotel} nights={nights} checkIn={query.checkIn} checkOut={query.checkOut} />
                    </div>
                  ))}
                </div>

                {hotels.length > visibleCount && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => setVisibleCount(n => n + 12)}
                      className="px-10 py-3.5 bg-card border border-border rounded-2xl text-sm font-semibold text-foreground hover:bg-muted/50 hover:border-[#C66A30]/30 transition-all shadow-sm hover:shadow-md"
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
      {showFilter && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilter(false)} />
          <div className="relative bg-card w-full max-h-[88vh] overflow-y-auto rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-semibold text-foreground">ตัวกรอง</h2>
              <button onClick={() => setShowFilter(false)} className="p-2 rounded-full hover:bg-muted/50">
                <X className="h-5 w-5" />
              </button>
            </div>
            <FilterPanel
              query={query}
              setQuery={setQuery}
              onApply={() => { search(query); setShowFilter(false); }}
              onClear={clearAllFilters}
            />
          </div>
        </div>
      )}

      {/* ── Mobile sticky bottom bar ── */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-card/95 backdrop-blur-md px-4 py-3 lg:hidden">
        <div className="max-w-screen-xl mx-auto grid grid-cols-2 gap-3">
          <button onClick={() => doSearch()} className="py-3 bg-[#C66A30] text-white rounded-xl text-sm font-bold hover:bg-[#A4522A] transition-colors flex items-center justify-center gap-2">
            <Search className="h-4 w-4" />ค้นหา
          </button>
          <button onClick={() => setShowFilter(true)} className="py-3 border border-border bg-card rounded-xl text-sm font-medium hover:bg-muted/50 transition-colors flex items-center justify-center gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            ตัวกรอง{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted/30 animate-pulse" />}>
      <SearchContent />
    </Suspense>
  );
}
