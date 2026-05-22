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
  const isConfirmed = res.status === 'confirmed';
  const daysUntil = checkIn ? differenceInDays(checkIn, new Date()) : null;
  const isUpcoming = daysUntil !== null && daysUntil >= 0 && daysUntil <= 7 && isConfirmed;
  const linkHref = isActive ? '/portal/stay' : isConfirmed ? '/portal/stay' : null;

  const cardContent = (
    <div className={cn(
      'bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/40 shadow-sm overflow-hidden transition-shadow hover:shadow-md',
      isActive && `ring-1 ${cfg.ring}`,
    )}>
      {/* ── Top row: image + info ── */}
      <div className="flex items-start gap-3 p-3.5">
        <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0">
          <Image
            src={hotel?.hero_image_url || PLACEHOLDER}
            alt={hotel?.name || ''}
            fill
            className="object-cover"
            sizes="96px"
          />
          {isActive && (
            <div className="absolute bottom-1 left-1 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/90 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
              </span>
              <span className="text-[8px] font-bold text-white uppercase tracking-wide">Live</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-medium">{hotel?.city || 'Thailand'}</p>
              <h3 className="font-display font-bold text-foreground text-sm leading-tight line-clamp-2">{hotel?.name || '—'}</h3>
            </div>
            <span className={cn(
              'text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 mt-0.5',
              cfg.pillBg, cfg.pillText,
            )}>
              <StatusIcon className="h-2.5 w-2.5" strokeWidth={2.5} />
              {cfg.label}
            </span>
          </div>

          {(roomType?.name || room?.room_number) && (
            <p className="text-[10px] text-muted-foreground mb-1.5">
              {roomType?.name}{room?.room_number ? ` · ห้อง ${room.room_number}` : ''}
            </p>
          )}

          {isUpcoming && (
            <span className="inline-flex text-[9px] font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-700 dark:text-green-400">
              {daysUntil === 0 ? 'วันนี้!' : `อีก ${daysUntil} วัน`}
            </span>
          )}
        </div>
      </div>

      {/* ── Date row ── */}
      <div className="mx-3.5 border-t border-gray-100 dark:border-border/40 py-3 flex items-center gap-2">
        <div className="flex-1 text-center">
          <p className="text-[9px] text-muted-foreground font-medium mb-0.5">เช็คอิน</p>
          <p className="text-xs font-bold text-foreground">{checkIn ? format(checkIn, 'EEE d MMM', { locale: th }) : '—'}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <div className="flex items-center gap-1">
            <div className="h-px w-5 bg-gray-300 dark:bg-border" />
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            <div className="h-px w-5 bg-gray-300 dark:bg-border" />
          </div>
          <span className="text-[9px] text-muted-foreground/60 font-medium">{nights != null ? `${nights} คืน` : ''}</span>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[9px] text-muted-foreground font-medium mb-0.5">เช็คเอาท์</p>
          <p className="text-xs font-bold text-foreground">{checkOut ? format(checkOut, 'EEE d MMM', { locale: th }) : '—'}</p>
        </div>
      </div>

      {/* ── Bottom: code + amount ── */}
      <div className="mx-3.5 border-t border-gray-100 dark:border-border/40 py-2.5 flex items-center justify-between">
        <span className="text-[10px] font-mono text-muted-foreground/50">#{res.reservation_code}</span>
        <div className="flex items-center gap-3">
          {res.total_amount != null && (
            <span className="text-sm font-bold text-orange-500">฿{res.total_amount.toLocaleString()}</span>
          )}
          {(isActive || isConfirmed) && (
            <div className="flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400">
              {isActive ? 'เข้าห้อง' : 'ดูรายละเอียด'} <ChevronRight className="h-3.5 w-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.45, ease }}
      whileTap={linkHref ? { scale: 0.985 } : {}}
    >
      {linkHref ? <Link href={linkHref}>{cardContent}</Link> : cardContent}
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
          className="rounded-2xl border border-gray-100 dark:border-border/50 bg-white dark:bg-card overflow-hidden shadow-sm">
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
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/90 dark:bg-background/85 backdrop-blur-2xl border-b border-gray-200/60 dark:border-border/30">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <h1 className="font-display font-bold text-lg text-foreground tracking-tight">การเดินทางของฉัน</h1>
          <PortalThemeToggle />
        </div>
      </div>

      <div className="px-4 pt-4 pb-32 max-w-screen-sm mx-auto space-y-5">

        {/* ── Animated tab switcher ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div className="flex gap-1 bg-gray-200/60 dark:bg-secondary/70 rounded-2xl p-1 border border-gray-200/80 dark:border-border/30">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold rounded-xl z-10"
              >
                {activeTab === tab && (
                  <motion.div
                    layoutId="trip-tab"
                    className="absolute inset-0 bg-white dark:bg-card rounded-xl shadow-sm border border-gray-100 dark:border-border/40"
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
              <p className="text-base font-semibold text-foreground mb-2">
                {activeTab === 'กำลังมา' ? 'ยังไม่มีการเดินทางที่กำลังมา'
                  : activeTab === 'เสร็จสิ้น' ? 'ยังไม่มีประวัติการเดินทาง'
                  : 'ยังไม่มีการจอง'}
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
                {activeTab === 'กำลังมา'
                  ? 'เมื่อคุณจองที่พักแล้ว การเดินทางของคุณจะปรากฏที่นี่'
                  : activeTab === 'เสร็จสิ้น'
                  ? 'การเข้าพักที่เสร็จสิ้นแล้วจะปรากฏที่นี่'
                  : 'เริ่มต้นการเดินทางครั้งใหม่ที่น่าจดจำ'}
              </p>
              {activeTab !== 'เสร็จสิ้น' && (
                <Link href="/portal/home">
                  <motion.div whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-600/25 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    ค้นหาที่พัก
                  </motion.div>
                </Link>
              )}
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
