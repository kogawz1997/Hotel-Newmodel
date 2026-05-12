'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn, formatCurrency } from '@/lib/utils';
import { MapPin, Star, ChevronLeft, ChevronRight, CheckCircle, Coffee, Camera } from 'lucide-react';
import { WishlistButton } from '@/components/ui/wishlist-button';

function scoreLabel(r: number): { th: string; bg: string } {
  if (r >= 4.7) return { th: 'ยอดเยี่ยมมาก', bg: '#1d4ed8' };
  if (r >= 4.3) return { th: 'ยอดเยี่ยม',    bg: '#0284c7' };
  if (r >= 3.8) return { th: 'ดีมาก',        bg: '#059669' };
  if (r >= 3.5) return { th: 'ดี',           bg: '#16a34a' };
  return           { th: 'น่าสนใจ',        bg: '#d97706' };
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
  compact?: boolean;
}

export function HotelCard({ hotel, nights = 0, checkIn = '', checkOut = '' }: Props) {
  const imgs  = (hotel.gallery || []).filter(g => g.image_url);
  const price = hotel.min_rate ?? hotel.min_price ?? 0;
  const score = hotel.avg_rating ? scoreLabel(hotel.avg_rating) : null;
  const stars = Math.min(5, Math.max(0, hotel.star_rating || 0));

  const [imgIdx, setImgIdx]         = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const heroSrc = imgs[imgIdx]?.image_url || hotel.hero_image_url;

  function prevImg(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setImgIdx(p => (p - 1 + imgs.length) % imgs.length);
  }
  function nextImg(e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    setImgIdx(p => (p + 1) % imgs.length);
  }

  const bookHref = `/h/${hotel.slug}${checkIn ? `?checkIn=${checkIn}&checkOut=${checkOut}` : ''}`;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-black/5 hover:shadow-xl transition-all duration-300 group cursor-pointer">
      {/* Image */}
      <Link href={bookHref} className="block">
        <div className="relative h-52 bg-[#FAF7F2] overflow-hidden"
          onTouchStart={e => setTouchStartX(e.touches[0]?.clientX ?? null)}
          onTouchEnd={e => {
            if (touchStartX === null || imgs.length < 2) return;
            const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX;
            if (dx > 40) setImgIdx(p => (p - 1 + imgs.length) % imgs.length);
            if (dx < -40) setImgIdx(p => (p + 1) % imgs.length);
            setTouchStartX(null);
          }}
        >
          {heroSrc
            ? <img src={heroSrc} alt={hotel.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            : <div className="w-full h-full flex items-center justify-center text-5xl text-[#2A2522]/10 font-serif">{hotel.name?.charAt(0)}</div>
          }

          {/* Deal badge */}
          {hotel.deal_percent && hotel.deal_percent > 0 && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
              ลด {hotel.deal_percent}%
            </div>
          )}

          {/* Wishlist */}
          <div className="absolute top-3 right-3" onClick={e => e.preventDefault()}>
            <WishlistButton hotelId={hotel.id} />
          </div>

          {/* Photo count */}
          {imgs.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-2xs px-2 py-0.5 rounded-full flex items-center gap-1">
              <Camera className="h-2.5 w-2.5" />{imgs.length}
            </div>
          )}

          {/* Carousel arrows */}
          {imgs.length > 1 && (
            <>
              <button onClick={prevImg}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-7 w-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={nextImg}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 bg-white/80 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                <ChevronRight className="h-4 w-4" />
              </button>
              {/* Dots */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {imgs.slice(0, 5).map((_, i) => (
                  <button key={i} onClick={e => { e.preventDefault(); setImgIdx(i); }}
                    className={cn('h-1.5 rounded-full transition-all', i === imgIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/60')} />
                ))}
              </div>
            </>
          )}
        </div>
      </Link>

      {/* Info */}
      <Link href={bookHref} className="block p-4">
        {/* Stars + type */}
        <div className="flex items-center gap-1 mb-1.5">
          {stars > 0 && Array.from({ length: stars }).map((_, i) => (
            <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />
          ))}
          {hotel.type && (
            <span className="text-2xs text-[#2A2522]/40 ml-1 capitalize">{hotel.type.replace('_', ' ')}</span>
          )}
        </div>

        {/* Name + score badge */}
        <div className="flex items-start justify-between gap-2 mb-0.5">
          <h3 className="font-bold text-[#2A2522] text-sm leading-tight line-clamp-2 flex-1">{hotel.name}</h3>
          {score && hotel.avg_rating && (
            <div className="shrink-0 rounded-lg px-2 py-1 text-white text-sm font-bold leading-none" style={{ backgroundColor: score.bg }}>
              {hotel.avg_rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Score label + reviews */}
        {score && hotel.avg_rating && (
          <p className="text-xs font-semibold mb-0.5" style={{ color: score.bg }}>
            {score.th}
            {hotel.review_count ? <span className="font-normal text-[#2A2522]/40"> · {hotel.review_count} รีวิว</span> : null}
          </p>
        )}

        {/* Location */}
        <p className="text-xs text-[#2A2522]/50 flex items-center gap-1 mb-2">
          <MapPin className="h-3 w-3 shrink-0" />
          {hotel.city || 'Thailand'}
          {hotel.distance_km !== undefined && hotel.distance_km > 0 && (
            <span className="text-[#2A2522]/30"> · {hotel.distance_km < 1 ? `${Math.round(hotel.distance_km * 1000)} ม.` : `${hotel.distance_km.toFixed(1)} กม.`}</span>
          )}
        </p>

        {/* Amenity tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {hotel.is_free_cancel && (
            <span className="flex items-center gap-0.5 text-2xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle className="h-3 w-3" />ยกเลิกฟรี
            </span>
          )}
          {hotel.is_breakfast && (
            <span className="flex items-center gap-0.5 text-2xs text-amber-700 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">
              <Coffee className="h-3 w-3" />อาหารเช้า
            </span>
          )}
        </div>

        {/* Price + CTA */}
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-2xs text-[#2A2522]/40">ราคาเริ่มต้น / คืน</p>
            <p className="text-xl font-bold text-[#2A2522] leading-tight">{formatCurrency(price)}</p>
            {nights > 1 && price > 0 && (
              <p className="text-xs text-[#2A2522]/50">{nights} คืน · {formatCurrency(price * nights)}</p>
            )}
          </div>
          <div className="shrink-0 px-4 py-2 bg-[#C66A30] hover:bg-[#A4522A] text-white text-xs font-bold rounded-xl transition-colors">
            จองเลย
          </div>
        </div>
      </Link>
    </div>
  );
}
