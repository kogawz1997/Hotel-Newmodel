'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Gift, Copy, Check, ChevronRight, Users, Tag, ArrowLeft, Share2 } from 'lucide-react';
import { PortalBottomNav } from '@/components/portal/PortalBottomNav';

type ReferralItem = {
  id: string;
  code: string;
  reward_type: string;
  reward_value: number;
  uses_count?: number;
  max_uses?: number;
  expires_at?: string | null;
  is_active?: boolean;
};

const HOW_IT_WORKS = [
  { step: '1', icon: Share2, title: 'แชร์โค้ดของคุณ', desc: 'ส่งโค้ดให้เพื่อนหรือครอบครัวที่กำลังมองหาที่พัก' },
  { step: '2', icon: Tag,    title: 'เพื่อนใช้โค้ด',   desc: 'เพื่อนใช้โค้ดตอนจองที่พักผ่าน Maitri ได้รับส่วนลดทันที' },
  { step: '3', icon: Gift,   title: 'รับรางวัล',       desc: 'คุณได้รับ Maitri Points สะสมแต้มเป็นของขวัญ' },
];

export default function PortalReferralsPage() {
  const [items, setItems]   = useState<ReferralItem[]>([]);
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
    <div className="min-h-screen bg-[#FAF7F2]">
      <nav className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/portal/bookings" className="p-2 rounded-full hover:bg-black/5">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <span className="font-medium text-[#2A2522]">แนะนำเพื่อน</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 pb-28 space-y-5">

        {/* Hero banner */}
        <div className="bg-[#2A2522] rounded-2xl p-6 text-center">
          <div className="text-4xl mb-3">🎁</div>
          <h1 className="text-white font-bold text-xl mb-1">แนะนำเพื่อน รับรางวัล</h1>
          <p className="text-white/50 text-sm">แชร์โค้ดของคุณ เพื่อนได้ส่วนลด 10% คุณได้ Maitri Points</p>
        </div>

        {/* How it works */}
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <h2 className="font-bold text-[#2A2522] mb-4">วิธีการ</h2>
          <div className="space-y-4">
            {HOW_IT_WORKS.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.step} className="flex items-start gap-4">
                  <div className="h-9 w-9 rounded-full bg-[#C66A30] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-semibold text-[#2A2522] text-sm">{s.title}</p>
                    <p className="text-xs text-[#2A2522]/50 mt-0.5">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* My codes */}
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#2A2522]">โค้ดของฉัน</h2>
            <button
              onClick={createCode}
              disabled={creating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#C66A30] hover:bg-[#A4522A] text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
            >
              <Gift className="h-3.5 w-3.5" />
              {creating ? 'กำลังสร้าง...' : 'สร้างโค้ดใหม่'}
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2].map(i => <div key={i} className="h-16 bg-[#FAF7F2] rounded-xl animate-pulse" />)}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-8">
              <Gift className="h-8 w-8 text-[#2A2522]/15 mx-auto mb-2" />
              <p className="text-sm text-[#2A2522]/40">ยังไม่มีโค้ด กดสร้างโค้ดเพื่อเริ่มแนะนำเพื่อน</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map(item => (
                <div key={item.id} className="border border-black/8 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg text-[#2A2522] tracking-wider">{item.code}</span>
                      <button
                        onClick={() => copyCode(item.code)}
                        className="p-1.5 rounded-lg hover:bg-[#FAF7F2] transition-colors"
                      >
                        {copied === item.code
                          ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                          : <Copy className="h-3.5 w-3.5 text-[#2A2522]/40" />}
                      </button>
                    </div>
                    <span className="text-sm font-bold text-[#C66A30]">
                      {item.reward_value}{item.reward_type === 'percent' ? '%' : ' บาท'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[#2A2522]/40">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      ใช้แล้ว {item.uses_count ?? 0}{item.max_uses ? `/${item.max_uses}` : ''} ครั้ง
                    </span>
                    {item.expires_at && (
                      <span>หมดอายุ {new Date(item.expires_at).toLocaleDateString('th-TH')}</span>
                    )}
                    <span className={cn(
                      'px-2 py-0.5 rounded-full font-medium',
                      item.is_active !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400',
                    )}>
                      {item.is_active !== false ? 'ใช้งานได้' : 'หมดอายุ'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Apply a referral code */}
        <div className="bg-white rounded-2xl border border-black/5 p-5">
          <h2 className="font-bold text-[#2A2522] mb-1">มีโค้ดจากเพื่อน?</h2>
          <p className="text-xs text-[#2A2522]/50 mb-4">ใส่โค้ดเพื่อรับส่วนลดครั้งแรก</p>
          <div className="flex gap-2">
            <input
              value={applyCode}
              onChange={e => setApplyCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && applyReferral()}
              placeholder="MTR-XXXXXX"
              className="flex-1 px-3 py-2.5 bg-[#FAF7F2] border border-black/8 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#C66A30]/30"
            />
            <button
              onClick={applyReferral}
              disabled={applying || !applyCode.trim()}
              className="px-4 py-2.5 bg-[#2A2522] hover:bg-black text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50"
            >
              {applying ? 'กำลังใช้...' : 'ใช้โค้ด'}
            </button>
          </div>
        </div>

        {/* Terms */}
        <p className="text-center text-xs text-[#2A2522]/30 px-4">
          เงื่อนไข: โค้ดใช้ได้สำหรับการจองแรก · ไม่สามารถใช้ร่วมกับโปรโมชั่นอื่น · Maitri ขอสงวนสิทธิ์เปลี่ยนแปลงเงื่อนไข
        </p>
      </div>
      <PortalBottomNav />
    </div>
  );
}
