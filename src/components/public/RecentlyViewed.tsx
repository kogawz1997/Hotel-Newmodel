'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, ChevronRight } from 'lucide-react';

interface ViewedHotel {
  id: string;
  slug: string;
  name: string;
  city?: string;
  hero_image_url?: string;
  min_rate?: number;
  avg_rating?: number;
  viewedAt: number;
}

const STORAGE_KEY = 'maitri_recently_viewed';

export function trackHotelView(hotel: Omit<ViewedHotel, 'viewedAt'>) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: ViewedHotel[] = raw ? JSON.parse(raw) : [];
    const filtered = list.filter(h => h.id !== hotel.id);
    const updated = [{ ...hotel, viewedAt: Date.now() }, ...filtered].slice(0, 6);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {}
}

export function RecentlyViewed() {
  const [hotels, setHotels] = useState<ViewedHotel[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHotels(JSON.parse(raw).slice(0, 4));
    } catch {}
  }, []);

  if (hotels.length === 0) return null;

  return (
    <section className="py-12 px-4 bg-white border-t border-black/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[#2563eb]" />
            <h2 className="text-xl font-bold text-foreground">ที่พักที่ดูล่าสุด</h2>
          </div>
          <Link href="/search" className="text-sm text-[#2563eb] hover:underline flex items-center gap-1">
            ดูทั้งหมด <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {hotels.map(h => (
            <Link key={h.id} href={`/h/${h.slug}`}
              className="bg-[#FAF7F2] rounded-2xl overflow-hidden border border-black/5 hover:shadow-md transition-shadow group">
              <div className="h-32 bg-foreground/10 overflow-hidden relative">
                {h.hero_image_url
                  ? <Image src={h.hero_image_url} alt={h.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl font-serif text-foreground/10">{h.name.charAt(0)}</div>
                }
              </div>
              <div className="p-3">
                <p className="font-semibold text-xs text-foreground line-clamp-1">{h.name}</p>
                {h.city && <p className="text-2xs text-foreground/40 mt-0.5">{h.city}</p>}
                {h.min_rate && (
                  <p className="text-xs font-bold text-[#2563eb] mt-1">฿{h.min_rate.toLocaleString()}<span className="font-normal text-foreground/40">/คืน</span></p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
