'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Tag, ChevronRight, MessageSquare, Sparkles, CalendarCheck, Megaphone, Gift, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { th } from 'date-fns/locale';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=75&fit=crop';

const FILTERS = ['ทั้งหมด', 'การจอง', 'โปรโมชั่น', 'แจ้งเตือน'] as const;
type Filter = typeof FILTERS[number];

const v = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } }),
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: 'ยืนยันการจองแล้ว',
  checked_in: 'เช็คอินแล้ว',
  completed: 'เข้าพักเสร็จสิ้น',
  cancelled: 'ยกเลิกการจอง',
  pending: 'รอการยืนยัน',
};

const STATUS_COLOR: Record<string, string> = {
  confirmed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  checked_in: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  completed: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  cancelled: 'bg-red-500/15 text-red-600 dark:text-red-400',
  pending: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
};

type Reservation = {
  id: string; reservation_code: string; check_in: string; check_out: string;
  status: string; total_amount?: number; hotels: any;
};

type NotifItem = {
  id: string;
  type: 'booking' | 'promo' | 'system';
  icon: React.ElementType;
  iconColor: string;
  title: string;
  body: string;
  time: Date;
  hotel?: any;
  href?: string;
  badge?: string;
};

const STATIC_PROMOS: NotifItem[] = [
  {
    id: 'promo-1',
    type: 'promo',
    icon: Tag,
    iconColor: 'text-amber-600 dark:text-amber-400',
    title: 'โปรโมชั่นพิเศษสำหรับคุณ',
    body: 'จองล่วงหน้า 7 วัน รับส่วนลดสูงสุด 30% ทุกประเภทห้อง',
    time: new Date(Date.now() - 2 * 3600_000),
    badge: 'ดีล',
  },
  {
    id: 'promo-2',
    type: 'promo',
    icon: Gift,
    iconColor: 'text-rose-500',
    title: 'สะสมแต้มรับของรางวัล',
    body: 'แลกคะแนน Maitri Rewards เป็นส่วนลดหรือห้องพักฟรี',
    time: new Date(Date.now() - 24 * 3600_000),
    href: '/portal/loyalty',
    badge: 'Rewards',
  },
];

function buildNotifications(reservations: Reservation[]): NotifItem[] {
  const items: NotifItem[] = [];
  const now = Date.now();

  for (const r of reservations) {
    const hotel = r.hotels as any;
    const checkInDate = r.check_in ? parseISO(r.check_in + 'T00:00:00') : null;
    const daysUntil = checkInDate ? differenceInDays(checkInDate, new Date()) : null;

    if (r.status === 'checked_in') {
      items.push({
        id: r.id + '-checkin',
        type: 'booking',
        icon: CalendarCheck,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        title: `เช็คอินแล้วที่ ${hotel?.name || 'โรงแรม'}`,
        body: `ห้องพักพร้อมให้บริการ · เช็คเอาท์ ${r.check_out ? format(parseISO(r.check_out + 'T00:00:00'), 'd MMM yy', { locale: th }) : '—'}`,
        time: new Date(now - 30 * 60_000),
        hotel,
        href: '/portal/stay',
        badge: 'กำลังเข้าพัก',
      });
    } else if (r.status === 'confirmed' && daysUntil !== null && daysUntil >= 0 && daysUntil <= 7) {
      items.push({
        id: r.id + '-soon',
        type: 'booking',
        icon: Bell,
        iconColor: 'text-amber-600 dark:text-amber-400',
        title: daysUntil === 0 ? 'วันนี้เป็นวันเช็คอิน!' : `เช็คอินอีก ${daysUntil} วัน`,
        body: `${hotel?.name || 'โรงแรม'} · #${r.reservation_code}`,
        time: new Date(now - 60 * 60_000),
        hotel,
        href: '/portal/trips',
        badge: daysUntil === 0 ? 'วันนี้' : `${daysUntil} วัน`,
      });
    } else if (r.status === 'confirmed') {
      items.push({
        id: r.id + '-confirmed',
        type: 'booking',
        icon: CalendarCheck,
        iconColor: 'text-sky-500',
        title: 'ยืนยันการจองแล้ว',
        body: `${hotel?.name || 'โรงแรม'} · เช็คอิน ${checkInDate ? format(checkInDate, 'd MMM yy', { locale: th }) : '—'}`,
        time: checkInDate ? new Date(checkInDate.getTime() - 7 * 86400_000) : new Date(now - 3 * 86400_000),
        hotel,
        href: '/portal/trips',
      });
    } else if (r.status === 'completed') {
      items.push({
        id: r.id + '-done',
        type: 'booking',
        icon: Star,
        iconColor: 'text-amber-500',
        title: `ขอบคุณที่เข้าพักกับเรา`,
        body: `${hotel?.name || 'โรงแรม'} · คุณได้รับคะแนนสะสม`,
        time: r.check_out ? parseISO(r.check_out + 'T12:00:00') : new Date(now - 7 * 86400_000),
        hotel,
        href: '/portal/loyalty',
      });
    }
  }

  items.push(...STATIC_PROMOS);
  items.sort((a, b) => b.time.getTime() - a.time.getTime());
  return items;
}

function relativeTime(date: Date) {
  const diff = Date.now() - date.getTime();
  if (diff < 3600_000) return `${Math.max(1, Math.round(diff / 60_000))} นาทีที่แล้ว`;
  if (diff < 86400_000) return `${Math.round(diff / 3600_000)} ชั่วโมงที่แล้ว`;
  if (diff < 7 * 86400_000) return `${Math.round(diff / 86400_000)} วันที่แล้ว`;
  return format(date, 'd MMM', { locale: th });
}

export function MessagesClient({ firstName, reservations }: {
  firstName: string; reservations: Reservation[];
}) {
  const [activeFilter, setActiveFilter] = useState<Filter>('ทั้งหมด');

  const allNotifs = useMemo(() => buildNotifications(reservations), [reservations]);

  const filtered = useMemo(() => {
    if (activeFilter === 'ทั้งหมด') return allNotifs;
    if (activeFilter === 'การจอง') return allNotifs.filter(n => n.type === 'booking');
    if (activeFilter === 'โปรโมชั่น') return allNotifs.filter(n => n.type === 'promo');
    return allNotifs.filter(n => n.type === 'system');
  }, [allNotifs, activeFilter]);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/30">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <h1 className="font-display font-bold text-lg text-foreground">ข้อความ</h1>
          <PortalThemeToggle />
        </div>
      </div>

      <div className="px-4 pt-4 max-w-screen-sm mx-auto space-y-4">

        {/* ── Filter chips ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={cn(
                  'flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                  activeFilter === f
                    ? 'bg-amber-600 dark:bg-amber-500 text-white shadow-sm'
                    : 'bg-secondary text-muted-foreground hover:text-foreground',
                )}>
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Notifications ── */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="text-muted-foreground text-sm">ไม่มีข้อความในหมวดนี้</p>
            </motion.div>
          ) : (
            <motion.div key={activeFilter} className="space-y-2.5">
              {filtered.map((item, i) => {
                const Icon = item.icon;
                const inner = (
                  <motion.div custom={i} variants={v} initial="hidden" animate="show"
                    whileTap={{ scale: 0.98 }}
                    className="flex items-start gap-3 rounded-2xl bg-card border border-border/70 p-4 hover:bg-secondary/40 transition-colors">
                    {/* Hotel image or icon */}
                    <div className="relative shrink-0">
                      {item.hotel?.hero_image_url ? (
                        <div className="h-12 w-12 rounded-xl overflow-hidden relative">
                          <Image src={item.hotel.hero_image_url || PLACEHOLDER} alt="" fill className="object-cover" sizes="48px" />
                        </div>
                      ) : (
                        <div className={cn('h-12 w-12 rounded-xl bg-secondary flex items-center justify-center', item.iconColor)}>
                          <Icon className="h-5 w-5" strokeWidth={1.8} />
                        </div>
                      )}
                      {item.badge && (
                        <span className="absolute -bottom-1 -right-1 text-[8px] font-bold px-1 py-0.5 rounded-full bg-amber-500 text-white leading-none whitespace-nowrap">
                          {item.badge}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground leading-snug">{item.title}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">{relativeTime(item.time)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.body}</p>
                    </div>

                    {item.href && <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-1" />}
                  </motion.div>
                );

                return item.href ? (
                  <Link key={item.id} href={item.href}>{inner}</Link>
                ) : (
                  <div key={item.id}>{inner}</div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-2" />
      </div>
    </div>
  );
}
