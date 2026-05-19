'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, MapPin, Star, ChevronRight, Sparkles, X,
  QrCode, Loader2, Flame, ArrowRight, Key,
  UtensilsCrossed, BedDouble, MessageSquare, Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';

// ─── Hero slides ──────────────────────────────────────────────────────────────

const HERO_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=85',
    label: 'Bangkok',
    title: 'ค้นพบที่พักสุดหรู',
    sub: 'เลือกสรรประสบการณ์ที่ดีที่สุด',
  },
  {
    url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=85',
    label: 'Phuket',
    title: 'วันหยุดในฝัน',
    sub: 'รีสอร์ทและวิลล่าระดับโลก',
  },
  {
    url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=85',
    label: 'Koh Samui',
    title: 'ใกล้ชิดธรรมชาติ',
    sub: 'บังกะโลและโรงแรมบูทีคพิเศษ',
  },
];

// ─── Promo deals ──────────────────────────────────────────────────────────────

const DEALS = [
  {
    tag: '🔥 Hot Deal',
    tagBg: 'bg-rose-500',
    title: 'ลด 30%',
    sub: 'จองล่วงหน้า 7 วัน',
    img: 'https://images.unsplash.com/photo-1540541338537-1d4d1a4e5d08?auto=format&fit=crop&w=600&q=80',
  },
  {
    tag: '⚡ Flash Sale',
    tagBg: 'bg-amber-500',
    title: 'Superior ฿1,499',
    sub: 'รวมอาหารเช้า • เหลือน้อย',
    img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80',
  },
  {
    tag: '✨ Exclusive',
    tagBg: 'bg-violet-500',
    title: 'Spa ฟรี',
    sub: 'เมื่อจอง Suite วันนี้',
    img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80',
  },
];

// ─── Quick service actions ─────────────────────────────────────────────────────

const QUICK = [
  { icon: BedDouble,      label: 'ห้องพัก',   href: '/portal/trips',   color: 'from-amber-500 to-orange-500' },
  { icon: UtensilsCrossed,label: 'อาหาร',     href: '/portal/stay',    color: 'from-orange-500 to-red-500' },
  { icon: MessageSquare,  label: 'Concierge', href: '/portal/stay',    color: 'from-violet-500 to-purple-500' },
  { icon: Key,            label: 'กุญแจ',     href: '/portal/keys',    color: 'from-amber-600 to-yellow-500' },
  { icon: Receipt,        label: 'ค่าใช้จ่าย',href: '/portal/folio',   color: 'from-emerald-500 to-teal-500' },
  { icon: Sparkles,       label: 'สิทธิพิเศษ',href: '/portal/loyalty', color: 'from-sky-500 to-blue-500' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ease = [0.22, 1, 0.36, 1] as const;

function hotelRating(name: string) {
  const s = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (4.5 + (s % 5) * 0.1).toFixed(1);
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';

// ─── Search Dropdown ──────────────────────────────────────────────────────────

function SearchDropdown({ results, loading, query, onSelect }: {
  results: any[];
  loading: boolean;
  query: string;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease }}
      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border/60 rounded-2xl shadow-2xl overflow-hidden z-50"
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">กำลังค้นหา...</span>
        </div>
      ) : results.length === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          ไม่พบ "<span className="text-foreground font-medium">{query}</span>"
        </div>
      ) : (
        <div className="py-1.5">
          {results.map((h, i) => (
            <Link key={h.id} href={`/h/${h.slug || h.id}`} onClick={onSelect}>
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04, duration: 0.2 }}
                className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-secondary/70 transition-colors cursor-pointer"
              >
                <div className="relative h-12 w-16 rounded-xl overflow-hidden shrink-0">
                  <Image
                    src={h.hero_image_url || PLACEHOLDER}
                    alt={h.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{h.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{h.city}
                  </p>
                </div>
                {h.min_rate && (
                  <div className="shrink-0 text-right">
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      ฿{h.min_rate.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground">/คืน</p>
                  </div>
                )}
              </motion.div>
            </Link>
          ))}
          <div className="px-3.5 py-2 border-t border-border/40">
            <Link href={`/portal/home?q=${encodeURIComponent(query)}`} onClick={onSelect}
              className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              ดูผลลัพธ์ทั้งหมด <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Hotel Card ───────────────────────────────────────────────────────────────

function HotelCard({ hotel, index }: { hotel: any; index: number }) {
  const minRate = hotel.room_types?.length
    ? Math.min(...hotel.room_types.map((rt: any) => rt.base_rate).filter(Boolean))
    : null;
  const rating = hotelRating(hotel.name || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: index * 0.07, duration: 0.45, ease }}
    >
      <Link href={`/h/${hotel.slug || hotel.id}`}>
        <motion.div
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.985 }}
          transition={{ duration: 0.25, ease }}
          className="rounded-3xl overflow-hidden border border-border/50 bg-card shadow-md hover:shadow-xl hover:shadow-black/8 transition-shadow duration-300"
        >
          {/* Photo */}
          <div className="relative h-52 overflow-hidden">
            <Image
              src={hotel.hero_image_url || PLACEHOLDER}
              alt={hotel.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 640px"
            />
            {/* gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            {/* Rating */}
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-white">{rating}</span>
            </div>

            {/* Bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/55 font-medium mb-1">
                {hotel.city} · Thailand
              </p>
              <h3 className="font-display font-bold text-white text-lg leading-tight line-clamp-1">
                {hotel.name}
              </h3>
            </div>
          </div>

          {/* Info strip */}
          <div className="px-4 py-3.5 flex items-center justify-between">
            <div>
              {minRate && isFinite(minRate) ? (
                <>
                  <span className="text-xs text-muted-foreground">เริ่มต้น</span>
                  <span className="text-base font-bold text-amber-700 dark:text-amber-400 ml-1.5">
                    ฿{minRate.toLocaleString()}
                  </span>
                  <span className="text-xs text-muted-foreground">/คืน</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">ดูราคาและห้องพัก</span>
              )}
            </div>
            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 text-xs font-semibold">
              ดูรายละเอียด <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function HomeClient({ firstName, hotels, activeStay, loyaltyPoints }: {
  firstName: string;
  hotels: any[];
  activeStay: any | null;
  loyaltyPoints?: number;
}) {
  // Hero carousel
  const [heroIdx, setHeroIdx] = useState(0);
  const [heroKey, setHeroKey] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setHeroIdx(i => (i + 1) % HERO_SLIDES.length);
      setHeroKey(k => k + 1);
    }, 6000);
    return () => clearInterval(t);
  }, []);

  // Search autocomplete
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setSuggestions([]); setSearchLoading(false); return; }
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/search/hotels?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSuggestions(data.hotels ?? []);
    } catch { setSuggestions([]); }
    finally { setSearchLoading(false); }
  }, []);

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); setShowDropdown(false); return; }
    setShowDropdown(true);
    const t = setTimeout(() => fetchSuggestions(query), 280);
    return () => clearTimeout(t);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  // City filter
  const cities = ['ทั้งหมด', ...Array.from(new Set(hotels.map((h: any) => h.city).filter(Boolean)))];
  const [selectedCity, setSelectedCity] = useState('ทั้งหมด');

  const filteredHotels = selectedCity === 'ทั้งหมด'
    ? hotels
    : hotels.filter((h: any) => h.city === selectedCity);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
  const slide = HERO_SLIDES[heroIdx];

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-2xl border-b border-border/30">
        <div className="h-14 px-4 flex items-center justify-between max-w-screen-sm mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[10px] bg-gradient-to-br from-amber-500 to-[#C66A30] flex items-center justify-center shadow-sm">
              <span className="font-display font-bold text-white text-sm">M</span>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground">Private Journey</p>
              <p className="font-display font-bold text-[14px] text-foreground tracking-tight leading-none">Maitri Collection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loyaltyPoints != null && (
              <Link href="/portal/loyalty">
                <motion.div whileTap={{ scale: 0.93 }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors">
                  <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{loyaltyPoints.toLocaleString()}</span>
                </motion.div>
              </Link>
            )}
            <PortalThemeToggle />
          </div>
        </div>
      </div>

      {/* ── Hero ── */}
      <div className="relative h-[58vh] min-h-[340px] overflow-hidden">
        <AnimatePresence mode="sync">
          <motion.div
            key={heroIdx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <Image
              src={slide.url}
              alt={slide.label}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
          </motion.div>
        </AnimatePresence>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/20 to-transparent h-20" />

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-8 max-w-screen-sm mx-auto left-0 right-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={heroKey}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.6, ease }}
            >
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/50 font-medium mb-2">
                {greeting}{firstName ? `, ${firstName}` : ''} · {format(new Date(), 'd MMMM yyyy', { locale: th })}
              </p>
              <h1 className="font-display font-bold text-3xl text-white leading-tight">
                {slide.title}
              </h1>
              <p className="text-sm text-white/65 mt-1.5">{slide.sub}</p>
            </motion.div>
          </AnimatePresence>

          {/* Slide indicators */}
          <div className="flex items-center gap-1.5 mt-5">
            {HERO_SLIDES.map((_, i) => (
              <button key={i} onClick={() => setHeroIdx(i)}>
                <motion.div
                  animate={{ width: i === heroIdx ? 20 : 6, opacity: i === heroIdx ? 1 : 0.35 }}
                  transition={{ duration: 0.35, ease }}
                  className="h-1.5 rounded-full bg-white"
                />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Floating Search Card ── */}
      <div className="relative z-30 px-4 max-w-screen-sm mx-auto -mt-6">
        <div ref={searchRef} className="relative">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, ease }}
            className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/15 border border-border/50 overflow-visible"
          >
            <div className="flex items-center gap-3 px-4 py-3.5">
              {searchLoading ? (
                <Loader2 className="h-4.5 w-4.5 text-amber-600 dark:text-amber-400 shrink-0 animate-spin" />
              ) : (
                <Search className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
                placeholder="ค้นหาโรงแรม หรือ เมือง..."
                className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground/50 focus:outline-none text-foreground"
              />
              <AnimatePresence>
                {query && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.7 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.7 }}
                    onClick={() => { setQuery(''); setSuggestions([]); setShowDropdown(false); inputRef.current?.focus(); }}
                    className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center shrink-0"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </motion.button>
                )}
              </AnimatePresence>
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-[#C66A30] flex items-center justify-center shrink-0 shadow-sm">
                <Search className="h-3.5 w-3.5 text-white" />
              </div>
            </div>
          </motion.div>

          {/* Autocomplete dropdown */}
          <AnimatePresence>
            {showDropdown && query.trim().length >= 2 && (
              <SearchDropdown
                results={suggestions}
                loading={searchLoading}
                query={query}
                onSelect={() => { setShowDropdown(false); setQuery(''); }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="px-4 pb-32 max-w-screen-sm mx-auto space-y-7 mt-6">

        {/* ── Quick Services (only shown when no active stay) ── */}
        {!activeStay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45, ease }}
          >
            <div className="grid grid-cols-6 gap-2">
              {QUICK.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.label} href={item.href}>
                    <motion.div
                      whileTap={{ scale: 0.85 }}
                      className="flex flex-col items-center gap-1.5"
                    >
                      <div className={cn(
                        'h-12 w-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-sm',
                        item.color,
                      )}>
                        <Icon className="h-5 w-5 text-white" strokeWidth={1.8} />
                      </div>
                      <span className="text-[9px] font-medium text-muted-foreground text-center leading-tight">
                        {item.label}
                      </span>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Active stay card ── */}
        <AnimatePresence>
          {activeStay && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.4, ease }}
            >
              <Link href="/portal/stay">
                <motion.div
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="relative rounded-3xl overflow-hidden h-36 shadow-lg border border-amber-500/20"
                >
                  <Image
                    src={(activeStay.hotels as any)?.hero_image_url || PLACEHOLDER}
                    alt="" fill className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/88 via-black/55 to-black/10" />
                  <div className="absolute inset-0 p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-[0.2em]">กำลังเข้าพัก</span>
                      </div>
                      <p className="font-display font-bold text-white text-lg leading-tight">
                        {(activeStay.hotels as any)?.name}
                      </p>
                      <p className="text-xs text-white/60 mt-1 flex items-center gap-1.5">
                        ห้อง {(activeStay.rooms as any)?.room_number || '—'}
                        {activeStay.check_out && (
                          <>
                            <span className="opacity-40">·</span>
                            <span>ออก {format(parseISO(activeStay.check_out + 'T00:00:00'), 'd MMM', { locale: th })}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold">
                      บริการ <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── QR shortcut (no active stay) ── */}
        {!activeStay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4, ease }}
          >
            <Link href="/portal/scan">
              <motion.div
                whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20 px-4 py-3.5"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <QrCode className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">สแกน QR ในห้องพัก</p>
                  <p className="text-xs text-muted-foreground mt-0.5">เข้าถึง Room Service & Concierge ทันที</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* ── Deals ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.45, ease }}
        >
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-rose-500/15 flex items-center justify-center">
                <Flame className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <h2 className="font-display font-bold text-foreground text-base">ดีลพิเศษ</h2>
            </div>
            <button className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-0.5">
              ดูทั้งหมด <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex gap-3 -mx-4 px-4 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory">
            {DEALS.map((d, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.08, duration: 0.4, ease }}
                whileTap={{ scale: 0.96 }}
                className="relative rounded-2xl overflow-hidden h-36 w-44 shrink-0 snap-start cursor-pointer shadow-md"
              >
                <Image src={d.img} alt={d.title} fill className="object-cover" sizes="176px" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute inset-0 p-3 flex flex-col justify-between">
                  <span className={cn('self-start text-[9px] font-bold px-2 py-0.5 rounded-full text-white', d.tagBg)}>
                    {d.tag}
                  </span>
                  <div>
                    <p className="font-display font-bold text-white text-sm leading-tight">{d.title}</p>
                    <p className="text-[10px] text-white/60 mt-0.5">{d.sub}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Hotel Discovery ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-foreground text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              สำรวจที่พัก
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              {filteredHotels.length} แห่ง
            </span>
          </div>

          {/* City chips */}
          <div className="flex gap-2 -mx-4 px-4 overflow-x-auto pb-3 scrollbar-none">
            {cities.map((city) => (
              <motion.button
                key={city}
                onClick={() => setSelectedCity(city)}
                whileTap={{ scale: 0.92 }}
                className="relative shrink-0"
              >
                {selectedCity === city && (
                  <motion.div
                    layoutId="city-pill"
                    className="absolute inset-0 bg-amber-600 dark:bg-amber-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={cn(
                  'relative z-10 text-xs font-semibold px-4 py-1.5 rounded-full block transition-colors duration-200',
                  selectedCity === city
                    ? 'text-white'
                    : 'text-muted-foreground bg-secondary hover:bg-secondary/80',
                )}>
                  {city}
                </span>
              </motion.button>
            ))}
          </div>

          {/* Hotel list */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCity}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4 mt-4"
            >
              {filteredHotels.length === 0 ? (
                <div className="rounded-3xl border border-border bg-card p-10 text-center">
                  <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">ไม่พบโรงแรมในเมืองนี้</p>
                </div>
              ) : (
                filteredHotels.map((hotel: any, i: number) => (
                  <HotelCard key={hotel.id} hotel={hotel} index={i} />
                ))
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
