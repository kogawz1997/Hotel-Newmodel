'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Gift, Copy, Check, Users, Tag, ArrowLeft, Share2, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

type ReferralItem = {
  id: string;
  code: string;
  reward_type: string;
  reward_value: number;
  uses_count?: number;
  max_uses?: number;
  expires_at?: string | null;
  active?: boolean;
};

const HOW_IT_WORKS = [
  { step: '1', icon: Share2, title: 'แชร์โค้ดของคุณ', desc: 'ส่งโค้ดให้เพื่อนหรือครอบครัวที่กำลังมองหาที่พัก', bg: 'bg-sky-500/10', color: 'text-sky-600 dark:text-sky-400' },
  { step: '2', icon: Tag,    title: 'เพื่อนใช้โค้ด',   desc: 'เพื่อนใช้โค้ดตอนจองที่พักผ่าน Maitri ได้รับส่วนลดทันที', bg: 'bg-emerald-500/10', color: 'text-emerald-600 dark:text-emerald-400' },
  { step: '3', icon: Gift,   title: 'รับรางวัล',       desc: 'คุณได้รับ Maitri Points สะสมแต้มเป็นของขวัญ', bg: 'bg-blue-500/10', color: 'text-blue-600 dark:text-blue-400' },
];

const ease = [0.25, 0.46, 0.45, 0.94] as const;
const v = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.06, duration: 0.35, ease } }),
};

export default function PortalReferralsPage() {
  const [items, setItems]     = useState<ReferralItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyCode, setApplyCode] = useState('');
  const [applying, setApplying]   = useState(false);
  const [creating, setCreating]   = useState(false);
  const [copied, setCopied]       = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch('/api/guest/referrals');
    const data = await res.json();
    setItems(data.referrals || []);
    setLoading(false);
  }

  async function createCode() {
    setCreating(true);
    const res = await fetch('/api/guest/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', rewardType: 'percent', rewardValue: 10 }),
    });
    const data = await res.json();
    setCreating(false);
    if (!res.ok) return toast.error(data.error || 'สร้างโค้ดไม่สำเร็จ');
    toast.success(`สร้างโค้ดแล้ว: ${data.referral.code}`);
    await load();
  }

  async function applyReferral() {
    if (!applyCode.trim()) return;
    setApplying(true);
    const res = await fetch('/api/guest/referrals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'apply', code: applyCode.trim() }),
    });
    const data = await res.json();
    setApplying(false);
    if (!res.ok || !data.valid) return toast.error(data.error || 'โค้ดใช้ไม่ได้');
    toast.success(`ใช้โค้ดสำเร็จ! ได้รับส่วนลด ${data.referral.reward_value}${data.referral.reward_type === 'percent' ? '%' : ' บาท'}`);
    setApplyCode('');
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl border-b border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <Link href="/portal/account"
            className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground">แนะนำเพื่อน</p>
          </div>
          <Gift className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </div>

      <div className="px-4 py-5 pb-24 max-w-screen-sm mx-auto space-y-4">

        {/* Hero */}
        <motion.div custom={0} variants={v} initial="hidden" animate="show">
          <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 text-center relative">
            <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute bottom-0 left-4 translate-y-6 h-20 w-20 rounded-full bg-white/8" />
            <div className="relative">
              <div className="text-4xl mb-3">🎁</div>
              <h1 className="font-display font-bold text-white text-xl mb-1">แนะนำเพื่อน รับรางวัล</h1>
              <p className="text-white/70 text-sm">แชร์โค้ดของคุณ เพื่อนได้ส่วนลด 10% คุณได้ Maitri Points</p>
            </div>
          </div>
        </motion.div>

        {/* How it works */}
        <motion.div custom={1} variants={v} initial="hidden" animate="show">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-2">วิธีการ</p>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden shadow-sm divide-y divide-border/30">
            {HOW_IT_WORKS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="flex items-center gap-4 px-4 py-3.5">
                  <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`h-4 w-4 ${s.color}`} strokeWidth={1.8} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.desc}</p>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground/40">0{s.step}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* My codes */}
        <motion.div custom={2} variants={v} initial="hidden" animate="show">
          <div className="flex items-center justify-between px-1 mb-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">โค้ดของฉัน</p>
            <button
              onClick={createCode}
              disabled={creating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-opacity disabled:opacity-50"
            >
              <Gift className="h-3.5 w-3.5" />
              {creating ? 'กำลังสร้าง...' : 'สร้างโค้ดใหม่'}
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-20 bg-muted/40 rounded-2xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border/60 p-8 text-center shadow-sm">
              <Gift className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">ยังไม่มีโค้ด กดสร้างเพื่อเริ่มแนะนำเพื่อน</p>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="bg-card border border-border/60 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg text-foreground tracking-wider">{item.code}</span>
                      <button
                        onClick={() => copyCode(item.code)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        {copied === item.code
                          ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                          : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
                      </button>
                    </div>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {item.reward_value}{item.reward_type === 'percent' ? '%' : ' บาท'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      ใช้แล้ว {item.uses_count ?? 0}{item.max_uses ? `/${item.max_uses}` : ''} ครั้ง
                    </span>
                    {item.expires_at && (
                      <span>หมดอายุ {new Date(item.expires_at).toLocaleDateString('th-TH')}</span>
                    )}
                    <span className={cn(
                      'ml-auto px-2 py-0.5 rounded-full text-[10px] font-semibold',
                      item.active !== false
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground',
                    )}>
                      {item.active !== false ? 'ใช้งานได้' : 'หมดอายุ'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Apply a referral code */}
        <motion.div custom={3} variants={v} initial="hidden" animate="show">
          <div className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
            <h2 className="font-display font-bold text-foreground mb-1">มีโค้ดจากเพื่อน?</h2>
            <p className="text-xs text-muted-foreground mb-4">ใส่โค้ดเพื่อรับส่วนลดครั้งแรก</p>
            <div className="flex gap-2">
              <input
                value={applyCode}
                onChange={e => setApplyCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && applyReferral()}
                placeholder="MTR-XXXXXX"
                className="flex-1 px-3 py-2.5 bg-background border border-input rounded-xl text-sm font-mono
                  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
              />
              <button
                onClick={applyReferral}
                disabled={applying || !applyCode.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-opacity disabled:opacity-50"
              >
                {applying ? 'กำลังใช้...' : 'ใช้โค้ด'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Terms */}
        <p className="text-center text-[10px] text-muted-foreground/50 px-4 pb-2">
          เงื่อนไข: โค้ดใช้ได้สำหรับการจองแรก · ไม่สามารถใช้ร่วมกับโปรโมชั่นอื่น · Maitri ขอสงวนสิทธิ์เปลี่ยนแปลงเงื่อนไข
        </p>
      </div>
    </div>
  );
}
