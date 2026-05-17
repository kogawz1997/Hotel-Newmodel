import Link from 'next/link';
import Image from 'next/image';
import { SearchHeader } from '@/components/public/SearchHeader';
import { FAQSection } from '@/components/public/FAQSection';
import { SeasonalBanner } from '@/components/public/SeasonalBanner';
import { RecentlyViewed } from '@/components/public/RecentlyViewed';
import { IMAGES } from '@/lib/images';
import { ArrowRight, ChevronRight, Star, ShieldCheck, Tag, CreditCard, Search, CalendarCheck, Heart } from 'lucide-react';

const DESTINATIONS = [
  { name: 'Bangkok',    nameTh: 'กรุงเทพฯ',    img: IMAGES.bangkok,   hotels: 1240 },
  { name: 'Chiang Mai', nameTh: 'เชียงใหม่',    img: IMAGES.chiangMai, hotels: 420  },
  { name: 'Phuket',     nameTh: 'ภูเก็ต',      img: IMAGES.phuket,    hotels: 890  },
  { name: 'Samui',      nameTh: 'เกาะสมุย',    img: IMAGES.samui,     hotels: 310  },
  { name: 'Krabi',      nameTh: 'กระบี่',      img: IMAGES.krabi,     hotels: 260  },
  { name: 'Chiang Rai', nameTh: 'เชียงราย',    img: IMAGES.chiangRai, hotels: 180  },
];

const TRUST_SIGNALS = [
  { icon: Tag,          title: 'ราคาดีที่สุด',      desc: 'จองตรงกับโรงแรม ได้ราคาพิเศษกว่า OTA' },
  { icon: ShieldCheck,  title: 'ยกเลิกฟรี',         desc: 'เลือกเรทที่ยกเลิกได้ฟรี ไม่มีค่าปรับ' },
  { icon: CreditCard,   title: 'ชำระเงินปลอดภัย',   desc: 'รองรับทุกธนาคาร PromptPay และบัตรเครดิต' },
];

const HOW_IT_WORKS = [
  { icon: Search,        step: '01', title: 'ค้นหาที่พัก',     desc: 'เลือกปลายทาง วันที่ และจำนวนผู้เข้าพักที่ต้องการ' },
  { icon: CalendarCheck, step: '02', title: 'จองและชำระเงิน',  desc: 'เลือกห้อง ยืนยันการจอง และชำระเงินอย่างปลอดภัย' },
  { icon: Heart,         step: '03', title: 'เช็กอินและพัก',   desc: 'รับ QR Code เช็กอิน พร้อมจัดการการเดินทางผ่านแอป' },
];

const TESTIMONIALS = [
  {
    quote: 'จองง่ายมาก ราคาดีกว่า Agoda เยอะเลย ห้องก็ได้ตามที่จอง แนะนำมากๆ',
    name: 'คุณนภัสสร มีสุข',
    trip: 'เดินทางคู่ · ภูเก็ต',
    rating: 5,
    avatar: '👩',
  },
  {
    quote: 'ยกเลิกง่ายมาก ไม่มีค่าปรับ และมี AI ช่วยตอบคำถามตอนดึกๆ ด้วย ประทับใจมาก',
    name: 'คุณธีรพล วิไลพร',
    trip: 'เดินทางครอบครัว · เชียงใหม่',
    rating: 5,
    avatar: '👨',
  },
  {
    quote: 'ระบบ Check-in ออนไลน์สะดวกมาก ไม่ต้องรอที่เคาน์เตอร์ แถมยังได้โปรโมชั่นพิเศษด้วย',
    name: 'คุณปิยะนุช ศรีสุวรรณ',
    trip: 'เดินทางเดี่ยว · กรุงเทพฯ',
    rating: 5,
    avatar: '👩',
  },
];

const SOCIAL_PROVIDERS = [
  {
    label: 'Google',
    className: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden>
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    className: 'bg-[#1877F2] border border-[#1877F2] text-white hover:bg-[#166FE5]',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-white" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'Apple',
    className: 'bg-black border border-black text-white hover:bg-black/80',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-white" aria-hidden>
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
];

export default function GuestHomePage() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2A2522]">

      {/* ─── Navigation ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#2A2522]/85 backdrop-blur-xl">
        <div className="container max-w-7xl flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-[#C66A30] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-serif text-xl font-medium text-white tracking-tight">Maitri</span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <Link href="/search" className="hover:text-white transition-colors">ค้นหาที่พัก</Link>
            <a href="#destinations" className="hover:text-white transition-colors">จุดหมาย</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">วิธีจอง</a>
            <a href="#reviews" className="hover:text-white transition-colors">รีวิว</a>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/portal/login"
              className="text-sm text-white/70 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all"
            >
              เข้าสู่ระบบ
            </Link>
            <Link
              href="/portal/login"
              className="text-sm bg-[#C66A30] hover:bg-[#A4522A] text-white px-5 py-2 rounded-full font-medium transition-colors"
            >
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <video
            autoPlay muted loop playsInline
            poster={IMAGES.heroLobby}
            className="w-full h-full object-cover"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1614]/70 via-[#1A1614]/50 to-[#1A1614]/85" />
        </div>

        <div className="container max-w-7xl px-4 pt-24 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 mb-6">
              <div className="badge-luxury">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                จองตรงกับโรงแรม — ราคาดีที่สุด ไม่มีค่าธรรมเนียมซ่อน
              </div>
            </div>

            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium text-white leading-[0.95] tracking-tight mb-6">
              ค้นหาที่พัก<br/>
              <span className="italic gradient-text">ในฝัน</span><br/>
              ทั่วประเทศไทย
            </h1>

            <p className="text-lg text-white/70 leading-relaxed max-w-xl mb-8">
              จองโรงแรม รีสอร์ท และที่พักตากอากาศ ราคาดีที่สุด Check-in ออนไลน์
              และจัดการการเดินทางผ่านแอปได้ทุกที่
            </p>

            <div className="mb-8">
              <SearchHeader variant="hero" />
            </div>

            {/* Social login prompt */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <span className="text-white/50 text-sm shrink-0">เข้าสู่ระบบด้วย</span>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_PROVIDERS.map(p => (
                  <Link
                    key={p.label}
                    href="/portal/login"
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${p.className}`}
                  >
                    {p.icon}
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 animate-float">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* ─── Trust signals ───────────────────────────────────────────────── */}
      <section className="bg-[#2A2522] py-10">
        <div className="container max-w-7xl px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {TRUST_SIGNALS.map(t => {
              const Icon = t.icon;
              return (
                <div key={t.title} className="flex items-center gap-4">
                  <div className="h-10 w-10 bg-[#C66A30]/20 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-[#C66A30]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{t.title}</p>
                    <p className="text-xs text-white/40 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Seasonal Campaign ────────────────────────────────────────────── */}
      <SeasonalBanner />

      {/* ─── Recently Viewed ─────────────────────────────────────────────── */}
      <RecentlyViewed />

      {/* ─── Destinations ─────────────────────────────────────────────────── */}
      <section id="destinations" className="py-16 bg-white/50">
        <div className="container max-w-7xl px-4">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="overline text-[#C66A30] mb-1">สำรวจ</p>
              <h2 className="font-serif text-3xl md:text-4xl font-medium">จุดหมายยอดนิยม</h2>
            </div>
            <Link href="/search" className="hidden md:flex items-center gap-1 text-sm text-[#C66A30] hover:underline">
              ดูทั้งหมด <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {DESTINATIONS.slice(0, 2).map(d => (
              <Link key={d.name} href={`/search?city=${d.name}`}
                className="relative rounded-2xl overflow-hidden h-48 md:h-64 group cursor-pointer">
                <Image src={d.img} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-white font-bold text-lg">{d.nameTh}</p>
                  <p className="text-white/70 text-xs">{d.hotels.toLocaleString()} ที่พัก</p>
                </div>
              </Link>
            ))}
            <div className="grid grid-rows-2 gap-3 md:gap-4">
              {DESTINATIONS.slice(2, 4).map(d => (
                <Link key={d.name} href={`/search?city=${d.name}`}
                  className="relative rounded-2xl overflow-hidden h-[calc(50%-6px)] min-h-[100px] group cursor-pointer">
                  <Image src={d.img} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-semibold text-sm">{d.nameTh}</p>
                    <p className="text-white/60 text-xs">{d.hotels.toLocaleString()} ที่พัก</p>
                  </div>
                </Link>
              ))}
            </div>
            {DESTINATIONS.slice(4).map(d => (
              <Link key={d.name} href={`/search?city=${d.name}`}
                className="relative rounded-2xl overflow-hidden h-28 md:h-36 group cursor-pointer hidden md:block">
                <Image src={d.img} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-semibold text-sm">{d.nameTh}</p>
                  <p className="text-white/60 text-xs">{d.hotels.toLocaleString()} ที่พัก</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-[#FAF7F2]">
        <div className="container max-w-7xl px-4">
          <div className="text-center mb-16">
            <p className="overline text-[#C66A30] mb-4">ง่ายมาก</p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight">
              จองที่พักใน<br/>
              <span className="italic text-[#C66A30]">3 ขั้นตอน</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map(step => {
              const Icon = step.icon;
              return (
                <div key={step.step} className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="h-16 w-16 bg-[#C66A30]/10 rounded-2xl flex items-center justify-center">
                      <Icon className="h-7 w-7 text-[#C66A30]" />
                    </div>
                    <span className="absolute -top-2 -right-2 h-6 w-6 bg-[#2A2522] text-white rounded-full text-xs font-bold flex items-center justify-center">
                      {step.step.slice(1)}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#2A2522] text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-[#2A2522]/60 leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ─── Testimonials ────────────────────────────────────────────────── */}
      <section id="reviews" className="py-24 bg-[#2A2522]">
        <div className="container max-w-7xl px-4">
          <div className="text-center mb-16">
            <div className="overline text-[#C66A30] mb-4">รีวิวจากนักท่องเที่ยว</div>
            <h2 className="font-serif text-4xl font-medium text-white">
              ประสบการณ์จริง<br/>
              <span className="italic text-[#C66A30]">จากผู้ใช้ทั่วไทย</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="glass rounded-3xl p-6">
                <div className="flex mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 border-t border-white/10 pt-4">
                  <div className="h-10 w-10 bg-white/10 rounded-full flex items-center justify-center text-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{t.name}</p>
                    <p className="text-xs text-white/40">{t.trip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative py-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <Image src={IMAGES.heroBeach} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-[#1A1614]/75" />
        </div>
        <div className="container max-w-3xl px-4 text-center">
          <div className="overline text-[#C66A30] mb-4">เริ่มต้นวันนี้</div>
          <h2 className="font-serif text-4xl md:text-6xl font-medium text-white mb-6">
            สมัครฟรี<br/>
            <span className="italic text-[#C66A30]">จองง่าย ราคาดีที่สุด</span>
          </h2>
          <p className="text-white/60 mb-10 text-lg">
            สมัครสมาชิกฟรี เข้าถึงราคาพิเศษ ติดตามการจอง และ Check-in ออนไลน์
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Link href="/portal/login"
              className="btn-shimmer flex items-center gap-2 bg-[#C66A30] text-white px-8 py-4 rounded-full font-medium hover:bg-[#A4522A] transition-colors">
              สมัครสมาชิกฟรี <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/search"
              className="flex items-center gap-2 glass text-white px-8 py-4 rounded-full font-medium hover:bg-white/15 transition-colors">
              ค้นหาที่พัก
            </Link>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {SOCIAL_PROVIDERS.map(p => (
              <Link
                key={p.label}
                href="/portal/login"
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${p.className}`}
              >
                {p.icon}
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#1A1614] py-12">
        <div className="container max-w-7xl px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-[#C66A30] rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="font-serif text-xl font-medium text-white">Maitri</span>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                จองที่พักทั่วไทยในราคาที่ดีที่สุด<br/>
                Built with ❤️ in Thailand 🇹🇭
              </p>
            </div>
            {[
              { title: 'ที่พัก', links: [
                { label: 'ค้นหาที่พัก', href: '/search' },
                { label: 'กรุงเทพฯ', href: '/search?city=Bangkok' },
                { label: 'ภูเก็ต', href: '/search?city=Phuket' },
                { label: 'เชียงใหม่', href: '/search?city=Chiang+Mai' },
              ]},
              { title: 'บัญชีของฉัน', links: [
                { label: 'เข้าสู่ระบบ', href: '/portal/login' },
                { label: 'สมัครสมาชิก', href: '/portal/login' },
                { label: 'การจองของฉัน', href: '/portal/bookings' },
                { label: 'โปรไฟล์', href: '/portal/profile' },
              ]},
              { title: 'ข้อมูล', links: [
                { label: 'เงื่อนไขการใช้งาน', href: '/terms' },
                { label: 'ความเป็นส่วนตัว', href: '/privacy' },
                { label: 'ติดต่อเรา', href: 'mailto:hello@maitri.co' },
              ]},
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <Link href={link.href} className="text-sm text-white/40 hover:text-white/70 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-white/30">© 2026 Maitri Collection · All rights reserved</p>
            <p className="text-xs text-white/20">
              <Link href="/owner/login" className="hover:text-white/40 transition-colors">Hotel Partner Login</Link>
            </p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .btn-shimmer {
          position: relative;
          overflow: hidden;
        }
        .btn-shimmer::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.15) 50%, transparent 60%);
          transform: translateX(-100%);
        }
        .btn-shimmer:hover::after {
          transform: translateX(100%);
          transition: transform 0.5s ease;
        }
        .badge-luxury {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.05em;
          background: rgba(198,106,48,0.2);
          border: 1px solid rgba(198,106,48,0.3);
          color: rgba(255,255,255,0.8);
        }
        .glass {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.12);
        }
        .gradient-text {
          background: linear-gradient(135deg, #C66A30, #E8A87C);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .overline {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
        }
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-6px); }
        }
        .animate-float { animation: float 2.5s ease-in-out infinite; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.6s ease forwards; }
      `}</style>
    </div>
  );
}
