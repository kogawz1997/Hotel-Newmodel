'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Utensils, BedDouble, MessageSquare, Key, Receipt, BookOpen,
  Wifi, Clock, Phone, QrCode, ChevronRight, MapPin, LogOut,
  Sparkles, AlertTriangle, Loader2,
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
  { href: '/portal/keys',     icon: Key,           label: 'Digital Key',     desc: 'กุญแจห้องดิจิทัล',         color: 'text-amber-600 dark:text-amber-400' },
  { href: '/portal/folio',    icon: Receipt,       label: 'ค่าใช้จ่าย',    desc: 'รายการชาร์จ & ใบแจ้งหนี้',  color: 'text-emerald-500' },
  { href: '/portal/compendium',icon: BookOpen,     label: 'คู่มือโรงแรม',  desc: 'WiFi · เวลาบริการ · แผนที่',color: 'text-rose-500' },
];

const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.3, ease: [0.4,0,0.2,1] } }),
};

export function StayHubClient({ reservation }: { reservation: any | null }) {
  const [scannedHotel, setScannedHotel] = useState<{ id: string; name: string; heroImage?: string } | null>(null);
  const [folioTotal, setFolioTotal] = useState<number | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('maitri_scanned_hotel');
      if (raw) setScannedHotel(JSON.parse(raw));
    } catch {}
    // Fetch folio outstanding amount
    fetch('/api/guest/folio').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.reservation?.outstanding != null) setFolioTotal(d.reservation.outstanding);
    }).catch(() => {});
  }, []);

  // No active stay and no QR scan → show empty state
  if (!reservation && !scannedHotel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <div className="h-20 w-20 rounded-3xl bg-secondary flex items-center justify-center mb-5">
          <QrCode className="h-9 w-9 text-muted-foreground" />
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">ยังไม่ได้เช็คอิน</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-xs leading-relaxed">
          สแกน QR Code ในห้องพักเพื่อเข้าถึงบริการโรงแรม หรือเช็คอินผ่านการจองของคุณ
        </p>
        <Link href="/portal/scan"
          className="flex items-center gap-2 px-5 py-3 bg-amber-600 dark:bg-amber-500 text-white rounded-2xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <QrCode className="h-4 w-4" /> สแกน QR ในห้อง
        </Link>
        <Link href="/portal/bookings"
          className="mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
          ดูการจองของฉัน →
        </Link>
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
    <div className="space-y-5 pb-4">

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
            <div key={item.label} className="rounded-xl bg-card border border-border px-3 py-2.5 text-center">
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
                  <div className="relative rounded-2xl border border-border bg-card p-3.5 text-center hover:bg-secondary/60 transition-colors active:scale-95 transition-transform">
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
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {hotel.check_in_time && (
            <InfoRow icon={Clock} label="เวลาเช็คอิน / เช็คเอาท์"
              value={`${hotel.check_in_time || '14:00'} / ${hotel.check_out_time || '12:00'}`} />
          )}
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
            <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/8 dark:bg-amber-400/6">
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4 text-amber-700 dark:text-amber-400" />
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
