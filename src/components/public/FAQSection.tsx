'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const FAQ_ITEMS = [
  {
    q: 'จองแล้วสามารถยกเลิกได้ไหม?',
    a: 'ขึ้นอยู่กับนโยบายของแต่ละที่พัก ห้องที่แสดง "ยกเลิกฟรี" สามารถยกเลิกได้โดยไม่มีค่าใช้จ่าย ตามระยะเวลาที่กำหนด คุณสามารถยกเลิกได้จากหน้า "การจองของฉัน" ในแอปได้เลย',
  },
  {
    q: 'ชำระเงินได้ผ่านช่องทางอะไรบ้าง?',
    a: 'รองรับบัตรเครดิต/เดบิต (Visa, Mastercard), PromptPay, และ QR Code ทุกธนาคาร ข้อมูลการชำระเงินเข้ารหัสด้วยมาตรฐาน SSL 256-bit ปลอดภัย 100%',
  },
  {
    q: 'Online Check-in ทำงานอย่างไร?',
    a: 'กรอกข้อมูลเช็คอินออนไลน์ล่วงหน้าได้ตั้งแต่ 24 ชั่วโมงก่อนวันเข้าพัก รับ QR Code เพื่อเช็คอินที่เคาน์เตอร์โดยไม่ต้องรอคิวกรอกเอกสาร',
  },
  {
    q: 'ราคาที่แสดงดีกว่า Agoda หรือ Booking.com อย่างไร?',
    a: 'เราเป็นช่องทางจองตรงกับโรงแรม ไม่ผ่าน OTA ดังนั้นโรงแรมประหยัดค่าคอมมิชชั่น 15-20% และส่วนหนึ่งตกมาเป็นส่วนลดให้คุณ รวมถึงได้รับสิทธิพิเศษที่ OTA ไม่มี',
  },
  {
    q: 'ไม่ได้รับอีเมลยืนยันการจองต้องทำอย่างไร?',
    a: 'ตรวจสอบโฟลเดอร์ Spam/Junk ก่อน หากยังไม่พบ เข้า "การจองของฉัน" ในแอปเพื่อดูสถานะการจอง หรือใช้ฟีเจอร์ "ค้นหาการจอง" ด้วยรหัสจองและอีเมล',
  },
  {
    q: 'แต้มสะสม Loyalty Points ใช้อย่างไร?',
    a: 'ทุกการจองจะได้รับแต้มสะสมโดยอัตโนมัติ แต้มสามารถนำมาใช้เป็นส่วนลดในการจองครั้งถัดไป ยิ่งจองบ่อยยิ่งได้สิทธิ์ระดับสูงขึ้น พร้อมสิทธิประโยชน์พิเศษเพิ่มเติม',
  },
];

export function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-24 bg-background">
      <div className="container max-w-7xl px-4">
        <div className="text-center mb-16">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C66A30] mb-3">FAQ</p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight mb-4">
            คำถามที่พบบ่อย
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-[0.95rem]">
            มีข้อสงสัยเพิ่มเติม? ทีมงานพร้อมช่วยเหลือตลอด 24 ชั่วโมง
          </p>
        </div>

        <div className="max-w-3xl mx-auto divide-y divide-border">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="py-5">
              <button
                className="flex items-center justify-between w-full text-left gap-4 group"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className={cn(
                  'font-medium text-base transition-colors',
                  open === i ? 'text-[#C66A30]' : 'text-foreground group-hover:text-[#C66A30]',
                )}>
                  {item.q}
                </span>
                <ChevronDown
                  className={cn(
                    'h-5 w-5 text-[#C66A30] shrink-0 transition-transform duration-300',
                    open === i && 'rotate-180',
                  )}
                />
              </button>
              {open === i && (
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed pr-9">
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
