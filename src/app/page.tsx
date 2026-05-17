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
  { icon: Tag,          title: 'ราคาดีที่สุด',     desc: 'จองตรงกับโรงแรม ได้ราคาพิเศษกว่า OTA' },
  { icon: ShieldCheck,  title: 'ยกเลิกฟรี',        desc: 'เลือกเรทที่ยกเลิกได้ฟรี ไม่มีค่าปรับ' },
  { icon: CreditCard,   title: 'ชำระเงินปลอดภัย',  desc: 'รองรับทุกธนาคาร PromptPay และบัตรเครดิต' },
];

const HOW_IT_WORKS = [
  { icon: Search,        step: 1, title: 'ค้นหาที่พัก',    desc: 'เลือกปลายทาง วันที่ และจำนวนผู้เข้าพักที่ต้องการ' },
  { icon: CalendarCheck, step: 2, title: 'จองและชำระเงิน', desc: 'เลือกห้อง ยืนยันการจอง และชำระเงินอย่างปลอดภัย' },
  { icon: Heart,         step: 3, title: 'เช็กอินและพัก',  desc: 'รับ QR Code เช็กอิน พร้อมจัดการการเดินทางผ่านแอป' },
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
    className: 'bg-white border border-white/30 text-gray-800 hover:bg-white/90 shadow-sm',
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
    className: 'bg-[#1877F2] border border-[#1877F2] text-white hover:bg-[#166FE5] shadow-sm',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-white" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'Apple',
    className: 'bg-white/10 border border-white/30 text-white hover:bg-white/20 shadow-sm backdrop-blur-sm',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 fill-white" aria-hidden>
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
      </svg>
    ),
  },
];

const STATS = [
  { value: '50,000+', label: 'ที่พัก' },
  { value: '4.9/5',   label: 'คะแนน' },
  { value: '200+',    label: 'เมืองทั่วไทย' },
  { value: '24/7',    label: 'ซัพพอร์ต' },
];

export default function GuestHomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ─── Navigation ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#1C1410]/90 backdrop-blur-xl border-b border-white/8">
        <div className="container max-w-7xl flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="h-9 w-9 bg-gradient-to-br from-[#C66A30] to-[#A4522A] rounded-xl flex items-center justify-center shadow-lg shadow-[#C66A30]/25">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-serif text-xl font-semibold text-white tracking-tight">Maitri</span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-white/70">
            <Link href="/search" className="hover:text-white transition-colors">ค้นหาที่พัก</Link>
            <a href="#destinations" className="hover:text-white transition-colors">จุดหมาย</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">วิธีจอง</a>
            <a href="#reviews" className="hover:text-white transition-colors">รีวิว</a>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/portal/login"
              className="text-sm text-white/80 hover:text-white px-4 py-2 rounded-xl hover:bg-white/10 transition-all font-medium">
              เข้าสู่ระบบ
            </Link>
            <Link href="/portal/login"
              className="text-sm bg-[#C66A30] hover:bg-[#B05B28] text-white px-5 py-2 rounded-full font-semibold transition-colors shadow-lg shadow-[#C66A30]/30">
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <video autoPlay muted loop playsInline poster={IMAGES.heroLobby}
            className="w-full h-full object-cover">
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          {/* Strong layered gradient for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D0A08]/85 via-[#0D0A08]/60 to-[#0D0A08]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0A08]/70 via-transparent to-[#0D0A08]/40" />
        </div>

        <div className="container max-w-7xl px-4 pt-24 pb-20 relative z-10">
          <div className="max-w-2xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-7 px-4 py-2 rounded-full
              bg-[#C66A30]/20 border border-[#C66A30]/40 backdrop-blur-sm">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#C66A30] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#C66A30]" />
              </span>
              <span className="text-[#E8A87C] text-xs font-semibold tracking-wide uppercase">
                จองตรงกับโรงแรม · ราคาดีที่สุด
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-serif font-semibold text-white leading-tight tracking-tight mb-5"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', lineHeight: 1.1 }}>
              ค้นหาที่พักในฝัน<br/>
              <span className="text-[#E8A87C] italic">ทั่วประเทศไทย</span>
            </h1>

            {/* Subtitle */}
            <p className="text-[1.05rem] text-white/85 leading-relaxed mb-8 max-w-lg">
              จองโรงแรม รีสอร์ท และที่พักตากอากาศ ราคาดีที่สุด
              พร้อม Check-in ออนไลน์และจัดการการเดินทางผ่านแอปได้ทุกที่
            </p>

            {/* Search form */}
            <div className="mb-8">
              <SearchHeader variant="hero" />
            </div>

            {/* Social login */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <span className="text-white/60 text-sm font-medium shrink-0 whitespace-nowrap">
                หรือเข้าสู่ระบบด้วย
              </span>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_PROVIDERS.map(p => (
                  <Link key={p.label} href="/portal/login"
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${p.className}`}>
                    {p.icon}
                    {p.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-white/50">
          <span className="text-[10px] tracking-[0.2em] uppercase font-medium">เลื่อนลง</span>
          <div className="h-8 w-px bg-gradient-to-b from-white/50 to-transparent" />
        </div>
      </section>

      {/* ─── Trust signals ───────────────────────────────────────────────── */}
      <section className="bg-[#1C1410] py-10">
        <div className="container max-w-7xl px-4">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
            {TRUST_SIGNALS.map(t => {
              const Icon = t.icon;
              return (
                <div key={t.title} className="flex items-center gap-4 py-6 md:py-0 md:px-8 first:md:pl-0 last:md:pr-0">
                  <div className="h-11 w-11 bg-[#C66A30]/25 border border-[#C66A30]/30 rounded-2xl flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-[#E8A87C]" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-[0.95rem] mb-0.5">{t.title}</p>
                    <p className="text-sm text-white/65 leading-snug">{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Seasonal Campaign ───────────────────────────────────────────── */}
      <SeasonalBanner />

      {/* ─── Recently Viewed ─────────────────────────────────────────────── */}
      <RecentlyViewed />

      {/* ─── Destinations ────────────────────────────────────────────────── */}
      <section id="destinations" className="py-20 bg-muted/30">
        <div className="container max-w-7xl px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C66A30] mb-2">สำรวจ</p>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold text-foreground">
                จุดหมายยอดนิยม
              </h2>
            </div>
            <Link href="/search"
              className="hidden md:flex items-center gap-1 text-sm font-semibold text-[#C66A30] hover:text-[#A4522A] transition-colors">
              ดูทั้งหมด <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {DESTINATIONS.slice(0, 2).map(d => (
              <Link key={d.name} href={`/search?city=${d.name}`}
                className="relative rounded-2xl overflow-hidden h-72 md:h-96 group cursor-pointer ring-2 ring-white/0 group-hover:ring-[#C66A30]/30 transition-all">
                <Image src={d.img} alt={d.name} fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-white font-bold text-2xl md:text-3xl leading-tight">{d.nameTh}</p>
                  <p className="text-white/80 text-xs mt-0.5">{d.hotels.toLocaleString()} ที่พัก</p>
                </div>
              </Link>
            ))}
            <div className="grid grid-rows-2 gap-3 md:gap-4">
              {DESTINATIONS.slice(2, 4).map(d => (
                <Link key={d.name} href={`/search?city=${d.name}`}
                  className="relative rounded-2xl overflow-hidden min-h-[110px] group cursor-pointer ring-2 ring-white/0 group-hover:ring-[#C66A30]/30 transition-all">
                  <Image src={d.img} alt={d.name} fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <p className="text-white font-semibold text-sm">{d.nameTh}</p>
                    <p className="text-white/75 text-xs">{d.hotels.toLocaleString()} ที่พัก</p>
                  </div>
                </Link>
              ))}
            </div>
            {DESTINATIONS.slice(4).map(d => (
              <Link key={d.name} href={`/search?city=${d.name}`}
                className="relative rounded-2xl overflow-hidden h-28 md:h-36 group cursor-pointer hidden md:block ring-2 ring-white/0 group-hover:ring-[#C66A30]/30 transition-all">
                <Image src={d.img} alt={d.name} fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-semibold text-sm">{d.nameTh}</p>
                  <p className="text-white/75 text-xs">{d.hotels.toLocaleString()} ที่พัก</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats strip ─────────────────────────────────────────────────── */}
      <section className="bg-[#1C1410] py-12">
        <div className="container max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y-2 md:divide-y-0 md:divide-x divide-white/10">
            {STATS.map(s => (
              <div key={s.label} className="flex flex-col items-center justify-center py-6 md:py-0 md:px-8 gap-1.5">
                <span className="font-serif text-3xl md:text-4xl font-semibold text-[#E8A87C]">{s.value}</span>
                <span className="text-sm text-white/55 tracking-wide">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How it works ────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 bg-card">
        <div className="container max-w-7xl px-4">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C66A30] mb-3">ง่ายมาก</p>
            <h2 className="font-serif text-4xl md:text-5xl font-semibold text-foreground tracking-tight">
              จองที่พักใน <span className="text-[#C66A30] italic">3 ขั้นตอน</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {HOW_IT_WORKS.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={step.step}
                  className="relative bg-card rounded-3xl p-8 border border-border shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  {/* Decorative step number watermark */}
                  <span className="font-display text-[#C66A30]/8 absolute -top-4 -right-4 leading-none select-none pointer-events-none"
                    style={{ fontSize: '120px', fontWeight: 700 }}>
                    {step.step}
                  </span>
                  {/* Step connector arrow */}
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="hidden md:block absolute top-12 -right-3 z-10">
                      <ChevronRight className="h-5 w-5 text-[#C66A30]/40" />
                    </div>
                  )}
                  <div className="flex items-start gap-4 mb-5">
                    <div className="h-14 w-14 bg-[#C66A30]/15 rounded-2xl flex items-center justify-center shrink-0">
                      <Icon className="h-7 w-7 text-[#C66A30]" />
                    </div>
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{step.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ─── Testimonials ────────────────────────────────────────────────── */}
      <section id="reviews" className="py-24 bg-[#1C1410]">
        <div className="container max-w-7xl px-4">
          <div className="text-center mb-14">
            <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#C66A30] mb-3">
              รีวิวจากนักท่องเที่ยว
            </p>
            <h2 className="font-serif text-4xl font-semibold text-white">
              ประสบการณ์จริง{' '}
              <span className="text-[#E8A87C] italic">จากผู้ใช้ทั่วไทย</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i}
                className="bg-white/8 border border-white/12 rounded-3xl p-7 flex flex-col gap-5">
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                {/* Quote */}
                <p className="text-white text-[0.95rem] leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                {/* Author */}
                <div className="flex items-center gap-3 pt-5 border-t border-white/12">
                  <div className="h-10 w-10 bg-[#C66A30]/20 border border-[#C66A30]/30 rounded-full flex items-center justify-center text-lg shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{t.name}</p>
                    <p className="text-xs text-white/60 mt-0.5">{t.trip}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image src={IMAGES.heroBeach} alt="" fill className="object-cover" />
          <div className="absolute inset-0 bg-[#0D0A08]/80" />
        </div>
        <div className="container max-w-2xl px-4 text-center relative z-10">
          <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#E8A87C] mb-4">เริ่มต้นวันนี้</p>
          <h2 className="font-serif text-4xl md:text-5xl font-semibold text-white mb-5 leading-tight">
            สมัครฟรี จองง่าย<br/>
            <span className="text-[#E8A87C] italic">ราคาดีที่สุด</span>
          </h2>
          <p className="text-white/80 mb-10 text-base leading-relaxed">
            สมัครสมาชิกฟรี เข้าถึงราคาพิเศษ ติดตามการจอง<br className="hidden sm:block" />
            และ Check-in ออนไลน์ผ่านมือถือ
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Link href="/portal/login"
              className="flex items-center gap-2 bg-[#C66A30] hover:bg-[#B05B28] text-white
                px-8 py-3.5 rounded-full font-semibold text-sm transition-colors
                shadow-xl shadow-[#C66A30]/30">
              สมัครสมาชิกฟรี <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/search"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/18 border border-white/25
                text-white px-8 py-3.5 rounded-full font-semibold text-sm transition-colors backdrop-blur-sm">
              ค้นหาที่พัก
            </Link>
          </div>

          {/* Social login */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-white/55 text-xs font-medium">หรือเข้าสู่ระบบด้วย</p>
            <div className="flex justify-center gap-2 flex-wrap">
              {SOCIAL_PROVIDERS.map(p => (
                <Link key={p.label} href="/portal/login"
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${p.className}`}>
                  {p.icon}
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-[#0D0A08] py-14">
        <div className="container max-w-7xl px-4">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-[#C66A30] to-[#A4522A] rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="font-serif text-lg font-semibold text-white">Maitri</span>
              </div>
              <p className="text-sm text-white/55 leading-relaxed">
                จองที่พักทั่วไทยในราคาที่ดีที่สุด<br/>
                Built with ❤️ in Thailand 🇹🇭
              </p>
            </div>

            {/* Links */}
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
                <h4 className="text-xs font-bold tracking-[0.15em] uppercase text-white/40 mb-5">
                  {col.title}
                </h4>
                <ul className="space-y-3">
                  {col.links.map(link => (
                    <li key={link.label}>
                      <Link href={link.href}
                        className="text-sm text-white/65 hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/8 pt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-white/40">© 2026 Maitri Collection · All rights reserved</p>
            <Link href="/owner/login"
              className="text-xs text-white/25 hover:text-white/50 transition-colors">
              Hotel Partner Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
