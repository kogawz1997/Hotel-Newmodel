export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { ArrowLeft, Wifi, Clock, UtensilsCrossed, Dumbbell, Car, Phone, Star, Info } from 'lucide-react';

const SECTIONS = [
  {
    icon: Wifi, title: 'อินเตอร์เน็ต Wi-Fi',
    items: ['ชื่อ: Hotel_Guest', 'รหัสผ่าน: Welcome2024', 'ความเร็ว: 100 Mbps', 'ใช้ได้ทุกพื้นที่ในโรงแรม'],
  },
  {
    icon: Clock, title: 'เวลาบริการ',
    items: ['เช็คอิน: 14:00 | เช็คเอาท์: 12:00', 'Front Desk: 24 ชั่วโมง', 'Room Service: 06:00–22:00', 'สระว่ายน้ำ: 07:00–21:00'],
  },
  {
    icon: UtensilsCrossed, title: 'อาหารและเครื่องดื่ม',
    items: ['ร้านอาหาร: 07:00–22:00', 'Lobby Bar: 10:00–24:00', 'Room Service: 06:00–22:00', 'อาหารเช้า (Buffet): 07:00–10:00'],
  },
  {
    icon: Dumbbell, title: 'สิ่งอำนวยความสะดวก',
    items: ['ฟิตเนส: 06:00–22:00', 'สปา: 09:00–21:00 (นัดหมายล่วงหน้า)', 'สระว่ายน้ำ: ชั้น 5', 'ห้องประชุม: ติดต่อ Front Desk'],
  },
  {
    icon: Car, title: 'การเดินทาง',
    items: ['บริการรถรับส่ง: แจ้งล่วงหน้า 2 ชั่วโมง', 'ที่จอดรถ: ใต้ดิน ชั้น B1-B2 (ฟรี)', 'แท็กซี่: Front Desk จัดให้', 'BTS/MRT: 10 นาที (เดิน)'],
  },
  {
    icon: Phone, title: 'เบอร์โทรสำคัญ',
    items: ['Front Desk: 0', 'Room Service: 1', 'Housekeeping: 2', 'สปา: 3', 'ช่าง: 4'],
  },
];

export default function CompendiumPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-20">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/portal" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-semibold">คู่มือโรงแรม</h1>
            <p className="text-xs text-muted-foreground">Hotel Compendium</p>
          </div>
        </div>

        <div className="space-y-4">
          {SECTIONS.map(s => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/30 border-b border-border">
                  <Icon className="h-4 w-4 text-primary" />
                  <p className="text-sm font-semibold">{s.title}</p>
                </div>
                <div className="divide-y divide-border/50">
                  {s.items.map((item, i) => (
                    <p key={i} className="px-4 py-2.5 text-sm text-muted-foreground">{item}</p>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex gap-3">
            <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">ต้องการความช่วยเหลือ?</p>
              <p className="text-xs text-muted-foreground mt-0.5">ติดต่อ Concierge ได้ตลอด 24 ชั่วโมง กด 0 จากโทรศัพท์ในห้อง</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
