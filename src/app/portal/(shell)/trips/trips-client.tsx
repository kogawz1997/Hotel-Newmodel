'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin, Star, ChevronRight, CalendarDays, Plane,
  Clock, CheckCircle2, XCircle, AlertCircle, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80';
const ease = [0.22, 1, 0.36, 1] as const;

const TABS = ['ทั้งหมด', 'กำลังมา', 'เสร็จสิ้น'] as const;
type Tab = typeof TABS[number];

const STATUS: Record<string, { label: string; Icon: React.ElementType; pillBg: string; pillText: string; ring: string }> = {
  confirmed:  { label: 'ยืนยันแล้ว',   Icon: CheckCircle2, pillBg: 'bg-emerald-500/15', pillText: 'text-emerald-700 dark:text-emerald-300', ring: 'ring-emerald-500/20' },
  checked_in: { label: 'กำลังเข้าพัก', Icon: Clock,         pillBg: 'bg-green-500/20',  pillText: 'text-green-800 dark:text-green-300',   ring: 'ring-green-500/30'   },
  completed:  { label: 'เสร็จสิ้น',     Icon: CheckCircle2, pillBg: 'bg-sky-500/15',    pillText: 'text-sky-700 dark:text-sky-300',         ring: ''                    },
  cancelled:  { label: 'ยกเลิกแล้ว',   Icon: XCircle,      pillBg: 'bg-red-500/10',    pillText: 'text-red-600 dark:text-red-400',         ring: ''                    },
  pending:    { label: 'รอยืนยัน',      Icon: AlertCircle,  pillBg: 'bg-orange-500/15', pillText: 'text-orange-700 dark:text-orange-300',   ring: ''                    },
};

type Reservation = {
  id: string; reservation_code: string; check_in: string; check_out: string;
  status: string; total_amount?: number; hotels: any; room_types: any; rooms: any;
};

function hotelRating(name: string) {
  const s = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return (4.5 + (s % 5) * 0.1).toFixed(1);
}

function BookingCard({ res, index }: { res: Reservation; index: number }) {
  const hotel    = res.hotels as any;
  const roomType = res.room_types as any;
  const room     = res.rooms as any;
  const cfg      = STATUS[res.status] ?? STATUS.confirmed;
  const StatusIcon = cfg.Icon;
  const checkIn  = res.check_in  ? parseISO(res.check_in  + 'T00:00:00') : null;
  const checkOut = res.check_out ? parseISO(res.check_out + 'T00:00:00') : null;
  const nights   = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : null;
  const isActive = res.status === 'checked_in';
  const daysUntil = checkIn ? differenceInDays(checkIn, new Date()) : null;
  const isUpcoming = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && res.status === 'confirmed';
  const rating   = hotelRating(hotel?.name);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease }}
      whileTap={{ scale: 0.985 }}
    >
      <Link href={isActive ? '/portal/stay' : '#'}>
        <div className={cn(
          'rounded-3xl border bg-card overflow-hidden shadow-md transition-shadow hover:shadow-lg',
          isActive
            ? `border-green-500/40 ring-1 ${cfg.ring}`
            : 'border-border/50',
        )}>

          {/* ── Hero image ── */}
          <div className="relative h-44 overflow-hidden">
            <Image
              src={hotel?.hero_image_url || PLACEHOLDER}
              alt={hotel?.name || ''}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 640px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />

            {/* Live badge */}
            {isActive && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-emerald-400/30">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
                <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider">กำลังเข้าพัก</span>
              </div>
            )}

            {/* Countdown badge */}
            {isUpcoming && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-green-500/85 backdrop-blur-sm border border-green-400/30">
                <span className="text-[9px] font-bold text-white">
                  {daysUntil === 0 ? '🎉 วันนี้!' : `⏳ อีก ${daysUntil} วัน`}
                </span>
              </div>
            )}

            {/* Rating top-right */}
            <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/10">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-bold text-white">{rating}</span>
            </div>

            {/* Bottom overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/50 mb-0.5">
                  {hotel?.city} · Thailand
                </p>
                <h3 className="font-display font-bold text-white text-base leading-tight line-clamp-1">
                  {hotel?.name || '—'}
                </h3>
              </div>
              <span className={cn(
                'text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2 flex items-center gap-1 backdrop-blur-sm',
                cfg.pillBg, cfg.pillText,
              )}>
                <StatusIcon className="h-3 w-3" strokeWidth={2.5} />
                {cfg.label}
              </span>
            </div>
          </div>

          {/* ── Details strip ── */}
          <div className="px-4 py-3.5 space-y-3">

            {/* Date row */}
            <div className="flex items-center gap-2.5">
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground font-medium">เช็คอิน</p>
                <p className="text-sm font-bold text-foreground">
                  {checkIn ? format(checkIn, 'EEE d MMM', { locale: th }) : '—'}
                </p>
              </div>

              <div className="flex flex-col items-center gap-0.5 px-3">
                <div className="h-px w-10 bg-border" />
                <span className="text-[9px] text-muted-foreground/60 font-medium">
                  {nights != null ? `${nights} คืน` : ''}
                </span>
                <div className="h-px w-10 bg-border" />
              </div>

              <div className="flex-1 text-right">
                <p className="text-[10px] text-muted-foreground font-medium">เช็คเอาท์</p>
                <p className="text-sm font-bold text-foreground">
                  {checkOut ? format(checkOut, 'EEE d MMM', { locale: th }) : '—'}
                </p>
              </div>
            </div>

            {/* Room & code row */}
            <div className="flex items-center justify-between border-t border-border/40 pt-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {roomType?.name && <span className="font-medium text-foreground">{roomType.name}</span>}
                {room?.room_number && <span>· ห้อง {room.room_number}</span>}
              </div>
              <div className="flex items-center gap-2">
                {res.total_amount != null && (
                  <span className="text-xs font-bold text-orange-500">
                    ฿{res.total_amount.toLocaleString()}
                  </span>
                )}
                {isActive ? (
                  <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
                    เข้าห้อง <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                ) : (
                  <span className="text-[10px] font-mono text-muted-foreground/40">
                    #{res.reservation_code}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Mini hotel explore card ──────────────────────────────────────────────────

function HotelMiniCard({ hotel, index }: { hotel: any; index: number }) {
  const rating = hotelRating(hotel.name || '');
  const minRate = hotel.room_types?.length
    ? Math.min(...hotel.room_types.map((rt: any) => rt.base_rate).filter(Boolean))
    : null;
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease }}
      className="flex-shrink-0 snap-start w-44"
    >
      <Link href={`/h/${hotel.slug || hotel.id}`}>
        <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.96 }}
          className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-md">
          <div className="relative h-28 overflow-hidden">
            <Image src={hotel.hero_image_url || PLACEHOLDER} alt={hotel.name} fill
              className="object-cover transition-transform duration-500 hover:scale-105" sizes="176px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
            <div className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
              <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              <span className="text-[9px] font-bold text-white">{rating}</span>
            </div>
            <div className="absolute bottom-2 left-2.5">
              <p className="text-[9px] text-white/60 font-medium">{hotel.city}</p>
            </div>
          </div>
          <div className="p-2.5">
            <p className="text-xs font-bold text-foreground line-clamp-1 leading-snug">{hotel.name}</p>
            {minRate && isFinite(minRate) ? (
              <p className="text-[10px] text-orange-500 mt-1 font-semibold">
                ฿{minRate.toLocaleString()}<span className="text-muted-foreground font-normal">/คืน</span>
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-1">จองได้เลย →</p>
            )}
          </div>
        </motion.div>
      </Link>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function TripsClient({ reservations, hotels }: {
  reservations: Reservation[];
  hotels: any[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>('ทั้งหมด');

  const counts: Record<Tab, number> = {
    'ทั้งหมด': reservations.length,
    'กำลังมา': reservations.filter(r => ['confirmed', 'checked_in', 'pending'].includes(r.status)).length,
    'เสร็จสิ้น': reservations.filter(r => ['completed', 'cancelled'].includes(r.status)).length,
  };

  const filtered = reservations.filter(r => {
    if (activeTab === 'ทั้งหมด') return true;
    if (activeTab === 'กำลังมา') return ['confirmed', 'checked_in', 'pending'].includes(r.status);
    return ['completed', 'cancelled'].includes(r.status);
  });

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-background/85 backdrop-blur-2xl border-b border-border/30">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <h1 className="font-display font-bold text-lg text-foreground tracking-tight">ทริปของฉัน</h1>
          <PortalThemeToggle />
        </div>
      </div>

      <div className="px-4 pt-4 pb-32 max-w-screen-sm mx-auto space-y-5">

        {/* ── Animated tab switcher ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex gap-1 bg-secondary/70 rounded-2xl p-1 border border-border/30">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl z-10"
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="trip-tab"
                    className="absolute inset-0 bg-card rounded-xl shadow-sm border border-border/40"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={cn(
                  'relative z-10 transition-colors',
                  activeTab === tab ? 'text-foreground' : 'text-muted-foreground',
                )}>
                  {tab}
                </span>
                {counts[tab] > 0 && (
                  <span className={cn(
                    'relative z-10 inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full text-[9px] font-bold transition-colors',
                    activeTab === tab
                      ? 'bg-blue-500/15 text-blue-800 dark:text-blue-300'
                      : 'bg-border/50 text-muted-foreground',
                  )}>
                    {counts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Booking cards ── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <motion.div
                initial={{ y: -8 }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="h-24 w-24 rounded-3xl bg-secondary border border-border/40 flex items-center justify-center mb-5 shadow-sm"
              >
                <Plane className="h-10 w-10 text-muted-foreground/30" />
              </motion.div>
              <p className="text-base font-semibold text-foreground mb-2">ยังไม่มีการจองที่นี่</p>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
                เริ่มต้นการเดินทางครั้งใหม่ที่น่าจดจำ
              </p>
              <Link href="/portal/home">
                <motion.div whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/25 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  ค้นหาที่พัก
                </motion.div>
              </Link>
            </motion.div>
          ) : (
            <motion.div key={activeTab} className="space-y-4">
              {filtered.map((res, i) => (
                <BookingCard key={res.id} res={res} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Discover hotels ── */}
        {hotels.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="font-display font-bold text-foreground">สำรวจที่พัก</h2>
              </div>
              <Link href="/portal/home" className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-0.5">
                ดูทั้งหมด <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="flex gap-3 -mx-4 px-4 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
              {hotels.map((h, i) => (
                <HotelMiniCard key={h.id} hotel={h} index={i} />
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
}
