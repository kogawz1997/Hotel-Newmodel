'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Search, MapPin, Star, ChevronRight, Sparkles, Flame, Tag,
  QrCode, BedDouble, Waves, UtensilsCrossed, Heart, Compass,
  CalendarDays, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80&fit=crop';

const PROMOS = [
  {
    label: 'แพ็กเกจพิเศษ',
    title: 'ลดสูงสุด 30%',
    sub: 'จองล่วงหน้า 7 วัน',
    img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80&fit=crop',
    badge: 'Hot Deal',
    badgeColor: 'bg-rose-500',
  },
  {
    label: 'วันหยุดนี้',
    title: 'ห้อง Superior\n฿1,499/คืน',
    sub: 'รวมอาหารเช้า',
    img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80&fit=crop',
    badge: 'เหลือน้อย',
    badgeColor: 'bg-amber-500',
  },
  {
    label: 'สปาสุดหรู',
    title: 'นวดฟรี\nเมื่อจอง Suite',
    sub: 'มูลค่า ฿800',
    img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80&fit=crop',
    badge: 'จำกัด',
    badgeColor: 'bg-violet-500',
  },
];

const CATEGORIES = [
  { icon: BedDouble,      label: 'ที่พัก',    href: '/portal/trips',    iconBg: 'bg-amber-500/15 dark:bg-amber-400/10',   iconColor: 'text-amber-700 dark:text-amber-300' },
  { icon: Waves,          label: 'สปา',       href: '/portal/stay',     iconBg: 'bg-sky-500/15 dark:bg-sky-400/10',       iconColor: 'text-sky-700 dark:text-sky-300' },
  { icon: UtensilsCrossed,label: 'ห้องอาหาร', href: '/portal/stay',     iconBg: 'bg-orange-500/15 dark:bg-orange-400/10', iconColor: 'text-orange-700 dark:text-orange-300' },
  { icon: Sparkles,       label: 'บริการ',    href: '/portal/stay',     iconBg: 'bg-violet-500/15 dark:bg-violet-400/10', iconColor: 'text-violet-700 dark:text-violet-300' },
  { icon: Heart,          label: 'บันทึกไว้', href: '/portal/wishlist', iconBg: 'bg-rose-500/15 dark:bg-rose-400/10',     iconColor: 'text-rose-700 dark:text-rose-300' },
  { icon: Compass,        label: 'สำรวจ',     href: '/portal/trips',    iconBg: 'bg-emerald-500/15 dark:bg-emerald-400/10', iconColor: 'text-emerald-700 dark:text-emerald-300' },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const v = {
  hidden: { opacity: 0, y: 16 },
  show:   (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.4, ease } }),
};

export function HomeClient({ firstName, hotels, activeStay, loyaltyPoints }: {
  firstName: string; hotels: any[]; activeStay: any | null; loyaltyPoints?: number;
}) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? hotels.filter(h =>
        h.name?.toLowerCase().includes(query.toLowerCase()) ||
        h.city?.toLowerCase().includes(query.toLowerCase()),
      )
    : hotels;

  const byCity = filtered.reduce<Record<string, any[]>>((acc, h) => {
    const city = h.city || 'อื่นๆ';
    if (!acc[city]) acc[city] = [];
    acc[city].push(h);
    return acc;
  }, {});

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';
  const dateStr  = format(new Date(), 'EEEE d MMMM', { locale: th });

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[10px] bg-gradient-to-br from-amber-500 to-[#C66A30] flex items-center justify-center shadow-md shadow-amber-500/30">
              <span className="font-display font-bold text-white text-sm leading-none">M</span>
            </div>
            <div className="leading-none">
              <p className="text-[8px] uppercase tracking-[0.35em] text-muted-foreground font-medium">Private Journey</p>
              <p className="font-display font-bold text-[15px] text-foreground tracking-tight">Maitri Collection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loyaltyPoints != null && (
              <Link href="/portal/account">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/15 transition-colors">
                  <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">{loyaltyPoints.toLocaleString()}</span>
                </div>
              </Link>
            )}
            <PortalThemeToggle />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 pt-5 pb-8 max-w-screen-sm mx-auto">

        {/* ── Greeting ── */}
        <motion.div custom={0} variants={v} initial="hidden" animate="show">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />{dateStr}
          </p>
          <h1 className="font-display text-2xl font-bold text-foreground mt-1 tracking-tight">
            {greeting}{firstName ? `, ${firstName}` : ''} <span className="text-amber-500">✦</span>
          </h1>
        </motion.div>

        {/* ── Categories ── */}
        <motion.div custom={1} variants={v} initial="hidden" animate="show">
          <div className="grid grid-cols-6 gap-1">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <Link key={cat.label} href={cat.href}>
                  <motion.div whileTap={{ scale: 0.88 }} className="flex flex-col items-center gap-1.5 py-1">
                    <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center transition-all', cat.iconBg)}>
                      <Icon className={cn('h-5 w-5', cat.iconColor)} strokeWidth={1.7} />
                    </div>
                    <span className="text-[10px] font-medium text-muted-foreground text-center leading-tight">{cat.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* ── Active stay card ── */}
        <AnimatePresence>
          {activeStay && (
            <motion.div custom={2} variants={v} initial="hidden" animate="show">
              <Link href="/portal/stay">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  className="relative rounded-3xl overflow-hidden h-32 shadow-lg">
                  <Image
                    src={(activeStay.hotels as any)?.hero_image_url || PLACEHOLDER}
                    alt="" fill className="object-cover"
                  />
                  {/* multi-stop gradient for readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/10" />
                  <div className="absolute inset-0 p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                        </span>
                        <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-[0.2em]">กำลังเข้าพัก</span>
                      </div>
                      <p className="font-display font-bold text-white text-base leading-tight">
                        {(activeStay.hotels as any)?.name}
                      </p>
                      <p className="text-xs text-white/65 mt-1 flex items-center gap-1.5">
                        <span>ห้อง {(activeStay.rooms as any)?.room_number || '—'}</span>
                        {activeStay.check_out && (
                          <>
                            <span className="opacity-40">·</span>
                            <span>ออก {format(parseISO(activeStay.check_out + 'T00:00:00'), 'd MMM', { locale: th })}</span>
                          </>
                        )}
                      </p>
                    </div>
                    <div className="shrink-0">
                      <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-semibold">
                        บริการ <ChevronRight className="h-3.5 w-3.5 -mr-0.5" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Search ── */}
        <motion.div custom={3} variants={v} initial="hidden" animate="show">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="ค้นหาโรงแรม หรือ เมือง..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-card border border-border/60 rounded-2xl text-sm
                placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-500/25
                focus:border-amber-500/50 transition-all shadow-sm"
            />
          </div>
        </motion.div>

        {/* ── QR scan shortcut ── */}
        <AnimatePresence>
          {!activeStay && !query && (
            <motion.div custom={4} variants={v} initial="hidden" animate="show" exit={{ opacity: 0, height: 0 }}>
              <Link href="/portal/scan">
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-3.5 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/8 via-amber-500/5 to-transparent px-4 py-3.5 shadow-sm">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <QrCode className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">สแกน QR ในห้องพัก</p>
                    <p className="text-xs text-muted-foreground mt-0.5">รับบริการ Room Service & Concierge ทันที</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Promo banners ── */}
        <AnimatePresence>
          {!query && (
            <motion.div custom={5} variants={v} initial="hidden" animate="show">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-rose-500/15 flex items-center justify-center">
                  <Flame className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
                </div>
                <h2 className="font-display font-bold text-foreground">ดีลและโปรโมชั่น</h2>
              </div>

              {/* Hero promo */}
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="relative rounded-3xl overflow-hidden h-44 shadow-md mb-2.5 cursor-pointer">
                <Image src={PROMOS[0].img} alt={PROMOS[0].title} fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-br from-black/75 via-black/45 to-transparent" />
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <span className={cn('self-start text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-sm', PROMOS[0].badgeColor)}>
                    {PROMOS[0].badge}
                  </span>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-white/60 font-medium mb-1">{PROMOS[0].label}</p>
                    <p className="font-display font-bold text-white text-xl leading-tight whitespace-pre-line">{PROMOS[0].title}</p>
                    <p className="text-xs text-white/70 mt-1">{PROMOS[0].sub}</p>
                  </div>
                </div>
              </motion.div>

              {/* Two smaller promos */}
              <div className="grid grid-cols-2 gap-2.5">
                {PROMOS.slice(1).map((p, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                    className="relative rounded-2xl overflow-hidden h-36 shadow-sm cursor-pointer">
                    <Image src={p.img} alt={p.title} fill className="object-cover" sizes="50vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    <div className="absolute inset-0 p-3 flex flex-col justify-between">
                      <span className={cn('self-start text-[9px] font-bold px-2 py-0.5 rounded-full text-white', p.badgeColor)}>
                        {p.badge}
                      </span>
                      <div>
                        <p className="font-display font-bold text-white text-sm leading-tight whitespace-pre-line">{p.title}</p>
                        <p className="text-[10px] text-white/65 mt-0.5">{p.sub}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Hotel discovery ── */}
        <motion.div custom={6} variants={v} initial="hidden" animate="show">
          {Object.keys(byCity).length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
              <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground text-sm font-medium">ไม่พบโรงแรมที่ค้นหา</p>
              <p className="text-xs text-muted-foreground/60 mt-1">ลองค้นหาด้วยชื่อเมืองหรือโรงแรม</p>
            </div>
          ) : (
            <div className="space-y-7">
              {Object.entries(byCity).map(([city, cityHotels]) => (
                <div key={city}>
                  <div className="flex items-center justify-between mb-3.5">
                    <h2 className="font-display font-bold text-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      {city}
                    </h2>
                    <span className="text-xs text-muted-foreground bg-secondary px-2.5 py-1 rounded-full font-medium">
                      {cityHotels.length} แห่ง
                    </span>
                  </div>
                  <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none snap-x snap-mandatory">
                    {cityHotels.map((hotel, i) => {
                      const minRate = hotel.room_types?.length
                        ? Math.min(...hotel.room_types.map((rt: any) => rt.base_rate || Infinity))
                        : null;
                      return (
                        <motion.div key={hotel.id} custom={i} variants={v} initial="hidden" animate="show"
                          className="flex-shrink-0 snap-start w-48">
                          <Link href={`/h/${hotel.slug || hotel.id}`}>
                            <motion.div whileHover={{ y: -4 }} whileTap={{ scale: 0.97 }}
                              className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
                              <div className="relative h-32">
                                <Image
                                  src={hotel.hero_image_url || PLACEHOLDER}
                                  alt={hotel.name} fill
                                  className="object-cover" sizes="192px"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                {/* Rating badge */}
                                <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm">
                                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                                  <span className="text-[10px] font-bold text-white">4.8</span>
                                </div>
                                {/* City badge */}
                                <div className="absolute bottom-2 left-2 flex items-center gap-1">
                                  <MapPin className="h-2.5 w-2.5 text-white/70" />
                                  <span className="text-[9px] text-white/70">{hotel.city}</span>
                                </div>
                              </div>
                              <div className="p-3">
                                <p className="text-xs font-bold text-foreground line-clamp-1 leading-snug">{hotel.name}</p>
                                {minRate && isFinite(minRate) ? (
                                  <p className="text-[10px] text-muted-foreground mt-1">
                                    เริ่ม <span className="font-bold text-amber-700 dark:text-amber-400">฿{minRate.toLocaleString()}</span>
                                    <span className="text-muted-foreground/60">/คืน</span>
                                  </p>
                                ) : (
                                  <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-medium">จองได้เลย →</p>
                                )}
                              </div>
                            </motion.div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}
