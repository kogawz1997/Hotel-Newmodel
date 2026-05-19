'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft, Utensils, Sparkles, Check, Loader2,
  ShoppingCart, Plus, Minus, AlertCircle, ChevronRight,
  Bed, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const MENU = [
  { category: 'อาหาร', emoji: '🍽️', items: [
    { id: 'congee',    name: 'ข้าวต้ม',           price: 150, desc: 'ข้าวต้มหมู/ไก่ ฝักเขียว' },
    { id: 'friedrice', name: 'ข้าวผัด',            price: 180, desc: 'ข้าวผัดหมู/ไก่/กุ้ง' },
    { id: 'basil',     name: 'ผัดกระเพรา',         price: 160, desc: 'ผัดกระเพราหมูสับ/ไก่ + ข้าวสวย' },
    { id: 'noodle',    name: 'ก๋วยเตี๋ยว',         price: 150, desc: 'น้ำใส / ต้มยำ' },
    { id: 'club_sand', name: 'Club Sandwich',      price: 220, desc: 'ขนมปังปิ้ง ไก่ ไข่ ผัก' },
    { id: 'fried_egg', name: 'ไข่ดาว / ไข่เจียว', price: 90,  desc: 'พร้อมข้าวสวย' },
  ]},
  { category: 'เครื่องดื่ม', emoji: '☕', items: [
    { id: 'coffee',    name: 'กาแฟ',             price: 80,  desc: 'Espresso / Latte / Americano' },
    { id: 'tea',       name: 'ชาร้อน/เย็น',      price: 60,  desc: 'มะลิ / เขียว / นม' },
    { id: 'juice',     name: 'น้ำผลไม้สด',       price: 90,  desc: 'ส้ม / แตงโม / มะม่วง' },
    { id: 'water',     name: 'น้ำดื่ม (ขวด)',   price: 40,  desc: '500ml' },
    { id: 'softdrink', name: 'โซดา / น้ำอัดลม', price: 50,  desc: 'Coke / Sprite / Soda' },
  ]},
  { category: 'ของหวาน', emoji: '🍰', items: [
    { id: 'fruit',    name: 'ผลไม้รวม',       price: 120, desc: 'แล่ตามฤดูกาล' },
    { id: 'icecream', name: 'ไอศกรีม',        price: 90,  desc: 'วานิลลา / ช็อกโกแลต / สตรอเบอร์รี่' },
    { id: 'cake',     name: 'เค้ก (1 ชิ้น)', price: 110, desc: 'ช็อกโกแลต / ช่อง' },
  ]},
] as const;

const HK_ITEMS = [
  { id: 'towel',    label: 'ขอผ้าเช็ดตัวเพิ่ม',          icon: '🛁' },
  { id: 'pillow',   label: 'ขอหมอนเพิ่ม',                icon: '🛏️' },
  { id: 'blanket',  label: 'ขอผ้าห่มเพิ่ม',              icon: '🧸' },
  { id: 'cleaning', label: 'ขอทำความสะอาดห้อง',          icon: '🧹' },
  { id: 'minibar',  label: 'เติม Minibar',                icon: '🥤' },
  { id: 'charger',  label: 'ขอสายชาร์จ/อุปกรณ์ไฟฟ้า',   icon: '🔌' },
  { id: 'other',    label: 'อื่นๆ (ระบุในหมายเหตุ)',      icon: '📝' },
];

const SPA_SERVICES = [
  { id: 'thai60',   name: 'นวดแผนไทย 60 นาที',      price: 800,  duration: '60 นาที' },
  { id: 'oil60',    name: 'นวดน้ำมัน 60 นาที',       price: 900,  duration: '60 นาที' },
  { id: 'facial60', name: 'Facial Treatment 60 นาที', price: 1000, duration: '60 นาที' },
  { id: 'couple',   name: 'Couple Massage 60 นาที',   price: 1600, duration: '60 นาที' },
  { id: 'foot30',   name: 'นวดเท้า 30 นาที',          price: 500,  duration: '30 นาที' },
  { id: 'back30',   name: 'นวดหลัง 30 นาที',          price: 500,  duration: '30 นาที' },
];

type Tab = 'room_service' | 'housekeeping' | 'spa';
type CartItem = { id: string; name: string; price: number; qty: number };

const TAB_IMAGES: Record<Tab, string> = {
  room_service: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=75&fit=crop',
  housekeeping: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=75&fit=crop',
  spa:          'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=75&fit=crop',
};

const TAB_LABELS: Record<Tab, { title: string; subtitle: string; icon: React.ReactNode }> = {
  room_service: { title: 'Room Service', subtitle: 'สั่งอาหารและเครื่องดื่มส่งถึงห้อง', icon: <Utensils className="h-4 w-4" /> },
  housekeeping: { title: 'Housekeeping', subtitle: 'ของใช้และบริการห้องพัก', icon: <Bed className="h-4 w-4" /> },
  spa:          { title: 'Spa & Wellness', subtitle: 'จองบริการสปาและนวด', icon: <Sparkles className="h-4 w-4" /> },
};

const fadeIn = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 } };

export function ServicesClient() {
  const [tab, setTab] = useState<Tab>('room_service');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [rsNotes, setRsNotes] = useState('');
  const [hkSelected, setHkSelected] = useState<string[]>([]);
  const [hkNotes, setHkNotes] = useState('');
  const [spaService, setSpaService] = useState('');
  const [spaTime, setSpaTime] = useState('');
  const [spaGuests, setSpaGuests] = useState(1);
  const [spaNotes, setSpaNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);

  function addToCart(item: { id: string; name: string; price: number }) {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1 }];
    });
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c).filter(c => c.qty > 0));
  }

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const cartCount = cart.reduce((s, c) => s + c.qty, 0);

  async function submitRequest(type: Tab) {
    setSubmitting(true);
    try {
      let title = '';
      let description = '';

      if (type === 'room_service') {
        if (cart.length === 0) { toast.error('กรุณาเลือกรายการสั่ง'); return; }
        const lines = cart.map(c => `${c.name} ×${c.qty} (฿${(c.price * c.qty).toLocaleString()})`);
        title = `Room Service — ${cart.length} รายการ`;
        description = lines.join('\n') + (rsNotes ? `\nหมายเหตุ: ${rsNotes}` : '');
      } else if (type === 'housekeeping') {
        if (hkSelected.length === 0 && !hkNotes.trim()) { toast.error('กรุณาเลือกหรือระบุสิ่งที่ต้องการ'); return; }
        const items = HK_ITEMS.filter(h => hkSelected.includes(h.id)).map(h => h.label);
        title = `Housekeeping — ${items.slice(0, 2).join(', ')}${items.length > 2 ? '...' : ''}`;
        description = items.join('\n') + (hkNotes ? `\nหมายเหตุ: ${hkNotes}` : '');
      } else {
        if (!spaService) { toast.error('กรุณาเลือกบริการ Spa'); return; }
        const service = SPA_SERVICES.find(s => s.id === spaService);
        title = `Spa — ${service?.name ?? spaService}`;
        description = `บริการ: ${service?.name}\nเวลาต้องการ: ${spaTime || 'ยืดหยุ่น'}\nจำนวนคน: ${spaGuests}${spaNotes ? `\nหมายเหตุ: ${spaNotes}` : ''}`;
      }

      const res = await fetch('/api/guest/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, description }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'เกิดข้อผิดพลาด'); return; }
      setLastOrderId(data.id);
      toast.success('ส่งคำร้องสำเร็จ! ทีมงานจะดูแลคุณโดยเร็ว');
      setCart([]); setRsNotes(''); setShowCart(false);
      setHkSelected([]); setHkNotes('');
      setSpaService(''); setSpaTime(''); setSpaNotes('');
    } finally {
      setSubmitting(false);
    }
  }

  const tabInfo = TAB_LABELS[tab];

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background text-foreground">

      {/* Hero image header */}
      <div className="relative h-44 overflow-hidden rounded-b-3xl mb-6">
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }} className="absolute inset-0">
            <Image src={TAB_IMAGES[tab]} alt={tabInfo.title} fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60" />
          </motion.div>
        </AnimatePresence>

        {/* Back button + title overlay */}
        <div className="absolute inset-x-0 top-0 px-4 pt-4 flex items-center gap-3 z-10">
          <Link href="/portal/stay"
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/30 backdrop-blur-sm border border-white/20 text-white hover:bg-black/40 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 z-10">
          <AnimatePresence mode="wait">
            <motion.div key={tab} {...fadeIn} transition={{ duration: 0.3 }}>
              <h1 className="font-display text-xl font-bold text-white">{tabInfo.title}</h1>
              <p className="text-sm text-white/70">{tabInfo.subtitle}</p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="px-4">
        {/* Tab selector */}
        <div className="relative flex bg-secondary rounded-2xl p-1 mb-6">
          {(['room_service', 'housekeeping', 'spa'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 relative flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium z-10 transition-colors duration-200"
              style={{ color: tab === t ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
            >
              {tab === t && (
                <motion.div layoutId="service-tab"
                  className="absolute inset-0 bg-white dark:bg-card rounded-xl shadow-sm"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }} />
              )}
              <span className="relative z-10">{TAB_LABELS[t].icon}</span>
              <span className="relative z-10 hidden sm:inline">{TAB_LABELS[t].title}</span>
              <span className="relative z-10 sm:hidden">{t === 'room_service' ? 'อาหาร' : t === 'housekeeping' ? 'แม่บ้าน' : 'Spa'}</span>
            </button>
          ))}
        </div>

        {/* Success banner */}
        <AnimatePresence>
          {lastOrderId && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="mb-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">คำร้องถูกส่งแล้ว</p>
                <p className="text-xs text-muted-foreground">ทีมงานจะดูแลคุณโดยเร็ว</p>
              </div>
              <Link href={`/portal/requests/${lastOrderId}`}
                className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 shrink-0 font-medium">
                ติดตาม <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ── ROOM SERVICE ── */}
          {tab === 'room_service' && (
            <motion.div key="rs" {...fadeIn} transition={{ duration: 0.25 }} className="space-y-5 pb-32">
              {MENU.map(cat => (
                <div key={cat.category}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">{cat.emoji}</span>
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{cat.category}</h3>
                  </div>
                  <div className="rounded-2xl border border-gray-100 dark:border-border bg-white dark:bg-card overflow-hidden divide-y divide-border/60">
                    {cat.items.map((item) => {
                      const inCart = cart.find(c => c.id === item.id);
                      return (
                        <div key={item.id} className="flex items-center justify-between px-4 py-3.5">
                          <div className="flex-1 min-w-0 mr-4">
                            <p className="text-sm font-semibold text-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-sm font-bold text-orange-500">
                              {formatCurrency(item.price)}
                            </span>
                            {inCart ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => updateQty(item.id, -1)}
                                  className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary transition-colors">
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="text-sm font-bold text-foreground w-4 text-center">{inCart.qty}</span>
                                <button onClick={() => updateQty(item.id, 1)}
                                  className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => addToCart(item)}
                                className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90 transition-opacity">
                                <Plus className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">หมายเหตุ</label>
                <textarea value={rsNotes} onChange={e => setRsNotes(e.target.value)} rows={2}
                  placeholder="ระบุความต้องการพิเศษ เช่น ไม่ใส่ผักชี ..."
                  className="w-full px-4 py-3 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
              </div>
            </motion.div>
          )}

          {/* ── HOUSEKEEPING ── */}
          {tab === 'housekeeping' && (
            <motion.div key="hk" {...fadeIn} transition={{ duration: 0.25 }} className="space-y-4 pb-32">
              <p className="text-sm text-muted-foreground">เลือกรายการที่ต้องการ</p>
              <div className="rounded-2xl border border-gray-100 dark:border-border bg-white dark:bg-card overflow-hidden divide-y divide-border/60">
                {HK_ITEMS.map(item => (
                  <label key={item.id}
                    className={cn(
                      'flex items-center gap-3 px-4 py-4 cursor-pointer transition-colors',
                      hkSelected.includes(item.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-secondary/50'
                    )}>
                    <div className={cn(
                      'h-5 w-5 rounded flex items-center justify-center border-2 shrink-0 transition-all',
                      hkSelected.includes(item.id)
                        ? 'bg-blue-600 border-blue-600'
                        : 'border-border bg-background'
                    )}>
                      {hkSelected.includes(item.id) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <span className="text-lg mr-1">{item.icon}</span>
                    <span className="text-sm text-foreground">{item.label}</span>
                    <input type="checkbox" checked={hkSelected.includes(item.id)} className="sr-only"
                      onChange={() => setHkSelected(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id])} />
                  </label>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">หมายเหตุเพิ่มเติม</label>
                <textarea value={hkNotes} onChange={e => setHkNotes(e.target.value)} rows={2}
                  placeholder="ระบุรายละเอียดเพิ่มเติม..."
                  className="w-full px-4 py-3 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
              </div>
              <button onClick={() => submitRequest('housekeeping')} disabled={submitting || (hkSelected.length === 0 && !hkNotes.trim())}
                className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity hover:opacity-90">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bed className="h-4 w-4" />}
                {submitting ? 'กำลังส่ง...' : 'ส่งคำขอแม่บ้าน'}
              </button>
              <p className="text-xs text-muted-foreground text-center">ทีมงานจะดำเนินการภายใน 45 นาที</p>
            </motion.div>
          )}

          {/* ── SPA ── */}
          {tab === 'spa' && (
            <motion.div key="spa" {...fadeIn} transition={{ duration: 0.25 }} className="space-y-4 pb-32">
              <div className="rounded-2xl border border-gray-100 dark:border-border bg-white dark:bg-card overflow-hidden divide-y divide-border/60">
                {SPA_SERVICES.map(s => (
                  <button key={s.id} type="button" onClick={() => setSpaService(s.id)}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-4 text-left transition-colors',
                      spaService === s.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-secondary/50'
                    )}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all',
                        spaService === s.id ? 'bg-blue-600 border-blue-600' : 'border-border'
                      )}>
                        {spaService === s.id && <div className="h-2 w-2 rounded-full bg-white" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />{s.duration}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-orange-500 shrink-0 ml-4">
                      {formatCurrency(s.price)}
                    </span>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">เวลาที่ต้องการ</label>
                  <input type="time" value={spaTime} onChange={e => setSpaTime(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">จำนวนคน</label>
                  <select value={spaGuests} onChange={e => setSpaGuests(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl text-sm focus:outline-none">
                    {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} คน</option>)}
                  </select>
                </div>
              </div>

              {spaService && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                  className="rounded-2xl bg-white dark:bg-card border border-blue-500/20 p-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">บริการที่เลือก</span>
                    <span className="font-semibold text-foreground">{SPA_SERVICES.find(s => s.id === spaService)?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">ราคา ({spaGuests} คน)</span>
                    <span className="font-bold text-orange-500">
                      {formatCurrency((SPA_SERVICES.find(s => s.id === spaService)?.price ?? 0) * spaGuests)}
                    </span>
                  </div>
                </motion.div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">หมายเหตุ / ความต้องการพิเศษ</label>
                <textarea value={spaNotes} onChange={e => setSpaNotes(e.target.value)} rows={2}
                  placeholder="เช่น แพ้น้ำมันมะพร้าว, ต้องการนักบำบัดหญิง..."
                  className="w-full px-4 py-3 bg-white dark:bg-card border border-gray-100 dark:border-border rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all" />
              </div>

              <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3.5 flex gap-3 text-xs text-orange-500">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p>ราคาที่แสดงเป็นราคาประมาณ โปรดชำระที่ Spa โดยตรง · จองล่วงหน้าอย่างน้อย 1 ชั่วโมง</p>
              </div>

              <button onClick={() => submitRequest('spa')} disabled={submitting || !spaService}
                className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-opacity hover:opacity-90">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {submitting ? 'กำลังส่ง...' : 'จองบริการ Spa'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Floating cart (room service) ── */}
      <AnimatePresence>
        {tab === 'room_service' && cart.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed bottom-20 inset-x-4 z-30 max-w-2xl mx-auto"
          >
            <button
              onClick={() => setShowCart(true)}
              className="w-full flex items-center justify-between px-5 py-4 rounded-2xl
                bg-blue-600 text-white shadow-xl shadow-blue-900/20
                hover:opacity-95 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-white text-blue-600 text-[10px] font-bold flex items-center justify-center">
                    {cartCount}
                  </span>
                </div>
                <span className="font-semibold text-sm">ดูตะกร้า</span>
              </div>
              <span className="font-bold">{formatCurrency(cartTotal)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart sheet */}
      <AnimatePresence>
        {showCart && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowCart(false)} />
            <motion.div
              initial={{ y: 40 }} animate={{ y: 0 }} exit={{ y: 40 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              className="relative w-full max-w-2xl bg-white dark:bg-card rounded-t-3xl border-t border-l border-r border-gray-100 dark:border-border shadow-2xl"
            >
              <div className="flex justify-center pt-3 pb-2">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>
              <div className="flex items-center justify-between px-5 py-3 border-b border-border">
                <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> ตะกร้าสั่งอาหาร
                </h3>
                <button onClick={() => setShowCart(false)} className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground">
                  ✕
                </button>
              </div>
              <div className="px-5 py-4 max-h-64 overflow-y-auto space-y-3">
                {cart.map(c => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(c.price)} / ชิ้น</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <button onClick={() => updateQty(c.id, -1)}
                        className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-secondary">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-sm font-bold text-foreground w-6 text-center">{c.qty}</span>
                      <button onClick={() => updateQty(c.id, 1)}
                        className="h-7 w-7 rounded-full bg-blue-600 text-white flex items-center justify-center hover:opacity-90">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <span className="text-sm font-bold text-foreground ml-4 w-16 text-right">{formatCurrency(c.price * c.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-6 pt-3 border-t border-border">
                <div className="flex justify-between font-bold text-base mb-4">
                  <span>รวมทั้งหมด</span>
                  <span className="text-orange-500">{formatCurrency(cartTotal)}</span>
                </div>
                <div className="mb-3">
                  <textarea value={rsNotes} onChange={e => setRsNotes(e.target.value)} rows={2}
                    placeholder="หมายเหตุ (ไม่ใส่ผักชี, แพ้อาหาร...)"
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30" />
                </div>
                <button onClick={() => submitRequest('room_service')} disabled={submitting}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Utensils className="h-4 w-4" />}
                  {submitting ? 'กำลังส่ง...' : `สั่งอาหาร · ${formatCurrency(cartTotal)}`}
                </button>
                <p className="text-xs text-muted-foreground text-center mt-2">ระยะเวลาจัดส่งประมาณ 30 นาที</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
