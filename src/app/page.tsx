import Link from 'next/link';
import { AnimatedNumber } from '@/components/ui/animated-number';
import { SearchHeader } from '@/components/public/SearchHeader';
import { FAQSection } from '@/components/public/FAQSection';
import { SeasonalBanner } from '@/components/public/SeasonalBanner';
import { RecentlyViewed } from '@/components/public/RecentlyViewed';
import { IMAGES } from '@/lib/images';
import {
  ArrowRight, Globe2, Check, Star, ChevronRight,
  BarChart3, Calendar, Users, Receipt, Bot,
  ShieldCheck, Tag, CreditCard,
} from 'lucide-react';

const STATS = [
  { value: 142, suffix: '+', label: 'โรงแรมที่ใช้ระบบ' },
  { value: 98,  suffix: '%', label: 'ความพึงพอใจ' },
  { value: 14,  suffix: '',  label: 'ภาษาที่ AI รองรับ' },
  { value: 60,  suffix: 'วัน', label: 'ทดลองใช้ฟรี' },
];

const FEATURES = [
  { icon: Bot,              title: 'AI Concierge',         desc: 'ตอบแขก 14 ภาษาอัตโนมัติ ผ่าน LINE, WhatsApp, Email ไม่พลาดแม้แต่คำถามเดียว', img: IMAGES.concierge },
  { icon: Calendar,         title: 'จัดการห้องพัก',        desc: 'ปฏิทินจอง, check-in/out, housekeeping kanban ครบในหน้าเดียว', img: IMAGES.deluxeRoom },
  { icon: Globe2,           title: 'Channel Manager',      desc: 'เชื่อม Booking.com, Agoda, Airbnb อัพราคาและห้องว่างพร้อมกันทุก OTA', img: IMAGES.heroHotel },
  { icon: BarChart3,        title: 'รายงานอัจฉริยะ',       desc: 'ADR, RevPAR, Occupancy เรียลไทม์ Export CSV ส่งทีมได้ทันที', img: IMAGES.rooftop },
  { icon: Receipt,          title: 'e-Tax & ทร.30',        desc: 'ออกใบกำกับภาษีอิเล็กทรอนิกส์ และส่ง ทร.30 อัตโนมัติตามกฎหมายไทย', img: IMAGES.dining },
  { icon: Users,            title: 'Guest Portal',         desc: 'แขกจอง, จัดการการจอง, รีวิว ผ่านเว็บของโรงแรมคุณโดยตรง', img: IMAGES.heroPool },
];

const PLANS = [
  {
    name: 'Starter',
    price: 1500,
    desc: 'เหมาะสำหรับโรงแรมขนาดเล็ก ที่เริ่มต้นดิจิทัล',
    rooms: '≤15 ห้อง', users: '1 ผู้ใช้', ota: '1 ช่องทาง',
    features: ['AI Inbox (LINE)', 'จัดการจอง', 'รายงานพื้นฐาน', 'e-Tax invoice', 'Guest portal'],
    cta: 'เริ่มต้นฟรี', highlight: false,
  },
  {
    name: 'Standard',
    price: 3500,
    desc: 'ยอดนิยม สำหรับโรงแรมที่กำลังเติบโต',
    rooms: '≤50 ห้อง', users: '5 ผู้ใช้', ota: 'ไม่จำกัด',
    features: ['AI Inbox ทุกช่องทาง', 'Channel Manager', 'รายงานขั้นสูง + Export', 'ทร.30 อัตโนมัติ', 'Loyalty program', 'Team management', 'Audit log'],
    cta: 'เริ่มต้นฟรี 60 วัน', highlight: true,
  },
  {
    name: 'Pro',
    price: 8000,
    desc: 'สำหรับเครือโรงแรมและรีสอร์ทขนาดใหญ่',
    rooms: 'ไม่จำกัด', users: 'ไม่จำกัด', ota: 'ไม่จำกัด',
    features: ['ทุกอย่างใน Standard', 'Multi-property', 'Custom branding', 'API access', 'Priority support', 'Onboarding specialist', 'SLA 99.9%'],
    cta: 'ติดต่อทีมงาน', highlight: false,
  },
];


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

const TESTIMONIALS = [
  {
    quote: 'ก่อนใช้ Maitri ต้องตอบ LINE ด้วยตัวเองทุกคืน ตอนนี้ AI ตอบแทนได้เลย รายได้เพิ่มขึ้น 23% ในสามเดือนแรก',
    name: 'คุณสมศักดิ์ วิไลพร',
    hotel: 'The Riverside Boutique, เชียงใหม่',
    rating: 5,
    avatar: '👨‍💼',
  },
  {
    quote: 'เชื่อม Booking.com กับ Agoda ได้ภายในวันเดียว ไม่ต้องกลัว overbooking อีกต่อไป ระบบง่ายมากสำหรับทีมเล็กๆ',
    name: 'คุณปิยะนุช ศรีสุวรรณ',
    hotel: 'Baan Rim Talay Resort, สมุย',
    rating: 5,
    avatar: '👩‍💼',
  },
  {
    quote: 'ทร.30 ส่งอัตโนมัติ ไม่ต้องจ้างพนักงานทำเอกสารพิเศษ ประหยัดได้หลายหมื่นต่อปี และไม่เคยส่งผิดพลาดสักครั้ง',
    name: 'คุณธนาวุฒิ มีสุข',
    hotel: 'Golden Gate Hotel, กรุงเทพฯ',
    rating: 5,
    avatar: '👨‍💼',
  },
];

export default function HomePage() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Maitri',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://maitri.app',
    potentialAction: {
      '@type': 'SearchAction',
      target: `${process.env.NEXT_PUBLIC_APP_URL || 'https://maitri.app'}/search?city={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Maitri',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://maitri.app',
    sameAs: [],
  };
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#2A2522]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />

      {/* ─── Navigation ───────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#2A2522]/80 backdrop-blur-xl">
        <div className="container max-w-7xl flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 bg-[#C66A30] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-serif text-xl font-medium text-white tracking-tight">Maitri</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">ฟีเจอร์</a>
            <a href="#pricing"  className="hover:text-white transition-colors">ราคา</a>
            <Link href="/search" className="hover:text-white transition-colors">ค้นหาที่พัก</Link>
            <a href="#reviews"  className="hover:text-white transition-colors">รีวิว</a>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login/owner" className="text-sm text-white/70 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition-all">
              เข้าสู่ระบบ
            </Link>
            <Link href="/auth/signup"
              className="btn-shimmer text-sm bg-[#C66A30] hover:bg-[#A4522A] text-white px-5 py-2 rounded-full font-medium transition-colors">
              ทดลองฟรี 60 วัน
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Cinematic video hero with image fallback */}
        <div className="absolute inset-0 -z-10">
          <video
            autoPlay muted loop playsInline
            poster={IMAGES.heroLobby}
            className="w-full h-full object-cover"
          >
            {/* Hotel can upload their own video — fallback to poster image */}
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-[#1A1614]/70 via-[#1A1614]/50 to-[#1A1614]/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1A1614]/40 to-transparent" />
        </div>

        {/* Floating gallery thumbnails */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-3">
          {[IMAGES.infinityPool, IMAGES.suite, IMAGES.dining].map((img, i) => (
            <div key={i} className={`zoom-img w-32 h-20 rounded-xl overflow-hidden border border-white/20 shadow-xl`}
              style={{ animationDelay: `${i * 200}ms` }}>
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        <div className="container max-w-7xl px-4 pt-24 pb-16">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 mb-6 animate-fade-in">
              <div className="badge-luxury">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                </span>
                ทดลองใช้ฟรี 60 วัน — ไม่ต้องใส่บัตรเครดิต
              </div>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl font-medium text-white leading-[0.95] tracking-tight animate-fade-in mb-6"
              style={{ animationDelay: '100ms' }}>
              ระบบโรงแรม<br/>
              <span className="italic gradient-text">ที่เข้าใจ</span><br/>
              แขกของคุณ
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-white/70 leading-relaxed max-w-xl animate-fade-in mb-8"
              style={{ animationDelay: '200ms' }}>
              AI Concierge คุยกับแขกได้ 14 ภาษา ระบบจอง ห้อง บัญชี OTA Channel Manager
              ทร.30 และ e-Tax ครบในที่เดียว — ออกแบบเฉพาะสำหรับโรงแรมไทย
            </p>

            {/* Hero search form */}
            <div className="animate-fade-in mb-6" style={{ animationDelay: '300ms' }}>
              <SearchHeader variant="hero" />
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
              <Link href="/auth/signup"
                className="btn-shimmer group flex items-center gap-2 bg-[#C66A30] text-white px-7 py-3.5 rounded-full font-medium text-sm hover:bg-[#A4522A] transition-colors">
                เริ่มต้นฟรีเลย
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/search"
                className="flex items-center gap-2 glass text-white px-7 py-3.5 rounded-full font-medium text-sm hover:bg-white/15 transition-colors">
                ดูโรงแรมทั้งหมด
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap items-center gap-6 mt-10 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="flex -space-x-2">
                {['🏨','🌴','🏡','🏯','🌊'].map((e, i) => (
                  <div key={i} className="h-8 w-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm">
                    {e}
                  </div>
                ))}
              </div>
              <p className="text-white/60 text-sm">
                <strong className="text-white">142+ โรงแรม</strong> ทั่วประเทศไทยไว้วางใจ Maitri
              </p>
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />)}
                <span className="text-white/60 text-xs ml-1">4.9 / 5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 animate-float">
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <div className="h-8 w-px bg-gradient-to-b from-white/40 to-transparent" />
        </div>
      </section>

      {/* ─── Stats ───────────────────────────────────────────────────────── */}
      <section className="bg-[#2A2522] py-16">
        <div className="container max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 stagger">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-serif text-4xl md:text-5xl font-medium text-white mb-2">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-white/40 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Seasonal Campaign ────────────────────────────────────────────── */}
      <SeasonalBanner />

      {/* ─── Recently Viewed ─────────────────────────────────────────────── */}
      <RecentlyViewed />

      {/* ─── Destinations ─────────────────────────────────────────────────── */}
      <section className="py-16 bg-white/50">
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

          {/* Big 2 + small 4 grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {DESTINATIONS.slice(0, 2).map(d => (
              <Link key={d.name} href={`/search?city=${d.name}`}
                className="relative rounded-2xl overflow-hidden h-48 md:h-64 group cursor-pointer">
                <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                  <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                <img src={d.img} alt={d.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-3">
                  <p className="text-white font-semibold text-sm">{d.nameTh}</p>
                  <p className="text-white/60 text-xs">{d.hotels.toLocaleString()} ที่พัก</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Trust signals */}
          <div className="grid md:grid-cols-3 gap-4 mt-12">
            {TRUST_SIGNALS.map(t => {
              const Icon = t.icon;
              return (
                <div key={t.title} className="flex items-start gap-4 bg-white rounded-2xl border border-black/5 p-5">
                  <div className="h-10 w-10 bg-[#C66A30]/10 rounded-xl flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-[#C66A30]" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#2A2522] text-sm mb-1">{t.title}</p>
                    <p className="text-xs text-[#2A2522]/50 leading-relaxed">{t.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 md:py-32">
        <div className="container max-w-7xl px-4">
          <div className="text-center mb-16">
            <div className="overline text-[#C66A30] mb-4">ฟีเจอร์ทั้งหมด</div>
            <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mb-4">
              ทุกสิ่งที่โรงแรมต้องการ<br/>
              <span className="italic text-[#C66A30]">ในที่เดียว</span>
            </h2>
            <p className="text-[#2A2522]/60 max-w-xl mx-auto">
              ระบบที่ออกแบบมาสำหรับโรงแรมไทยโดยเฉพาะ ไม่ใช่แค่แปลจากต่างประเทศมา
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon;
              return (
                <div key={feat.title}
                  className="card-lift group bg-white rounded-3xl overflow-hidden border border-black/5 cursor-pointer"
                  style={{ animationDelay: `${i * 80}ms` }}>
                  <div className="zoom-img h-48 overflow-hidden">
                    <img src={feat.img} alt={feat.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  </div>
                  <div className="p-6">
                    <div className="h-10 w-10 bg-[#C66A30]/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="h-5 w-5 text-[#C66A30]" />
                    </div>
                    <h3 className="font-semibold text-[#2A2522] mb-2">{feat.title}</h3>
                    <p className="text-sm text-[#2A2522]/60 leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Services showcase ───────────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-[#2A2522]">
        <div className="container max-w-7xl px-4">
          <div className="text-center mb-16">
            <div className="overline text-[#C66A30] mb-4">บริการครบวงจร</div>
            <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mb-4 text-white">
              ครบทุกบริการในที่เดียว<br/>
              <span className="italic text-[#C66A30]">เพิ่มรายได้ทุกจุดสัมผัส</span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto">
              Maitri ไม่ได้แค่จัดการห้องพัก — รองรับทุกบริการที่โรงแรมคุณมี
              เพื่อเพิ่มรายได้จาก F&B สปา กิจกรรม และสิ่งอำนวยความสะดวกทั้งหมด
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { emoji: '🍽️', title: 'ร้านอาหาร',        desc: 'จัดการเมนู สั่งอาหาร F&B' },
              { emoji: '💆', title: 'สปา',              desc: 'จอง Spa ออนไลน์ ไม่พลาดรายได้' },
              { emoji: '🏊', title: 'สระว่ายน้ำ',       desc: 'จัดการการใช้งานสิ่งอำนวยความสะดวก' },
              { emoji: '🎯', title: 'กิจกรรม',          desc: 'แพ็กเกจและประสบการณ์พิเศษ' },
            ].map((service) => (
              <div key={service.title}
                className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl p-8 text-center transition-colors group cursor-default">
                <div className="text-5xl mb-5">{service.emoji}</div>
                <h3 className="font-semibold text-white text-lg mb-2">{service.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Promotions & packages ───────────────────────────────────────── */}
      <section className="py-24 md:py-32 bg-[#FAF7F2]">
        <div className="container max-w-7xl px-4">
          <div className="text-center mb-16">
            <div className="overline text-[#C66A30] mb-4">โปรโมชั่น</div>
            <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mb-4">
              โปรโมชั่นและแพ็กเกจ<br/>
              <span className="italic text-[#C66A30]">สร้างเองได้ง่ายๆ</span>
            </h2>
            <p className="text-[#2A2522]/60 max-w-xl mx-auto">
              สร้างโปรโมชั่นและแพ็กเกจพิเศษให้แขกของคุณได้ภายในไม่กี่นาที
              ตัวอย่างด้านล่างคือสิ่งที่โรงแรมที่ใช้ Maitri สร้างได้
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Early Bird',
                desc:  'จองล่วงหน้า 30 วัน รับส่วนลด 20%',
                color: 'from-amber-500 to-orange-600',
              },
              {
                title: 'Honeymoon Package',
                desc:  'ห้อง Deluxe + อาหารเช้า + Welcome cake',
                color: 'from-rose-500 to-pink-600',
              },
              {
                title: 'Long Stay',
                desc:  'พัก 3 คืนขึ้นไป รับคืนที่ 4 ฟรี',
                color: 'from-emerald-500 to-teal-600',
              },
            ].map((offer) => (
              <div key={offer.title}
                className="bg-white rounded-3xl border border-black/5 p-8 flex flex-col gap-5 shadow-sm hover:shadow-md transition-shadow">
                <div>
                  <span className={`inline-block text-xs font-semibold text-white px-3 py-1 rounded-full bg-gradient-to-r ${offer.color} mb-4`}>
                    โปรโมชั่น
                  </span>
                  <h3 className="font-semibold text-[#2A2522] text-xl mb-2">{offer.title}</h3>
                  <p className="text-sm text-[#2A2522]/60 leading-relaxed">{offer.desc}</p>
                </div>
                <Link href="/auth/signup"
                  className="mt-auto inline-flex items-center gap-1 text-sm text-[#C66A30] font-medium hover:underline">
                  สร้างโปรโมชั่นแบบนี้ได้ <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─────────────────────────────────────────────────────────── */}
      <FAQSection />

      {/* ─── Visual showcase ──────────────────────────────────────────────── */}
      <section className="py-16 bg-[#2A2522] overflow-hidden">
        <div className="container max-w-7xl px-4">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="overline text-[#C66A30] mb-4">Guest Experience</div>
              <h2 className="font-serif text-4xl md:text-5xl font-medium text-white mb-6">
                หน้า Booking<br/>
                <span className="italic">ระดับ Airbnb</span>
              </h2>
              <p className="text-white/60 mb-8 leading-relaxed">
                สร้างหน้าจองสำหรับโรงแรมคุณในไม่กี่คลิก พร้อม Gallery, Reviews, Rate plan
                และ AI Chatbot ที่แขกเข้าถึงได้โดยตรง
              </p>
              <div className="space-y-3 mb-8">
                {['Gallery photo ลาก-วาง', 'Real-time availability', 'Multi-currency (10 สกุล)', 'AI Chatbot ตลอด 24/7'].map(f => (
                  <div key={f} className="flex items-center gap-3 text-sm text-white/70">
                    <Check className="h-4 w-4 text-[#C66A30] shrink-0" /> {f}
                  </div>
                ))}
              </div>
              <Link href="/auth/signup"
                className="btn-shimmer inline-flex items-center gap-2 bg-[#C66A30] text-white px-6 py-3 rounded-full font-medium text-sm">
                สร้างหน้าโรงแรมของคุณ <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                <div className="zoom-img rounded-2xl overflow-hidden h-64">
                  <img src={IMAGES.heroPool} alt="Hotel pool" className="w-full h-full object-cover" />
                </div>
                <div className="space-y-3 mt-8">
                  <div className="zoom-img rounded-2xl overflow-hidden h-36">
                    <img src={IMAGES.suite} alt="Suite" className="w-full h-full object-cover" />
                  </div>
                  <div className="zoom-img rounded-2xl overflow-hidden h-24">
                    <img src={IMAGES.dining} alt="Dining" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-24 md:py-32">
        <div className="container max-w-7xl px-4">
          <div className="text-center mb-16">
            <div className="overline text-[#C66A30] mb-4">ราคา</div>
            <h2 className="font-serif text-4xl md:text-5xl font-medium tracking-tight mb-4">
              ราคาที่ยุติธรรม<br/>
              <span className="italic text-[#C66A30]">ไม่มีค่าซ่อนเร้น</span>
            </h2>
            <p className="text-[#2A2522]/60">ทดลองใช้ฟรี 60 วัน ไม่ต้องใส่บัตรเครดิต</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => (
              <div key={plan.name}
                className={`relative rounded-3xl p-8 ${plan.highlight
                  ? 'bg-[#2A2522] text-white shadow-2xl scale-105 border-0'
                  : 'bg-white border border-black/8'}`}>
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="badge-luxury text-xs">ยอดนิยม</span>
                  </div>
                )}
                <div className="mb-6">
                  <h3 className={`font-semibold text-lg mb-1 ${plan.highlight ? 'text-white' : 'text-[#2A2522]'}`}>{plan.name}</h3>
                  <p className={`text-xs ${plan.highlight ? 'text-white/50' : 'text-[#2A2522]/50'}`}>{plan.desc}</p>
                </div>
                <div className="mb-6">
                  <span className={`font-serif text-5xl font-medium ${plan.highlight ? 'text-white' : 'text-[#2A2522]'}`}>
                    ฿{plan.price.toLocaleString()}
                  </span>
                  <span className={`text-sm ${plan.highlight ? 'text-white/50' : 'text-[#2A2522]/50'}`}>/เดือน</span>
                </div>
                <div className={`text-xs mb-6 space-y-1 ${plan.highlight ? 'text-white/60' : 'text-[#2A2522]/50'}`}>
                  <div>🏠 {plan.rooms}</div>
                  <div>👤 {plan.users}</div>
                  <div>🌐 OTA {plan.ota}</div>
                </div>
                <ul className={`space-y-2.5 mb-8 text-sm ${plan.highlight ? 'text-white/80' : 'text-[#2A2522]/70'}`}>
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5">
                      <Check className={`h-4 w-4 shrink-0 ${plan.highlight ? 'text-[#C66A30]' : 'text-[#C66A30]'}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={i === 2 ? 'mailto:hello@maitri.co' : '/auth/signup'}
                  className={`btn-shimmer flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-medium text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-[#C66A30] text-white hover:bg-[#A4522A]'
                      : 'bg-[#2A2522] text-white hover:bg-black'
                  }`}>
                  {plan.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials ────────────────────────────────────────────────── */}
      <section id="reviews" className="py-24 bg-[#2A2522]">
        <div className="container max-w-7xl px-4">
          <div className="text-center mb-16">
            <div className="overline text-[#C66A30] mb-4">รีวิวจากลูกค้าจริง</div>
            <h2 className="font-serif text-4xl font-medium text-white">
              เสียงจากเจ้าของโรงแรม<br/>
              <span className="italic text-[#C66A30]">ที่ใช้ Maitri จริง</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6 stagger">
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
                    <p className="text-xs text-white/40">{t.hotel}</p>
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
          <img src={IMAGES.heroBeach} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1A1614]/75" />
        </div>
        <div className="container max-w-3xl px-4 text-center">
          <div className="overline text-[#C66A30] mb-4">เริ่มต้นวันนี้</div>
          <h2 className="font-serif text-4xl md:text-6xl font-medium text-white mb-6">
            พร้อมที่จะยกระดับ<br/>
            <span className="italic text-[#C66A30]">โรงแรมของคุณ?</span>
          </h2>
          <p className="text-white/60 mb-10 text-lg">ทดลองใช้ฟรี 60 วัน ไม่ต้องใส่บัตรเครดิต ยกเลิกได้ทุกเมื่อ</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/auth/signup"
              className="btn-shimmer flex items-center gap-2 bg-[#C66A30] text-white px-8 py-4 rounded-full font-medium hover:bg-[#A4522A] transition-colors">
              เริ่มต้นฟรี 60 วัน <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="mailto:hello@maitri.co"
              className="flex items-center gap-2 glass text-white px-8 py-4 rounded-full font-medium hover:bg-white/15 transition-colors">
              ติดต่อทีมงาน
            </a>
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
                Hotel PMS สำหรับโรงแรมไทย<br/>
                Built with ❤️ in Thailand 🇹🇭
              </p>
            </div>
            {[
              { title: 'ผลิตภัณฑ์', links: ['ฟีเจอร์', 'ราคา', 'Changelog', 'Roadmap'] },
              { title: 'โรงแรม', links: ['ค้นหาที่พัก', 'จองห้อง', 'Guest Portal', 'รีวิว'] },
              { title: 'บริษัท', links: ['เกี่ยวกับเรา', 'ติดต่อ', 'เงื่อนไข', 'ความเป็นส่วนตัว'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-sm font-semibold text-white mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links.map(link => (
                    <li key={link}>
                      <Link href={link === 'เงื่อนไข' ? '/terms' : link === 'ความเป็นส่วนตัว' ? '/privacy' : link === 'ค้นหาที่พัก' ? '/search' : '#'}
                        className="text-sm text-white/40 hover:text-white/70 transition-colors">{link}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-white/30">© 2026 Maitri Hospitality Tech · MIT License</p>
            <p className="text-xs text-white/30">
              Powered by <a href="https://anthropic.com" className="hover:text-white/50">Claude</a> ·{' '}
              <a href="https://supabase.com" className="hover:text-white/50">Supabase</a> ·{' '}
              <a href="https://vercel.com" className="hover:text-white/50">Vercel</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
