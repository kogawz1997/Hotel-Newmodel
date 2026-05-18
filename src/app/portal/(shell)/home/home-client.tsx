'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, MapPin, ChevronRight, BedDouble, QrCode, Star, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=75&fit=crop';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.07, duration: 0.35, ease: [0.4,0,0.2,1] } }),
};

export function HomeClient({
  firstName,
  hotels,
  activeStay,
}: {
  firstName: string;
  hotels: any[];
  activeStay: any | null;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = query.trim()
    ? hotels.filter(h =>
        h.name?.toLowerCase().includes(query.toLowerCase()) ||
        h.city?.toLowerCase().includes(query.toLowerCase())
      )
    : hotels;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'อรุณสวัสดิ์' : hour < 17 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น';

  return (
    <div className="space-y-6 pb-4">

      {/* ── Greeting ── */}
      <motion.div initial="hidden" animate="show" custom={0} variants={fadeUp}>
        <p className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-400 font-medium">{greeting}</p>
        <h1 className="font-display text-2xl font-semibold text-foreground mt-0.5">
          {firstName ? `${firstName} 👋` : 'ยินดีต้อนรับ 👋'}
        </h1>
      </motion.div>

      {/* ── Active Stay Banner ── */}
      {activeStay && (
        <motion.div initial="hidden" animate="show" custom={1} variants={fadeUp}>
          <Link href="/portal/stay">
            <div className="relative rounded-2xl overflow-hidden h-32">
              <Image
                src={(activeStay.hotels as any)?.hero_image_url || PLACEHOLDER}
                alt={(activeStay.hotels as any)?.name || ''}
                fill className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
              <div className="absolute inset-0 p-4 flex items-end justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">เช็คอินแล้ว</span>
                  </div>
                  <p className="font-display font-semibold text-white text-base leading-tight">
                    {(activeStay.hotels as any)?.name}
                  </p>
                  <p className="text-xs text-white/70 mt-0.5">
                    ห้อง {(activeStay.rooms as any)?.room_number || '—'} · เช็คเอาท์{' '}
                    {activeStay.check_out
                      ? format(parseISO(activeStay.check_out + 'T00:00:00'), 'd MMM', { locale: th })
                      : '—'}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2">
                  <span className="text-xs font-semibold text-white">ดูบริการ</span>
                  <ChevronRight className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── Search bar ── */}
      <motion.div initial="hidden" animate="show" custom={2} variants={fadeUp}>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="ค้นหาโรงแรม หรือ เมือง..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-2xl text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 transition-all"
          />
        </div>
      </motion.div>

      {/* ── QR Scan shortcut (only when not checked in) ── */}
      {!activeStay && (
        <motion.div initial="hidden" animate="show" custom={3} variants={fadeUp}>
          <Link href="/portal/scan">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 dark:bg-amber-400/6 px-4 py-3.5">
              <div className="h-9 w-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center shrink-0">
                <QrCode className="h-4.5 w-4.5 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">สแกน QR ในห้องพัก</p>
                <p className="text-xs text-muted-foreground">รับบริการโรงแรมทันทีหลังเช็คอิน</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── Hotels list ── */}
      <motion.div initial="hidden" animate="show" custom={4} variants={fadeUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-foreground">
            {query ? `ผลการค้นหา (${filtered.length})` : 'ค้นพบที่พัก'}
          </h2>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground text-sm">ไม่พบโรงแรมที่ค้นหา</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((hotel, i) => (
              <motion.div
                key={hotel.id}
                custom={i}
                variants={fadeUp}
                initial="hidden"
                animate="show"
              >
                <Link href={`/h/${hotel.slug || hotel.id}`}>
                  <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 hover:bg-secondary/50 transition-colors">
                    <div className="relative h-20 w-24 rounded-xl overflow-hidden shrink-0">
                      <Image
                        src={hotel.hero_image_url || PLACEHOLDER}
                        alt={hotel.name}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-0.5">
                      <p className="font-display font-semibold text-foreground text-sm leading-snug line-clamp-1">
                        {hotel.name}
                      </p>
                      {hotel.city && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3 shrink-0" />{hotel.city}
                        </p>
                      )}
                      {hotel.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                          {hotel.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                          <Star className="h-3 w-3 fill-current" /> 4.8
                        </span>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <BedDouble className="h-3 w-3" /> จองได้เลย
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

    </div>
  );
}
