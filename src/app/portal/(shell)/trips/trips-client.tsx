'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, ChevronRight, CalendarDays, Plane, Hotel, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO, isPast, isFuture, isToday } from 'date-fns';
import { th } from 'date-fns/locale';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=75&fit=crop';

const v = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const TABS = ['ทั้งหมด', 'กำลังมา', 'เสร็จสิ้น'] as const;
type Tab = typeof TABS[number];

const STATUS_PILL: Record<string, { label: string; color: string }> = {
  confirmed:  { label: 'ยืนยันแล้ว',     color: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' },
  checked_in: { label: 'กำลังเข้าพัก',   color: 'bg-amber-500/15 text-amber-700 dark:text-amber-400' },
  completed:  { label: 'เสร็จสิ้น',       color: 'bg-sky-500/15 text-sky-500' },
  cancelled:  { label: 'ยกเลิกแล้ว',     color: 'bg-red-500/15 text-red-500' },
  pending:    { label: 'รอยืนยัน',        color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' },
};

type Reservation = {
  id: string; reservation_code: string; check_in: string; check_out: string;
  status: string; total_amount?: number; hotels: any; room_types: any; rooms: any;
};

function BookingCard({ res, index }: { res: Reservation; index: number }) {
  const hotel     = res.hotels as any;
  const roomType  = res.room_types as any;
  const room      = res.rooms as any;
  const pill      = STATUS_PILL[res.status] ?? { label: res.status, color: 'bg-secondary text-muted-foreground' };
  const checkIn   = res.check_in ? parseISO(res.check_in + 'T00:00:00') : null;
  const checkOut  = res.check_out ? parseISO(res.check_out + 'T00:00:00') : null;
  const isActive  = res.status === 'checked_in';

  return (
    <motion.div custom={index} variants={v} initial="hidden" animate="show" whileTap={{ scale: 0.98 }}>
      <Link href={isActive ? '/portal/stay' : `/portal/trips`}>
        <div className={cn(
          'rounded-2xl border bg-card overflow-hidden shadow-sm',
          isActive ? 'border-amber-500/40 ring-1 ring-amber-500/20' : 'border-border',
        )}>
          {/* Hotel image */}
          <div className="relative h-32">
            <Image
              src={hotel?.hero_image_url || PLACEHOLDER}
              alt={hotel?.name || ''}
              fill className="object-cover" sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            {isActive && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-widest">กำลังเข้าพัก</span>
              </div>
            )}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
              <p className="font-display font-bold text-white text-base leading-tight line-clamp-2">
                {hotel?.name || '—'}
              </p>
              <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ml-2', pill.color)}>
                {pill.label}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="p-3.5">
            <div className="flex items-center gap-4 mb-2.5">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span className="text-xs font-semibold text-foreground">
                  {checkIn ? format(checkIn, 'd MMM', { locale: th }) : '—'}
                </span>
              </div>
              <div className="h-px flex-1 bg-border" />
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {checkOut ? format(checkOut, 'd MMM yy', { locale: th }) : '—'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {roomType?.name && (
                  <span className="text-xs text-muted-foreground">{roomType.name}</span>
                )}
                {room?.room_number && (
                  <span className="text-xs text-muted-foreground">· ห้อง {room.room_number}</span>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="font-mono text-[10px]">#{res.reservation_code}</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function TripsClient({ reservations, hotels }: {
  reservations: Reservation[];
  hotels: any[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>('ทั้งหมด');

  const filtered = reservations.filter(r => {
    if (activeTab === 'ทั้งหมด') return true;
    if (activeTab === 'กำลังมา') return ['confirmed', 'checked_in', 'pending'].includes(r.status);
    return ['completed', 'cancelled'].includes(r.status);
  });

  const byCity = hotels.reduce<Record<string, any[]>>((acc, h) => {
    const city = h.city || 'อื่นๆ';
    if (!acc[city]) acc[city] = [];
    acc[city].push(h);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <h1 className="font-display font-bold text-lg text-foreground">ทริปของฉัน</h1>
          <PortalThemeToggle />
        </div>
      </div>

      <div className="px-4 pt-4 max-w-screen-sm mx-auto space-y-5">

        {/* ── Tabs ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex gap-1.5 bg-secondary rounded-2xl p-1">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 py-2 text-xs font-semibold rounded-xl transition-all',
                  activeTab === tab
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                {tab}
                {tab === 'กำลังมา' && reservations.filter(r => ['confirmed', 'checked_in', 'pending'].includes(r.status)).length > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[9px] font-bold">
                    {reservations.filter(r => ['confirmed', 'checked_in', 'pending'].includes(r.status)).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Booking cards ── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center">
              <Plane className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">ยังไม่มีการจองในหมวดนี้</p>
              <Link href="/portal/home"
                className="mt-4 px-5 py-2.5 bg-amber-600 dark:bg-amber-500 text-white rounded-2xl text-xs font-semibold">
                ค้นหาที่พัก
              </Link>
            </motion.div>
          ) : (
            <motion.div key={activeTab} className="space-y-3">
              {filtered.map((res, i) => (
                <BookingCard key={res.id} res={res} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Discover section ── */}
        {Object.keys(byCity).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="font-display font-bold text-foreground mb-3 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              สำรวจที่พัก
            </h2>
            {Object.entries(byCity).map(([city, cityHotels]) => (
              <div key={city} className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-semibold text-foreground">{city}</span>
                  <span className="text-xs text-muted-foreground">{cityHotels.length} แห่ง</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide snap-x snap-mandatory">
                  {cityHotels.map((hotel, i) => (
                    <motion.div key={hotel.id} custom={i} variants={v} initial="hidden" animate="show"
                      className="flex-shrink-0 snap-start w-40">
                      <Link href={`/h/${hotel.slug || hotel.id}`}>
                        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                          className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
                          <div className="relative h-24">
                            <Image src={hotel.hero_image_url || PLACEHOLDER} alt={hotel.name} fill
                              className="object-cover" sizes="160px" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute bottom-1.5 left-2 flex items-center gap-1">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              <span className="text-[10px] font-bold text-white">4.8</span>
                            </div>
                          </div>
                          <div className="p-2.5">
                            <p className="text-xs font-semibold text-foreground line-clamp-2 leading-snug">{hotel.name}</p>
                          </div>
                        </motion.div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        <div className="h-2" />
      </div>
    </div>
  );
}
