'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { TrendingUp, Star, Image, CheckCircle, Coffee, Sparkles, FileText, Flame, Info, ExternalLink } from 'lucide-react';
import { WEIGHT_META } from '@/lib/ranking';

type SignalKey = 'avg_rating' | 'review_count' | 'gallery_count' | 'is_free_cancel' | 'is_breakfast' | 'star_rating' | 'is_featured' | 'has_content';

type RankingData = {
  hotel: { id: string; name: string; slug: string; is_featured: boolean; featured_until: string | null };
  score: number;
  maxScore: number;
  signals: Record<string, any>;
  weights: Record<string, number>;
};

const SIGNAL_CONFIG: Array<{
  key: SignalKey;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  format: (v: any) => string;
  good: (v: any) => boolean;
  tip: string;
  href?: string;
}> = [
  {
    key: 'avg_rating', label: 'คะแนนรีวิวเฉลี่ย', icon: Star,
    format: v => v ? `${v} / 5.0` : 'ยังไม่มีรีวิว',
    good: v => v && v >= 4.0,
    tip: 'ตอบรีวิวทุกข้อ ส่ง follow-up email ขอรีวิว และแก้ไขปัญหาที่แขกพูดถึงบ่อย',
    href: '/dashboard/guests',
  },
  {
    key: 'review_count', label: 'จำนวนรีวิว', icon: TrendingUp,
    format: v => `${v} รีวิว`,
    good: v => v >= 10,
    tip: 'ยิ่งมีรีวิวมาก ยิ่งน่าเชื่อถือ — เปิดใช้ Post-stay email ให้แขก rate อัตโนมัติ',
    href: '/dashboard/marketing',
  },
  {
    key: 'gallery_count', label: 'รูปภาพ (gallery)', icon: Image,
    format: v => `${v} รูป ${v >= 5 ? '(เต็ม score)' : `(ต้องการอีก ${5 - v} รูป)`}`,
    good: v => v >= 5,
    tip: 'อัปโหลดอย่างน้อย 5 รูปคุณภาพสูง ครอบคลุมห้อง lobby สระว่ายน้ำ และอาหารเช้า',
    href: '/dashboard/branding',
  },
  {
    key: 'is_free_cancel', label: 'ยกเลิกฟรี', icon: CheckCircle,
    format: v => v ? 'มีนโยบายยกเลิกฟรี' : 'ไม่มีนโยบายยกเลิกฟรี',
    good: v => v === true,
    tip: 'เพิ่มนโยบาย Free Cancellation ให้ห้องอย่างน้อย 1 ประเภท — convert rate สูงขึ้นมาก',
    href: '/dashboard/rooms',
  },
  {
    key: 'is_breakfast', label: 'รวมอาหารเช้า', icon: Coffee,
    format: v => v ? 'มีห้องรวมอาหารเช้า' : 'ไม่มีห้องรวมอาหารเช้า',
    good: v => v === true,
    tip: 'สร้าง Room Type ใหม่ที่รวม breakfast — แขกหลายคนกรองแบบนี้',
    href: '/dashboard/rooms',
  },
  {
    key: 'has_content', label: 'คำอธิบาย & Tagline', icon: FileText,
    format: v => v ? 'มีครบ' : 'ยังขาดอยู่',
    good: v => v === true,
    tip: 'เพิ่ม description และ tagline ในหน้า Settings — ช่วย SEO และ conversion',
    href: '/dashboard/settings',
  },
  {
    key: 'star_rating', label: 'ระดับดาว', icon: Star,
    format: v => v ? `${v} ดาว` : 'ยังไม่ระบุ',
    good: v => v >= 3,
    tip: 'ระบุระดับดาวในหน้า Settings เพื่อให้ระบบจัดอันดับได้ถูกต้อง',
    href: '/dashboard/settings',
  },
  {
    key: 'is_featured', label: 'Featured Boost', icon: Flame,
    format: v => v ? 'เปิดใช้งาน' : 'ปิดอยู่',
    good: v => v === true,
    tip: 'Featured Boost ให้คะแนนพิเศษ +50 ทำให้ขึ้นอันดับสูงกว่าคู่แข่งที่ score เท่ากัน',
  },
];

export function RankingDashboardClient() {
  const [data, setData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [featured, setFeatured] = useState(false);
  const [featuredUntil, setFeaturedUntil] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard/ranking')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setFeatured(d.hotel?.is_featured ?? false);
        setFeaturedUntil(d.hotel?.featured_until?.slice(0, 10) ?? '');
      })
      .finally(() => setLoading(false));
  }, []);

  async function saveFeatured() {
    setSaving(true);
    const res = await fetch('/api/dashboard/ranking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_featured: featured, featured_until: featuredUntil || null }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(featured ? 'เปิด Featured Boost แล้ว' : 'ปิด Featured Boost แล้ว');
      setData(prev => prev ? { ...prev, hotel: { ...prev.hotel, is_featured: featured } } : prev);
    } else {
      toast.error('บันทึกไม่สำเร็จ');
    }
  }

  if (loading) return (
    <div className="p-8 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
    </div>
  );

  if (!data) return (
    <div className="p-8 text-center text-muted-foreground">ไม่พบข้อมูลโรงแรม</div>
  );

  const pct = Math.round((data.score / data.maxScore) * 100);
  const scoreColor = pct >= 70 ? 'text-emerald-600' : pct >= 40 ? 'text-amber-500' : 'text-red-500';
  const barColor   = pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-400' : 'bg-red-400';

  const totalMax = Object.values(data.weights).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Search Ranking</h1>
        <p className="text-sm text-muted-foreground mt-1">
          อันดับของ <span className="font-semibold text-foreground">{data.hotel.name}</span> ในผลการค้นหา Maitri
        </p>
      </div>

      {/* Score card */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Ranking Score</p>
            <div className="flex items-end gap-2">
              <span className={`text-5xl font-bold ${scoreColor}`}>{data.score}</span>
              <span className="text-muted-foreground text-lg mb-1">/ {data.maxScore} pts</span>
            </div>
          </div>
          <div className={`text-4xl font-black ${scoreColor}`}>{pct}%</div>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(100, (data.score / totalMax) * 100)}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>0</span>
          <span className="text-amber-500 font-medium">Featured +{data.weights.featured} pts (แยก)</span>
          <span>{data.maxScore}</span>
        </div>
        <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
          <span>คะแนนนี้ใช้จัดอันดับเมื่อแขกเลือก sort "แนะนำ" — Featured Boost บวกเพิ่มแยกต่างหากบน score นี้</span>
        </div>
      </div>

      {/* Signal breakdown */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-semibold mb-4">Signal Breakdown</h2>
        <div className="space-y-3">
          {SIGNAL_CONFIG.filter(s => s.key !== 'is_featured').map(s => {
            const value = data.signals[s.key];
            const isGood = s.good(value);
            const weight = data.weights[
              s.key === 'avg_rating' ? 'rating' :
              s.key === 'review_count' ? 'reviews' :
              s.key === 'gallery_count' ? 'photos' :
              s.key === 'is_free_cancel' ? 'freeCancel' :
              s.key === 'star_rating' ? 'stars' :
              s.key === 'has_content' ? 'content' :
              s.key === 'is_breakfast' ? 'breakfast' : 'featured'
            ] ?? 0;
            const Icon = s.icon;

            return (
              <div key={s.key} className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${isGood ? 'border-emerald-100 bg-emerald-50/40' : 'border-orange-100 bg-orange-50/40'}`}>
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isGood ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                  <Icon className={`h-4 w-4 ${isGood ? 'text-emerald-600' : 'text-orange-500'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{s.label}</p>
                    <span className="text-xs text-muted-foreground shrink-0">max {weight} pts</span>
                  </div>
                  <p className={`text-xs mt-0.5 font-medium ${isGood ? 'text-emerald-700' : 'text-orange-600'}`}>{s.format(value)}</p>
                  {!isGood && (
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.tip}</p>
                  )}
                </div>
                {!isGood && s.href && (
                  <Link href={s.href} className="shrink-0 text-xs text-primary hover:underline flex items-center gap-1 mt-0.5">
                    แก้ไข <ExternalLink className="h-3 w-3" />
                  </Link>
                )}
                {isGood && (
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Featured Boost */}
      <div className="rounded-2xl border bg-card p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
            <Flame className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h2 className="font-semibold">Featured Boost</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              บวกคะแนน +{data.weights.featured} pts บน ranking score ปกติ — โรงแรมของคุณจะขึ้นเหนือคู่แข่งที่ score ต่ำกว่า
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">เปิดใช้ Featured Boost</p>
              <p className="text-xs text-muted-foreground">ปรากฏในผลการค้นหา "แนะนำ" อันดับต้นๆ</p>
            </div>
            <div onClick={() => setFeatured(p => !p)}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${featured ? 'bg-orange-500' : 'bg-muted'}`}>
              <div className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform ${featured ? 'left-7' : 'left-1'}`} />
            </div>
          </label>

          {featured && (
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">วันที่หมดอายุ Featured (ว่างไว้ = ไม่มีวันหมด)</label>
              <input type="date" value={featuredUntil} onChange={e => setFeaturedUntil(e.target.value)}
                className="w-full px-3 py-2 bg-muted border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </div>
          )}

          <button onClick={saveFeatured} disabled={saving}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-50">
            {saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
          </button>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="font-semibold mb-4">ปรับปรุง Score เร็วที่สุด</h2>
        <div className="space-y-2">
          {SIGNAL_CONFIG.filter(s => s.key !== 'is_featured' && !s.good(data.signals[s.key]) && s.href).map(s => (
            <Link key={s.key} href={s.href!}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors border border-border group">
              <div className="flex items-center gap-3">
                <s.icon className="h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-muted-foreground">{s.tip.slice(0, 60)}...</p>
                </div>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
            </Link>
          ))}
          {SIGNAL_CONFIG.filter(s => s.key !== 'is_featured' && !s.good(data.signals[s.key])).length === 0 && (
            <div className="text-center py-6">
              <Sparkles className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-700">ยอดเยี่ยม! ทุก signal ผ่านหมดแล้ว</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
