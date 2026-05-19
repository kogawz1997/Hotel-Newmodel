'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, ChevronRight, Copy, Check, Clock, ArrowLeft, Ticket } from 'lucide-react';
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
  color: string;
  emoji: string;
}

const DEMO_COUPONS: Coupon[] = [
  { id: 'c1', code: 'WELCOME15',  title: 'ส่วนลดต้อนรับ 15%',           desc: 'สำหรับการจองครั้งแรก ลด 15% ทุกโรงแรมในเครือ',    discount: '15%',       minSpend: 1500, expiry: '31 ธ.ค. 2569', status: 'available', color: 'from-violet-500 to-purple-600', emoji: '🎉' },
  { id: 'c2', code: 'SUMMER500',  title: 'ซัมเมอร์ฤดูร้อน ลด 500 บาท',  desc: 'จองห้องพักฤดูร้อน ลดทันที 500 บาท',               discount: '฿500',      minSpend: 2500, expiry: '30 มิ.ย. 2569', status: 'available', color: 'from-amber-400 to-orange-500', emoji: '☀️' },
  { id: 'c3', code: 'LOYALTY10',  title: 'สมาชิก Maitri ลด 10%',        desc: 'สิทธิพิเศษเฉพาะสมาชิก Maitri Rewards',            discount: '10%',                       expiry: '31 ธ.ค. 2569', status: 'available', color: 'from-emerald-400 to-teal-500',  emoji: '💎' },
  { id: 'c4', code: 'BDAY200',    title: 'วันเกิดพิเศษ ลด 200 บาท',     desc: 'อวยพรวันเกิดจาก Maitri Collection',                discount: '฿200',                       expiry: '31 พ.ค. 2569', status: 'available', color: 'from-rose-400 to-pink-500',    emoji: '🎂' },
  { id: 'c5', code: 'EARLYBIRD',  title: 'จองล่วงหน้า 30 วัน ลด 20%',  desc: 'จองล่วงหน้าอย่างน้อย 30 วัน รับส่วนลดสูงสุด',     discount: '20%',       minSpend: 3000, expiry: '15 เม.ย. 2569', status: 'used',      color: 'from-sky-400 to-blue-500',     emoji: '🐦' },
  { id: 'c6', code: 'NEWYEAR25',  title: 'ปีใหม่ ลด 25%',               desc: 'ฉลองปีใหม่กับ Maitri Collection',                  discount: '25%',       minSpend: 5000, expiry: '31 ม.ค. 2569', status: 'expired',   color: 'from-gray-400 to-gray-500',    emoji: '🎆' },
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

  function useNow(c: Coupon) {
    router.push(`/search?coupon=${c.code}`);
  }

  function redeemCode() {
    if (!code.trim()) return;
    const found = DEMO_COUPONS.find(c => c.code === code.trim().toUpperCase());
    if (found) {
      toast.success(`พบคูปอง: ${found.title}`);
      setCode('');
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
            <motion.div whileTap={{ scale: 0.9 }} className="h-9 w-9 rounded-xl bg-secondary border border-border/40 flex items-center justify-center">
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
              <input
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && redeemCode()}
                placeholder="เช่น WELCOME15"
                className="flex-1 h-10 rounded-xl bg-secondary border border-border/40 px-3 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={redeemCode}
                className="h-10 px-4 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors">
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
              <span className="ml-1 text-xs opacity-60">
                ({DEMO_COUPONS.filter(c => c.status === t.id).length})
              </span>
            </button>
          ))}
        </div>

        {/* Coupon list */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3">
            {shown.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Ticket className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p className="text-sm">ไม่มีคูปองในหมวดนี้</p>
              </div>
            ) : shown.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.3, ease }}>
                <CouponCard
                  coupon={c}
                  copied={copied === c.id}
                  onCopy={() => copyCode(c)}
                  onUse={() => useNow(c)}
                />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

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
      'rounded-2xl border overflow-hidden shadow-sm',
      isUsable ? 'bg-card border-border/60' : 'bg-secondary/40 border-border/30 opacity-70',
    )}>
      {/* Top color band */}
      <div className={cn('h-1.5 bg-gradient-to-r', c.color)} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Emoji badge */}
          <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br', c.color, 'opacity-20')} />
          <div className="absolute">
            <div className="h-11 w-11 flex items-center justify-center text-2xl">{c.emoji}</div>
          </div>

          <div className="flex-1 min-w-0 ml-11 -mt-11 pl-2">
            {/* This is a positioning workaround — simpler approach below */}
          </div>
        </div>

        {/* Actual content (simpler layout) */}
        <div className="flex items-start gap-3 -mt-11">
          <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br')}>
            <span>{c.emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="font-bold text-sm text-foreground leading-snug">{c.title}</p>
              <span className={cn(
                'text-sm font-bold px-2 py-0.5 rounded-lg shrink-0',
                isUsable ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-secondary text-muted-foreground',
              )}>{c.discount}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.desc}</p>
            {c.minSpend && (
              <p className="text-xs text-muted-foreground/70 mt-1">ขั้นต่ำ ฿{c.minSpend.toLocaleString()}</p>
            )}
          </div>
        </div>

        {/* Divider + code + actions */}
        <div className="mt-3 pt-3 border-t border-border/40 flex items-center gap-2">
          {/* Code pill */}
          <button
            onClick={isUsable ? onCopy : undefined}
            disabled={!isUsable}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-xs font-bold transition-all',
              isUsable
                ? 'bg-secondary hover:bg-secondary/80 text-foreground cursor-pointer'
                : 'bg-secondary/50 text-muted-foreground cursor-default',
            )}>
            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
            {c.code}
          </button>

          <div className="flex items-center gap-1 text-xs text-muted-foreground/60 flex-1">
            <Clock className="h-3 w-3 shrink-0" />
            <span className="truncate">{c.expiry}</span>
          </div>

          {isUsable && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onUse}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shrink-0">
              ใช้เลย <ChevronRight className="h-3 w-3" />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
