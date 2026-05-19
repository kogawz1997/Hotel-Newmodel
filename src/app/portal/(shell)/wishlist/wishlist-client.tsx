'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { Heart, MapPin, ArrowLeft, Users, Maximize2, ChevronRight, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

export function WishlistClient({ guest, wishlists: initial }: { guest: any; wishlists: any[] }) {
  const [items, setItems] = useState(initial);

  async function remove(id: string) {
    const res = await fetch(`/api/guest/wishlist?id=${id}`, { method: 'DELETE' });
    if (!res.ok) { toast.error('ลบไม่สำเร็จ'); return; }
    setItems(p => p.filter(i => i.id !== id));
    toast.success('ลบออกจาก Wishlist แล้ว');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <Link href="/portal/home"
            className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground">ที่บันทึกไว้</p>
            <p className="text-[10px] text-muted-foreground">{items.length} รายการ</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 pb-24 max-w-screen-sm mx-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-full bg-rose-500/10 border border-dashed border-rose-500/30 flex items-center justify-center mb-5">
              <Heart className="h-9 w-9 text-rose-500/40" />
            </div>
            <h2 className="font-display font-bold text-foreground text-lg mb-2">ยังไม่มีรายการโปรด</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-[220px]">
              กดไอคอน ❤️ ที่หน้าโรงแรมเพื่อบันทึกที่พักที่คุณสนใจ
            </p>
            <Link href="/portal/home"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-semibold hover:bg-blue-700 transition-colors">
              ค้นหาที่พัก <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, i) => {
              const hotel = item.hotels as any;
              const rt = item.room_types as any;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm"
                >
                  <div className="relative h-44 bg-muted/40 overflow-hidden">
                    {hotel?.hero_image_url ? (
                      <Image src={hotel.hero_image_url} alt={hotel.name}
                        fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-500/10 to-amber-600/5">
                        <span className="text-6xl text-amber-500/20 font-serif">{hotel?.name?.charAt(0)}</span>
                      </div>
                    )}
                    {/* Heart button */}
                    <button onClick={() => remove(item.id)}
                      className="absolute top-3 right-3 h-9 w-9 bg-card/85 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-105 transition-transform">
                      <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                    </button>
                    {/* City chip */}
                    {hotel?.city && (
                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1">
                        <MapPin className="h-3 w-3 text-white/80" />
                        <span className="text-[11px] text-white font-medium">{hotel.city}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-display font-bold text-foreground mb-1">{hotel?.name}</h3>

                    {rt && (
                      <div className="mt-2 p-3 bg-muted/40 rounded-xl border border-border/40">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground">{rt.name}</span>
                          <span className="text-sm font-bold text-orange-500">
                            {formatCurrency(rt.base_rate)}<span className="text-xs font-normal text-muted-foreground">/คืน</span>
                          </span>
                        </div>
                        <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                          {rt.max_occupancy && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />{rt.max_occupancy} คน
                            </span>
                          )}
                          {rt.size_sqm && (
                            <span className="flex items-center gap-1">
                              <Maximize2 className="h-3 w-3" />{rt.size_sqm} ตร.ม.
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 mt-3">
                      <Link href={`/h/${hotel?.slug || hotel?.id}`}
                        className="flex-1 text-center py-2.5 border border-border/60 rounded-xl text-xs font-semibold text-foreground hover:bg-secondary transition-colors">
                        ดูรายละเอียด
                      </Link>
                      <Link href={`/booking/${hotel?.slug || hotel?.id}`}
                        className="flex-1 text-center py-2.5 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5">
                        <Calendar className="h-3 w-3" /> จองเลย
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
