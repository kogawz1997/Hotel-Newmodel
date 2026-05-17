'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Phone, Mail, MessageCircle, Clock } from 'lucide-react';

const FAQS = [
  { q: 'ฉันจะดูรหัสการจองได้จากที่ไหน?', a: 'รหัสการจองจะแสดงในอีเมลยืนยัน และในหน้า "การจองของฉัน" หลังเข้าสู่ระบบ' },
  { q: 'ยกเลิกการจองได้ไหม?', a: 'ขึ้นอยู่กับนโยบายของที่พักแต่ละแห่ง โดยทั่วไปสามารถยกเลิกฟรีหากยกเลิกล่วงหน้ามากกว่า 24 ชั่วโมง กดปุ่ม "ยกเลิก" ในหน้าการจองได้เลย' },
  { q: 'แก้ไขวันเช็คอิน-เช็คเอาท์ได้ไหม?', a: 'สามารถส่งคำขอเปลี่ยนวันได้ในหน้าการจอง ทางโรงแรมจะยืนยันผ่านอีเมลภายใน 24 ชั่วโมง ขึ้นอยู่กับห้องว่าง' },
  { q: 'ชำระเงินผ่านช่องทางไหนได้บ้าง?', a: 'รองรับ PromptPay, บัตรเครดิต/เดบิต, TrueMoney Wallet, โอนเงินผ่านธนาคาร และชำระที่โรงแรม (Pay at Hotel)' },
  { q: 'ถ้าชำระแล้วไม่ได้รับการยืนยันทำอย่างไร?', a: 'รอ 15 นาที ระบบจะตรวจสอบอัตโนมัติ ถ้ายังไม่ได้รับ กรุณาถ่ายสลิปและส่งมาที่ support@maitri.app หรือโทร 02-000-0000' },
  { q: 'Maitri Points คืออะไร?', a: 'แต้มสะสมจากการจองที่พัก 1 แต้มต่อ ฿100 นำไปใช้เป็นส่วนลดในการจองครั้งถัดไป ดูรายละเอียดในหน้า Maitri Rewards' },
  { q: 'ลืมรหัสผ่านทำอย่างไร?', a: 'ไปที่หน้า "ลืมรหัสผ่าน" กรอกอีเมลที่ลงทะเบียน ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านภายใน 5 นาที' },
  { q: 'สามารถจองห้องเดิมซ้ำได้ไหม?', a: 'ได้ กดปุ่ม "จองอีกครั้ง" ในหน้าประวัติการจอง ระบบจะโหลดข้อมูลที่พักเดิมให้โดยอัตโนมัติ' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between py-4 text-left">
        <span className="text-sm font-semibold text-foreground pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-muted-foreground pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-muted/50">
      <nav className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/portal/bookings" className="p-2 rounded-full hover:bg-muted">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium text-foreground">ศูนย์ช่วยเหลือ</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-28 space-y-5">

        {/* Hero */}
        <div className="bg-foreground rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🛎️</div>
          <h1 className="text-white font-bold text-xl mb-1">ศูนย์ช่วยเหลือ Maitri</h1>
          <p className="text-white/50 text-sm">มีคำถาม? เราพร้อมช่วยเหลือคุณตลอด 24/7</p>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Phone, label: 'โทรหาเรา', sub: '02-000-0000', href: 'tel:020000000', color: 'bg-emerald-50 text-emerald-700' },
            { icon: Mail, label: 'อีเมล', sub: 'support@maitri.app', href: 'mailto:support@maitri.app', color: 'bg-blue-50 text-blue-700' },
            { icon: MessageCircle, label: 'LINE', sub: '@maitriapp', href: 'https://line.me/ti/p/@maitriapp', color: 'bg-green-50 text-green-700' },
          ].map(({ icon: Icon, label, sub, href, color }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer"
              className="bg-card rounded-2xl border border-border p-4 text-center hover:shadow-md transition-shadow">
              <div className={`h-10 w-10 rounded-full ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-xs text-foreground">{label}</p>
              <p className="text-2xs text-muted-foreground mt-0.5 break-all">{sub}</p>
            </a>
          ))}
        </div>

        {/* Hours */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-[#C66A30] shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">เวลาให้บริการ</p>
            <p className="text-xs text-muted-foreground">จันทร์–ศุกร์ 8:00–22:00 น. · เสาร์–อาทิตย์ 9:00–20:00 น.</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-4">คำถามที่พบบ่อย</h2>
          <div>
            {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-bold text-foreground mb-4">ลิงก์ที่เป็นประโยชน์</h2>
          <div className="space-y-2">
            {[
              { label: 'ดูการจองของฉัน', href: '/portal/bookings' },
              { label: 'Maitri Rewards (แต้มสะสม)', href: '/portal/loyalty' },
              { label: 'แนะนำเพื่อน รับรางวัล', href: '/portal/referrals' },
              { label: 'แก้ไขโปรไฟล์', href: '/portal/profile' },
              { label: 'นโยบายความเป็นส่วนตัว', href: '/privacy' },
            ].map(({ label, href }) => (
              <Link key={href} href={href}
                className="flex items-center justify-between py-2.5 border-b border-border last:border-0 text-sm text-foreground hover:text-[#C66A30] transition-colors">
                {label}
                <ChevronDown className="h-4 w-4 -rotate-90 opacity-30" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
