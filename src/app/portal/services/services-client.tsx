'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Utensils, Bed, Sparkles, Check, Loader2, ShoppingCart, Plus, Minus, AlertCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';

// ─── Room Service Menu ───────────────────────────────────────────────────────

const MENU = [
  { category: 'อาหาร', items: [
    { id: 'congee',    name: 'ข้าวต้ม',             price: 150, desc: 'ข้าวต้มหมู/ไก่ ฝักเขียว' },
    { id: 'friedrice', name: 'ข้าวผัด',              price: 180, desc: 'ข้าวผัดหมู/ไก่/กุ้ง' },
    { id: 'basil',     name: 'ผัดกระเพรา',           price: 160, desc: 'ผัดกระเพราหมูสับ/ไก่ + ข้าวสวย' },
    { id: 'noodle',    name: 'ก๋วยเตี๋ยว',           price: 150, desc: 'น้ำใส / ต้มยำ' },
    { id: 'club_sand', name: 'Club Sandwich',        price: 220, desc: 'ขนมปังปิ้ง ไก่ ไข่ ผัก' },
    { id: 'fried_egg', name: 'ไข่ดาว / ไข่เจียว',  price: 90,  desc: 'พร้อมข้าวสวย' },
  ]},
  { category: 'เครื่องดื่ม', items: [
    { id: 'coffee',   name: 'กาแฟ',           price: 80,  desc: 'Espresso / Latte / Americano' },
    { id: 'tea',      name: 'ชาร้อน/เย็น',    price: 60,  desc: 'มะลิ / เขียว / นม' },
    { id: 'juice',    name: 'น้ำผลไม้สด',     price: 90,  desc: 'ส้ม / แตงโม / มะม่วง' },
    { id: 'water',    name: 'น้ำดื่ม (ขวด)', price: 40,  desc: '500ml' },
    { id: 'softdrink',name: 'โซดา / น้ำอัดลม', price: 50, desc: 'Coke / Sprite / Soda' },
  ]},
  { category: 'ของหวาน', items: [
    { id: 'fruit',   name: 'ผลไม้รวม',         price: 120, desc: 'แล่ตามฤดูกาล' },
    { id: 'icecream',name: 'ไอศกรีม',          price: 90,  desc: 'วานิลลา / ช็อกโกแลต / สตรอเบอร์รี่' },
    { id: 'cake',    name: 'เค้ก (1 ชิ้น)',   price: 110, desc: 'ช็อกโกแลต / ช่อง' },
  ]},
] as const;

type CartItem = { id: string; name: string; price: number; qty: number };

// ─── Housekeeping options ────────────────────────────────────────────────────

const HK_ITEMS = [
  { id: 'towel',    label: 'ขอผ้าเช็ดตัวเพิ่ม' },
  { id: 'pillow',   label: 'ขอหมอนเพิ่ม' },
  { id: 'blanket',  label: 'ขอผ้าห่มเพิ่ม' },
  { id: 'cleaning', label: 'ขอทำความสะอาดห้อง' },
  { id: 'minibar',  label: 'เติม Minibar' },
  { id: 'charger',  label: 'ขอสายชาร์จ/อุปกรณ์ไฟฟ้า' },
  { id: 'other',    label: 'อื่นๆ (ระบุในหมายเหตุ)' },
];

// ─── Spa services ────────────────────────────────────────────────────────────

const SPA_SERVICES = [
  { id: 'thai60',   name: 'นวดแผนไทย 60 นาที',   price: 800 },
  { id: 'oil60',    name: 'นวดน้ำมัน 60 นาที',    price: 900 },
  { id: 'facial60', name: 'Facial treatment 60 นาที', price: 1000 },
  { id: 'couple',   name: 'Couple massage 60 นาที',  price: 1600 },
  { id: 'foot30',   name: 'นวดเท้า 30 นาที',       price: 500 },
  { id: 'back30',   name: 'นวดหลัง 30 นาที',       price: 500 },
];

type Tab = 'room_service' | 'housekeeping' | 'spa';

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
      setCart([]); setRsNotes('');
      setHkSelected([]); setHkNotes('');
      setSpaService(''); setSpaTime(''); setSpaNotes('');
    } finally {
      setSubmitting(false);
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof Utensils }[] = [
    { key: 'room_service', label: 'Room Service', icon: Utensils },
    { key: 'housekeeping', label: 'แม่บ้าน', icon: Bed },
    { key: 'spa', label: 'Spa & Wellness', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/portal" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-semibold">บริการห้องพัก</h1>
            <p className="text-xs text-muted-foreground">สั่งอาหาร · แม่บ้าน · Spa</p>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${tab === t.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {lastOrderId && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-3">
            <Check className="h-4 w-4 text-emerald-600 shrink-0" />
            <div className="flex-1 text-sm text-emerald-700">
              <p className="font-medium">คำร้องถูกส่งแล้ว</p>
              <p className="text-xs mt-0.5">ทีมงานจะดูแลคุณโดยเร็ว</p>
            </div>
            <Link href={`/portal/requests/${lastOrderId}`} className="text-xs text-emerald-600 flex items-center gap-1 shrink-0">
              ติดตาม <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {/* ── ROOM SERVICE ── */}
        {tab === 'room_service' && (
          <div className="space-y-5">
            {MENU.map(cat => (
              <div key={cat.category}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{cat.category}</h3>
                <div className="rounded-xl border border-border divide-y divide-border/50">
                  {cat.items.map(item => {
                    const inCart = cart.find(c => c.id === item.id);
                    return (
                      <div key={item.id} className="flex items-center justify-between px-4 py-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className="text-sm font-semibold text-primary">{formatCurrency(item.price)}</span>
                          {inCart ? (
                            <div className="flex items-center gap-2">
                              <button onClick={() => updateQty(item.id, -1)} className="h-7 w-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors">
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-medium w-4 text-center">{inCart.qty}</span>
                              <button onClick={() => updateQty(item.id, 1)} className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(item)} className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity">
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

            {cart.length > 0 && (
              <div className="rounded-xl border border-border p-4 space-y-3 bg-muted/20">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  <span className="text-sm font-semibold">ตะกร้าสั่งอาหาร ({cart.length} รายการ)</span>
                </div>
                {cart.map(c => (
                  <div key={c.id} className="flex justify-between text-sm">
                    <span>{c.name} ×{c.qty}</span>
                    <span className="font-medium">{formatCurrency(c.price * c.qty)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold border-t border-border pt-2">
                  <span>รวม</span>
                  <span className="text-primary">{formatCurrency(cartTotal)}</span>
                </div>
              </div>
            )}

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">หมายเหตุ</label>
              <textarea value={rsNotes} onChange={e => setRsNotes(e.target.value)} rows={2}
                placeholder="ระบุความต้องการพิเศษ เช่น ไม่ใส่ผักชี ..."
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <button onClick={() => submitRequest('room_service')} disabled={submitting || cart.length === 0}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Utensils className="h-4 w-4" />}
              {submitting ? 'กำลังส่ง...' : `สั่งอาหาร${cartTotal > 0 ? ` · ${formatCurrency(cartTotal)}` : ''}`}
            </button>
            <p className="text-xs text-muted-foreground text-center">ระยะเวลาจัดส่งประมาณ 30 นาที</p>
          </div>
        )}

        {/* ── HOUSEKEEPING ── */}
        {tab === 'housekeeping' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">เลือกรายการที่ต้องการ</p>
            <div className="rounded-xl border border-border divide-y divide-border/50">
              {HK_ITEMS.map(item => (
                <label key={item.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                  <input type="checkbox" checked={hkSelected.includes(item.id)}
                    onChange={() => setHkSelected(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id])}
                    className="h-4 w-4 rounded accent-primary" />
                  <span className="text-sm">{item.label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">หมายเหตุเพิ่มเติม</label>
              <textarea value={hkNotes} onChange={e => setHkNotes(e.target.value)} rows={2}
                placeholder="ระบุรายละเอียดเพิ่มเติม..."
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            <button onClick={() => submitRequest('housekeeping')} disabled={submitting || (hkSelected.length === 0 && !hkNotes.trim())}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bed className="h-4 w-4" />}
              {submitting ? 'กำลังส่ง...' : 'ส่งคำขอแม่บ้าน'}
            </button>
            <p className="text-xs text-muted-foreground text-center">ทีมงานจะดำเนินการภายใน 45 นาที</p>
          </div>
        )}

        {/* ── SPA ── */}
        {tab === 'spa' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border divide-y divide-border/50">
              {SPA_SERVICES.map(s => (
                <label key={s.id} className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors ${spaService === s.id ? 'bg-primary/5' : ''}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="spa" value={s.id} checked={spaService === s.id} onChange={() => setSpaService(s.id)}
                      className="accent-primary" />
                    <span className="text-sm">{s.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-primary">{formatCurrency(s.price)}</span>
                </label>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">เวลาที่ต้องการ</label>
                <input type="time" value={spaTime} onChange={e => setSpaTime(e.target.value)}
                  className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">จำนวนคน</label>
                <select value={spaGuests} onChange={e => setSpaGuests(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-muted/30 border border-border rounded-xl text-sm focus:outline-none">
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} คน</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">หมายเหตุ / ความต้องการพิเศษ</label>
              <textarea value={spaNotes} onChange={e => setSpaNotes(e.target.value)} rows={2}
                placeholder="เช่น แพ้น้ำมันมะพร้าว, ต้องการนักบำบัดหญิง..."
                className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>

            {spaService && (
              <div className="rounded-xl bg-muted/30 border border-border p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">บริการ</span>
                  <span className="font-medium">{SPA_SERVICES.find(s => s.id === spaService)?.name}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-muted-foreground">ราคา</span>
                  <span className="font-semibold text-primary">{formatCurrency((SPA_SERVICES.find(s => s.id === spaService)?.price ?? 0) * spaGuests)} ({spaGuests} คน)</span>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex gap-2 text-xs text-amber-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>ราคาที่แสดงเป็นราคาประมาณ โปรดชำระที่ Spa โดยตรง · จองล่วงหน้าอย่างน้อย 1 ชั่วโมง</p>
            </div>

            <button onClick={() => submitRequest('spa')} disabled={submitting || !spaService}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {submitting ? 'กำลังส่ง...' : 'จองบริการ Spa'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
