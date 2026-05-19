'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, ChevronRight, Copy, Check, Clock, ArrowLeft, Ticket, Search } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const TABS = [
  { id: 'available', label: 'ใช้ได้' },
  { id: 'used',      label: 'ใช้แล้ว' },
  { id: 'expired',   label: 'หมดอายุ' },
] as const;
type TabId = typeof TABS[number]['id'];

interface Coupon {
  id: string;
  code: string;
  title: string;
  desc: string;
  discount: string;
  minSpend?: number;
  expiry: string;
  status: TabId;
  from: string;
  to: string;
  emoji: string;
}

const DEMO_COUPONS: Coupon[] = [
  {
    id: 'c1', code: 'WELCOME15', title: 'ส่วนลดต้อนรับ 15%',
    desc: 'สำหรับการจองครั้งแรก ลด 15% ทุกโรงแรมในเครือ Maitri Collection',
    discount: '15%', minSpend: 1500, expiry: '31 ธ.ค. 2569',
    status: 'available', from: 'from-violet-500', to: 'to-purple-600', emoji: '🎉',
  },
  {
    id: 'c2', code: 'SUMMER500', title: 'ซัมเมอร์ฤดูร้อน ลด 500 บาท',
    desc: 'จองห้องพักฤดูร้อน ลดทันที 500 บาท สำหรับทุกโรงแรมในเครือ',
    discount: '฿500', minSpend: 2500, expiry: '30 มิ.ย. 2569',
    status: 'available', from: 'from-amber-400', to: 'to-orange-500', emoji: '☀️',
  },
  {
    id: 'c3', code: 'LOYALTY10', title: 'สมาชิก Maitri Rewards ลด 10%',
    desc: 'สิทธิพิเศษเฉพาะสมาชิก Maitri Rewards ทุกระดับ',
    discount: '10%', expiry: '31 ธ.ค. 2569',
    status: 'available', from: 'from-emerald-400', to: 'to-teal-500', emoji: '💎',
  },
  {
    id: 'c4', code: 'BDAY200', title: 'วันเกิดพิเศษ ลด 200 บาท',
    desc: 'ของขวัญวันเกิดจาก Maitri Collection เพื่อคุณโดยเฉพาะ',
    discount: '฿200', expiry: '31 พ.ค. 2569',
    status: 'available', from: 'from-rose-400', to: 'to-pink-500', emoji: '🎂',
  },
  {
    id: 'c5', code: 'EARLYBIRD', title: 'จองล่วงหน้า 30 วัน ลด 20%',
    desc: 'จองล่วงหน้าอย่างน้อย 30 วัน รับส่วนลดสูงสุด 20%',
    discount: '20%', minSpend: 3000, expiry: '15 เม.ย. 2569',
    status: 'used', from: 'from-sky-400', to: 'to-blue-500', emoji: '🐦',
  },
  {
    id: 'c6', code: 'NEWYEAR25', title: 'ปีใหม่ ลด 25%',
    desc: 'ฉลองปีใหม่กับ Maitri Collection ทุกโรงแรมทั่วไทย',
    discount: '25%', minSpend: 5000, expiry: '31 ม.ค. 2569',
    status: 'expired', from: 'from-gray-400', to: 'to-gray-500', emoji: '🎆',
  },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;

export default function CouponsPage() {
  const router  = useRouter();
  const [tab, setTab]       = useState<TabId>('available');
  const [code, setCode]     = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const shown = DEMO_COUPONS.filter(c => c.status === tab);

  function copyCode(c: Coupon) {
    navigator.clipboard.writeText(c.code).catch(() => {});
    setCopied(c.id);
    toast.success(`คัดลอก ${c.code} แล้ว`);
    setTimeout(() => setCopied(null), 2000);
  }

  function redeemCode() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    const found = DEMO_COUPONS.find(c => c.code === trimmed);
    if (found) {
      toast.success(`พบคูปอง: ${found.title}`);
      setCode('');
      setTab('available');
    } else {
      toast.error('ไม่พบรหัสคูปองนี้ กรุณาตรวจสอบอีกครั้ง');
    }
  }

  return (
    <div className="min-h-screen bg-background">

      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto lg:max-w-2xl">
          <Link href="/portal/account">
            <motion.div whileTap={{ scale: 0.9 }}
              className="h-9 w-9 rounded-xl bg-secondary border border-border/40 flex items-center justify-center shrink-0">
              <ArrowLeft className="h-4 w-4 text-foreground" />
            </motion.div>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground tracking-tight flex-1">คูปองส่วนลด</h1>
          <Ticket className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>

      <div className="px-4 pt-5 pb-10 max-w-screen-sm mx-auto lg:max-w-2xl space-y-5">

        {/* Redeem input */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease }}>
          <div className="rounded-2xl bg-card border border-border/60 shadow-sm p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">ใส่รหัสคูปอง</p>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 h-10 rounded-xl bg-secondary border border-border/40 px-3 focus-within:ring-2 focus-within:ring-blue-500/30">
                <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && redeemCode()}
                  placeholder="เช่น WELCOME15"
                  className="flex-1 bg-transparent text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={redeemCode}
                className="h-10 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold hover:opacity-90 transition-all shrink-0">
                ใช้เลย
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex-1 h-8 rounded-lg text-sm font-semibold transition-all',
                tab === t.id
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}>
              {t.label}
              <span className="ml-1.5 text-xs opacity-50">
                {DEMO_COUPONS.filter(c => c.status === t.id).length}
              </span>
            </button>
          ))}
        </div>

        {/* Coupon list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-3">
            {shown.length === 0 ? (
              <div className="text-center py-16">
                <Ticket className="h-12 w-12 mx-auto mb-3 text-muted-foreground/20" />
                <p className="text-sm text-muted-foreground font-medium">ไม่มีคูปองในหมวดนี้</p>
              </div>
            ) : shown.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.055, duration: 0.28, ease }}>
                <CouponCard
                  coupon={c}
                  copied={copied === c.id}
                  onCopy={() => copyCode(c)}
                  onUse={() => router.push(`/search?coupon=${c.code}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Discover more */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.35 }}>
          <Link href="/search">
            <div className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-dashed border-border/60 text-muted-foreground hover:text-foreground hover:border-blue-500/30 hover:bg-blue-500/4 transition-all">
              <Search className="h-4 w-4" />
              <span className="text-sm font-semibold">ค้นหาโรงแรมและรับส่วนลด</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </Link>
        </motion.div>

      </div>
    </div>
  );
}

function CouponCard({ coupon: c, copied, onCopy, onUse }: {
  coupon: Coupon;
  copied: boolean;
  onCopy: () => void;
  onUse: () => void;
}) {
  const isUsable = c.status === 'available';

  return (
    <div className={cn(
      'rounded-2xl overflow-hidden border shadow-sm transition-all',
      isUsable
        ? 'bg-card border-border/60 hover:shadow-md hover:border-border'
        : 'bg-secondary/30 border-border/30 opacity-65',
    )}>
      {/* Gradient top band */}
      <div className={cn('h-1 bg-gradient-to-r', c.from, c.to)} />

      <div className="p-4">
        {/* Top row: emoji icon + title + discount badge */}
        <div className="flex items-start gap-3">
          <div className={cn(
            'h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 bg-gradient-to-br',
            c.from, c.to, 'opacity-90',
          )}>
            <span className="drop-shadow-sm">{c.emoji}</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 justify-between">
              <p className="font-bold text-sm text-foreground leading-snug">{c.title}</p>
              <span className={cn(
                'text-sm font-bold px-2.5 py-0.5 rounded-lg shrink-0',
                isUsable
                  ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                  : 'bg-secondary text-muted-foreground',
              )}>
                {c.discount}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">{c.desc}</p>
            {c.minSpend && (
              <p className="text-xs text-muted-foreground/60 mt-1">
                ยอดสั่งขั้นต่ำ ฿{c.minSpend.toLocaleString()}
              </p>
            )}
          </div>
        </div>

        {/* Bottom row: code + expiry + action */}
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2">
          <button
            onClick={isUsable ? onCopy : undefined}
            disabled={!isUsable}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-mono text-xs font-bold transition-all',
              isUsable
                ? 'bg-secondary hover:bg-secondary/70 text-foreground active:scale-95'
                : 'bg-transparent text-muted-foreground cursor-default',
            )}>
            {copied
              ? <Check className="h-3 w-3 text-emerald-500 shrink-0" />
              : <Copy className="h-3 w-3 shrink-0 opacity-60" />
            }
            {c.code}
          </button>

          <div className="flex items-center gap-1 text-xs text-muted-foreground/55 flex-1 min-w-0">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{c.expiry}</span>
          </div>

          {isUsable && (
            <motion.button
              whileTap={{ scale: 0.93 }}
              onClick={onUse}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:opacity-90 transition-all shrink-0">
              ใช้เลย <ChevronRight className="h-3 w-3" />
            </motion.button>
          )}

          {c.status === 'used' && (
            <span className="text-xs text-muted-foreground/50 font-medium shrink-0">ใช้แล้ว</span>
          )}
          {c.status === 'expired' && (
            <span className="text-xs text-muted-foreground/50 font-medium shrink-0">หมดอายุ</span>
          )}
        </div>
      </div>
    </div>
  );
}
