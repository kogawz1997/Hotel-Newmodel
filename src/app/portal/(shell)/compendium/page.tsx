export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Wifi, Clock, UtensilsCrossed, Dumbbell, Car, Phone,
  Sparkles, MapPin, ChevronRight,
} from 'lucide-react';

export default async function CompendiumPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/compendium');

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, hotels(id, name, phone, email, check_in_time, check_out_time, address, city, currency)')
    .eq('guest_account_id', user.id)
    .in('status', ['checked_in', 'confirmed'])
    .order('check_in', { ascending: true })
    .limit(1)
    .maybeSingle();

  const hotel = reservation ? (reservation.hotels as any) : null;
  const ciTime  = hotel?.check_in_time  ? String(hotel.check_in_time).slice(0, 5)  : '14:00';
  const coTime  = hotel?.check_out_time ? String(hotel.check_out_time).slice(0, 5) : '12:00';

  const SECTIONS = [
    {
      icon: Wifi, title: 'อินเตอร์เน็ต Wi-Fi',
      color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-500/10',
      items: ['ชื่อเครือข่าย: Hotel_Guest', 'รหัสผ่าน: สอบถาม Front Desk', 'ครอบคลุมทุกพื้นที่ในโรงแรม'],
    },
    {
      icon: Clock, title: 'เวลาบริการ',
      color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-500/10',
      items: [
        `เช็คอิน: ${ciTime} น. | เช็คเอาท์: ${coTime} น.`,
        'Front Desk: 24 ชั่วโมง',
        'Room Service: 06:00–22:00 น.',
        'สระว่ายน้ำ: 07:00–21:00 น.',
      ],
    },
    {
      icon: UtensilsCrossed, title: 'อาหารและเครื่องดื่ม',
      color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-500/10',
      items: [
        'ร้านอาหาร: 07:00–22:00 น.',
        'Lobby Bar: 10:00–24:00 น.',
        'อาหารเช้า Buffet: 07:00–10:00 น.',
        'สั่ง Room Service ผ่านแอปได้เลย',
      ],
    },
    {
      icon: Dumbbell, title: 'สิ่งอำนวยความสะดวก',
      color: 'text-violet-600 dark:text-violet-400', bg: 'bg-violet-500/10',
      items: [
        'ฟิตเนส: 06:00–22:00 น.',
        'สปา & นวด: 09:00–21:00 น. (นัดล่วงหน้า)',
        'สระว่ายน้ำ: 07:00–21:00 น.',
        'ห้องประชุม: ติดต่อ Front Desk',
      ],
    },
    {
      icon: Car, title: 'การเดินทาง',
      color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10',
      items: [
        'บริการรถรับส่งสนามบิน: แจ้งล่วงหน้า 2 ชั่วโมง',
        'ที่จอดรถ: ใต้ดิน B1–B2 (ฟรีสำหรับผู้เข้าพัก)',
        'แท็กซี่ Meter: ติดต่อ Front Desk',
      ],
    },
    {
      icon: Phone, title: 'เบอร์โทรภายใน',
      color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-500/10',
      items: [
        `Front Desk: 0${hotel?.phone ? ` (${hotel.phone})` : ''}`,
        'Room Service: กด 1',
        'Housekeeping: กด 2',
        'สปา: กด 3',
        'ฝ่ายซ่อมบำรุง: กด 4',
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <Link href="/portal/stay"
            className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground truncate">{hotel?.name || 'คู่มือโรงแรม'}</p>
            {hotel?.city && (
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <MapPin className="h-2.5 w-2.5" />{hotel.city}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 pb-24 max-w-screen-sm mx-auto space-y-3">
        {hotel?.address && (
          <div className="rounded-2xl bg-card border border-border/60 p-4 flex items-start gap-3 shadow-sm">
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">ที่ตั้ง</p>
              <p className="text-sm text-foreground">{hotel.address}</p>
            </div>
          </div>
        )}

        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="rounded-2xl border border-border/60 bg-card overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
                  <Icon className={`h-4 w-4 ${s.color}`} strokeWidth={1.8} />
                </div>
                <p className="text-sm font-bold text-foreground">{s.title}</p>
              </div>
              <div className="divide-y divide-border/30">
                {s.items.map((item, i) => (
                  <p key={i} className="px-4 py-2.5 text-sm text-muted-foreground">{item}</p>
                ))}
              </div>
            </div>
          );
        })}

        <Link href="/portal/services">
          <div className="flex items-center gap-3.5 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/8 to-transparent px-4 py-3.5 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-amber-700 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">ต้องการบริการ?</p>
              <p className="text-xs text-muted-foreground">Room Service · Housekeeping · Spa</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
          </div>
        </Link>

        {hotel?.phone && (
          <a href={`tel:${hotel.phone}`}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-card border border-border/60 text-sm font-semibold shadow-sm hover:bg-secondary transition-colors">
            <Phone className="h-4 w-4 text-amber-700 dark:text-amber-400" />
            โทร Front Desk: {hotel.phone}
          </a>
        )}
      </div>
    </div>
  );
}
