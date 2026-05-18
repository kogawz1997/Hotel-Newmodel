'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Search, MapPin, Star, ChevronRight, Sparkles, Flame, Tag, QrCode, BedDouble, Waves, UtensilsCrossed, Heart, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=75&fit=crop';

const PROMOS = [
  { label: 'แพ็กเกจพิเศษ', title: 'ลดสูงสุด 30%\nจองวันนี้', sub: 'จองล่วงหน้า 7 วัน', bg: 'from-amber-900 to-amber-700', img: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=75&fit=crop', badge: 'ดีลพิเศษ' },
  { label: 'วันหยุดนี้', title: 'ห้อง Superior\nเพียง ฿1,499', sub: 'รวมอาหารเช้า', bg: 'from-stone-900 to-stone-700', img: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=75&fit=crop', badge: 'เหลือน้อย' },
  { label: 'สปาสุดหรู', title: 'นวดฟรี\nเมื่อจอง Suite', sub: 'มูลค่า ฿800', bg: 'from-emerald-950 to-emerald-800', img: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600&q=75&fit=crop', badge: 'จำกัด' },
];

const CATEGORIES = [
  { icon: BedDouble,      label: 'ที่พัก',     href: '/portal/home',     color: 'bg-amber-500/12 text-amber-700 dark:text-amber-400' },
  { icon: Waves,          label: 'สปา',        href: '/portal/services', color: 'bg-sky-500/12 text-sky-600 dark:text-sky-400' },
  { icon: UtensilsCrossed,label: 'ห้องอาหาร',  href: '/portal/services', color: 'bg-orange-500/12 text-orange-600 dark:text-orange-400' },
  { icon: Sparkles,       label: 'บริการ',     href: '/portal/stay',     color: 'bg-violet-500/12 text-violet-600 dark:text-violet-400' },
  { icon: Heart,          label: 'บันทึกไว้',  href: '/portal/wishlist', color: 'bg-rose-500/12 text-rose-600 dark:text-rose-400' },
  { icon: Compass,        label: 'สำรวจ',      href: '/portal/home',     color: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400' },
];

const v = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

export function HomeClient({ firstName, hotels, activeStay, loyaltyPoints }: {
  firstName: string; hotels: any[]; activeStay: any | null; loyaltyPoints?: number;
}) {
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? hotels.filter(h => h.name?.toLowerCase().includes(query.toLowerCase()) || h.city?.toLowerCase().includes(query.toLowerCase()))
    : hotels;

  const byCity = filtered.reduce<Record<string, any[]>>((acc, h) => {
    const city = h.city || 'อื่นๆ';
    if (!acc[city]) acc[city] = [];
    acc[city].push(h);
    return acc;
  }, {});

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <span className="font-display font-bold text-white text-sm">M</span>
            </div>
            <div className="leading-none">
              <p className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground">Private Journey</p>
              <p className="font-display font-bold text-[15px] text-foreground">Maitri Collection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {loyaltyPoints != null && (
              <Link href="/portal/account">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{loyaltyPoints.toLocaleString()}</span>
                </div>
              </Link>
            )}
            <PortalThemeToggle />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6 pt-5 max-w-screen-sm mx-auto">

        {/* ── Greeting ── */}
        <motion.div custom={0} variants={v} initial="hidden" animate="show">
          <p className="text-xs text-muted-foreground">{greeting} 👋</p>
          <h1 className="font-display text-2xl font-bold text-foreground mt-0.5">
            {firstName || 'ยินดีต้อนรับ'}
          </h1>
        </motion.div>

        {/* ── Categories ── */}
        <motion.div custom={1} variants={v} initial="hidden" animate="show">
          <div className="grid grid-cols-6 gap-1.5">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <Link key={cat.label} href={cat.href}>
                  <motion.div whileTap={{ scale: 0.92 }} className="flex flex-col items-center gap-1.5">
                    <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center', cat.color)}>
                      <Icon className="h-5 w-5" strokeWidth={1.8} />
                    </div>
                    <span className="text-[10px] text-muted-foreground text-center leading-tight font-medium">{cat.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* ── Active stay card ── */}
        {activeStay && (
          <motion.div custom={2} variants={v} initial="hidden" animate="show">
            <Link href="/portal/stay">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                className="relative rounded-2xl overflow-hidden h-28 shadow-xl">
                <Image src={(activeStay.hotels as any)?.hero_image_url || PLACEHOLDER} alt="" fill className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
                <div className="absolute inset-0 p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }}
                        className="h-2 w-2 rounded-full bg-emerald-400 inline-block" />
                      <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">เช็คอินแล้ว</span>
                    </div>
                    <p className="font-display font-bold text-white">{(activeStay.hotels as any)?.name}</p>
                    <p className="text-xs text-white/70 mt-0.5">
                      ห้อง {(activeStay.rooms as any)?.room_number || '—'} · ออก{' '}
                      {activeStay.check_out ? format(parseISO(activeStay.check_out + 'T00:00:00'), 'd MMM', { locale: th }) : '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 mr-2">
                    <div className="px-3 py-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold">
                      บริการ →
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* ── Search ── */}
        <motion.div custom={3} variants={v} initial="hidden" animate="show">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text" placeholder="ค้นหาโรงแรม ชื่อ หรือ เมือง..."
              value={query} onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-2xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
            />
          </div>
        </motion.div>

        {/* ── QR scan (if no active stay) ── */}
        {!activeStay && !query && (
          <motion.div custom={4} variants={v} initial="hidden" animate="show">
            <Link href="/portal/scan">
              <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-3.5 rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-500/8 to-amber-600/5 px-4 py-3.5">
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center shrink-0">
                  <QrCode className="h-5 w-5 text-amber-700 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">สแกน QR ในห้องพัก</p>
                  <p className="text-xs text-muted-foreground">รับบริการ Room Service, Concierge ทันที</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </motion.div>
            </Link>
          </motion.div>
        )}

        {/* ── Promo banners ── */}
        {!query && (
          <motion.div custom={5} variants={v} initial="hidden" animate="show">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-orange-500" />
                <h2 className="font-display font-bold text-foreground">ดีลและโปรโมชั่น</h2>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {PROMOS.map((p, i) => (
                <motion.div key={i} custom={i} variants={v} initial="hidden" animate="show"
                  whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.97 }}
                  className={cn('relative rounded-2xl overflow-hidden cursor-pointer shadow-lg', i === 0 ? 'col-span-2 h-36' : 'h-40')}>
                  <Image src={p.img} alt={p.title} fill className="object-cover" sizes={i === 0 ? '100vw' : '50vw'} />
                  <div className={cn('absolute inset-0 bg-gradient-to-br opacity-80', p.bg)} />
                  <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
                    <span className="self-start text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950">
                      {p.badge}
                    </span>
                    <div>
                      <p className="font-display font-bold text-white text-sm leading-tight whitespace-pre-line">{p.title}</p>
                      <p className="text-[10px] text-white/70 mt-0.5">{p.sub}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Hotel discovery (by city) ── */}
        <motion.div custom={6} variants={v} initial="hidden" animate="show">
          {Object.keys(byCity).length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-muted-foreground text-sm">ไม่พบโรงแรมที่ค้นหา</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(byCity).map(([city, cityHotels]) => (
                <div key={city}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display font-bold text-foreground flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />{city}
                    </h2>
                    <span className="text-xs text-muted-foreground">{cityHotels.length} แห่ง</span>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                    {cityHotels.map((hotel, i) => (
                      <motion.div key={hotel.id} custom={i} variants={v} initial="hidden" animate="show"
                        className="flex-shrink-0 snap-start w-44">
                        <Link href={`/h/${hotel.slug || hotel.id}`}>
                          <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                            className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                            <div className="relative h-28">
                              <Image src={hotel.hero_image_url || PLACEHOLDER} alt={hotel.name} fill
                                className="object-cover" sizes="176px" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                              <div className="absolute bottom-2 left-2.5 flex items-center gap-1">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span className="text-[10px] font-bold text-white">4.8</span>
                              </div>
                            </div>
                            <div className="p-2.5">
                              <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">{hotel.name}</p>
                              <p className="text-[10px] text-muted-foreground mt-1">จองได้เลย</p>
                            </div>
                          </motion.div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <div className="h-2" />
      </div>
    </div>
  );
}
