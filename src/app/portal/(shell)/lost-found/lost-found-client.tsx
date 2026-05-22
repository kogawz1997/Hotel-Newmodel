'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Package, CheckCircle2, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const ITEM_CATEGORIES = [
  'เสื้อผ้า / เครื่องแต่งกาย',
  'อิเล็กทรอนิกส์ (โทรศัพท์ แท็บเล็ต)',
  'เครื่องประดับ / นาฬิกา',
  'กระเป๋า / กระเป๋าเดินทาง',
  'เอกสาร / หนังสือเดินทาง',
  'ของใช้ส่วนตัว',
  'ของเล่นเด็ก',
  'อื่นๆ',
];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 rounded-xl bg-secondary border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/40 transition-all placeholder:text-muted-foreground/50';

export function LostFoundClient({ reservations }: { reservations: any[] }) {
  const [form, setForm] = useState({
    reservationId: reservations[0]?.id || '',
    category: ITEM_CATEGORIES[0],
    description: '',
    lostDate: '',
    location: '',
    contactPhone: '',
    reward: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.reservationId) {
      toast.error('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/guest/lost-found', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || 'ส่งรายงานไม่สำเร็จ'); return; }
      setSubmitted(data.id || 'ok');
      toast.success('ส่งรายงานสิ่งของหายแล้ว ทีมงานจะติดต่อกลับเร็วๆ นี้');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ──
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] dark:bg-background flex flex-col">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 bg-[#f5f7fa]/95 dark:bg-background/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-border/40">
          <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
            <Link href="/portal/stay" className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-foreground">รายงานสิ่งของหาย</p>
              <p className="text-[10px] text-muted-foreground">Lost & Found</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col items-center justify-center px-4 py-16 text-center max-w-screen-sm mx-auto"
        >
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-5">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h2 className="font-display font-bold text-foreground text-xl mb-2">ส่งรายงานสำเร็จ</h2>
          <p className="text-sm text-muted-foreground mb-8 max-w-[280px] leading-relaxed">
            ทีม Housekeeping จะตรวจสอบและติดต่อกลับภายใน 24 ชั่วโมง หากพบสิ่งของของท่าน
          </p>
          <div className="flex gap-2.5 w-full max-w-[280px]">
            <Link href="/portal/stay"
              className="flex-1 py-3 rounded-2xl border border-border/60 bg-white dark:bg-card text-sm font-semibold text-foreground text-center hover:bg-secondary transition-colors">
              กลับ
            </Link>
            <Link href="/portal/home"
              className="flex-1 py-3 rounded-2xl bg-blue-600 text-white text-sm font-bold text-center hover:bg-blue-700 transition-colors">
              หน้าแรก
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/95 dark:bg-background/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <Link href="/portal/stay" className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground">รายงานสิ่งของหาย</p>
            <p className="text-[10px] text-muted-foreground">Lost & Found Report</p>
          </div>
          <Search className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </div>

      <div className="px-4 pt-5 pb-28 max-w-screen-sm mx-auto space-y-3">

        {/* Info banner */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 px-4 py-3.5">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
            กรอกรายละเอียดให้ครบถ้วน ทีม Housekeeping จะค้นหาและติดต่อกลับหากพบสิ่งของ
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={submit}>
          <div className="rounded-2xl border border-gray-100 dark:border-border/60 bg-white dark:bg-card shadow-sm p-4 space-y-4">

            {/* Reservation select (show only if multiple) */}
            {reservations.length > 1 && (
              <Field label="การจองที่เกี่ยวข้อง" required>
                <div className="relative">
                  <select
                    value={form.reservationId}
                    onChange={e => setForm(p => ({ ...p, reservationId: e.target.value }))}
                    required
                    className={inputCls + ' appearance-none pr-8'}
                  >
                    {reservations.map(r => (
                      <option key={r.id} value={r.id}>
                        {(r.hotels as any)?.name} — {r.reservation_code}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </Field>
            )}

            {/* Category */}
            <Field label="ประเภทสิ่งของ" required>
              <div className="relative">
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  required
                  className={inputCls + ' appearance-none pr-8'}
                >
                  {ITEM_CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </Field>

            {/* Description */}
            <Field label="รายละเอียดสิ่งของ" required>
              <textarea
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                required
                placeholder="เช่น กระเป๋าสีดำยี่ห้อ X มีซิปทอง ด้านในมีหนังสือเดินทาง..."
                rows={3}
                className={inputCls + ' resize-none'}
              />
            </Field>

            {/* Date + Location */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="วันที่หาย">
                <input
                  type="date"
                  value={form.lostDate}
                  onChange={e => setForm(p => ({ ...p, lostDate: e.target.value }))}
                  className={inputCls}
                />
              </Field>
              <Field label="สถานที่ (เดา)">
                <input
                  type="text"
                  value={form.location}
                  onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
                  placeholder="ห้อง, ล็อบบี้..."
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Phone */}
            <Field label="เบอร์โทรติดต่อ">
              <input
                type="tel"
                value={form.contactPhone}
                onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
                placeholder="+66 8x xxx xxxx"
                className={inputCls}
              />
            </Field>

            {/* Reward */}
            <Field label="รางวัลนำจ่าย (ถ้ามี)">
              <input
                type="text"
                value={form.reward}
                onChange={e => setForm(p => ({ ...p, reward: e.target.value }))}
                placeholder="เช่น ฿500 สำหรับผู้ที่พบ"
                className={inputCls}
              />
            </Field>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            whileTap={{ scale: 0.98 }}
            disabled={submitting || !form.description}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
          >
            {submitting
              ? <><Loader2 className="h-4 w-4 animate-spin" /> กำลังส่ง...</>
              : <><Package className="h-4 w-4" /> ส่งรายงาน</>
            }
          </motion.button>
        </form>

        <p className="text-center text-xs text-muted-foreground/50 pb-2">
          ทีมงานจะตรวจสอบและติดต่อกลับภายใน 24 ชั่วโมง
        </p>
      </div>
    </div>
  );
}
