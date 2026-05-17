'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Package, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

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

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" aria-hidden="true" />
        <h2 className="text-xl font-semibold mb-2">ส่งรายงานสำเร็จ</h2>
        <p className="text-sm text-muted-foreground mb-6">
          ทีม Housekeeping จะตรวจสอบและติดต่อกลับภายใน 24 ชั่วโมง
        </p>
        <Link href="/portal/bookings" className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
          กลับหน้าหลัก
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/portal/bookings" className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="กลับ">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-semibold flex items-center gap-2">
            <Search className="h-4 w-4" aria-hidden="true" />
            รายงานสิ่งของหาย
          </h1>
          <p className="text-xs text-muted-foreground">Lost & Found Report</p>
        </div>
      </div>

      <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 flex gap-2 text-sm text-amber-800">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
        <p>กรอกรายละเอียดให้ครบถ้วน ทีม Housekeeping จะค้นหาและติดต่อกลับหากพบสิ่งของ</p>
      </div>

      <form onSubmit={submit} className="space-y-4" aria-label="แบบฟอร์มรายงานสิ่งของหาย">
        {reservations.length > 1 && (
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">การจองที่เกี่ยวข้อง <span aria-hidden="true">*</span></label>
            <select
              value={form.reservationId}
              onChange={e => setForm(p => ({ ...p, reservationId: e.target.value }))}
              required
              aria-required="true"
              className="w-full px-3 py-2 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {reservations.map(r => (
                <option key={r.id} value={r.id}>
                  {(r.hotels as any)?.name} — {r.reservation_code}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium mb-1.5 text-muted-foreground">ประเภทสิ่งของ <span aria-hidden="true">*</span></label>
          <select
            value={form.category}
            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
            required
            aria-required="true"
            className="w-full px-3 py-2 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ITEM_CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-muted-foreground">
            รายละเอียดสิ่งของ <span aria-hidden="true">*</span>
          </label>
          <textarea
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            required
            aria-required="true"
            placeholder="เช่น กระเป๋าสีดำยี่ห้อ X มีซิปทอง ด้านในมีหนังสือเดินทาง..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-secondary border-0 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">วันที่หาย</label>
            <input
              type="date"
              value={form.lostDate}
              onChange={e => setForm(p => ({ ...p, lostDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">สถานที่ที่หาย (เดา)</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              placeholder="เช่น ห้อง, ล็อบบี้, สระน้ำ"
              className="w-full px-3 py-2 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-muted-foreground">เบอร์โทรติดต่อ</label>
          <input
            type="tel"
            value={form.contactPhone}
            onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
            placeholder="+66 8x xxx xxxx"
            className="w-full px-3 py-2 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1.5 text-muted-foreground">รางวัลนำจ่าย (ถ้ามี)</label>
          <input
            type="text"
            value={form.reward}
            onChange={e => setForm(p => ({ ...p, reward: e.target.value }))}
            placeholder="เช่น ฿500 สำหรับผู้ที่พบ"
            className="w-full px-3 py-2 rounded-lg bg-secondary border-0 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || !form.description}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors"
          aria-busy={submitting}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Package className="h-4 w-4" aria-hidden="true" />}
          {submitting ? 'กำลังส่ง...' : 'ส่งรายงาน'}
        </button>
      </form>
    </div>
  );
}
