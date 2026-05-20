'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Utensils, BedDouble, MessageSquare, Key, Receipt, BookOpen,
  Wifi, Clock, Phone, QrCode, ChevronRight, MapPin, LogOut,
  Sparkles, AlertTriangle, Loader2, CalendarDays,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO, differenceInDays } from 'date-fns';
import { th } from 'date-fns/locale';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=75&fit=crop';

type ServiceTile = {
  href: string;
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  badge?: string;
};

const SERVICES: ServiceTile[] = [
  { href: '/portal/services', icon: Utensils,      label: 'Room Service',    desc: 'สั่งอาหาร & เครื่องดื่ม', color: 'text-orange-500',  badge: '24 ชม.' },
  { href: '/portal/services', icon: BedDouble,     label: 'Housekeeping',    desc: 'แม่บ้าน / ของใช้ห้อง',     color: 'text-sky-500'   },
  { href: '/portal/services', icon: MessageSquare, label: 'Concierge',       desc: 'ขอความช่วยเหลือ',           color: 'text-violet-500' },
  { href: '/portal/keys',     icon: Key,           label: 'Digital Key',     desc: 'กุญแจห้องดิจิทัล',         color: 'text-blue-600 dark:text-blue-400' },
  { href: '/portal/folio',    icon: Receipt,       label: 'ค่าใช้จ่าย',    desc: 'รายการชาร์จ & ใบแจ้งหนี้',  color: 'text-emerald-500' },
  { href: '/portal/compendium',icon: BookOpen,     label: 'คู่มือโรงแรม',  desc: 'WiFi · เวลาบริการ · แผนที่',color: 'text-rose-500' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3, ease: [0.4,0,0.2,1] } }),
};

export function StayHubClient({
  reservation,
  upcomingReservations = [],
}: {
  reservation: any | null;
  upcomingReservations?: any[];
}) {
  const [scannedHotel, setScannedHotel] = useState<{ id: string; name: string; heroImage?: string } | null>(null);
  const [folioTotal, setFolioTotal] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('maitri_scanned_hotel');
      if (raw) setScannedHotel(JSON.parse(raw));
    } catch {}
    fetch('/api/guest/folio').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.reservation?.outstanding != null) setFolioTotal(d.reservation.outstanding);
    }).catch(() => {});
  }, []);

  // No active stay and no QR scan → show empty/upcoming state
  if (!reservation && !scannedHotel) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-[#f5f7fa]/95 dark:bg-background/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-border/40">
          <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto lg:max-w-2xl">
            <div>
              <p className="font-bold text-foreground">My Stay</p>
              <p className="text-[10px] text-muted-foreground">บริการห้องพัก</p>
            </div>
          </div>
        </div>

        <div className="px-4 pt-6 pb-24 max-w-screen-sm mx-auto lg:max-w-2xl space-y-5">
          {/* Upcoming reservations */}
          {upcomingReservations.length > 0 ? (
            <>
              <div>
                <h2 className="font-display font-semibold text-foreground mb-3">การจองที่กำลังมา</h2>
                <div className="space-y-3">
                  {upcomingReservations.map((res: any, i: number) => {
                    const h = res.hotels as any;
                    const rt = res.room_types as any;
                    const checkIn = res.check_in ? parseISO(res.check_in + 'T00:00:00') : null;
                    const checkOut = res.check_out ? parseISO(res.check_out + 'T00:00:00') : null;
                    const nights = checkIn && checkOut ? differenceInDays(checkOut, checkIn) : null;
                    const daysUntil = checkIn ? Math.max(0, differenceInDays(checkIn, new Date())) : null;
                    return (
                      <motion.div key={res.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06 }}>
                        <Link href="/portal/trips">
                          <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/60 shadow-sm overflow-hidden">
                            <div className="relative h-32 overflow-hidden">
                              <Image src={h?.hero_image_url || 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=75&fit=crop'}
                                alt={h?.name || ''} fill className="object-cover" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                              {daysUntil !== null && (
                                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm">
                                  <span className="text-[10px] font-bold text-white">
                                    {daysUntil === 0 ? 'วันนี้!' : `อีก ${daysUntil} วัน`}
                                  </span>
                                </div>
                              )}
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <p className="font-display font-bold text-white text-base leading-tight">{h?.name}</p>
                                {rt?.name && <p className="text-xs text-white/70 mt-0.5">{rt.name}</p>}
                              </div>
                            </div>
                            <div className="px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CalendarDays className="h-3.5 w-3.5 shrink-0" />
                                <span>
                                  {checkIn ? format(checkIn, 'd MMM', { locale: th }) : '—'}
                                  {' – '}
                                  {checkOut ? format(checkOut, 'd MMM', { locale: th }) : '—'}
                                  {nights ? ` · ${nights} คืน` : ''}
                                </span>
                              </div>
                              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                                ดูรายละเอียด <ChevronRight className="h-3 w-3" />
                              </span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* QR scan prompt (secondary) */}
              <div className="rounded-2xl border border-dashed border-gray-300 dark:border-border bg-white dark:bg-card px-4 py-5 flex flex-col items-center text-center gap-3">
                <QrCode className="h-7 w-7 text-muted-foreground" />
                <div>
                  <p className="text-sm font-semibold text-foreground">เมื่อถึงโรงแรม</p>
                  <p className="text-xs text-muted-foreground mt-0.5">สแกน QR Code ในห้องพักเพื่อเข้าถึงบริการทั้งหมด</p>
                </div>
                <Link href="/portal/scan"
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors">
                  <QrCode className="h-3.5 w-3.5" /> สแกน QR
                </Link>
              </div>
            </>
          ) : (
            /* No reservation and no upcoming → original empty state */
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="h-20 w-20 rounded-3xl bg-white dark:bg-card border border-gray-100 dark:border-border shadow-sm flex items-center justify-center mb-5">
                <QrCode className="h-9 w-9 text-muted-foreground" />
              </div>
              <h2 className="font-display text-xl font-semibold text-foreground mb-2">ยังไม่ได้เช็คอิน</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
                สแกน QR Code ในห้องพักเพื่อเข้าถึงบริการโรงแรม หรือเช็คอินผ่านการจองของคุณ
              </p>
              <Link href="/portal/scan"
                className="flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm">
                <QrCode className="h-4 w-4" /> สแกน QR ในห้อง
              </Link>
              <Link href="/portal/trips"
                className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
                ดูการจองของฉัน →
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  const hotel = reservation
    ? (reservation.hotels as any)
    : { name: scannedHotel!.name, hero_image_url: scannedHotel!.heroImage, id: scannedHotel!.id };
  const roomType = reservation ? (reservation.room_types as any) : null;
  const room     = reservation ? (reservation.rooms as any)     : null;
  const checkOut = reservation?.check_out;
  const nightsLeft = checkOut
    ? Math.max(0, differenceInDays(parseISO(checkOut + 'T00:00:00'), new Date()))
    : null;

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">

      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/95 dark:bg-background/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto lg:max-w-2xl">
          <div>
            <p className="font-bold text-foreground">My Stay</p>
            <p className="text-[10px] text-muted-foreground">
              {reservation
                ? (hotel.name || 'การเข้าพักปัจจุบัน')
                : 'บริการห้องพัก'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 max-w-screen-sm mx-auto lg:max-w-2xl space-y-5">

      {/* ── Hotel Hero ── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="relative rounded-2xl overflow-hidden h-44">
        <Image
          src={hotel.hero_image_url || PLACEHOLDER}
          alt={hotel.name}
          fill className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {reservation && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest">เช็คอินแล้ว</span>
            </div>
          )}
          <p className="font-display font-bold text-white text-xl leading-tight">{hotel.name}</p>
          <div className="flex items-center gap-3 mt-1">
            {room?.room_number && (
              <span className="text-sm text-white/80 font-medium">ห้อง {room.room_number}</span>
            )}
            {roomType?.name && (
              <span className="text-xs text-white/60">· {roomType.name}</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Stay info strip ── */}
      {reservation && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2">
          {[
            { label: 'เช็คอิน', value: reservation.check_in ? format(parseISO(reservation.check_in + 'T00:00:00'), 'd MMM', { locale: th }) : '—' },
            { label: 'เช็คเอาท์', value: checkOut ? format(parseISO(checkOut + 'T00:00:00'), 'd MMM', { locale: th }) : '—' },
            { label: 'คืนที่เหลือ', value: nightsLeft != null ? `${nightsLeft} คืน` : '—' },
          ].map(item => (
            <div key={item.label} className="rounded-xl bg-white dark:bg-card border border-gray-100 dark:border-border px-3 py-2.5 text-center">
              <p className="text-lg font-bold font-display text-foreground">{item.value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
            </div>
          ))}
        </motion.div>
      )}

      {/* ── Service tiles ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}>
        <h2 className="font-display font-semibold text-foreground mb-3">บริการโรงแรม</h2>
        <div className="grid grid-cols-3 gap-2.5">
          {SERVICES.map((svc, i) => {
            const Icon = svc.icon;
            const showBadge = svc.href === '/portal/folio' && folioTotal != null && folioTotal > 0;
            return (
              <motion.div key={svc.label} custom={i} variants={cardVariants} initial="hidden" animate="show">
                <Link href={svc.href}>
                  <div className="relative rounded-2xl border border-gray-100 dark:border-border bg-white dark:bg-card p-3.5 text-center hover:bg-secondary/60 transition-colors active:scale-95 transition-transform">
                    {showBadge && (
                      <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                    )}
                    <div className={cn('h-9 w-9 rounded-xl bg-secondary/80 flex items-center justify-center mx-auto mb-2', svc.color)}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-tight">{svc.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight line-clamp-2">{svc.desc}</p>
                    {svc.badge && (
                      <span className="mt-1.5 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        {svc.badge}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Hotel quick info ── */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <h2 className="font-display font-semibold text-foreground mb-3">ข้อมูลโรงแรม</h2>
        <div className="rounded-2xl border border-gray-100 dark:border-border bg-white dark:bg-card divide-y divide-border">
          <InfoRow icon={Clock} label="เวลาเช็คอิน / เช็คเอาท์"
            value={`${hotel.check_in_time || '14:00'} / ${hotel.check_out_time || '12:00'}`} />
          {hotel.phone && (
            <InfoRow icon={Phone} label="Front Desk" value={hotel.phone}
              href={`tel:${hotel.phone}`} />
          )}
          {hotel.city && (
            <InfoRow icon={MapPin} label="ที่ตั้ง" value={hotel.city} />
          )}
          <InfoRow icon={Wifi} label="WiFi" value="สอบถามที่ Front Desk" />
        </div>
      </motion.div>

      {/* ── Check-out / QR clear ── */}
      {!reservation && scannedHotel && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <button
            onClick={() => { localStorage.removeItem('maitri_scanned_hotel'); setScannedHotel(null); }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <LogOut className="h-4 w-4" /> ออกจากโหมดโรงแรม
          </button>
        </motion.div>
      )}

      {reservation && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
          <Link href="/portal/pre-checkout">
            <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/15">
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Express Check-out</p>
                  <p className="text-xs text-muted-foreground">เช็คเอาท์ออนไลน์ได้เลย</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </Link>
        </motion.div>
      )}

      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon, label, value, href,
}: { icon: React.ElementType; label: string; value: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3">
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
      {href && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
    </div>
  );
  return href ? <a href={href}>{content}</a> : <div>{content}</div>;
}
