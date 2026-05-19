'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Star, ChevronRight, Sparkles, X,
  QrCode, Loader2, ArrowRight, Key,
  BedDouble, Calendar, Users, Minus, Plus, Car,
  Plane, Train, Bot, Zap, Clock, Navigation, Gift,
  Tag, Heart, ArrowLeft, History,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';

const ease = [0.22, 1, 0.36, 1] as const;
const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

// ─── Service rows ─────────────────────────────────────────────────────────────

const ROW1 = [
  { icon: BedDouble, label: 'ที่พัก',     href: '/search',      active: true  },
  { icon: Plane,     label: 'เที่ยวบิน',  href: '/portal/home', active: false },
  { icon: Tag,       label: 'ทัวร์&ตั๋ว', href: '/portal/home', active: false },
  { icon: Train,     label: 'รถไฟ',       href: '/portal/home', active: false },
];

const ROW2 = [
  { icon: Key,        label: 'บ้าน/อพาร์ท',   href: '/portal/home' },
  { icon: Sparkles,   label: 'ทัวร์',          href: '/portal/home' },
  { icon: Car,        label: 'รถเช่า',          href: '/portal/home' },
  { icon: Navigation, label: 'รับส่งสนามบิน',   href: '/portal/home' },
  { icon: ArrowRight, label: 'อื่นๆ +7',        href: '/portal/home' },
];

const QUICK_ROW = [
  { icon: Zap,      label: 'ดีล',           href: '/portal/coupons'   },
  { icon: Gift,     label: 'อิเวนต์',        href: '/portal/home'      },
  { icon: Calendar, label: 'แผนการเดินทาง', href: '/portal/itinerary' },
  { icon: Star,     label: 'Trip.Pulse',    href: '/portal/home'      },
  { icon: Clock,    label: 'ล่าสุด',         href: '/portal/home'      },
];

// ─── Recommended cities for search overlay ────────────────────────────────────

const CITIES_GRID = [
  { name: 'กรุงเทพฯ', img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=400&q=80' },
  { name: 'ภูเก็ต',   img: 'https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?auto=format&fit=crop&w=400&q=80' },
  { name: 'เชียงใหม่', img: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&w=400&q=80' },
  { name: 'พัทยา',    img: 'https://images.unsplash.com/photo-1526786220381-1d21eeafd6b9?auto=format&fit=crop&w=400&q=80' },
  { name: 'เกาะสมุย', img: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=400&q=80' },
  { name: 'หัวหิน',   img: 'https://images.unsplash.com/photo-1568797629192-789acf8e4df3?auto=format&fit=crop&w=400&q=80' },
];

const SUGGESTED = ['เชียงใหม่', 'กระบี่', 'เกาะพะงัน', 'อยุธยา'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hotelRating(name: string) {
  const s = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (4.5 + (s % 5) * 0.1).toFixed(1);
}

// ─── Search Overlay ───────────────────────────────────────────────────────────

function SearchOverlay({
  onClose,
  onSearch,
}: {
  onClose: () => void;
  onSearch: (p: { city: string; checkIn: string; checkOut: string; adults: number }) => void;
}) {
  const [q, setQ]                       = useState('');
  const [suggestions, setSuggestions]   = useState<any[]>([]);
  const [loading, setLoading]           = useState(false);
  const [recentSearches, setRecent]     = useState<string[]>([]);
  const [checkIn, setCheckIn]   = useState(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(() => format(addDays(new Date(), 2), 'yyyy-MM-dd'));
  const [adults, setAdults]     = useState(2);
  const [rooms, setRooms]       = useState(1);
  const [showDates, setShowDates]   = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const nights = useMemo(() => {
    try { return Math.max(1, differenceInDays(parseISO(checkOut), parseISO(checkIn))); } catch { return 1; }
  }, [checkIn, checkOut]);

  useEffect(() => {
    inputRef.current?.focus();
    try {
      const raw = localStorage.getItem('maitri_recent_searches');
      if (raw) setRecent(JSON.parse(raw).slice(0, 5));
    } catch {}
  }, []);

  useEffect(() => {
    if (!q.trim() || q.length < 2) { setSuggestions([]); setLoading(false); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/search/hotels?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        setSuggestions(data.hotels ?? []);
      } catch { setSuggestions([]); }
      setLoading(false);
    }, 280);
    return () => clearTimeout(t);
  }, [q]);

  function saveRecent(city: string) {
    const next = [city, ...recentSearches.filter(s => s !== city)].slice(0, 5);
    setRecent(next);
    try { localStorage.setItem('maitri_recent_searches', JSON.stringify(next)); } catch {}
  }

  function doSearch(city: string = q) {
    const trimmed = city.trim();
    if (!trimmed) return;
    saveRecent(trimmed);
    onSearch({ city: trimmed, checkIn, checkOut, adults });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.18, ease }}
      className="fixed inset-0 z-50 bg-white dark:bg-background flex flex-col"
    >
      {/* ── Header (blue bar) ── */}
      <div className="bg-blue-600 px-4 pb-3 shrink-0">
        <div className="flex items-center gap-3 h-14">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-white" />
          </motion.button>
          <div className="flex-1 flex items-center bg-white rounded-full h-10 px-4 gap-2">
            {loading
              ? <Loader2 className="h-4 w-4 text-blue-600 shrink-0 animate-spin" />
              : <Search className="h-4 w-4 text-gray-400 shrink-0" />
            }
            <input
              ref={inputRef}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && q.trim()) doSearch(); }}
              placeholder="ค้นหาโรงแรม, เมือง..."
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ('')} className="h-5 w-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <X className="h-3 w-3 text-gray-500" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto">

        {/* Autocomplete results when typing */}
        {q.trim().length >= 2 ? (
          <div className="py-2">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-4 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">กำลังค้นหา...</span>
              </div>
            ) : suggestions.length === 0 ? (
              <p className="px-4 py-6 text-sm text-gray-400 text-center">ไม่พบ "{q}"</p>
            ) : (
              suggestions.map(h => (
                <button
                  key={h.id}
                  onClick={() => doSearch(h.city || h.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left"
                >
                  <div className="relative h-12 w-16 rounded-xl overflow-hidden shrink-0 bg-gray-100">
                    <Image src={h.hero_image_url || PLACEHOLDER} alt={h.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-1">{h.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{h.city}
                    </p>
                  </div>
                  {h.min_rate && (
                    <p className="text-xs font-bold text-orange-500 shrink-0">฿{h.min_rate.toLocaleString()}</p>
                  )}
                </button>
              ))
            )}
          </div>
        ) : (
          <div>
            {/* Recent searches */}
            {recentSearches.length > 0 && (
              <div className="px-4 pt-5 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-800 dark:text-foreground">ค้นหาล่าสุด</p>
                  <button
                    onClick={() => { setRecent([]); localStorage.removeItem('maitri_recent_searches'); }}
                    className="text-xs text-blue-600"
                  >
                    ล้างทั้งหมด
                  </button>
                </div>
                {recentSearches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => doSearch(s)}
                    className="w-full flex items-center gap-3 py-2.5 hover:bg-gray-50 text-left rounded-xl px-2"
                  >
                    <History className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 dark:text-foreground flex-1">{s}</span>
                    <button
                      onClick={e => { e.stopPropagation(); setRecent(r => r.filter((_, j) => j !== i)); }}
                      className="shrink-0 p-1"
                    >
                      <X className="h-3.5 w-3.5 text-gray-300" />
                    </button>
                  </button>
                ))}
              </div>
            )}

            {/* Recommended cities grid */}
            <div className="px-4 pt-4">
              <p className="text-sm font-bold text-gray-800 dark:text-foreground mb-3">เมืองแนะนำ</p>
              <div className="grid grid-cols-3 gap-2">
                {CITIES_GRID.map(city => (
                  <button
                    key={city.name}
                    onClick={() => doSearch(city.name)}
                    className="relative rounded-2xl overflow-hidden h-[72px] group"
                  >
                    <Image src={city.img} alt={city.name} fill className="object-cover" sizes="120px" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <span className="absolute bottom-1.5 left-0 right-0 text-center text-[11px] font-bold text-white">
                      {city.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Trip Planner banner */}
            <div className="mx-4 mt-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                <Bot className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">AI Trip Planner</p>
                <p className="text-xs text-white/70 mt-0.5">วางแผนทริปด้วย AI อัตโนมัติ</p>
              </div>
              <ArrowRight className="h-4 w-4 text-white/70 shrink-0" />
            </div>

            {/* Suggested destinations */}
            <div className="px-4 pt-4 pb-4">
              <p className="text-sm font-bold text-gray-800 dark:text-foreground mb-3">สำหรับคุณ</p>
              {SUGGESTED.map(dest => (
                <button
                  key={dest}
                  onClick={() => doSearch(dest)}
                  className="w-full flex items-center gap-3 py-3 border-b border-gray-100 dark:border-border/40 last:border-0 text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-foreground flex-1">{dest}</span>
                  <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom: dates + guests + search button ── */}
      <div className="border-t border-gray-100 dark:border-border/40 bg-white dark:bg-card px-4 pt-3 pb-6 space-y-2 shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => { setShowDates(s => !s); setShowGuests(false); }}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-background text-left"
          >
            <Calendar className="h-4 w-4 text-blue-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-400">วันที่</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-foreground truncate">
                {format(parseISO(checkIn), 'd MMM', { locale: th })} – {format(parseISO(checkOut), 'd MMM', { locale: th })}
                <span className="text-gray-400 font-normal ml-1">({nights} คืน)</span>
              </p>
            </div>
          </button>
          <button
            onClick={() => { setShowGuests(s => !s); setShowDates(false); }}
            className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-background text-left"
          >
            <Users className="h-4 w-4 text-blue-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-gray-400">ผู้เข้าพัก</p>
              <p className="text-xs font-semibold text-gray-800 dark:text-foreground truncate">{rooms} ห้อง · {adults} คน</p>
            </div>
          </button>
        </div>

        <AnimatePresence>
          {showDates && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">เช็คอิน</p>
                  <input type="date" value={checkIn}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    onChange={e => {
                      setCheckIn(e.target.value);
                      if (e.target.value >= checkOut) setCheckOut(format(addDays(parseISO(e.target.value), 1), 'yyyy-MM-dd'));
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-background text-sm text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1.5">เช็คออก</p>
                  <input type="date" value={checkOut}
                    min={format(addDays(parseISO(checkIn), 1), 'yyyy-MM-dd')}
                    onChange={e => setCheckOut(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-background text-sm text-gray-900 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showGuests && (
            <motion.div
              initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-2 pt-1">
                {([
                  { label: 'ห้องพัก', value: rooms, min: 1, set: setRooms },
                  { label: 'ผู้ใหญ่',  value: adults, min: 1, set: setAdults },
                ] as const).map(({ label, value, min, set }) => (
                  <div key={label} className="flex items-center justify-between px-1">
                    <span className="text-sm text-gray-800 dark:text-foreground font-medium">{label}</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => (set as any)(Math.max(min, value - 1))}
                        disabled={value <= min}
                        className="h-8 w-8 rounded-full border border-gray-200 dark:border-border flex items-center justify-center disabled:opacity-30"
                      >
                        <span className="text-lg text-gray-700 leading-none">−</span>
                      </button>
                      <span className="text-sm font-bold text-gray-900 dark:text-foreground w-5 text-center">{value}</span>
                      <button
                        onClick={() => (set as any)(value + 1)}
                        className="h-8 w-8 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center"
                      >
                        <span className="text-lg text-blue-600 leading-none">+</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => doSearch()}
          className="w-full py-3.5 bg-blue-600 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:bg-blue-700 transition-colors"
        >
          <Search className="h-4 w-4" /> ค้นหาที่พัก
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── Hotel Card ───────────────────────────────────────────────────────────────

function HotelCard({ hotel, index }: { hotel: any; index: number }) {
  const minRate = hotel.room_types?.length
    ? Math.min(...hotel.room_types.map((rt: any) => rt.base_rate).filter(Boolean))
    : hotel.min_rate ?? null;
  const rating = hotelRating(hotel.name || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.06, duration: 0.45, ease }}
    >
      <Link href={`/h/${hotel.slug || hotel.id}`}>
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.985 }}
          transition={{ duration: 0.25, ease }}
          className="rounded-2xl overflow-hidden border border-gray-100 dark:border-border bg-white dark:bg-card shadow-sm hover:shadow-lg transition-shadow duration-300 group"
        >
          <div className="relative h-44 overflow-hidden">
            <Image
              src={hotel.hero_image_url || PLACEHOLDER}
              alt={hotel.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-md">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-white">{rating}</span>
            </div>
            <button className="absolute top-3 left-3 h-8 w-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center">
              <Heart className="h-4 w-4 text-white" />
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/60 mb-0.5">{hotel.city} · Thailand</p>
              <h3 className="font-semibold text-white text-sm leading-tight line-clamp-1">{hotel.name}</h3>
            </div>
          </div>
          <div className="px-3.5 py-3 flex items-center justify-between">
            <div>
              {minRate && isFinite(minRate) ? (
                <>
                  <span className="text-xs text-gray-400">เริ่มต้น</span>
                  <span className="text-base font-bold text-orange-500 ml-1">฿{(minRate as number).toLocaleString()}</span>
                  <span className="text-xs text-gray-400">/คืน</span>
                </>
              ) : (
                <span className="text-sm text-gray-400">ดูราคาและห้องพัก</span>
              )}
            </div>
            <span className="flex items-center gap-0.5 text-blue-600 text-xs font-semibold">
              ดูรายละเอียด <ChevronRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Active Stay Block ────────────────────────────────────────────────────────

function ActiveStayBlock({ activeStay }: { activeStay: any }) {
  return (
    <Link href="/portal/stay">
      <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
        className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border shadow-sm overflow-hidden">
        <div className="flex items-center">
          <div className="relative h-24 w-28 shrink-0">
            <Image src={(activeStay.hotels as any)?.hero_image_url || PLACEHOLDER} alt="" fill className="object-cover" />
          </div>
          <div className="flex-1 px-3.5 py-3">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
              </span>
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-[0.15em]">กำลังเข้าพัก</span>
            </div>
            <p className="font-semibold text-gray-900 dark:text-foreground text-sm leading-tight line-clamp-1">
              {(activeStay.hotels as any)?.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-muted-foreground mt-1">
              ห้อง {(activeStay.rooms as any)?.room_number || '—'}
              {activeStay.check_out && (
                <> · ออก {format(parseISO(activeStay.check_out + 'T00:00:00'), 'd MMM', { locale: th })}</>
              )}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mr-3" />
        </div>
      </motion.div>
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HomeClient({
  firstName,
  hotels,
  activeStay,
  loyaltyPoints,
}: {
  firstName: string;
  hotels: any[];
  activeStay: any | null;
  loyaltyPoints?: number;
}) {
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);

  // City filter chips
  const dbCities = Array.from(new Set(hotels.map((h: any) => h.city).filter(Boolean)));
  const allCityOptions = ['ทั้งหมด', ...dbCities];
  const [selectedCity, setSelectedCity] = useState('ทั้งหมด');
  const filteredHotels = selectedCity === 'ทั้งหมด' ? hotels : hotels.filter((h: any) => h.city === selectedCity);

  // Popular city pills shown inside the blue header (for quick filter)
  const headerCities = Array.from(new Set([...dbCities, 'กรุงเทพฯ', 'ภูเก็ต', 'เชียงใหม่', 'พัทยา'])).slice(0, 8);

  function handleSearch(params: { city: string; checkIn: string; checkOut: string; adults: number }) {
    const p = new URLSearchParams({
      city: params.city,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      adults: String(params.adults),
    });
    router.push(`/search?${p}`);
    setShowSearch(false);
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">

      {/* ── Search Overlay ── */}
      <AnimatePresence>
        {showSearch && (
          <SearchOverlay onClose={() => setShowSearch(false)} onSearch={handleSearch} />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          BLUE HEADER SECTION
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-blue-600 dark:bg-blue-700">

        {/* Header bar: brand left, loyalty + avatar right */}
        <div className="px-4 pt-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[10px] bg-gradient-to-br from-amber-500 to-[#C66A30] flex items-center justify-center shadow-sm shrink-0">
              <span className="font-bold text-white text-sm">M</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-[8px] uppercase tracking-[0.3em] text-white/50">Private Journey</p>
              <p className="font-bold text-white text-[14px] leading-none">Maitri Collection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loyaltyPoints != null && (
              <Link href="/portal/loyalty">
                <motion.div
                  whileTap={{ scale: 0.93 }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white/15 border border-white/25 hover:bg-white/25 transition-colors"
                >
                  <div className="h-3.5 w-3.5 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                    <span className="text-[7px] font-bold text-amber-900">T</span>
                  </div>
                  <span className="text-xs font-bold text-white">{loyaltyPoints.toLocaleString()}</span>
                </motion.div>
              </Link>
            )}
            <Link href="/portal/account">
              <div className="h-8 w-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {firstName ? firstName.charAt(0).toUpperCase() : 'G'}
              </div>
            </Link>
          </div>
        </div>

        {/* ── Service Grid Row 1: 4 large icons ── */}
        <div className="px-4 mt-4 grid grid-cols-4 gap-1">
          {ROW1.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center gap-1.5 py-1 relative">
                  <div className={cn(
                    'h-14 w-14 rounded-2xl flex items-center justify-center border',
                    item.active ? 'bg-white/25 border-white/50' : 'bg-white/15 border-white/20',
                  )}>
                    <Icon className="h-7 w-7 text-white" strokeWidth={1.7} />
                  </div>
                  <span className="text-[10px] text-white/90 font-medium text-center leading-tight">{item.label}</span>
                  {item.active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-400 block" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* ── Service Grid Row 2: 5 smaller icons ── */}
        <div className="px-4 mt-4 grid grid-cols-5 gap-1">
          {ROW2.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center gap-1.5">
                  <div className="h-10 w-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-white" strokeWidth={1.7} />
                  </div>
                  <span className="text-[9px] text-white/70 font-medium text-center leading-tight line-clamp-1">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* ── Search pill ── */}
        <div className="px-4 mt-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSearch(true)}
            className="w-full bg-white rounded-full h-12 flex items-center px-2 gap-2 shadow-sm"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="flex-1 text-sm text-gray-400 text-left">ค้นหาโรงแรม, เมือง...</span>
            <div className="h-8 px-4 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">ค้นหา</span>
            </div>
          </motion.button>
        </div>

        {/* ── City chips (quick city filter) ── */}
        <div className="flex gap-2 px-4 mt-3 pb-5 overflow-x-auto [scrollbar-width:none]">
          {headerCities.map(city => (
            <motion.button
              key={city}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSelectedCity(city)}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors',
                selectedCity === city
                  ? 'bg-white text-blue-600 border-white'
                  : 'bg-white/15 text-white/90 border-white/25 hover:bg-white/25',
              )}
            >
              {city}
            </motion.button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          QUICK ICONS ROW (white bg)
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-card border-b border-gray-100 dark:border-border/40 px-4 py-3">
        <div className="flex gap-6 overflow-x-auto [scrollbar-width:none] max-w-screen-sm mx-auto lg:max-w-2xl">
          {QUICK_ROW.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className="h-11 w-11 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.8} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-muted-foreground text-center whitespace-nowrap">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="px-4 pb-24 mt-4 max-w-screen-sm mx-auto lg:max-w-2xl">

        {/* Active stay card */}
        {activeStay && (
          <div className="mb-4">
            <ActiveStayBlock activeStay={activeStay} />
          </div>
        )}

        {/* QR scan card (shown when no active stay) */}
        {!activeStay && (
          <Link href="/portal/scan" className="block mb-4">
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-3.5 rounded-2xl bg-white dark:bg-card border border-gray-100 dark:border-border shadow-sm px-4 py-3.5">
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-foreground">สแกน QR ในห้องพัก</p>
                <p className="text-xs text-gray-400 dark:text-muted-foreground mt-0.5">เข้าถึง Room Service & Concierge ทันที</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
            </motion.div>
          </Link>
        )}

        {/* ── กิจกรรมล่าสุด / Hotel recommendations ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-foreground text-base">แนะนำสำหรับคุณ</h2>
            <span className="text-xs text-gray-400">{filteredHotels.length} แห่ง</span>
          </div>

          {/* City filter chips */}
          <div className="flex gap-2 -mx-4 px-4 overflow-x-auto pb-3 [scrollbar-width:none]">
            {allCityOptions.map(city => (
              <motion.button key={city} onClick={() => setSelectedCity(city)} whileTap={{ scale: 0.92 }} className="relative shrink-0">
                {selectedCity === city && (
                  <motion.div
                    layoutId="city-pill"
                    className="absolute inset-0 bg-blue-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={cn(
                  'relative z-10 text-xs font-semibold px-4 py-1.5 rounded-full block transition-colors duration-200',
                  selectedCity === city
                    ? 'text-white'
                    : 'text-gray-500 bg-white dark:bg-card border border-gray-200 dark:border-border hover:bg-gray-50 dark:hover:bg-secondary',
                )}>
                  {city}
                </span>
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCity}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid gap-3 mt-3 lg:grid-cols-2"
            >
              {filteredHotels.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 dark:border-border bg-white dark:bg-card p-10 text-center">
                  <Search className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">ไม่พบโรงแรมในเมืองนี้</p>
                </div>
              ) : (
                filteredHotels.map((hotel: any, i: number) => (
                  <HotelCard key={hotel.id} hotel={hotel} index={i} />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Deals banner */}
        <div className="mt-5 rounded-2xl overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-white/70 uppercase tracking-wider mb-0.5">โปรโมชัน</p>
            <p className="font-bold text-white text-base leading-tight">ลดสูงสุด 30%</p>
            <p className="text-xs text-white/70 mt-0.5">เมื่อจองผ่านแอปวันนี้</p>
          </div>
          <Link href="/portal/coupons">
            <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm border border-white/30 px-3.5 py-2 rounded-xl text-white text-xs font-bold">
              ดูดีล <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
