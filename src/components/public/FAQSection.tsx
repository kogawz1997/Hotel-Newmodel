'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: 'ระบบใช้งานได้กับโรงแรมขนาดไหน?',
    a: 'ตั้งแต่ 5 ห้องถึง 1,000+ ห้อง รองรับทุกขนาด',
  },
  {
    q: 'ต้องติดตั้งซอฟต์แวร์เพิ่มเติมไหม?',
    a: 'ไม่ต้องติดตั้งอะไร ใช้งานผ่านเว็บเบราว์เซอร์ได้เลย',
  },
  {
    q: 'มีระบบ OTA เชื่อมต่อกี่ช่องทาง?',
    a: 'Booking.com, Agoda, Airbnb, Expedia และอื่นๆ รวม 20+ ช่องทาง',
  },
  {
    q: 'ข้อมูลลูกค้าปลอดภัยแค่ไหน?',
    a: 'เข้ารหัส SSL 256-bit ปฏิบัติตาม PDPA',
  },
  {
    q: 'ทดลองใช้ฟรีได้ไหม?',
    a: 'ทดลองใช้ฟรี 14 วัน ไม่ต้องใส่บัตรเครดิต',
  },
  {
    q: 'มีการ support ภาษาไทยไหม?',
    a: 'ทีม support พูดภาษาไทย ตอบไว ทุกวัน 8:00-22:00',
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 bg-white">
      <div className="container max-w-7xl px-4">
        <div className="text-center mb-16">
          <div className="overline text-[#C66A30] mb-4">FAQ</div>
          <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mb-4">
            คำถามที่พบบ่อย
          </h2>
          <p className="text-[#2A2522]/60 max-w-xl mx-auto">
            มีข้อสงสัยเพิ่มเติม? ติดต่อทีมงานได้ตลอดเวลา
          </p>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-black/8">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="py-5">
              <button
                className="flex items-center justify-between w-full text-left gap-4 group"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="font-medium text-[#2A2522] text-base group-hover:text-[#C66A30] transition-colors">
                  {item.q}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-[#C66A30] shrink-0 transition-transform duration-300 ${
                    open === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {open === i && (
                <p className="mt-3 text-sm text-[#2A2522]/60 leading-relaxed pr-9">
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
