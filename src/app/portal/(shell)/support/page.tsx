'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Phone, Mail, MessageCircle, Clock, HelpCircle, ChevronRight } from 'lucide-react';

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
    <div className="border-b border-border/40 last:border-0">
      <button onClick={() => setOpen(p => !p)}
        className="w-full flex items-center justify-between py-4 text-left">
        <span className="text-sm font-semibold text-foreground pr-4">{q}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-muted-foreground pb-4 leading-relaxed">{a}</p>}
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/90 dark:bg-background/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <Link href="/portal/home"
            className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground">ศูนย์ช่วยเหลือ</p>
          </div>
          <HelpCircle className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </div>

      <div className="px-4 py-5 pb-24 max-w-screen-sm mx-auto space-y-4">

        {/* Hero */}
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-500 p-6 text-center relative">
          <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute bottom-0 left-4 translate-y-6 h-20 w-20 rounded-full bg-white/8" />
          <div className="relative">
            <div className="text-4xl mb-3">🛎️</div>
            <h1 className="font-display font-bold text-white text-xl mb-1">ศูนย์ช่วยเหลือ Maitri</h1>
            <p className="text-white/70 text-sm">มีคำถาม? เราพร้อมช่วยเหลือตลอด 24/7</p>
          </div>
        </div>

        {/* Contact cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Phone,         label: 'โทรหาเรา',   sub: '02-000-0000',        href: 'tel:020000000',                      bg: 'bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
            { icon: Mail,          label: 'อีเมล',       sub: 'support@maitri.app', href: 'mailto:support@maitri.app',          bg: 'bg-sky-500/10',     color: 'text-sky-600 dark:text-sky-400' },
            { icon: MessageCircle, label: 'LINE',        sub: '@maitriapp',         href: 'https://line.me/ti/p/@maitriapp',   bg: 'bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
          ].map(({ icon: Icon, label, sub, href, bg, color }) => (
            <a key={label} href={href} target="_blank" rel="noreferrer"
              className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/60 p-4 text-center hover:shadow-md transition-shadow shadow-sm">
              <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <p className="font-semibold text-xs text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 break-all">{sub}</p>
            </a>
          ))}
        </div>

        {/* Hours */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/60 p-4 flex items-center gap-3 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
            <Clock className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">เวลาให้บริการ</p>
            <p className="text-xs text-muted-foreground mt-0.5">จันทร์–ศุกร์ 8:00–22:00 น. · เสาร์–อาทิตย์ 9:00–20:00 น.</p>
          </div>
        </div>

        {/* FAQ */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/60 p-5 shadow-sm">
          <h2 className="font-display font-bold text-foreground mb-4">คำถามที่พบบ่อย</h2>
          <div>
            {FAQS.map(f => <FAQItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-border/60 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-border/40">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">ลิงก์ที่เป็นประโยชน์</p>
          </div>
          <div className="divide-y divide-border/30">
            {[
              { label: 'ดูการจองของฉัน',            href: '/portal/trips' },
              { label: 'Maitri Rewards (แต้มสะสม)', href: '/portal/loyalty' },
              { label: 'แนะนำเพื่อน รับรางวัล',    href: '/portal/referrals' },
              { label: 'แก้ไขโปรไฟล์',             href: '/portal/profile' },
            ].map(({ label, href }) => (
              <Link key={href} href={href}
                className="flex items-center justify-between px-4 py-3.5 text-sm font-medium text-foreground hover:bg-secondary/40 transition-colors group">
                {label}
                <ChevronRight className="h-4 w-4 text-muted-foreground/35 group-hover:text-muted-foreground transition-colors" />
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
