'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { format, addDays } from 'date-fns';
import { th } from 'date-fns/locale';
import {
  Search, MapPin, Calendar, Users, ChevronRight, Star,
  Hotel, Building2, Home, Tent, Waves, TreePine,
  Tag, Sparkles, Smartphone, HelpCircle, ShoppingBag,
  Gift, Shield, Menu, X, Heart, Bell, SlidersHorizontal,
  Plane, Trash2, Bot, ChevronLeft,
} from 'lucide-react';
import { IMAGES } from '@/lib/images';
import { cn } from '@/lib/utils';
import { RecentlyViewed } from '@/components/public/RecentlyViewed';

/* ── Sidebar nav items ── */
const SIDEBAR_ITEMS = [
  { icon: Hotel,     label: 'ที่พัก',            href: '/search',                   active: true },
  { icon: Building2, label: 'โรงแรม',             href: '/search?type=hotel' },
  { icon: Waves,     label: 'รีสอร์ท',            href: '/search?type=resort' },
  { icon: Home,      label: 'Pool Villa',          href: '/search?type=pool_villa' },
  { icon: Tent,      label: 'Boutique',            href: '/search?type=boutique' },
  { icon: TreePine,  label: 'Hostel',              href: '/search?type=hostel' },
  null,
  { icon: Tag,       label: 'ดีลพิเศษ',           href: '/portal/coupons' },
  { icon: Sparkles,  label: 'สะสมแต้ม',           href: '/portal/loyalty' },
  { icon: Gift,      label: 'บัตรของขวัญ',         href: '/portal/login' },
  { icon: Shield,    label: 'ประกันเดินทาง',       href: '/portal/login' },
  null,
  { icon: Smartphone, label: 'แอป',               href: '/portal/login' },
];

const DESTINATIONS = [
  { name: 'Bangkok',    nameTh: 'กรุงเทพฯ',  img: IMAGES.bangkok,   hotels: 1240 },
  { name: 'Chiang Mai', nameTh: 'เชียงใหม่', img: IMAGES.chiangMai, hotels: 420  },
  { name: 'Phuket',     nameTh: 'ภูเก็ต',    img: IMAGES.phuket,    hotels: 890  },
  { name: 'Samui',      nameTh: 'เกาะสมุย',  img: IMAGES.samui,     hotels: 310  },
  { name: 'Krabi',      nameTh: 'กระบี่',    img: IMAGES.krabi,     hotels: 260  },
  { name: 'Chiang Rai', nameTh: 'เชียงราย',  img: IMAGES.chiangRai, hotels: 180  },
];

const RECENT_SEARCHES = [
  'โรงแรมในกรุงเทพฯ ใกล้ BTS',
  'รีสอร์ทภูเก็ต ริมหาด',
];

const SUGGESTED_CITIES = [
  { label: 'ปากเกร็ด', icon: '📍' },
  { label: 'กรุงเทพฯ', icon: '🏙️' },
  { label: 'ลอนดอน',   icon: '🌆' },
  { label: 'โรม',       icon: '🏛️' },
  { label: 'ลาสเวกัส', icon: '🎰' },
  { label: 'โอซากะ',   icon: '⛩️' },
];

const SUGGESTED_SEARCHES = [
  { icon: Hotel,    text: 'ที่พักในกรุงเทพฯ' },
  { icon: Tag,      text: '🎁 ส่วนลดโปรแพคคู่', accent: true },
  { icon: Hotel,    text: 'ที่พักในปากเกร็ด' },
  { icon: Hotel,    text: 'ที่พักในลอนดอน' },
  { icon: Hotel,    text: 'ที่พักในโรม' },
  { icon: Plane,    text: 'เที่ยวบินกรุงเทพฯ – เชียงใหม่' },
  { icon: Plane,    text: 'เที่ยวบินกรุงเทพฯ – หาดใหญ่' },
];

const FILTER_CHIPS = ['ฟิลเตอร์', 'มีที่จอดรถ', '5 ดาว', 'โรงแรม', 'เตียงใหญ่ 1 เตียง'];

const QUICK_ACTIONS = [
  { icon: Heart,       label: 'รายการที่\nบันทึกไว้', href: '/portal/wishlist' },
  { icon: ShoppingBag, label: 'การจอง',               href: '/portal/trips'    },
  { icon: Tag,         label: 'ข้อเสนอ\nของฉัน',     href: '/portal/coupons'  },
  { icon: Bell,        label: 'การแจ้งเตือน\nราคา',  href: '/portal/login'    },
];

const NEW_USER_OFFERS = [
  { title: 'ผู้ใช้ใหม่รับส่วนลดการเดินทางเพิ่ม', emoji: '🎁', light: false, cta: 'เข้าสู่ระบบและรับสิทธิ์ทั้งหมด' },
  { title: 'ส่วนลด 10%', sub: 'ที่พัก', emoji: '🏨', light: true, cta: 'รับสิทธิ์ทั้งหมด' },
  { title: 'ส่วนลด 5%',  sub: 'สำหรับสมาชิก', emoji: '⭐', light: true, cta: 'รับสิทธิ์ทั้งหมด' },
  { title: 'ส่วนลด 15%', sub: 'ยกเลิกฟรี', emoji: '🎫', light: true, cta: 'รับสิทธิ์ทั้งหมด' },
];

const BLOG_POSTS = [
  { title: 'ดีลลดแรง Flash Sale ลดสูงสุด 40%', tag: 'ดีลพิเศษ', img: IMAGES.phuket },
  { title: 'สัมผัสประสบการณ์เอ็กซ์คลูซีฟไปกับ Maitri Collection', tag: 'ไฮไลท์', img: IMAGES.samui },
];

function fmtDate(d: string) {
  try { return format(new Date(d), 'EEE d MMM', { locale: th }); } catch { return d; }
}

/* ── Mobile Search Overlay (Trip.com style search page) ── */
function MobileSearchOverlay({ onClose, onSelect }: { onClose: () => void; onSelect: (city: string) => void }) {
  const [query, setQuery] = useState('');
  const [recents, setRecents] = useState(RECENT_SEARCHES);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(city: string) {
    onSelect(city);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto lg:hidden">
      {/* Top bar */}
      <div className="sticky top-0 bg-white border-b border-gray-100 px-3 py-2 flex items-center gap-2">
        <button onClick={onClose} className="h-9 w-9 flex items-center justify-center text-gray-600 shrink-0">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-2 gap-2">
          <Bot className="h-5 w-5 text-blue-600 shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && query && handleSelect(query)}
            placeholder="โรงแรมเบสท์เวสเทิร์น จตุจักร กรุงเทพ"
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <button
          onClick={() => query ? handleSelect(query) : onClose()}
          className="text-blue-600 text-sm font-semibold shrink-0 px-1">
          ค้นหา
        </button>
      </div>

      <div className="px-4 py-4 space-y-5">
        {/* Recent searches */}
        {recents.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-800">การค้นหาล่าสุด</h3>
              <button onClick={() => setRecents([])} className="text-gray-400 hover:text-gray-600">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {recents.map(r => (
                <button key={r} onClick={() => handleSelect(r)}
                  className="flex items-center gap-3 text-left w-full px-3 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <Search className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-700 truncate">{r}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Suggested cities */}
        <section>
          <h3 className="text-sm font-bold text-gray-800 mb-3">เมืองแนะนำ</h3>
          <div className="grid grid-cols-3 gap-2">
            {SUGGESTED_CITIES.map(c => (
              <button key={c.label} onClick={() => handleSelect(c.label)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium">
                <span className="shrink-0">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </section>

        {/* AI assistant banner */}
        <section>
          <button className="w-full flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-gray-800 leading-snug">
                สวัสดี ฉันคือ MaitriGenie ลองใช้การค้นหาอัจฉริยะเพื่อรับแรงบันดาลใจใหม่ๆ!
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
          </button>
        </section>

        {/* Suggested searches */}
        <section>
          <h3 className="text-sm font-bold text-gray-800 mb-3">การค้นหาแนะนำ</h3>
          <div className="flex flex-col">
            {SUGGESTED_SEARCHES.map((s, i) => {
              const Icon = typeof s.icon === 'string' ? null : s.icon;
              return (
                <button key={i} onClick={() => handleSelect(s.text)}
                  className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 text-left hover:bg-gray-50 px-1 rounded-lg transition-colors">
                  {Icon && <Icon className="h-4 w-4 text-gray-400 shrink-0" />}
                  <span className={cn('text-sm', s.accent ? 'text-orange-500 font-semibold' : 'text-gray-700')}>
                    {s.text}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ── Mobile Search Form ── */
function MobileSearchForm() {
  const router = useRouter();
  const [city,      setCity]      = useState('');
  const [checkIn,   setCheckIn]   = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [checkOut,  setCheckOut]  = useState(format(addDays(new Date(), 2), 'yyyy-MM-dd'));
  const [rooms,     setRooms]     = useState(1);
  const [adults,    setAdults]    = useState(2);
  const [children,  setChildren]  = useState(0);
  const [guestOpen, setGuestOpen] = useState(false);
  const [showApts,  setShowApts]  = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  function doSearch() {
    const p = new URLSearchParams({ city, checkIn, checkOut, adults: String(adults), rooms: String(rooms) });
    router.push(`/search?${p}`);
  }

  return (
    <>
      {searchOpen && (
        <MobileSearchOverlay
          onClose={() => setSearchOpen(false)}
          onSelect={val => { setCity(val); setSearchOpen(false); }}
        />
      )}
      <div className="bg-white rounded-2xl shadow-lg overflow-visible mx-4">
        {/* Destination row — tapping opens overlay */}
        <div
          className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 cursor-pointer"
          onClick={() => setSearchOpen(true)}>
          <Search className="h-5 w-5 text-gray-400 shrink-0" />
          <span className={cn('flex-1 text-base font-medium', city ? 'text-gray-800' : 'text-gray-400')}>
            {city || 'กรุงเทพฯ ไทย'}
          </span>
          {city && (
            <button onClick={e => { e.stopPropagation(); setCity(''); }} className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Dates row */}
        <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100">
          <Calendar className="h-5 w-5 text-gray-400 shrink-0" />
          <div className="flex-1 flex items-center gap-1">
            <label className="cursor-pointer relative">
              <input type="date" value={checkIn} min={format(new Date(), 'yyyy-MM-dd')}
                onChange={e => {
                  setCheckIn(e.target.value);
                  if (e.target.value >= checkOut) setCheckOut(format(addDays(new Date(e.target.value), 1), 'yyyy-MM-dd'));
                }}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <span className="text-base font-semibold text-gray-800">{fmtDate(checkIn)}</span>
            </label>
            <span className="text-gray-300 mx-1">—</span>
            <label className="cursor-pointer relative">
              <input type="date" value={checkOut} min={checkIn}
                onChange={e => setCheckOut(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
              <span className="text-base font-semibold text-gray-800">{fmtDate(checkOut)}</span>
            </label>
          </div>
          <span className="text-sm text-gray-500 font-medium shrink-0 ml-2">{nights} คืน</span>
        </div>

        {/* Guests row */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 cursor-pointer" onClick={() => setGuestOpen(s => !s)}>
          <Users className="h-5 w-5 text-gray-400 shrink-0" />
          <span className="flex-1 text-base text-gray-800 font-medium">
            {rooms} ห้อง  ผู้ใหญ่ {adults} คน  เด็ก {children} คน
          </span>
        </div>

        {/* Guest popover */}
        {guestOpen && (
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
            {[
              { label: 'ห้องพัก', value: rooms, min: 1, set: setRooms },
              { label: 'ผู้ใหญ่', value: adults, min: 1, set: setAdults },
              { label: 'เด็ก',    value: children, min: 0, set: setChildren },
            ].map(({ label, value, min, set }) => (
              <div key={label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-700 font-medium">{label}</span>
                <div className="flex items-center gap-3">
                  <button onClick={() => set(Math.max(min, value - 1))} disabled={value <= min}
                    className="h-8 w-8 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-blue-500 hover:text-blue-600 disabled:opacity-30 text-xl">−</button>
                  <span className="text-sm font-bold text-gray-800 w-6 text-center">{value}</span>
                  <button onClick={() => (set as any)(value + 1)}
                    className="h-8 w-8 rounded-full border border-blue-500 bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 text-xl">+</button>
                </div>
              </div>
            ))}
            <button onClick={() => setGuestOpen(false)}
              className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors">
              ยืนยัน
            </button>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 overflow-x-auto scrollbar-none">
          {FILTER_CHIPS.map((chip, i) => (
            <button key={chip}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap shrink-0 transition-colors bg-white',
                i === 0 ? 'border-gray-400 text-gray-700' : 'border-gray-200 text-gray-600',
              )}>
              {i === 0 && <SlidersHorizontal className="h-3 w-3" />}
              {chip}
            </button>
          ))}
        </div>

        {/* Apartments checkbox */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
          <input type="checkbox" id="showApts" checked={showApts} onChange={e => setShowApts(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <label htmlFor="showApts" className="text-sm text-gray-700 cursor-pointer select-none">แสดงบ้านและอพาร์ทเมนท์ก่อน</label>
        </div>

        {/* Search button */}
        <div className="p-3">
          <button onClick={doSearch}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-base rounded-xl transition-colors">
            ค้นหา
          </button>
        </div>
      </div>
    </>
  );
}

/* ── Desktop Search Form ── */
function DesktopSearchForm() {
  const router = useRouter();
  const [city,     setCity]     = useState('');
  const [checkIn,  setCheckIn]  = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [checkOut, setCheckOut] = useState(format(addDays(new Date(), 2), 'yyyy-MM-dd'));
  const [rooms,    setRooms]    = useState(1);
  const [adults,   setAdults]   = useState(2);
  const [children, setChildren] = useState(0);
  const [guestOpen, setGuestOpen] = useState(false);

  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));

  function doSearch() {
    const p = new URLSearchParams({ city, checkIn, checkOut, adults: String(adults), rooms: String(rooms) });
    router.push(`/search?${p}`);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-visible border border-gray-200">
      <div className="flex items-stretch divide-x divide-gray-200">
        <div className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0">
          <MapPin className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">จุดหมายปลายทาง</p>
            <input value={city} onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="ระบุชื่อเมือง, พื้นที่, สถานที่ท่องเที่ยว..."
              className="w-full bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none font-medium"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5 w-44">
          <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">เช็คอิน</p>
            <input type="date" value={checkIn} min={format(new Date(), 'yyyy-MM-dd')}
              onChange={e => {
                setCheckIn(e.target.value);
                if (e.target.value >= checkOut) setCheckOut(format(addDays(new Date(e.target.value), 1), 'yyyy-MM-dd'));
              }}
              className="w-full bg-transparent text-sm font-semibold text-gray-800 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center justify-center px-3 bg-gray-50 text-xs font-bold text-gray-500 w-14 shrink-0">
          {nights} คืน
        </div>
        <div className="flex items-center gap-3 px-4 py-3.5 w-44">
          <Calendar className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">เช็คเอาท์</p>
            <input type="date" value={checkOut} min={checkIn} onChange={e => setCheckOut(e.target.value)}
              className="w-full bg-transparent text-sm font-semibold text-gray-800 focus:outline-none"
            />
          </div>
        </div>
        <div className="relative flex items-center gap-3 px-4 py-3.5 w-52 cursor-pointer" onClick={() => setGuestOpen(s => !s)}>
          <Users className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-0.5">ห้องและผู้เข้าพัก</p>
            <p className="text-sm font-semibold text-gray-800">{rooms} ห้อง, ผู้ใหญ่ {adults} คน, เด็ก {children} คน</p>
          </div>
          {guestOpen && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-4 w-72" onClick={e => e.stopPropagation()}>
              {[
                { label: 'ห้องพัก', value: rooms, min: 1, set: setRooms },
                { label: 'ผู้ใหญ่', value: adults, min: 1, set: setAdults },
                { label: 'เด็ก',    value: children, min: 0, set: setChildren },
              ].map(({ label, value, min, set }) => (
                <div key={label} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <span className="text-sm text-gray-700 font-medium">{label}</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => set(Math.max(min, value - 1))} disabled={value <= min}
                      className="h-7 w-7 rounded-full border border-gray-300 text-gray-600 flex items-center justify-center hover:border-blue-500 hover:text-blue-600 disabled:opacity-30 text-lg leading-none">−</button>
                    <span className="text-sm font-bold text-gray-800 w-5 text-center">{value}</span>
                    <button onClick={() => (set as any)(value + 1)}
                      className="h-7 w-7 rounded-full border border-blue-500 bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 text-lg leading-none">+</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setGuestOpen(false)}
                className="mt-3 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors">
                ยืนยัน
              </button>
            </div>
          )}
        </div>
        <button onClick={doSearch}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shrink-0 rounded-r-xl">
          <Search className="h-5 w-5" /> ค้นหา
        </button>
      </div>
    </div>
  );
}

export default function PublicHomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f7fa] text-gray-800">

      {/* ── Top Nav ── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center h-14 px-4 gap-3 max-w-[1440px] mx-auto">
          <button onClick={() => setSidebarOpen(s => !s)} className="lg:hidden p-1 text-gray-600 hover:text-gray-900">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-sm shrink-0">
              <span className="font-bold text-white text-sm">M</span>
            </div>
            <span className="font-bold text-blue-600 text-xl hidden sm:block tracking-tight">Maitri</span>
          </Link>
          <div className="flex-1 max-w-lg mx-4 hidden md:block">
            <div className="flex items-center bg-gray-100 rounded-full px-4 py-2 gap-2 hover:bg-gray-200 transition-colors cursor-pointer">
              <Search className="h-4 w-4 text-gray-500 shrink-0" />
              <input
                placeholder="ค้นหาด้วยคีย์เวิร์ดที่โปรดปราน"
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none"
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value;
                    window.location.href = `/search?city=${encodeURIComponent(val)}`;
                  }
                }}
              />
              <button className="h-7 w-7 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors">
                <Search className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-3 ml-auto">
            <Link href="/portal/login" className="hidden lg:flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors px-2 py-1.5">
              <Smartphone className="h-4 w-4" /> แอป
            </Link>
            <Link href="/portal/login" className="hidden lg:flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors px-2 py-1.5">
              <Building2 className="h-4 w-4" /> ลงทะเบียนที่พัก
            </Link>
            <Link href="/portal/login" className="hidden lg:flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors px-2 py-1.5">
              <HelpCircle className="h-4 w-4" /> ช่วยเหลือ
            </Link>
            <Link href="/portal/trips" className="hidden lg:flex items-center gap-1 text-xs text-gray-600 hover:text-blue-600 transition-colors px-2 py-1.5">
              <ShoppingBag className="h-4 w-4" /> ค้นหาการจอง
            </Link>
            <Link href="/portal/login"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition-colors shrink-0">
              เข้าสู่ระบบ/ลงทะเบียน
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Body: sidebar + main ── */}
      <div className="flex max-w-[1440px] mx-auto">

        {/* ── Left Sidebar (desktop) ── */}
        <aside className={cn(
          'fixed lg:sticky lg:top-14 z-40 bg-white border-r border-gray-200 h-[calc(100vh-3.5rem)] overflow-y-auto transition-all duration-300 shrink-0',
          'lg:w-[168px]',
          sidebarOpen ? 'left-0 w-52 shadow-2xl' : '-left-52 lg:left-0',
        )}>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
          <nav className="py-3">
            {SIDEBAR_ITEMS.map((item, i) => {
              if (!item) return <div key={i} className="border-t border-gray-100 my-2 mx-3" />;
              const Icon = item.icon;
              return (
                <Link key={i} href={item.href}
                  className={cn(
                    'flex flex-col items-center gap-1.5 py-3 px-2 mx-1 rounded-xl text-center transition-colors hover:bg-blue-50 group',
                    item.active ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
                  )}>
                  <Icon className={cn('h-5 w-5 transition-colors', item.active ? 'text-blue-600' : 'text-gray-500 group-hover:text-blue-600')} strokeWidth={1.7} />
                  <span className={cn('text-[11px] font-medium leading-tight', item.active ? 'text-blue-700 font-semibold' : 'group-hover:text-blue-600')}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 overflow-hidden">

          {/* ══════════════════════════════ MOBILE LAYOUT ══════════════════════════════ */}
          <div className="lg:hidden">

            {/* Hero photo + title */}
            <div className="relative">
              <div className="relative h-52 overflow-hidden">
                <Image src={IMAGES.heroPool} alt="ที่พัก" fill className="object-cover" priority />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />
                {/* Nav controls */}
                <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
                  <Link href="/" className="h-9 w-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center">
                    <ChevronLeft className="h-5 w-5 text-white" />
                  </Link>
                  <div className="h-9 w-9 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center">
                    <span className="text-white text-base font-bold">•••</span>
                  </div>
                </div>
                {/* Title */}
                <div className="absolute bottom-4 left-4">
                  <h1 className="text-white text-2xl font-bold tracking-tight">
                    โรงแรมและบ้านพัก<span className="text-amber-400">.</span>
                  </h1>
                </div>
              </div>

              {/* Search form card, slightly overlapping hero */}
              <div className="bg-[#f5f7fa] pt-0 pb-0 -mt-3">
                <MobileSearchForm />
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex items-center justify-around bg-white border-y border-gray-100 px-2 py-4 mt-3">
              {QUICK_ACTIONS.map(action => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} href={action.href} className="flex flex-col items-center gap-2 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600" strokeWidth={1.8} />
                    </div>
                    <span className="text-[11px] text-gray-600 font-medium text-center leading-tight max-w-[68px] whitespace-pre-line">
                      {action.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Amber deal banner */}
            <div className="mx-4 mt-3 rounded-2xl bg-[#fdf6ee] border border-amber-100 p-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-bold text-amber-800">ดีลส่วนลดผู้จองตั๋วเครื่องบิน</p>
                <Link href="/portal/coupons"
                  className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg whitespace-nowrap ml-2 transition-colors shrink-0">
                  รับทั้งหมด
                </Link>
              </div>
              <div className="flex gap-2">
                {[
                  { title: 'ลดสูงสุด ฿ 500', sub: 'ส่วนลด 3 คืน' },
                  { title: 'ลดสูงสุด 25%',  sub: 'ดีลพิเศษผู้จองตั๋วเครื่องบิน' },
                ].map(d => (
                  <div key={d.title} className="flex-1 bg-white rounded-xl border border-amber-100 px-3 py-2.5">
                    <p className="text-sm font-bold text-amber-700">{d.title}</p>
                    <p className="text-[11px] text-amber-600 mt-0.5 leading-tight">{d.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Trip Best: dark card + horizontal hotel scroll */}
            <div className="mx-4 mt-3 rounded-2xl overflow-hidden shadow-sm border border-gray-100">
              {/* Dark image header */}
              <div className="relative h-36">
                <Image src={IMAGES.samui} alt="Trip Best" fill className="object-cover" />
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
                  <div>
                    <Link href="/search?stars=4" className="flex items-center gap-1">
                      <span className="text-white font-bold text-base">โรงแรม 4 ดาว คัดพิเศษ</span>
                      <ChevronRight className="h-4 w-4 text-white" />
                    </Link>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-white/70" />
                      <span className="text-white/70 text-xs">กรุงเทพฯ</span>
                    </div>
                  </div>
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">Maitri Best</span>
                </div>
              </div>
              {/* Horizontal hotel cards */}
              <div className="flex gap-2.5 p-3 overflow-x-auto scrollbar-none bg-white">
                {DESTINATIONS.slice(0, 5).map((d, i) => (
                  <Link key={d.name} href={`/search?city=${d.name}`}
                    className="shrink-0 w-36 rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="relative h-24">
                      <Image src={d.img} alt={d.nameTh} fill className="object-cover" />
                      <div className="absolute top-2 left-2 bg-white rounded-full px-1.5 py-0.5 text-[10px] font-bold text-gray-700 shadow-sm">
                        No.{i + 1}
                      </div>
                    </div>
                    <div className="p-2 bg-white">
                      <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{d.nameTh}</p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 4 }).map((_, si) => (
                          <Star key={si} className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <p className="text-xs font-bold text-blue-600 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-normal">8.{9 - i}/10 · {(1662 - i * 200).toLocaleString()} รีวิว</span>
                      </p>
                      <p className="text-sm font-bold text-blue-600 mt-0.5">฿ {(2995 + i * 855).toLocaleString()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Deal banners */}
            <div className="px-4 mt-3">
              <h2 className="text-base font-bold text-gray-800 mb-2.5">ดีลพิเศษ</h2>
              <div className="flex gap-3 overflow-x-auto scrollbar-none pb-1">
                {BLOG_POSTS.map((post, i) => (
                  <Link key={i} href="/search"
                    className="relative rounded-2xl overflow-hidden h-36 w-64 shrink-0 shadow-sm">
                    <Image src={post.img} alt={post.title} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <span className="inline-block bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">{post.tag}</span>
                      <p className="text-white font-bold text-xs leading-snug">{post.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Trust section */}
            <div className="px-4 mt-4 pb-6">
              <h2 className="text-base font-bold text-gray-800 mb-3">เหตุผลที่ควรจองกับ Maitri</h2>
              <div className="space-y-2">
                {[
                  { icon: Shield,   title: 'Maitri การันตีราคาเท่าเทียม',  desc: 'หากคุณพบราคาถูกกว่าที่อื่น เราจะคืนเงินส่วนต่าง' },
                  { icon: Tag,      title: 'ยกเลิกฟรีก่อน 24 ชั่วโมง',    desc: 'เลือกเรทที่ยกเลิกได้ฟรี ไม่มีค่าปรับก่อน 24 ชั่วโมง' },
                  { icon: Sparkles, title: 'รับแต้มทุกครั้งที่จอง',        desc: 'สะสม Maitri Points แลกส่วนลดและสิทธิพิเศษ' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 bg-white rounded-xl border border-gray-100 p-4">
                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 mb-0.5 flex items-center gap-1.5">
                        <span className="h-5 w-5 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-blue-600 text-base">✓</span>
                        </span>
                        <span className="font-bold text-gray-800">{title}</span>
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════ DESKTOP LAYOUT ══════════════════════════════ */}
          <div className="hidden lg:block">

            {/* Blue gradient hero */}
            <section className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 overflow-hidden">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-20 -right-20 h-96 w-96 rounded-full bg-white/5" />
                <div className="absolute top-10 right-40 h-64 w-64 rounded-full bg-white/5" />
                <div className="absolute -bottom-10 left-20 h-48 w-48 rounded-full bg-blue-800/30" />
              </div>
              <div className="relative px-8 pt-10 pb-6">
                <div className="text-center mb-4">
                  <h1 className="text-3xl font-bold text-white mb-2">อุ่นใจทุกการเดินทางกับ Maitri</h1>
                  <div className="flex items-center justify-center gap-6 text-sm text-blue-100">
                    <span className="flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-blue-400/50 flex items-center justify-center text-[10px]">✓</span>
                      ระบบการชำระเงินปลอดภัย วางใจได้
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-4 w-4 rounded-full bg-blue-400/50 flex items-center justify-center text-[10px]">✓</span>
                      ติดต่อง่ายภายใน 30 วินาที
                    </span>
                  </div>
                </div>
                {/* Category tabs */}
                <div className="flex items-center justify-center gap-1 mb-5">
                  {[
                    { label: 'ที่พัก', icon: Hotel, active: true, href: '#search' },
                    { label: 'โรงแรม', icon: Building2, href: '/search?type=hotel' },
                    { label: 'รีสอร์ท', icon: Waves, href: '/search?type=resort' },
                    { label: 'Pool Villa', icon: Home, href: '/search?type=pool_villa' },
                    { label: 'Boutique', icon: Tent, href: '/search?type=boutique' },
                  ].map(tab => {
                    const Icon = tab.icon;
                    return (
                      <Link key={tab.label} href={tab.href}
                        className={cn(
                          'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all',
                          tab.active ? 'bg-white text-blue-700 shadow-sm' : 'text-white/80 hover:text-white hover:bg-white/15',
                        )}>
                        <Icon className="h-4 w-4" strokeWidth={tab.active ? 2 : 1.7} />
                        {tab.label}
                      </Link>
                    );
                  })}
                </div>
                <div id="search" className="max-w-5xl mx-auto">
                  <DesktopSearchForm />
                </div>
              </div>
            </section>

            {/* Desktop content */}
            <div className="px-8 py-8 space-y-10 bg-[#f5f7fa]">

              {/* New user offers */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">สิทธิพิเศษสำหรับผู้ใช้ใหม่</h2>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {NEW_USER_OFFERS.map((offer, i) => (
                    <div key={i} className={cn(
                      'rounded-xl p-4 relative overflow-hidden border',
                      offer.light ? 'bg-white border-gray-200 shadow-sm' : 'bg-gradient-to-br from-blue-600 to-blue-700 border-transparent',
                    )}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className={cn('text-sm font-bold leading-snug', offer.light ? 'text-gray-800' : 'text-white')}>{offer.title}</p>
                          {'sub' in offer && offer.sub && <p className="text-xs text-gray-500 mt-0.5">{offer.sub}</p>}
                        </div>
                        <span className="text-2xl shrink-0">{offer.emoji}</span>
                      </div>
                      <Link href="/portal/login"
                        className={cn(
                          'inline-flex items-center justify-center w-full py-2 rounded-lg text-xs font-semibold transition-colors',
                          offer.light ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-white text-blue-700 hover:bg-blue-50',
                        )}>
                        {offer.cta}
                      </Link>
                    </div>
                  ))}
                </div>
              </section>

              <RecentlyViewed />

              {/* Deal banners */}
              <section>
                <div className="grid grid-cols-2 gap-4">
                  {BLOG_POSTS.map((post, i) => (
                    <Link key={i} href="/search"
                      className="relative rounded-2xl overflow-hidden h-44 group cursor-pointer shadow-sm hover:shadow-md transition-shadow">
                      <Image src={post.img} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <span className="inline-block bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1.5">{post.tag}</span>
                        <p className="text-white font-bold text-sm leading-snug">{post.title}</p>
                      </div>
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 text-[10px] font-semibold text-blue-700">Maitri</div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Popular destinations */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">จุดหมายยอดนิยม</h2>
                  <Link href="/search" className="flex items-center gap-0.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    เพิ่มเติม <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-6 gap-3">
                  {DESTINATIONS.map(d => (
                    <Link key={d.name} href={`/search?city=${d.name}`}
                      className="group rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                      <div className="relative h-32 overflow-hidden">
                        <Image src={d.img} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <div className="absolute bottom-2 left-2"><p className="text-white font-bold text-sm">{d.nameTh}</p></div>
                      </div>
                      <div className="px-3 py-2"><p className="text-xs text-gray-500">{d.hotels.toLocaleString()} ที่พัก</p></div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Trip Best */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">สถานที่ที่คุณอาจชอบ</h2>
                  <Link href="/search" className="flex items-center gap-0.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    เพิ่มเติม <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {DESTINATIONS.slice(0, 4).map((d, i) => (
                    <Link key={d.name} href={`/search?city=${d.name}`}
                      className="group rounded-xl overflow-hidden bg-white border border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                      <div className="relative h-44 overflow-hidden">
                        <Image src={d.img} alt={d.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md">Maitri Best</div>
                        <button onClick={e => e.preventDefault()} className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                          <Heart className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <p className="text-white font-bold text-sm">{d.nameTh}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="text-white/90 text-xs font-semibold">4.{7 - i}</span>
                            <span className="text-white/60 text-xs">· {(1200 - i * 200).toLocaleString()} รีวิว</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Trust strip */}
              <section className="grid grid-cols-3 gap-4">
                {[
                  { icon: Shield,   title: 'ราคาดีที่สุด',    desc: 'จองตรงกับโรงแรม ได้ราคาพิเศษกว่า OTA รับประกัน Best Rate' },
                  { icon: Tag,      title: 'ยกเลิกฟรี',       desc: 'เลือกเรทที่ยกเลิกได้ฟรี ไม่มีค่าปรับก่อน 24 ชม.' },
                  { icon: Sparkles, title: 'สะสมแต้มทุกจอง', desc: 'รับ Maitri Points ทุกครั้งที่จอง แลกส่วนลดได้ทุกเวลา' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm mb-0.5">{title}</p>
                      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </section>

            </div>
          </div>

          {/* ── Footer ── */}
          <footer className="bg-white border-t border-gray-200 mt-4">
            <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10 lg:py-12">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-8">
                <div className="col-span-2 md:col-span-1">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <span className="font-bold text-blue-600 text-xl">Maitri</span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    จองที่พักทั่วไทยในราคาที่ดีที่สุด<br />Built with ❤️ in Thailand 🇹🇭
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
                    { label: 'การจองของฉัน', href: '/portal/trips' },
                    { label: 'Maitri Rewards', href: '/portal/loyalty' },
                  ]},
                  { title: 'คู่มือ', links: [
                    { label: 'วิธีการจอง', href: '/portal/login' },
                    { label: 'นโยบายยกเลิก', href: '/privacy' },
                    { label: 'ช่วยเหลือ', href: '/portal/login' },
                    { label: 'ติดต่อเรา', href: 'mailto:hello@maitri.co' },
                  ]},
                  { title: 'ข้อมูล', links: [
                    { label: 'เงื่อนไขการใช้งาน', href: '/terms' },
                    { label: 'ความเป็นส่วนตัว', href: '/privacy' },
                    { label: 'ลงทะเบียนที่พัก', href: '/portal/login' },
                  ]},
                ].map(col => (
                  <div key={col.title}>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">{col.title}</h4>
                    <ul className="space-y-2.5">
                      {col.links.map(link => (
                        <li key={link.label}>
                          <Link href={link.href} className="text-sm text-gray-600 hover:text-blue-600 transition-colors">{link.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-gray-400">© 2026 Maitri Collection · All rights reserved</p>
                <Link href="/owner/login" className="text-xs text-gray-300 hover:text-gray-500 transition-colors">Hotel Partner Login</Link>
              </div>
            </div>
          </footer>

        </main>
      </div>
    </div>
  );
}
