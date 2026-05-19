'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Bell, Tag, ChevronRight, MessageSquare, Sparkles, CalendarCheck, Gift, Star, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';
import { PortalThemeToggle } from '@/components/portal/PortalThemeToggle';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&q=75&fit=crop';
const ease = [0.25, 0.46, 0.45, 0.94] as const;
const v = {
  hidden: { opacity: 0, y: 10 },
  show:   (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.3, ease } }),
};

const FILTERS = ['ทั้งหมด', 'การจอง', 'โปรโมชั่น', 'แจ้งเตือน'] as const;
type Filter = typeof FILTERS[number];

type Reservation = {
  id: string; reservation_code: string; check_in: string; check_out: string;
  status: string; total_amount?: number; hotels: any;
};

type NotifItem = {
  id: string;
  type: 'booking' | 'promo' | 'system';
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  time: Date;
  hotel?: any;
  href?: string;
  badge?: string;
  badgeColor?: string;
  isNew?: boolean;
};

const STATIC_PROMOS: NotifItem[] = [
  {
    id: 'promo-1',
    type: 'promo',
    icon: Tag,
    iconColor: 'text-amber-700 dark:text-amber-400',
    iconBg: 'bg-amber-500/12 dark:bg-amber-400/10',
    title: 'โปรโมชั่นพิเศษสำหรับคุณ',
    body: 'จองล่วงหน้า 7 วัน รับส่วนลดสูงสุด 30% ทุกประเภทห้อง',
    time: new Date(Date.now() - 2 * 3600_000),
    badge: 'ดีล',
    badgeColor: 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
    isNew: true,
  },
  {
    id: 'promo-2',
    type: 'promo',
    icon: Gift,
    iconColor: 'text-rose-600 dark:text-rose-400',
    iconBg: 'bg-rose-500/12 dark:bg-rose-400/10',
    title: 'สะสมแต้มรับของรางวัล',
    body: 'แลกคะแนน Maitri Rewards เป็นส่วนลดหรือห้องพักฟรีในการจองครั้งถัดไป',
    time: new Date(Date.now() - 26 * 3600_000),
    href: '/portal/loyalty',
    badge: 'Rewards',
    badgeColor: 'bg-rose-500/15 text-rose-700 dark:text-rose-400',
  },
  {
    id: 'promo-3',
    type: 'promo',
    icon: Sparkles,
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-500/12 dark:bg-violet-400/10',
    title: 'Spa Package สำหรับสมาชิก',
    body: 'จองห้อง Suite รับบริการนวดฟรี 60 นาที มูลค่า ฿800 ต่อคืน',
    time: new Date(Date.now() - 3 * 86400_000),
    badge: 'จำกัด',
    badgeColor: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  },
];

function buildNotifications(reservations: Reservation[]): NotifItem[] {
  const items: NotifItem[] = [];
  const now = Date.now();

  for (const r of reservations) {
    const hotel      = r.hotels as any;
    const checkInDate = r.check_in ? parseISO(r.check_in + 'T00:00:00') : null;
    const daysUntil  = checkInDate ? differenceInDays(checkInDate, new Date()) : null;

    if (r.status === 'checked_in') {
      items.push({
        id: r.id + '-checkin',
        type: 'booking',
        icon: CalendarCheck,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        iconBg: 'bg-emerald-500/12 dark:bg-emerald-400/10',
        title: `เช็คอินแล้วที่ ${hotel?.name || 'โรงแรม'}`,
        body: `ห้องพักพร้อมแล้ว · เช็คเอาท์ ${r.check_out ? format(parseISO(r.check_out + 'T00:00:00'), 'd MMM yy', { locale: th }) : '—'}`,
        time: new Date(now - 15 * 60_000),
        hotel,
        href: '/portal/stay',
        badge: 'กำลังเข้าพัก',
        badgeColor: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
        isNew: true,
      });
    } else if (r.status === 'confirmed' && daysUntil !== null && daysUntil >= 0 && daysUntil <= 7) {
      items.push({
        id: r.id + '-soon',
        type: 'booking',
        icon: Bell,
        iconColor: 'text-amber-700 dark:text-amber-400',
        iconBg: 'bg-amber-500/12 dark:bg-amber-400/10',
        title: daysUntil === 0 ? '🎉 วันนี้เป็นวันเช็คอิน!' : `เช็คอินอีก ${daysUntil} วัน`,
        body: `${hotel?.name || 'โรงแรม'} · รหัสจอง #${r.reservation_code}`,
        time: new Date(now - 60 * 60_000),
        hotel,
        href: '/portal/trips',
        badge: daysUntil === 0 ? 'วันนี้' : `${daysUntil} วัน`,
        badgeColor: daysUntil === 0 ? 'bg-amber-500 text-white' : 'bg-amber-500/15 text-amber-800 dark:text-amber-300',
        isNew: daysUntil <= 1,
      });
    } else if (r.status === 'confirmed') {
      items.push({
        id: r.id + '-confirmed',
        type: 'booking',
        icon: CalendarCheck,
        iconColor: 'text-sky-600 dark:text-sky-400',
        iconBg: 'bg-sky-500/12 dark:bg-sky-400/10',
        title: 'ยืนยันการจองสำเร็จ',
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
        iconColor: 'text-amber-600 dark:text-amber-400',
        iconBg: 'bg-amber-500/10 dark:bg-amber-400/8',
        title: 'ขอบคุณที่เลือกพักกับเรา',
        body: `${hotel?.name || 'โรงแรม'} · คุณได้รับแต้มสะสมจากการเข้าพักนี้`,
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
  if (diff < 3600_000)  return `${Math.max(1, Math.round(diff / 60_000))} นาทีที่แล้ว`;
  if (diff < 86400_000) return `${Math.round(diff / 3600_000)} ชม. ที่แล้ว`;
  if (diff < 7 * 86400_000) return `${Math.round(diff / 86400_000)} วันที่แล้ว`;
  return format(date, 'd MMM', { locale: th });
}

function groupByDay(items: NotifItem[]): { label: string; items: NotifItem[] }[] {
  const today     = new Date(); today.setHours(0,0,0,0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  const groups: Record<string, NotifItem[]> = {};
  for (const item of items) {
    const d = new Date(item.time); d.setHours(0,0,0,0);
    let key: string;
    if (d.getTime() === today.getTime())     key = 'วันนี้';
    else if (d.getTime() === yesterday.getTime()) key = 'เมื่อวาน';
    else key = format(d, 'd MMMM', { locale: th });
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}

export function MessagesClient({ firstName, reservations }: {
  firstName: string; reservations: Reservation[];
}) {
  const [activeFilter, setActiveFilter] = useState<Filter>('ทั้งหมด');

  const allNotifs = useMemo(() => buildNotifications(reservations), [reservations]);
  const newCount  = allNotifs.filter(n => n.isNew).length;

  const filtered = useMemo(() => {
    if (activeFilter === 'ทั้งหมด')   return allNotifs;
    if (activeFilter === 'การจอง')    return allNotifs.filter(n => n.type === 'booking');
    if (activeFilter === 'โปรโมชั่น') return allNotifs.filter(n => n.type === 'promo');
    return allNotifs.filter(n => n.type === 'system');
  }, [allNotifs, activeFilter]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center justify-between max-w-screen-sm mx-auto">
          <div className="flex items-center gap-2">
            <h1 className="font-display font-bold text-lg text-foreground tracking-tight">ข้อความ</h1>
            {newCount > 0 && (
              <span className="h-5 min-w-[1.25rem] px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                {newCount}
              </span>
            )}
          </div>
          <PortalThemeToggle />
        </div>
      </div>

      <div className="px-4 pt-4 pb-8 max-w-screen-sm mx-auto space-y-4">

        {/* ── Filter chips ── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-none">
            {FILTERS.map(f => {
              const count = f === 'ทั้งหมด' ? allNotifs.length
                : f === 'การจอง' ? allNotifs.filter(n => n.type === 'booking').length
                : f === 'โปรโมชั่น' ? allNotifs.filter(n => n.type === 'promo').length
                : allNotifs.filter(n => n.type === 'system').length;

              return (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={cn(
                    'flex-shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all',
                    activeFilter === f
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-secondary border border-border/40 text-muted-foreground hover:text-foreground',
                  )}>
                  {f}
                  {count > 0 && (
                    <span className={cn(
                      'h-4 min-w-[1rem] px-0.5 rounded-full text-[9px] font-bold flex items-center justify-center',
                      activeFilter === f ? 'bg-white/25 text-white' : 'bg-border text-muted-foreground',
                    )}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ── Notifications ── */}
        <AnimatePresence mode="wait">
          {grouped.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-3xl bg-secondary flex items-center justify-center mb-5">
                <MessageSquare className="h-9 w-9 text-muted-foreground/25" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">ไม่มีข้อความ</p>
              <p className="text-sm text-muted-foreground">การแจ้งเตือนและข้อความจะปรากฏที่นี่</p>
            </motion.div>
          ) : (
            <motion.div key={activeFilter} className="space-y-5">
              {grouped.map(({ label, items }) => (
                <div key={label}>
                  {/* Day label */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-px flex-1 bg-border/50" />
                    <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider px-1">{label}</span>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>

                  <div className="space-y-2">
                    {items.map((item, i) => {
                      const Icon = item.icon;
                      const inner = (
                        <motion.div custom={i} variants={v} initial="hidden" animate="show"
                          whileTap={{ scale: 0.985 }}
                          className={cn(
                            'flex items-start gap-3 rounded-2xl border p-4 transition-colors',
                            item.isNew
                              ? 'border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10'
                              : 'border-border/50 bg-card hover:bg-secondary/30',
                          )}>
                          {/* Icon or hotel image */}
                          <div className="relative shrink-0">
                            {item.hotel?.hero_image_url ? (
                              <div className="h-12 w-12 rounded-xl overflow-hidden relative border border-border/40">
                                <Image src={item.hotel.hero_image_url || PLACEHOLDER} alt="" fill className="object-cover" sizes="48px" />
                              </div>
                            ) : (
                              <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center', item.iconBg)}>
                                <Icon className={cn('h-5 w-5', item.iconColor)} strokeWidth={1.8} />
                              </div>
                            )}
                            {/* New dot */}
                            {item.isNew && (
                              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-blue-500 border-2 border-background" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-0.5">
                              <p className={cn('text-sm font-semibold leading-snug', item.isNew ? 'text-foreground' : 'text-foreground/90')}>
                                {item.title}
                              </p>
                              <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-0.5">{relativeTime(item.time)}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.body}</p>
                            {item.badge && (
                              <span className={cn('inline-flex items-center mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full', item.badgeColor)}>
                                {item.badge}
                              </span>
                            )}
                          </div>

                          {item.href && <ChevronRight className="h-4 w-4 text-muted-foreground/30 shrink-0 mt-1" />}
                        </motion.div>
                      );

                      return item.href ? (
                        <Link key={item.id} href={item.href}>{inner}</Link>
                      ) : (
                        <div key={item.id}>{inner}</div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
