'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Save, RotateCcw, TrendingUp, Info } from 'lucide-react';
import { DEFAULT_WEIGHTS, WEIGHT_META, type RankingWeights } from '@/lib/ranking';
import { useAdminLang } from '@/contexts/admin-lang-context';

export default function AdminRankingPage() {
  const { t } = useAdminLang();
  const [weights, setWeights] = useState<RankingWeights>({ ...DEFAULT_WEIGHTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/admin/ranking-weights')
      .then(r => r.json())
      .then(d => setWeights(d.weights ?? DEFAULT_WEIGHTS))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    const res = await fetch('/api/admin/ranking-weights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(weights),
    });
    setSaving(false);
    if (res.ok) toast.success('บันทึก Ranking Weights แล้ว — มีผลกับการค้นหาทันที');
    else toast.error('บันทึกไม่สำเร็จ');
  }

  function reset() {
    setWeights({ ...DEFAULT_WEIGHTS });
    toast('รีเซ็ตเป็นค่าเริ่มต้นแล้ว (ยังไม่ได้บันทึก)');
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

  if (loading) return (
    <div className="p-4 md:p-8 space-y-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
    </div>
  );

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl text-white">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">{t('ranking.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            ปรับ weight ของแต่ละ signal ที่ใช้คำนวณอันดับ "แนะนำ" ในผลการค้นหา — มีผลกับทุกโรงแรมในแพลตฟอร์ม
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground transition-colors">
            <RotateCcw className="h-3.5 w-3.5" />รีเซ็ต
          </button>
          <button onClick={save} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            <Save className="h-3.5 w-3.5" />{saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>

      {/* Formula explanation */}
      <div className="rounded-xl border bg-muted/30 p-4 flex items-start gap-3 text-sm">
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="text-muted-foreground">
          <span className="font-medium text-foreground">สูตรคำนวณ: </span>
          score = (rating_signal × weight_rating) + (reviews_signal × weight_reviews) + ... + featured_boost<br />
          <span className="text-xs mt-1 block">แต่ละ signal ถูก normalize เป็น 0–1 ก่อนคูณ weight — ยกเว้น Featured ที่บวกตรงๆ</span>
        </div>
      </div>

      {/* Weight sliders */}
      <div className="rounded-2xl border bg-card divide-y">
        {(Object.keys(DEFAULT_WEIGHTS) as (keyof RankingWeights)[]).map(key => {
          const meta = WEIGHT_META[key];
          const val  = weights[key];
          const pct  = Math.round((val / totalWeight) * 100);
          const isFeatured = key === 'featured';

          return (
            <div key={key} className="p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{meta.label}</p>
                    {isFeatured && (
                      <span className="text-2xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">Paid boost</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{meta.desc}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-2xl font-bold tabular-nums">{val}</span>
                  <p className="text-xs text-muted-foreground">{pct}% of total</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-4">0</span>
                <input
                  type="range"
                  min={0}
                  max={isFeatured ? 200 : 100}
                  step={5}
                  value={val}
                  onChange={e => setWeights(p => ({ ...p, [key]: Number(e.target.value) }))}
                  className="flex-1 accent-primary"
                />
                <span className="text-xs text-muted-foreground w-8">{isFeatured ? 200 : 100}</span>
              </div>

              {/* Visual bar */}
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${isFeatured ? 'bg-orange-400' : 'bg-primary'}`}
                  style={{ width: `${(val / (isFeatured ? 200 : 100)) * 100}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Live preview summary */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-sm">ตัวอย่างคะแนนสูงสุดที่เป็นไปได้ (ไม่นับ Featured)</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {(Object.keys(DEFAULT_WEIGHTS) as (keyof RankingWeights)[]).filter(k => k !== 'featured').map(key => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{WEIGHT_META[key].label}</span>
              <span className="font-semibold tabular-nums">{weights[key]} pts</span>
            </div>
          ))}
          <div className="col-span-2 border-t pt-2 flex items-center justify-between text-sm font-bold">
            <span>Max score (ไม่รวม Featured)</span>
            <span>{Object.entries(weights).filter(([k]) => k !== 'featured').reduce((s, [, v]) => s + v, 0)} pts</span>
          </div>
          <div className="col-span-2 flex items-center justify-between text-sm text-orange-600">
            <span>Featured Boost (บวกเพิ่ม)</span>
            <span className="font-bold">+{weights.featured} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
