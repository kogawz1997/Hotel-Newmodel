'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn, formatCurrency } from '@/lib/utils';
import { MapPin, Star, ChevronLeft, ChevronRight, CheckCircle, Coffee, Flame } from 'lucide-react';
import { WishlistButton } from '@/components/ui/wishlist-button';

function scoreLabel(r: number): { th: string; color: string } {
  if (r >= 4.7) return { th: 'ยอดเยี่ยมมาก', color: '#1d4ed8' };
  if (r >= 4.3) return { th: 'ยอดเยี่ยม',    color: '#0284c7' };
  if (r >= 3.8) return { th: 'ดีมาก',        color: '#059669' };
  if (r >= 3.5) return { th: 'ดี',           color: '#16a34a' };
  return           { th: 'น่าสนใจ',        color: '#d97706' };
}

export interface HotelCardData {
  id: string;
  slug: string;
  name: string;
  city?: string;
  country?: string;
  type?: string;
  hero_image_url?: string;
  gallery?: { image_url: string }[];
  star_rating?: number;
  avg_rating?: number | null;
  review_count?: number;
  min_rate?: number | null;
  min_price?: number | null;
  amenities?: string[];
  is_free_cancel?: boolean;
  is_breakfast?: boolean;
  deal_percent?: number;
  distance_km?: number;
  is_available?: boolean;
  tagline?: string;
}

interface Props {
  hotel: HotelCardData;
  nights?: number;
  checkIn?: string;
  checkOut?: string;
}

function bookingsToday(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  return 5 + Math.abs(h % 26);
}

export function HotelCard({ hotel, nights = 0, checkIn = '', checkOut = '' }: Props) {
  const imgs  = (hotel.gallery || []).filter(g => g.image_url);
  const price = hotel.min_rate ?? hotel.min_price ?? 0;
  const score = hotel.avg_rating ? scoreLabel(hotel.avg_rating) : null;
  const stars = Math.min(5, Math.max(0, hotel.star_rating || 0));

  const [imgIdx, setImgIdx]           = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const heroSrc  = imgs[imgIdx]?.image_url || hotel.hero_image_url;
  const bookHref = `/h/${hotel.slug}${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`;

  function prevImg(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setImgIdx(p => (p - 1 + imgs.length) % imgs.length);
  }
  function nextImg(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setImgIdx(p => (p + 1) % imgs.length);
  }

  return (
    <Link href={bookHref} className="block group">

      {/* ── Image ── */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden mb-3 bg-muted/40"
        onTouchStart={e => setTouchStartX(e.touches[0]?.clientX ?? null)}
        onTouchEnd={e => {
          if (touchStartX === null || imgs.length < 2) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX;
          if (dx > 40) setImgIdx(p => (p - 1 + imgs.length) % imgs.length);
          if (dx < -40) setImgIdx(p => (p + 1) % imgs.length);
          setTouchStartX(null);
        }}
      >
        {heroSrc ? (
          <Image src={heroSrc} alt={hotel.name} fill
            className="object-cover transition-transform duration-700 will-change-transform group-hover:scale-[1.06]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-7xl font-display text-muted-foreground/10">{hotel.name?.charAt(0)}</span>
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent" />

        {/* Deal badge */}
        {hotel.deal_percent && hotel.deal_percent > 0 && (
          <div className="absolute top-3 left-3 bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-lg tracking-wide">
            -{hotel.deal_percent}%
          </div>
        )}

        {/* Wishlist */}
        <div className="absolute top-3 right-3" onClick={e => e.preventDefault()}>
          <WishlistButton hotelId={hotel.id} />
        </div>

        {/* Rating pill — overlaid bottom-left */}
        {hotel.avg_rating && score && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-md text-white text-[12px] font-semibold px-2.5 py-1.5 rounded-full shadow-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {hotel.avg_rating.toFixed(1)}
            <span className="text-white/65 font-normal text-[11px]">{score.th}</span>
          </div>
        )}

        {/* Carousel dots — bottom right */}
        {imgs.length > 1 && (
          <div className="absolute bottom-3.5 right-3 flex gap-1">
            {imgs.slice(0, 5).map((_, i) => (
              <button key={i} onClick={e => { e.preventDefault(); setImgIdx(i); }}
                className={cn('h-1 rounded-full transition-all duration-300',
                  i === imgIdx ? 'w-5 bg-white' : 'w-1.5 bg-white/45')}
              />
            ))}
          </div>
        )}

        {/* Carousel arrows */}
        {imgs.length > 1 && (
          <>
            <button onClick={prevImg}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110">
              <ChevronLeft className="h-4 w-4 text-foreground" />
            </button>
            <button onClick={nextImg}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 bg-white/90 dark:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110">
              <ChevronRight className="h-4 w-4 text-foreground" />
            </button>
          </>
        )}
      </div>

      {/* ── Info ── */}
      <div className="space-y-1">
        {/* Name + stars */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-foreground text-[15px] leading-snug line-clamp-1 flex-1 group-hover:underline decoration-1 underline-offset-2">
            {hotel.name}
          </h3>
          {stars > 0 && (
            <div className="flex shrink-0 mt-0.5 gap-px">
              {Array.from({ length: stars }).map((_, i) => (
                <Star key={i} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
              ))}
            </div>
          )}
        </div>

        {/* Location */}
        <p className="text-sm text-muted-foreground flex items-center gap-1">
          <MapPin className="h-3 w-3 shrink-0" />
          <span>{hotel.city || 'Thailand'}</span>
          {hotel.distance_km !== undefined && hotel.distance_km > 0 && (
            <span className="opacity-60">
              · {hotel.distance_km < 1
                ? `${Math.round(hotel.distance_km * 1000)} ม.`
                : `${hotel.distance_km.toFixed(1)} กม.`}
            </span>
          )}
        </p>

        {/* Perks */}
        {(hotel.is_free_cancel || hotel.is_breakfast) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5">
            {hotel.is_free_cancel && (
              <span className="flex items-center gap-1 text-[12px] text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="h-3 w-3" />ยกเลิกฟรี
              </span>
            )}
            {hotel.is_breakfast && (
              <span className="flex items-center gap-1 text-[12px] text-amber-600 dark:text-amber-400 font-medium">
                <Coffee className="h-3 w-3" />อาหารเช้า
              </span>
            )}
          </div>
        )}

        {/* Social proof */}
        <div className="flex items-center gap-1 text-[11px] text-rose-500/80 dark:text-rose-400/80">
          <Flame className="h-2.5 w-2.5" />
          <span>จองแล้ว {bookingsToday(hotel.id)} ครั้งวันนี้</span>
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-between pt-0.5">
          <div>
            <span className="text-[17px] font-bold text-foreground leading-none">
              {formatCurrency(price)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">/ คืน</span>
          </div>
          {nights > 1 && price > 0 && (
            <span className="text-xs text-muted-foreground">
              {nights} คืน · {formatCurrency(price * nights)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
