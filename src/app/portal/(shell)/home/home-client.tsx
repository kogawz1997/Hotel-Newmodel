'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Star, ChevronRight, X,
  QrCode, Loader2, ArrowLeft, BedDouble,
  Calendar, Users, Car, Plane, Train, Bot, Zap, Clock,
  Tag, Heart, History, Trash2, Home as HomeIcon,
  Navigation, ChevronDown, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addDays, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';

const ease = [0.22, 1, 0.36, 1] as const;
const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

// ─── Service rows ─────────────────────────────────────────────────────────────

const ROW1 = [
  { icon: BedDouble, label: 'ที่พัก',       href: '/search', active: true  },
  { icon: Plane,     label: 'เที่ยวบิน',    href: '#',       active: false },
  { icon: BedDouble, label: 'เที่ยวบิน\n+โรงแรม', href: '#', active: false, twoLine: true },
  { icon: Train,     label: 'รถไฟ',         href: '#',       active: false },
];

const ROW2 = [
  { icon: HomeIcon,   label: 'บ้านและ\nอพาร์ทเมนท์' },
  { icon: Tag,        label: 'ทัวร์และตั๋ว\nท่องเที่ยว' },
  { icon: Car,        label: 'รถเช่า' },
  { icon: Navigation, label: 'บริการรับส่ง\nสนามบิน' },
  { icon: ChevronDown,label: 'อื่นๆ +7' },
];

const QUICK_ROW = [
  { icon: Zap,      label: 'ดีล',           href: '/portal/coupons',   color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/20' },
  { icon: Star,     label: 'อิเวนต์',       href: '#',                 color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { icon: Calendar, label: 'แผนการเดินทาง', href: '/portal/itinerary', color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { icon: Zap,      label: 'Trip.Pulse',    href: '#',                 color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { icon: Clock,    label: 'ล่าสุด',        href: '#',                 color: 'text-gray-500',   bg: 'bg-gray-100 dark:bg-gray-800' },
];

const CITIES_GRID = [
  { name: 'ใกล้ฉัน',  location: true  },
  { name: 'เชียงใหม่', location: false },
  { name: 'กรุงเทพฯ',  location: false },
  { name: 'ภูเก็ต',   location: false },
  { name: 'พัทยา',    location: false },
  { name: 'หัวหิน',   location: false },
];

const SUGGESTED_HOTELS = [
  'โรงแรม 5 ดาว กรุงเทพฯ',
  'ที่พักริมหาด ภูเก็ต',
  'รีสอร์ทเชียงใหม่',
  'บูติกโฮเทล อิมแพ็คท์',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function hotelRating(name: string) {
  const s = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (7.5 + (s % 20) * 0.1).toFixed(1);
}

// ─── Search Overlay ───────────────────────────────────────────────────────────

function SearchOverlay({
  onClose,
  onSearch,
}: {
  onClose: () => void;
  onSearch: (p: { city: string; checkIn: string; checkOut: string; adults: number }) => void;
}) {
  const [q, setQ]                   = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [recentSearches, setRecent] = useState<string[]>([]);
  const [checkIn, setCheckIn]  = useState(() => format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(() => format(addDays(new Date(), 2), 'yyyy-MM-dd'));
  const [adults, setAdults]    = useState(2);
  const [rooms, setRooms]      = useState(1);
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

  function clearRecent() {
    setRecent([]);
    try { localStorage.removeItem('maitri_recent_searches'); } catch {}
  }

  function removeRecent(i: number) {
    const next = recentSearches.filter((_, j) => j !== i);
    setRecent(next);
    try { localStorage.setItem('maitri_recent_searches', JSON.stringify(next)); } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-50 bg-white dark:bg-background flex flex-col"
    >
      {/* ── Search header (white bg, Trip.com style) ── */}
      <div className="bg-white dark:bg-background border-b border-gray-100 dark:border-border/40 px-4 py-2 flex items-center gap-2 shrink-0">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="h-9 w-9 flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="h-5 w-5 text-gray-700 dark:text-foreground" />
        </motion.button>
        <div className="flex-1 flex items-center bg-gray-100 dark:bg-secondary rounded-xl h-10 px-3 gap-2">
          <Bot className="h-4 w-4 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && q.trim()) doSearch(); }}
            placeholder="ค้นหาโรงแรม, เมือง..."
            className="flex-1 bg-transparent text-sm text-gray-900 dark:text-foreground placeholder:text-gray-400 focus:outline-none"
          />
          {loading
            ? <Loader2 className="h-4 w-4 text-blue-600 shrink-0 animate-spin" />
            : q && (
              <button onClick={() => setQ('')} className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center shrink-0">
                <X className="h-3 w-3 text-gray-600" />
              </button>
            )
          }
        </div>
        <button
          onClick={() => doSearch()}
          className="text-sm font-semibold text-blue-600 shrink-0 px-1"
        >
          ค้นหา
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div className="flex-1 overflow-y-auto bg-white dark:bg-background">

        {/* Autocomplete when typing */}
        {q.trim().length >= 2 ? (
          <div className="py-1">
            {loading ? (
              <div className="flex items-center gap-2 px-4 py-5 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">กำลังค้นหา...</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-400">ไม่พบ &ldquo;{q}&rdquo;</p>
                <button onClick={() => doSearch()}
                  className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">
                  ค้นหาต่อ
                </button>
              </div>
            ) : (
              suggestions.map(h => (
                <button
                  key={h.id}
                  onClick={() => doSearch(h.city || h.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-secondary text-left"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <BedDouble className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-foreground line-clamp-1">{h.name}</p>
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
            {/* ── Recent searches ── */}
            {recentSearches.length > 0 && (
              <div className="px-4 pt-5 pb-3">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-800 dark:text-foreground">การค้นหาล่าสุด</p>
                  <button onClick={clearRecent}>
                    <Trash2 className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                  </button>
                </div>
                <div className="space-y-0">
                  {recentSearches.map((s, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-border/30 last:border-0">
                      <button
                        onClick={() => doSearch(s)}
                        className="flex items-center gap-3 flex-1 text-left min-w-0"
                      >
                        <History className="h-4 w-4 text-gray-300 shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-foreground truncate">{s}</span>
                      </button>
                      <button
                        onClick={() => removeRecent(i)}
                        className="shrink-0 p-1 ml-2"
                      >
                        <X className="h-3.5 w-3.5 text-gray-300 hover:text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Recommended cities (3×2 text grid) ── */}
            <div className="px-4 pt-3 pb-3">
              <p className="text-sm font-bold text-gray-800 dark:text-foreground mb-3">เมืองแนะนำ</p>
              <div className="grid grid-cols-3 gap-2">
                {CITIES_GRID.map(city => (
                  <button
                    key={city.name}
                    onClick={() => doSearch(city.name === 'ใกล้ฉัน' ? '' : city.name)}
                    className="flex items-center justify-center gap-1.5 h-10 rounded-lg border border-gray-200 dark:border-border/60 bg-white dark:bg-card text-sm text-gray-700 dark:text-foreground hover:bg-gray-50 dark:hover:bg-secondary transition-colors font-medium"
                  >
                    {city.location && <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                    <span className="truncate">{city.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ── TripGenie / AI banner ── */}
            <div className="mx-4 mt-1 mb-3">
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 rounded-xl px-4 py-3">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 dark:text-foreground leading-snug">
                    สวัสดี ฉันคือ <strong>MaitriGenie</strong> ลองใช้การค้นหาอัจฉริยะเพื่อรับแรงบันดาลใจใหม่ๆ!
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-blue-400 shrink-0" />
              </div>
            </div>

            {/* ── Suggested searches ── */}
            <div className="px-4 pb-4">
              <p className="text-sm font-bold text-gray-800 dark:text-foreground mb-2">การค้นหาแนะนำ</p>
              {SUGGESTED_HOTELS.map(dest => (
                <button
                  key={dest}
                  onClick={() => doSearch(dest)}
                  className="w-full flex items-center gap-3 py-3 border-b border-gray-100 dark:border-border/30 last:border-0 text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <BedDouble className="h-4 w-4 text-blue-600" />
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
      <div className="border-t border-gray-100 dark:border-border/40 bg-white dark:bg-card px-4 pt-3 pb-6 space-y-2.5 shrink-0">
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
              <p className="text-xs font-semibold text-gray-800 dark:text-foreground">{rooms} ห้อง · {adults} คน</p>
            </div>
          </button>
        </div>

        <AnimatePresence>
          {showDates && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
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
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-2 pt-1">
                {([
                  { label: 'ห้องพัก', value: rooms, min: 1, set: setRooms },
                  { label: 'ผู้ใหญ่',  value: adults, min: 1, set: setAdults },
                ] as const).map(({ label, value, min, set }) => (
                  <div key={label} className="flex items-center justify-between px-1">
                    <span className="text-sm text-gray-800 dark:text-foreground font-medium">{label}</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => (set as any)(Math.max(min, value - 1))} disabled={value <= min}
                        className="h-8 w-8 rounded-full border border-gray-200 dark:border-border flex items-center justify-center disabled:opacity-30">
                        <span className="text-lg text-gray-700 leading-none">−</span>
                      </button>
                      <span className="text-sm font-bold text-gray-900 dark:text-foreground w-5 text-center">{value}</span>
                      <button onClick={() => (set as any)(value + 1)}
                        className="h-8 w-8 rounded-full border border-blue-200 bg-blue-50 flex items-center justify-center">
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

// ─── Hotel Card (Trip.com horizontal style for "recent") ─────────────────────

function RecentHotelCard({ hotel }: { hotel: any }) {
  const minRate = hotel.room_types?.length
    ? Math.min(...hotel.room_types.map((rt: any) => rt.base_rate).filter(Boolean))
    : hotel.min_rate ?? null;
  const rating = hotelRating(hotel.name || '');

  return (
    <Link href={`/h/${hotel.slug || hotel.id}`}>
      <motion.div whileTap={{ scale: 0.985 }}
        className="flex items-center gap-3 py-3 border-b border-gray-100 dark:border-border/30 last:border-0">
        <div className="relative h-16 w-20 rounded-xl overflow-hidden shrink-0">
          <Image src={hotel.hero_image_url || PLACEHOLDER} alt={hotel.name}
            fill className="object-cover" sizes="80px" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-foreground line-clamp-1">{hotel.name}</p>
          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 shrink-0" />{hotel.city}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded">{rating}</span>
            {minRate && isFinite(minRate) && (
              <span className="text-xs text-orange-500 font-bold">฿{(minRate as number).toLocaleString()}</span>
            )}
          </div>
        </div>
        <Heart className="h-4 w-4 text-gray-300 shrink-0" />
      </motion.div>
    </Link>
  );
}

// ─── Hotel Card (Explore grid) ────────────────────────────────────────────────

function ExploreCard({ hotel, index }: { hotel: any; index: number }) {
  const minRate = hotel.room_types?.length
    ? Math.min(...hotel.room_types.map((rt: any) => rt.base_rate).filter(Boolean))
    : hotel.min_rate ?? null;
  const rating = hotelRating(hotel.name || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.05, duration: 0.35, ease }}
    >
      <Link href={`/h/${hotel.slug || hotel.id}`}>
        <motion.div whileTap={{ scale: 0.97 }}
          className="rounded-2xl overflow-hidden border border-gray-100 dark:border-border/60 bg-white dark:bg-card shadow-sm">
          <div className="relative h-36 overflow-hidden">
            <Image src={hotel.hero_image_url || PLACEHOLDER} alt={hotel.name}
              fill className="object-cover" sizes="(max-width: 640px) 50vw, 300px" />
            <button className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center">
              <Heart className="h-3.5 w-3.5 text-gray-400" />
            </button>
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
              <span className="text-[10px] font-bold text-white">{rating}</span>
              <span className="text-[9px] text-white/70">/10</span>
            </div>
          </div>
          <div className="p-2.5">
            <p className="text-xs font-bold text-gray-900 dark:text-foreground line-clamp-1 mb-0.5">{hotel.name}</p>
            <p className="text-[10px] text-gray-400 flex items-center gap-0.5">
              <MapPin className="h-2.5 w-2.5 shrink-0" />{hotel.city}
            </p>
            {minRate && isFinite(minRate) ? (
              <p className="text-xs font-bold text-orange-500 mt-1">
                ฿{(minRate as number).toLocaleString()}<span className="text-[10px] font-normal text-gray-400">/คืน</span>
              </p>
            ) : (
              <p className="text-[10px] text-blue-600 mt-1">ดูราคา →</p>
            )}
          </div>
        </motion.div>
      </Link>
    </motion.div>
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
  const [selectedCity, setSelectedCity] = useState('ทั้งหมด');

  const dbCities = Array.from(new Set(hotels.map((h: any) => h.city).filter(Boolean)));
  const allCities = ['ทั้งหมด', ...dbCities];
  const filteredHotels = selectedCity === 'ทั้งหมด' ? hotels : hotels.filter((h: any) => h.city === selectedCity);

  // City chips shown in header: DB cities + popular Thai cities
  const headerCities = Array.from(new Set([...dbCities, 'กรุงเทพฯ', 'ภูเก็ต', 'เชียงใหม่', 'พัทยา'])).slice(0, 6);

  function handleSearch(params: { city: string; checkIn: string; checkOut: string; adults: number }) {
    const p = new URLSearchParams({
      city: params.city, checkIn: params.checkIn, checkOut: params.checkOut, adults: String(params.adults),
    });
    router.push(`/search?${p}`);
    setShowSearch(false);
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background">

      {/* ── Search Overlay ── */}
      <AnimatePresence>
        {showSearch && (
          <SearchOverlay onClose={() => setShowSearch(false)} onSearch={handleSearch} />
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════════
          TOP SECTION — white bg, Trip.com style
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-background">

        {/* Header row */}
        <div className="px-4 pt-4 h-14 flex items-center justify-between">
          {/* Brand logo */}
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-[10px] bg-gradient-to-br from-amber-500 to-[#C66A30] flex items-center justify-center shadow-sm shrink-0">
              <span className="font-bold text-white text-sm">M</span>
            </div>
            <div>
              <p className="font-black text-blue-600 dark:text-blue-400 text-lg leading-none tracking-tight">
                Maitri<span className="text-amber-500">.</span>
              </p>
            </div>
          </div>
          {/* Right: loyalty tier + coins */}
          <div className="flex items-center gap-2">
            {loyaltyPoints != null && loyaltyPoints > 0 && (
              <Link href="/portal/loyalty">
                <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800/40">
                  <div className="h-3.5 w-3.5 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                    <span className="text-[7px] font-bold text-white">T</span>
                  </div>
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{loyaltyPoints.toLocaleString()}</span>
                </div>
              </Link>
            )}
            <Link href="/portal/account">
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400 text-sm font-bold shrink-0">
                {firstName ? firstName.charAt(0).toUpperCase() : 'G'}
              </div>
            </Link>
          </div>
        </div>

        {/* ── Service Icon Row 1: 4 large ── */}
        <div className="px-4 mt-3 grid grid-cols-4 gap-1">
          {ROW1.map((item, idx) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <Link key={idx} href={item.href}
                className={cn(!isActive && 'pointer-events-none')}>
                <motion.div whileTap={isActive ? { scale: 0.88 } : {}}
                  className="flex flex-col items-center gap-1.5 py-1 relative">
                  <div className={cn(
                    'h-[60px] w-[60px] rounded-2xl flex items-center justify-center',
                    isActive
                      ? 'bg-blue-600'
                      : 'bg-gray-100 dark:bg-secondary',
                  )}>
                    <Icon className={cn(
                      'h-7 w-7',
                      isActive ? 'text-white' : 'text-gray-400 dark:text-muted-foreground',
                    )} strokeWidth={1.8} />
                  </div>
                  <span className={cn(
                    'text-[10px] font-medium text-center leading-tight',
                    isActive ? 'text-gray-900 dark:text-foreground' : 'text-gray-400 dark:text-muted-foreground',
                  )}>
                    {item.label.includes('\n')
                      ? item.label.split('\n').map((l, i) => <span key={i} className="block">{l}</span>)
                      : item.label}
                  </span>
                  {isActive && (
                    <span className="absolute -bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-400" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>

        {/* ── Service Icon Row 2: 5 smaller ── */}
        <div className="px-4 mt-4 grid grid-cols-5 gap-1">
          {ROW2.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div key={idx} className="opacity-40 pointer-events-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-secondary flex items-center justify-center">
                    <Icon className="h-5 w-5 text-gray-500 dark:text-muted-foreground" strokeWidth={1.7} />
                  </div>
                  <span className="text-[9px] text-gray-500 dark:text-muted-foreground font-medium text-center leading-tight line-clamp-2 px-0.5">
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Search bar ── */}
        <div className="px-4 mt-5">
          <motion.button
            whileTap={{ scale: 0.99 }}
            onClick={() => setShowSearch(true)}
            className="w-full bg-white dark:bg-card border-2 border-blue-600 dark:border-blue-500 rounded-full h-12 flex items-center px-2 gap-2 shadow-sm"
          >
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <span className="flex-1 text-sm text-gray-400 dark:text-muted-foreground text-left">ค้นหาโรงแรม, เมือง...</span>
            <div className="h-8 px-4 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">ค้นหา</span>
            </div>
          </motion.button>
        </div>

        {/* ── City chips ── */}
        <div className="flex items-center gap-0 mt-3 pb-3">
          <div className="flex gap-2 px-4 overflow-x-auto [scrollbar-width:none] flex-1">
            {headerCities.map(city => (
              <motion.button
                key={city}
                whileTap={{ scale: 0.92 }}
                onClick={() => { setSelectedCity(city); }}
                className={cn(
                  'shrink-0 px-3.5 py-1.5 rounded-full border text-xs font-medium whitespace-nowrap transition-colors',
                  selectedCity === city
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-card text-gray-600 dark:text-muted-foreground border-gray-200 dark:border-border/60 hover:bg-gray-50',
                )}
              >
                {city}
              </motion.button>
            ))}
          </div>
          <button className="shrink-0 flex items-center gap-1 pr-4 text-xs text-blue-600 dark:text-blue-400 font-medium">
            <MapPin className="h-3.5 w-3.5" /> แผนที่
          </button>
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-2 bg-gray-100 dark:bg-secondary/30" />

      {/* ══════════════════════════════════════════════════════════════════════
          QUICK ACTIONS ROW
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-background px-4 py-3.5">
        <div className="flex gap-5 overflow-x-auto [scrollbar-width:none] max-w-screen-sm mx-auto lg:max-w-2xl">
          {QUICK_ROW.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.label} href={item.href}>
                <motion.div whileTap={{ scale: 0.85 }} className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={cn('h-12 w-12 rounded-full flex items-center justify-center', item.bg)}>
                    <Icon className={cn('h-5 w-5', item.color)} strokeWidth={1.8} />
                  </div>
                  <span className="text-[10px] font-medium text-gray-600 dark:text-muted-foreground text-center whitespace-nowrap">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Divider ── */}
      <div className="h-2 bg-gray-100 dark:bg-secondary/30" />

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-white dark:bg-background max-w-screen-sm mx-auto lg:max-w-2xl">

        {/* Active stay card */}
        {activeStay && (
          <div className="px-4 pt-4">
            <Link href="/portal/stay">
              <motion.div whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50 dark:bg-emerald-900/10 p-3.5">
                <div className="relative h-14 w-14 rounded-xl overflow-hidden shrink-0">
                  <Image src={(activeStay.hotels as any)?.hero_image_url || PLACEHOLDER} alt="" fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider">กำลังเข้าพัก</span>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-foreground text-sm truncate">{(activeStay.hotels as any)?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    ห้อง {(activeStay.rooms as any)?.room_number || '—'}
                    {activeStay.check_out && <> · ออก {format(parseISO(activeStay.check_out + 'T00:00:00'), 'd MMM', { locale: th })}</>}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-emerald-500 shrink-0" />
              </motion.div>
            </Link>
          </div>
        )}

        {/* QR scan card (no active stay) */}
        {!activeStay && (
          <div className="px-4 pt-4">
            <Link href="/portal/scan">
              <motion.div whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3.5 rounded-2xl bg-gray-50 dark:bg-secondary/40 border border-gray-100 dark:border-border/40 px-4 py-3.5">
                <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-foreground">สแกน QR ในห้องพัก</p>
                  <p className="text-xs text-gray-400 mt-0.5">เข้าถึง Room Service & Concierge ทันที</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </motion.div>
            </Link>
          </div>
        )}

        {/* ── กิจกรรมล่าสุดของคุณ (Recent activity — first 3 hotels) ── */}
        {hotels.length > 0 && (
          <div className="px-4 pt-5">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-gray-900 dark:text-foreground text-sm">กิจกรรมล่าสุดของคุณ</p>
              <button>
                <Trash2 className="h-4 w-4 text-gray-300 hover:text-gray-500 transition-colors" />
              </button>
            </div>
            <div>
              {hotels.slice(0, 3).map(hotel => (
                <RecentHotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </div>
        )}

        {/* ── Divider ── */}
        {hotels.length > 0 && <div className="h-2 bg-gray-100 dark:bg-secondary/30 mt-4" />}

        {/* ── สำรวจ section ── */}
        <div className="px-4 pt-4 pb-28">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 dark:text-foreground text-sm">สำรวจ</p>
              <span className="h-2 w-2 rounded-full bg-orange-400" />
              <p className="text-sm text-gray-500 dark:text-muted-foreground">
                {selectedCity === 'ทั้งหมด' ? 'ที่พักแนะนำ' : selectedCity}
              </p>
            </div>
            <Link href="/search" className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
              ดูทั้งหมด
            </Link>
          </div>

          {/* City filter chips for explore */}
          <div className="flex gap-2 -mx-4 px-4 overflow-x-auto pb-3 [scrollbar-width:none]">
            {allCities.slice(0, 6).map(city => (
              <motion.button key={city} onClick={() => setSelectedCity(city)} whileTap={{ scale: 0.92 }} className="relative shrink-0">
                {selectedCity === city && (
                  <motion.div layoutId="explore-pill" className="absolute inset-0 bg-blue-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <span className={cn(
                  'relative z-10 text-xs font-semibold px-3.5 py-1.5 rounded-full block transition-colors duration-200',
                  selectedCity === city
                    ? 'text-white'
                    : 'text-gray-500 bg-gray-100 dark:bg-secondary dark:text-muted-foreground hover:bg-gray-200',
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
              transition={{ duration: 0.15 }}
              className="grid grid-cols-2 gap-3 mt-1"
            >
              {filteredHotels.length === 0 ? (
                <div className="col-span-2 py-12 text-center">
                  <Search className="h-8 w-8 text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">ไม่พบโรงแรมในเมืองนี้</p>
                </div>
              ) : (
                filteredHotels.map((hotel: any, i: number) => (
                  <ExploreCard key={hotel.id} hotel={hotel} index={i} />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
