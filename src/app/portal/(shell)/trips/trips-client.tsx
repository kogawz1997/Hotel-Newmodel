'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star, ChevronRight, CalendarDays, Plane, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&fit=crop';
const ease = [0.25, 0.46, 0.45, 0.94] as const;
const v = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease } }),
};

const TABS = ['ทั้งหมด', 'กำลังมา', 'เสร็จสิ้น'] as const;
type Tab = typeof TABS[number];

type StatusConfig = { label: string; Icon: React.ElementType; iconColor: string; pillBg: string; pillText: string };

const STATUS: Record<string, StatusConfig> = {
  confirmed:  { label: 'ยืนยันแล้ว',   Icon: CheckCircle2, iconColor: 'text-emerald-500', pillBg: 'bg-emerald-500/12 dark:bg-emerald-400/10', pillText: 'text-emerald-700 dark:text-emerald-300' },
  checked_in: { label: 'กำลังเข้าพัก', Icon: Clock,         iconColor: 'text-amber-500',   pillBg: 'bg-amber-500/15 dark:bg-amber-400/12',    pillText: 'text-amber-800 dark:text-amber-300' },
  completed:  { label: 'เสร็จสิ้น',     Icon: CheckCircle2, iconColor: 'text-sky-500',     pillBg: 'bg-sky-500/12 dark:bg-sky-400/10',         pillText: 'text-sky-700 dark:text-sky-300' },
  cancelled:  { label: 'ยกเลิกแล้ว',   Icon: XCircle,      iconColor: 'text-red-500',     pillBg: 'bg-red-500/10 dark:bg-red-400/8',           pillText: 'text-red-700 dark:text-red-400' },
  pending:    { label: 'รอยืนยัน',      Icon: AlertCircle,  iconColor: 'text-orange-500',  pillBg: 'bg-orange-500/12 dark:bg-orange-400/10',   pillText: 'text-orange-700 dark:text-orange-300' },
};

type Reservation = {
  id: string; reservation_code: string; check_in: string; check_out: string;
  status: string; total_amount?: number; hotels: any; room_types: any; rooms: any;
};

function BookingCard({ res, index }: { res: Reservation; index: number }) {
  const hotel    = res.hotels as any;
  const roomType = res.room_types as any;
  const room     = res.rooms as any;
  const cfg      = STATUS[res.status] ?? STATUS.confirmed;
  const StatusIcon = cfg.Icon;
  const checkIn  = res.check_in ? parseISO(res.check_in + 'T00:00:00') : null;
  const checkOut = res.check_out ? parseISO(res.check_out + 'T00:00:00') : null;
  const isActive = res.status === 'checked_in';
  const daysUntil = checkIn ? differenceInDays(checkIn, new Date()) : null;

  return (
    <motion.div custom={index} variants={v} initial="hidden" animate="show" whileTap={{ scale: 0.985 }}>
      <Link href={isActive ? '/portal/stay' : '#'}>
        <div className={cn(
          'rounded-3xl border bg-card overflow-hidden shadow-sm transition-shadow hover:shadow-md',
          isActive ? 'border-amber-500/35 ring-1 ring-amber-500/15' : 'border-border/60',
        )}>

          {/* Hotel image */}
          <div className="relative h-36">
            <Image
              src={hotel?.hero_image_url || PLACEHOLDER}
              alt={hotel?.name || ''}
              fill className="object-cover" sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

            {/* Active indicator */}
            {isActive && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-emerald-400/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">กำลังเข้าพัก</span>
              </div>
            )}

            {/* Upcoming badge */}
            {daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && res.status === 'confirmed' && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-amber-500/80 backdrop-blur-sm">
                <span className="text-[9px] font-bold text-white">{daysUntil === 0 ? 'วันนี้!' : `อีก ${daysUntil} วัน`}</span>
              </div>
            )}

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-3.5 flex items-end justify-between">
              <div>
                <p className="font-display font-bold text-white text-base leading-tight line-clamp-1">
                  {hotel?.name || '—'}
                </p>
                {hotel?.city && (
                  <p className="text-[10px] text-white/60 mt-0.5 flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />{hotel.city}
                  </p>
                )}
              </div>
              <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2 flex items-center gap-1', cfg.pillBg, cfg.pillText)}>
                <StatusIcon className="h-3 w-3" strokeWidth={2.5} />
                {cfg.label}
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="px-4 py-3 space-y-2.5">
            {/* Date row */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 flex-1">
                <CalendarDays className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-xs font-semibold text-foreground">
                  {checkIn ? format(checkIn, 'd MMM', { locale: th }) : '—'}
                </span>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <div className="h-px flex-1 border-t border-dashed border-border" />
                <span className="text-[9px] text-muted-foreground/60 px-1">
                  {checkIn && checkOut ? `${differenceInDays(checkOut, checkIn)} คืน` : ''}
                </span>
                <div className="h-px flex-1 border-t border-dashed border-border" />
              </div>
              <div className="flex items-center gap-1.5 flex-1 justify-end">
                <span className="text-xs text-muted-foreground">
                  {checkOut ? format(checkOut, 'd MMM yy', { locale: th }) : '—'}
                </span>
              </div>
            </div>

            {/* Room & booking code */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {roomType?.name && (
                  <span className="text-[11px] text-muted-foreground">{roomType.name}</span>
                )}
                {room?.room_number && (
                  <span className="text-[11px] text-muted-foreground">· ห้อง {room.room_number}</span>
                )}
              </div>
              <span className="text-[10px] font-mono text-muted-foreground/50">#{res.reservation_code}</span>
            </div>

            {/* CTA for active stay */}
            {isActive && (
              <div className="flex items-center justify-between pt-0.5 border-t border-border/50">
                <span className="text-xs text-muted-foreground">บริการในห้อง</span>
                <div className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  เข้าสู่ห้อง <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </div>
            )}
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

  const counts = {
    'ทั้งหมด': reservations.length,
    'กำลังมา': reservations.filter(r => ['confirmed', 'checked_in', 'pending'].includes(r.status)).length,
    'เสร็จสิ้น': reservations.filter(r => ['completed', 'cancelled'].includes(r.status)).length,
  };

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
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <h1 className="font-display font-bold text-lg text-foreground tracking-tight">ทริปของฉัน</h1>
          <PortalThemeToggle />
        </div>
      </div>

      <div className="px-4 pt-4 pb-8 max-w-screen-sm mx-auto space-y-5">

        {/* ── Tabs ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex gap-1.5 bg-secondary/80 rounded-2xl p-1 border border-border/40">
            {TABS.map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-xl transition-all',
                  activeTab === tab
                    ? 'bg-card text-foreground shadow-sm border border-border/40'
                    : 'text-muted-foreground hover:text-foreground',
                )}>
                {tab}
                {counts[tab] > 0 && (
                  <span className={cn(
                    'inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[9px] font-bold',
                    activeTab === tab
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300'
                      : 'bg-secondary text-muted-foreground',
                  )}>
                    {counts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Cards ── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-3xl bg-secondary flex items-center justify-center mb-5">
                <Plane className="h-9 w-9 text-muted-foreground/30" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">ยังไม่มีการจองที่นี่</p>
              <p className="text-sm text-muted-foreground mb-6">เริ่มต้นการเดินทางครั้งใหม่ของคุณ</p>
              <Link href="/portal/home"
                className="px-6 py-3 bg-gradient-to-r from-amber-600 to-[#C66A30] text-white rounded-2xl text-sm font-semibold shadow-md shadow-amber-500/20">
                ค้นหาที่พัก
              </Link>
            </motion.div>
          ) : (
            <motion.div key={activeTab} className="space-y-3.5">
              {filtered.map((res, i) => (
                <BookingCard key={res.id} res={res} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Discover hotels ── */}
        {Object.keys(byCity).length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="h-6 w-6 rounded-lg bg-amber-500/15 flex items-center justify-center">
                <MapPin className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400" />
              </div>
              <h2 className="font-display font-bold text-foreground">สำรวจที่พัก</h2>
            </div>
            {Object.entries(byCity).map(([city, cityHotels]) => (
              <div key={city} className="mb-5">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-semibold text-foreground">{city}</span>
                  <span className="text-xs text-muted-foreground">{cityHotels.length} แห่ง</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none snap-x snap-mandatory">
                  {cityHotels.map((hotel, i) => (
                    <motion.div key={hotel.id} custom={i} variants={v} initial="hidden" animate="show"
                      className="flex-shrink-0 snap-start w-44">
                      <Link href={`/h/${hotel.slug || hotel.id}`}>
                        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}
                          className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
                          <div className="relative h-28">
                            <Image src={hotel.hero_image_url || PLACEHOLDER} alt={hotel.name} fill
                              className="object-cover" sizes="176px" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                            <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-black/50 backdrop-blur-sm">
                              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                              <span className="text-[9px] font-bold text-white">4.8</span>
                            </div>
                          </div>
                          <div className="p-2.5">
                            <p className="text-xs font-bold text-foreground line-clamp-1">{hotel.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{hotel.city}</p>
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

      </div>
    </div>
  );
}
