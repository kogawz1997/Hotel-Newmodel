'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import NextImage from 'next/image';
import {
  Zap, ListChecks, Info, MessageCircle,
  Send, Phone, Wifi, Clock, Check, X, Loader2,
  CheckCheck, ChevronDown, Coffee, Bath, Wrench,
  Utensils, Car, Sparkles, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ServiceRequest {
  id: string;
  type: string;
  icon: string;
  label: string;
  detail: string;
  createdAt: number;
}

interface Msg {
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

type TabId = 'services' | 'requests' | 'info' | 'chat';

// ─── Constants ────────────────────────────────────────────────────────────────

const BRAND_DARK   = '#2A2522';
const BRAND_ORANGE = '#2563eb';
const BRAND_CREAM  = '#FAF7F2';

const TIMELINE_STEPS = [
  { label: 'ส่งคำขอแล้ว',      delayMs: 0,          color: 'bg-emerald-500' },
  { label: 'พนักงานรับงาน',     delayMs: 2 * 60_000,  color: 'bg-blue-500'    },
  { label: 'กำลังดำเนินการ',    delayMs: 5 * 60_000,  color: 'bg-yellow-500'  },
  { label: 'เสร็จเรียบร้อย',   delayMs: 15 * 60_000, color: 'bg-green-500'   },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nowTime() {
  return new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function getActiveStep(createdAt: number): number {
  const elapsed = Date.now() - createdAt;
  let step = 0;
  for (let i = 0; i < TIMELINE_STEPS.length; i++) {
    if (elapsed >= TIMELINE_STEPS[i].delayMs) step = i;
  }
  return step;
}

function formatThaiTime(ts: number) {
  return new Date(ts).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

// ─── Bottom-sheet backdrop ────────────────────────────────────────────────────

function Backdrop({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      onClick={onClose}
    />
  );
}

// ─── Linen form modal ─────────────────────────────────────────────────────────

const LINEN_ITEMS = ['ผ้าเช็ดตัว', 'ผ้าปูที่นอน', 'หมอน', 'ผ้าห่ม'];

function LinenSheet({ onSubmit, onClose }: { onSubmit: (detail: string) => void; onClose: () => void }) {
  const [checked, setChecked] = useState<string[]>([]);
  const toggle = (item: string) =>
    setChecked(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);

  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white rounded-t-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#2A2522]">ขอผ้า/หมอน</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-[#2A2522]/60 mb-3">เลือกรายการที่ต้องการ</p>
        <div className="space-y-2 mb-5">
          {LINEN_ITEMS.map(item => (
            <label key={item} className="flex items-center gap-3 p-3 rounded-xl border border-black/10 cursor-pointer hover:border-[#2563eb]/40">
              <input type="checkbox" checked={checked.includes(item)} onChange={() => toggle(item)}
                className="h-4 w-4 accent-[#2563eb]" />
              <span className="text-sm text-[#2A2522]">{item}</span>
            </label>
          ))}
        </div>
        <button
          disabled={checked.length === 0}
          onClick={() => onSubmit(`ขอ ${checked.join(', ')}`)}
          className="w-full py-3 bg-[#2563eb] disabled:bg-[#2563eb]/30 text-white rounded-xl font-medium transition-colors"
        >
          ส่งคำขอ
        </button>
      </div>
    </>
  );
}

// ─── Repair form modal ────────────────────────────────────────────────────────

function RepairSheet({ onSubmit, onClose }: { onSubmit: (detail: string) => void; onClose: () => void }) {
  const [text, setText] = useState('');
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white rounded-t-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#2A2522]">แจ้งซ่อม</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
        </div>
        <textarea
          value={text} onChange={e => setText(e.target.value)}
          placeholder="อธิบายปัญหาที่พบ เช่น แอร์ไม่เย็น, น้ำไม่ไหล..."
          rows={4}
          className="w-full px-4 py-3 bg-[#FAF7F2] rounded-xl text-sm focus:outline-none resize-none mb-4"
        />
        <button
          disabled={!text.trim()}
          onClick={() => onSubmit(`แจ้งซ่อม: ${text.trim()}`)}
          className="w-full py-3 bg-[#2563eb] disabled:bg-[#2563eb]/30 text-white rounded-xl font-medium transition-colors"
        >
          ส่งคำขอ
        </button>
      </div>
    </>
  );
}

// ─── Car form modal ───────────────────────────────────────────────────────────

function CarSheet({ onSubmit, onClose }: { onSubmit: (detail: string) => void; onClose: () => void }) {
  const [dest, setDest] = useState('');
  const [time, setTime] = useState('');
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white rounded-t-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#2A2522]">เรียกรถ</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 mb-5">
          <div>
            <label className="text-xs text-[#2A2522]/60 mb-1 block">ปลายทาง</label>
            <input value={dest} onChange={e => setDest(e.target.value)}
              placeholder="เช่น สนามบิน, ห้างสรรพสินค้า..."
              className="w-full px-4 py-2.5 bg-[#FAF7F2] rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-[#2A2522]/60 mb-1 block">เวลาที่ต้องการ</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#FAF7F2] rounded-xl text-sm focus:outline-none" />
          </div>
        </div>
        <button
          disabled={!dest.trim()}
          onClick={() => onSubmit(`เรียกรถ ปลายทาง: ${dest.trim()}${time ? ` เวลา ${time}` : ''}`)}
          className="w-full py-3 bg-[#2563eb] disabled:bg-[#2563eb]/30 text-white rounded-xl font-medium transition-colors"
        >
          ส่งคำขอ
        </button>
      </div>
    </>
  );
}

// ─── Simple info sheet ────────────────────────────────────────────────────────

function InfoSheet({ title, body, onClose }: { title: string; body: string; onClose: () => void }) {
  return (
    <>
      <Backdrop onClose={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-white rounded-t-2xl p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[#2A2522]">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-[#2A2522]/70 leading-relaxed mb-5">{body}</p>
        <button onClick={onClose} className="w-full py-3 bg-[#2A2522] text-white rounded-xl font-medium">รับทราบ</button>
      </div>
    </>
  );
}

// ─── Tab: Services ────────────────────────────────────────────────────────────

type ModalType = 'clean' | 'linen' | 'food' | 'repair' | 'car' | 'spa' | null;

function ServicesTab({
  hotel,
  room,
  reservation,
  onAddRequest,
  onSwitchToChat,
}: {
  hotel: any;
  room: any;
  reservation: any;
  onAddRequest: (req: Omit<ServiceRequest, 'id' | 'createdAt'>) => void;
  onSwitchToChat: () => void;
}) {
  const [modal, setModal] = useState<ModalType>(null);
  const close = () => setModal(null);

  const submitAndClose = useCallback(
    async (type: string, icon: string, label: string, detail: string) => {
      onAddRequest({ type, icon, label, detail });
      close();
      // Fire to API (best-effort)
      try {
        await fetch('/api/public/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hotelId: hotel.id,
            message: detail,
            history: [],
            context: `[SERVICE REQUEST] Guest in room ${room?.room_number}. Reservation: ${reservation?.reservation_code || 'N/A'}. Check-out: ${reservation?.check_out || 'unknown'}.`,
          }),
        });
      } catch {
        // silent fail — request still recorded locally
      }
    },
    [hotel, room, reservation, onAddRequest],
  );

  const CARDS = [
    {
      icon: '🧹', emoji: 'clean', label: 'ทำความสะอาด',
      sub: 'ขอให้ทำความสะอาดห้อง',
      onClick: () => setModal('clean'),
    },
    {
      icon: '🛁', emoji: 'linen', label: 'ขอผ้า/หมอน',
      sub: 'เลือกรายการที่ต้องการ',
      onClick: () => setModal('linen'),
    },
    {
      icon: '🍜', emoji: 'food', label: 'สั่งอาหาร',
      sub: 'Room Service',
      onClick: () => setModal('food'),
    },
    {
      icon: '🔧', emoji: 'repair', label: 'แจ้งซ่อม',
      sub: 'แจ้งปัญหาในห้อง',
      onClick: () => setModal('repair'),
    },
    {
      icon: '🚗', emoji: 'car', label: 'เรียกรถ',
      sub: 'จองรถรับส่ง',
      onClick: () => setModal('car'),
    },
    {
      icon: '💆', emoji: 'spa', label: 'จอง Spa',
      sub: 'นวดและสปา',
      onClick: () => setModal('spa'),
    },
    {
      icon: '💬', emoji: 'chat', label: 'ติดต่อพนักงาน',
      sub: 'แชทสด',
      onClick: onSwitchToChat,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="text-xs text-[#2A2522]/40 uppercase tracking-wider mb-3">เลือกบริการ</p>
      <div className="grid grid-cols-2 gap-3">
        {CARDS.map(card => (
          <button
            key={card.emoji}
            onClick={card.onClick}
            className="bg-white rounded-2xl p-4 text-left shadow-sm hover:shadow-md active:scale-95 transition-all border border-black/5"
          >
            <span className="text-2xl block mb-2">{card.icon}</span>
            <p className="text-sm font-semibold text-[#2A2522]">{card.label}</p>
            <p className="text-xs text-[#2A2522]/50 mt-0.5 leading-tight">{card.sub}</p>
          </button>
        ))}
      </div>

      {/* Modals */}
      {modal === 'clean' && (
        <InfoSheet
          title="ทำความสะอาดห้อง"
          body="ขอให้ทำความสะอาดห้อง เจ้าหน้าที่จะเข้าห้องภายใน 20–30 นาที"
          onClose={() => {
            submitAndClose('clean', '🧹', 'ทำความสะอาด', 'ขอให้ทำความสะอาดห้อง');
          }}
        />
      )}
      {modal === 'linen' && (
        <LinenSheet
          onSubmit={detail => submitAndClose('linen', '🛁', 'ขอผ้า/หมอน', detail)}
          onClose={close}
        />
      )}
      {modal === 'food' && (
        <InfoSheet
          title="สั่งอาหาร (Room Service)"
          body="ต้องการ Room Service โปรดติดต่อเจ้าหน้าที่ผ่านแท็บ แชท หรือโทรภายใน"
          onClose={() => {
            close();
            onSwitchToChat();
          }}
        />
      )}
      {modal === 'repair' && (
        <RepairSheet
          onSubmit={detail => submitAndClose('repair', '🔧', 'แจ้งซ่อม', detail)}
          onClose={close}
        />
      )}
      {modal === 'car' && (
        <CarSheet
          onSubmit={detail => submitAndClose('car', '🚗', 'เรียกรถ', detail)}
          onClose={close}
        />
      )}
      {modal === 'spa' && (
        <InfoSheet
          title="จอง Spa"
          body="ต้องการจอง Spa กรุณาติดต่อเจ้าหน้าที่ผ่านแท็บ แชท หรือ Front Desk"
          onClose={() => {
            close();
            onSwitchToChat();
          }}
        />
      )}
    </div>
  );
}

// ─── Tab: Requests ────────────────────────────────────────────────────────────

function RequestsTab({ requests }: { requests: ServiceRequest[] }) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceUpdate(n => n + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  if (requests.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-3">
        <ListChecks className="h-12 w-12 text-[#2A2522]/20" />
        <p className="text-[#2A2522]/50 text-sm">ยังไม่มีคำขอ<br />กดแท็บบริการเพื่อสั่งบริการ</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {[...requests].reverse().map(req => {
        const active = getActiveStep(req.createdAt);
        return (
          <div key={req.id} className="bg-white rounded-2xl p-4 shadow-sm border border-black/5">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{req.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#2A2522]">{req.label}</p>
                <p className="text-xs text-[#2A2522]/50 truncate">{req.detail}</p>
              </div>
              <span className="text-2xs text-[#2A2522]/40 shrink-0">{formatThaiTime(req.createdAt)}</span>
            </div>
            {/* Timeline */}
            <div className="space-y-2">
              {TIMELINE_STEPS.map((step, i) => {
                const done = i <= active;
                const isCurrent = i === active && active < TIMELINE_STEPS.length - 1;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <div className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-white transition-colors',
                      done ? step.color : 'bg-gray-200',
                    )}>
                      {done ? <Check className="h-3 w-3" /> : <span className="h-2 w-2 rounded-full bg-gray-400" />}
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className={cn('text-xs', done ? 'text-[#2A2522]' : 'text-[#2A2522]/30')}>
                        {step.label}
                      </span>
                      {isCurrent && (
                        <span className="text-2xs px-1.5 py-0.5 bg-[#2563eb]/10 text-[#2563eb] rounded-full animate-pulse">
                          กำลังดำเนินการ
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Hotel Info ──────────────────────────────────────────────────────────

function HotelInfoTab({ hotel }: { hotel: any }) {
  const amenities = ['สระว่ายน้ำ', 'ฟิตเนส', 'สปา', 'ร้านอาหาร'];
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      {/* WiFi */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5">
        <div className="flex items-center gap-2 mb-3">
          <Wifi className="h-4 w-4 text-[#2563eb]" />
          <span className="font-semibold text-sm text-[#2A2522]">WiFi</span>
        </div>
        {hotel.wifi_name ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#2A2522]/50">ชื่อเครือข่าย</span>
              <span className="font-mono font-medium text-[#2A2522]">{hotel.wifi_name}</span>
            </div>
            {hotel.wifi_password && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#2A2522]/50">รหัสผ่าน</span>
                <span className="font-mono font-medium text-[#2A2522] select-all">{hotel.wifi_password}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-[#2A2522]/50">ถามที่ Front Desk</p>
        )}
      </div>

      {/* Check-out time */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-4 w-4 text-[#2563eb]" />
          <span className="font-semibold text-sm text-[#2A2522]">เวลาเช็คเอาท์</span>
        </div>
        <p className="text-2xl font-bold text-[#2A2522]">
          {hotel.check_out_time || '12:00'}
        </p>
        <p className="text-xs text-[#2A2522]/40 mt-1">หากต้องการ Late Check-out กรุณาติดต่อเจ้าหน้าที่</p>
      </div>

      {/* Breakfast */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5">
        <div className="flex items-center gap-2 mb-2">
          <Coffee className="h-4 w-4 text-[#2563eb]" />
          <span className="font-semibold text-sm text-[#2A2522]">อาหารเช้า</span>
        </div>
        <p className="text-lg font-bold text-[#2A2522]">07:00 – 10:30 น.</p>
        <p className="text-xs text-[#2A2522]/40 mt-1">ห้องอาหารชั้น 1</p>
      </div>

      {/* Amenities */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#2563eb]" />
          <span className="font-semibold text-sm text-[#2A2522]">สิ่งอำนวยความสะดวก</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {amenities.map(a => (
            <div key={a} className="flex items-center gap-2 text-sm text-[#2A2522]/70">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              {a}
            </div>
          ))}
        </div>
      </div>

      {/* Emergency */}
      {hotel.phone && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-black/5">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="h-4 w-4 text-red-500" />
            <span className="font-semibold text-sm text-[#2A2522]">ฉุกเฉิน / ติดต่อ</span>
          </div>
          <a
            href={`tel:${hotel.phone}`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium transition-colors"
          >
            <Phone className="h-4 w-4" />
            {hotel.phone}
          </a>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Chat ────────────────────────────────────────────────────────────────

const QUICK_SERVICES = [
  { icon: Coffee,       label: 'Room Service',  msg: 'ขอสั่งอาหาร/เครื่องดื่ม' },
  { icon: Bath,         label: 'ขอผ้า/หมอน',   msg: 'ขอหมอนเพิ่ม/ผ้าห่มเพิ่ม' },
  { icon: Wrench,       label: 'แจ้งซ่อม',      msg: 'มีปัญหาในห้อง ต้องการช่วยเหลือ' },
  { icon: Utensils,     label: 'อาหารเช้า',      msg: 'สอบถามเวลาและเมนูอาหารเช้า' },
  { icon: Car,          label: 'เรียก Taxi',     msg: 'ต้องการจัดรถรับส่ง' },
  { icon: Clock,        label: 'Late Check-out', msg: 'ขอ late check-out ได้ไหม?' },
];

function ChatTab({ hotel, room, reservation, msgs, setMsgs }: {
  hotel: any; room: any; reservation: any;
  msgs: Msg[]; setMsgs: React.Dispatch<React.SetStateAction<Msg[]>>;
}) {
  const [input, setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);

  async function send(text?: string) {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');
    const time = nowTime();
    setMsgs(p => [...p, { role: 'user', text: msg, time }]);
    setLoading(true);

    try {
      const res = await fetch('/api/public/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelId: hotel.id,
          message: msg,
          history: msgs.slice(-6).map(m => ({ role: m.role, content: m.text })),
          context: `Guest is currently staying in room ${room?.room_number}. Check-out: ${reservation?.check_out || 'unknown'}.`,
        }),
      });
      const data = await res.json();
      setMsgs(p => [...p, {
        role: 'assistant',
        text: data.reply || 'ขออภัย เกิดข้อผิดพลาด',
        time: nowTime(),
      }]);
    } catch {
      setMsgs(p => [...p, {
        role: 'assistant',
        text: 'ขออภัย ขณะนี้ระบบขัดข้อง กรุณาโทร ' + hotel.phone,
        time: '',
      }]);
    }
    setLoading(false);
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : 'flex-row')}>
            {m.role === 'assistant' && (
              <div className="h-7 w-7 rounded-full bg-[#2A2522] flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                {hotel.name.charAt(0)}
              </div>
            )}
            <div className={cn('max-w-[78%]', m.role === 'user' ? 'items-end' : 'items-start', 'flex flex-col gap-1')}>
              <div className={cn(
                'px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed',
                m.role === 'assistant'
                  ? 'bg-white text-[#2A2522] rounded-tl-sm shadow-sm'
                  : 'bg-[#2563eb] text-white rounded-tr-sm',
              )}>
                {m.text.split('\n').map((line, j, arr) => (
                  <span key={j}>{line}{j < arr.length - 1 && <br />}</span>
                ))}
              </div>
              {m.time && (
                <span className="text-2xs text-[#2A2522]/30 px-1">
                  {m.time}{' '}
                  {m.role === 'user' && <CheckCheck className="h-3 w-3 inline text-[#2A2522]/30" />}
                </span>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="h-7 w-7 rounded-full bg-[#2A2522] flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">{hotel.name.charAt(0)}</span>
            </div>
            <div className="bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-[#2A2522]/40" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick services */}
      {msgs.length <= 2 && (
        <div className="px-4 py-3 bg-white border-t border-black/5">
          <p className="text-xs text-[#2A2522]/40 mb-2 uppercase tracking-wider">บริการด่วน</p>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_SERVICES.map(s => {
              const Icon = s.icon;
              return (
                <button key={s.label} onClick={() => send(s.msg)}
                  className="flex flex-col items-center gap-1 p-2.5 bg-[#FAF7F2] rounded-xl text-center hover:bg-[#2563eb]/10 transition-colors">
                  <Icon className="h-4 w-4 text-[#2563eb]" />
                  <span className="text-2xs text-[#2A2522]/70 leading-tight">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-white border-t border-black/5">
        <div className="flex items-center gap-2">
          <input
            value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="พิมพ์ข้อความหรือคำขอ..."
            className="flex-1 px-4 py-2.5 bg-[#FAF7F2] rounded-full text-sm focus:outline-none"
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="h-10 w-10 bg-[#2563eb] disabled:bg-[#2563eb]/30 text-white rounded-full flex items-center justify-center transition-colors">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export function InStayChatClient({
  hotel,
  room,
  reservation,
  knowledge,
}: {
  hotel: any;
  room: any;
  reservation: any;
  knowledge: any[];
}) {
  const guest = reservation?.guests as any;
  const rt    = room?.room_types as any;

  const storageKey = `sr_${reservation?.reservation_code || room?.room_number || 'guest'}`;

  // ── Tab state ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('services');

  // ── Requests state (persisted to localStorage) ──────────────────────────────
  const [requests, setRequests] = useState<ServiceRequest[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as ServiceRequest[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(requests)); } catch { /* noop */ }
  }, [requests, storageKey]);

  const addRequest = useCallback((req: Omit<ServiceRequest, 'id' | 'createdAt'>) => {
    const newReq: ServiceRequest = {
      ...req,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      createdAt: Date.now(),
    };
    setRequests(prev => [...prev, newReq]);
    // Switch to requests tab briefly to confirm
    setActiveTab('requests');
    setTimeout(() => setActiveTab('services'), 1500);
  }, []);

  // ── Chat state ───────────────────────────────────────────────────────────────
  const [msgs, setMsgs] = useState<Msg[]>([{
    role: 'assistant',
    text: `สวัสดี${guest ? ` คุณ${guest.first_name}` : ''}! 🙏 ยินดีต้อนรับสู่${room ? ` ห้อง ${room.room_number}` : ''}\n\nมีอะไรให้ช่วยเหลือไหมครับ/ค่ะ?`,
    time: nowTime(),
  }]);

  // ── Pending count (steps 0–2 not yet completed) ──────────────────────────────
  const pendingCount = requests.filter(r => getActiveStep(r.createdAt) < TIMELINE_STEPS.length - 1).length;

  // ── Nav tabs config ──────────────────────────────────────────────────────────
  const TABS: { id: TabId; label: string; Icon: React.ElementType }[] = [
    { id: 'services',  label: 'บริการ',         Icon: Zap           },
    { id: 'requests',  label: 'คำขอของฉัน',     Icon: ListChecks    },
    { id: 'info',      label: 'ข้อมูลโรงแรม',   Icon: Info          },
    { id: 'chat',      label: 'แชท',             Icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex flex-col max-w-md mx-auto">
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div className="bg-[#2A2522] text-white px-4 py-4 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          {hotel.logo_url
            ? (
              <div className="relative h-8 w-16">
                <NextImage src={hotel.logo_url} alt="logo" fill className="object-contain" />
              </div>
            )
            : (
              <div className="h-8 w-8 bg-[#2563eb] rounded-lg flex items-center justify-center font-bold text-sm">
                {hotel.name.charAt(0)}
              </div>
            )
          }
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{hotel.name}</p>
            <p className="text-white/50 text-xs flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full" />
              {room ? `ห้อง ${room.room_number}` : ''}
              {rt ? ` · ${rt.name}` : ''}
              {' · พร้อมให้บริการ'}
            </p>
          </div>
          {hotel.phone && (
            <a href={`tel:${hotel.phone}`} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
              <Phone className="h-4 w-4" />
            </a>
          )}
        </div>
      </div>

      {/* ── Content area ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden pb-16">
        {activeTab === 'services' && (
          <ServicesTab
            hotel={hotel}
            room={room}
            reservation={reservation}
            onAddRequest={addRequest}
            onSwitchToChat={() => setActiveTab('chat')}
          />
        )}
        {activeTab === 'requests' && <RequestsTab requests={requests} />}
        {activeTab === 'info'     && <HotelInfoTab hotel={hotel} />}
        {activeTab === 'chat'     && (
          <ChatTab
            hotel={hotel}
            room={room}
            reservation={reservation}
            msgs={msgs}
            setMsgs={setMsgs}
          />
        )}
      </div>

      {/* ── Bottom nav ────────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-30 bg-white border-t border-black/10 flex">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          const showBadge = tab.id === 'requests' && pendingCount > 0;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1 relative"
            >
              <div className="relative">
                <tab.Icon className={cn('h-5 w-5 transition-colors', isActive ? 'text-[#2563eb]' : 'text-[#2A2522]/40')} />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 h-4 w-4 bg-red-500 text-white text-2xs rounded-full flex items-center justify-center font-bold leading-none">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              <span className={cn('text-2xs transition-colors', isActive ? 'text-[#2563eb] font-medium' : 'text-[#2A2522]/40')}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
