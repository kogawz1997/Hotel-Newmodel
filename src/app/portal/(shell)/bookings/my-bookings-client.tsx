'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO, isAfter, isBefore } from 'date-fns';
import { th } from 'date-fns/locale';
import { formatCurrency, cn } from '@/lib/utils';
import { toast } from 'sonner';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Calendar, Bed, MapPin, Clock, Star, Download, MessageSquare,
  X, ChevronRight, LogOut, QrCode, Sunrise, Sunset,
  ArrowUpCircle, CalendarDays, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS: Record<string, { label: string; dot: string; badge: string }> = {
  confirmed:   { label: 'ยืนยันแล้ว',   dot: 'bg-sky-400',     badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/20' },
  checked_in:  { label: 'เช็คอินแล้ว', dot: 'bg-emerald-400', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' },
  checked_out: { label: 'เช็คเอาท์แล้ว', dot: 'bg-gray-400',  badge: 'bg-gray-500/10 text-muted-foreground border-border' },
  cancelled:   { label: 'ยกเลิกแล้ว',  dot: 'bg-red-400',    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
  pending:     { label: 'รอยืนยัน',    dot: 'bg-amber-400',  badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20' },
  no_show:     { label: 'ไม่มาตามนัด', dot: 'bg-red-400',    badge: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  }),
};

const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=75&fit=crop';

export function MyBookingsClient({ guest }: { guest: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loyaltyPoints, setLoyaltyPoints] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'cancelled'>('upcoming');
  const [selected, setSelected] = useState<any>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [showEarlyCheckin, setShowEarlyCheckin] = useState(false);
  const [showLateCheckout, setShowLateCheckout] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showModifyDates, setShowModifyDates] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundEstimate, setRefundEstimate] = useState<any>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [requests, setRequests] = useState({ text: '', arrival: '' });
  const [serviceNote, setServiceNote] = useState('');
  const [modifyDates, setModifyDates] = useState({ checkIn: '', checkOut: '' });
  const [review, setReview] = useState({ rating: 5, clean: 5, service: 5, location: 5, value: 5, title: '', comment: '' });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadBookings(); }, []);

  async function loadBookings() {
    setLoading(true);
    const [bookRes, loyaltyRes] = await Promise.all([
      fetch('/api/guest/bookings'),
      fetch('/api/guest/loyalty'),
    ]);
    const bookData = await bookRes.json();
    const loyaltyData = loyaltyRes.ok ? await loyaltyRes.json() : {};
    setBookings(bookData.reservations || []);
    if (loyaltyData.points !== undefined) setLoyaltyPoints(loyaltyData);
    setLoading(false);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push('/');
  }

  const now = new Date();
  const upcoming  = bookings.filter(b => !['cancelled','no_show'].includes(b.status) && isAfter(parseISO(b.check_out), now));
  const past      = bookings.filter(b => ['checked_out'].includes(b.status) || (b.status !== 'cancelled' && isBefore(parseISO(b.check_out), now)));
  const cancelled = bookings.filter(b => ['cancelled','no_show'].includes(b.status));
  const tabs = { upcoming, past, cancelled };
  const tabOrder: Array<'upcoming' | 'past' | 'cancelled'> = ['upcoming', 'past', 'cancelled'];
  const current = tabs[activeTab];

  async function doCancel() {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch(`/api/guest/bookings/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel', reason: cancelReason }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (!res.ok) { toast.error(data.error); return; }
    toast.success('ยกเลิกการจองเรียบร้อย');
    setShowCancel(false); setSelected(null);
    loadBookings();
  }

  async function doUpdateRequests() {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch(`/api/guest/bookings/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_requests', specialRequests: requests.text, estimatedArrival: requests.arrival }),
    });
    setActionLoading(false);
    if (!res.ok) { toast.error('เกิดข้อผิดพลาด'); return; }
    toast.success('บันทึกคำขอพิเศษแล้ว');
    setShowRequests(false); loadBookings();
  }

  async function doServiceRequest(action: string, successMsg: string) {
    if (!selected) return;
    setActionLoading(true);
    const body: any = { action, requestNote: serviceNote };
    if (action === 'request_date_change') {
      body.newCheckIn = modifyDates.checkIn;
      body.newCheckOut = modifyDates.checkOut;
    }
    const res = await fetch(`/api/guest/bookings/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    setActionLoading(false);
    if (!res.ok) { toast.error('เกิดข้อผิดพลาด'); return; }
    toast.success(successMsg);
    setShowEarlyCheckin(false); setShowLateCheckout(false);
    setShowUpgrade(false); setShowModifyDates(false);
    setServiceNote('');
  }

  async function doReview() {
    if (!selected) return;
    setActionLoading(true);
    const res = await fetch('/api/guest/reviews', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hotelId: selected.hotels?.id, reservationId: selected.id,
        rating: review.rating, ratingClean: review.clean, ratingService: review.service,
        ratingLocation: review.location, ratingValue: review.value,
        title: review.title, comment: review.comment,
        reviewerName: `${guest.first_name} ${guest.last_name || ''}`.trim(),
      }),
    });
    setActionLoading(false);
    if (!res.ok) { const d = await res.json(); toast.error(d.error); return; }
    toast.success('ขอบคุณสำหรับรีวิว!');
    setShowReview(false);
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        {/* Welcome */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-amber-700 dark:text-amber-400 font-medium mb-1">สวัสดี</p>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              {guest.first_name} {guest.last_name || ''}
            </h1>
            <p className="text-sm text-muted-foreground">{guest.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="ออกจากระบบ"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Loyalty + stats row */}
        <div className="grid grid-cols-4 gap-3">
          {loyaltyPoints && (
            <div className="col-span-4 sm:col-span-2 flex items-center gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/8 dark:bg-amber-400/6 px-4 py-3">
              <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
              <div>
                <p className="font-semibold text-foreground text-sm">{(loyaltyPoints.points || 0).toLocaleString()} แต้ม</p>
                <p className="text-xs text-muted-foreground">{loyaltyPoints.tier || 'Bronze'} Member</p>
              </div>
            </div>
          )}
          {[
            { label: 'ทั้งหมด', value: bookings.length },
            { label: 'ที่กำลังจะมา', value: upcoming.length },
            { label: 'เสร็จสิ้น', value: past.length },
          ].map(s => (
            <div key={s.label} className={cn(
              'rounded-2xl border border-border bg-card px-4 py-3',
              loyaltyPoints ? 'col-span-4 sm:col-span-2 lg:col-span-1' : 'col-span-4 sm:col-span-4 lg:col-span-4',
            )}>
              <p className="text-2xl font-bold text-foreground font-display">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Tabs ── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="relative flex bg-secondary rounded-2xl p-1 mb-6"
        role="tablist"
      >
        {[
          { key: 'upcoming', label: `จะมาถึง (${upcoming.length})` },
          { key: 'past',     label: `ผ่านมา (${past.length})` },
          { key: 'cancelled', label: `ยกเลิก (${cancelled.length})` },
        ].map(t => (
          <button
            key={t.key}
            role="tab"
            aria-selected={activeTab === t.key}
            onClick={() => setActiveTab(t.key as any)}
            className="flex-1 relative py-2 text-xs font-medium z-10 transition-colors duration-200"
            style={{ color: activeTab === t.key ? 'hsl(var(--foreground))' : 'hsl(var(--muted-foreground))' }}
          >
            {activeTab === t.key && (
              <motion.div
                layoutId="booking-tab"
                className="absolute inset-0 bg-card rounded-xl shadow-sm"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
            <span className="relative z-10">{t.label}</span>
          </button>
        ))}
      </motion.div>

      {/* ── Bookings list ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <div key={i} className="h-48 rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : current.length === 0 ? (
        <EmptyState icon={Calendar} title="ไม่มีการจองในหมวดนี้"
          description="เมื่อมีการจองใหม่ รายการจะถูกแสดงตามสถานะให้อัตโนมัติ"
          className="py-20 text-muted-foreground" />
      ) : (
        <div className="space-y-4">
          {current.map((b, i) => {
            const hotel = b.hotels || {};
            const rt = b.room_types || {};
            const nights = b.nights || 0;
            const isUpcoming = isAfter(parseISO(b.check_in), now);
            const canCancel = isUpcoming && b.status === 'confirmed';
            const canReview = b.status === 'checked_out';
            const st = STATUS[b.status] || STATUS.confirmed;
            const heroImg = hotel.hero_image_url || PLACEHOLDER_IMG;

            return (
              <motion.div
                key={b.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                {/* Hotel hero */}
                <div className="relative h-36">
                  <Image
                    src={heroImg}
                    alt={hotel.name || 'Hotel'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 672px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* Hotel info overlay */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p className="font-display font-semibold text-white text-base leading-tight">{hotel.name}</p>
                      {hotel.city && (
                        <p className="text-xs text-white/70 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />{hotel.city}
                        </p>
                      )}
                    </div>
                    <span className={cn('text-[11px] font-semibold px-2.5 py-1 rounded-full border backdrop-blur-sm', st.badge)}>
                      <span className={cn('inline-block h-1.5 w-1.5 rounded-full mr-1.5', st.dot)} />
                      {st.label}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-4">
                  {/* Code + Amount */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">รหัสจอง</p>
                      <p className="font-mono text-base font-bold text-foreground tracking-wider">{b.reservation_code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">ยอดรวม</p>
                      <p className="font-display text-lg font-bold text-foreground">{formatCurrency(b.total_amount)}</p>
                    </div>
                  </div>

                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4 pb-4 border-b border-border">
                    <BookingDetail icon={Calendar} label="เช็คอิน" value={format(parseISO(b.check_in + 'T00:00:00'), 'd MMM yyyy', { locale: th })} />
                    <BookingDetail icon={Calendar} label="เช็คเอาท์" value={format(parseISO(b.check_out + 'T00:00:00'), 'd MMM yyyy', { locale: th })} />
                    <BookingDetail icon={Bed} label="ประเภทห้อง" value={rt.name || '—'} />
                    <BookingDetail icon={Clock} label="จำนวนคืน" value={`${nights} คืน`} />
                  </div>

                  {b.special_requests && (
                    <div className="mb-4 px-3 py-2.5 bg-secondary/60 rounded-xl text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">คำขอพิเศษ: </span>
                      {b.special_requests}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {canCancel && (
                      <>
                        <ActionBtn icon={MessageSquare} label="ส่งข้อความ"
                          onClick={() => { window.location.href = `mailto:${hotel.email || ''}?subject=Pre-stay (${b.reservation_code})`; }} />
                        <ActionBtn icon={MessageSquare} label="คำขอพิเศษ"
                          onClick={() => { setSelected(b); setShowRequests(true); setRequests({ text: b.special_requests || '', arrival: b.estimated_arrival || '' }); }} />
                        <ActionBtn icon={Sunrise} label="Early Check-in" iconColor="text-amber-500"
                          onClick={() => { setSelected(b); setShowEarlyCheckin(true); setServiceNote(''); }} />
                        <ActionBtn icon={Sunset} label="Late Checkout" iconColor="text-sky-500"
                          onClick={() => { setSelected(b); setShowLateCheckout(true); setServiceNote(''); }} />
                        <ActionBtn icon={ArrowUpCircle} label="อัพเกรดห้อง" iconColor="text-amber-700 dark:text-amber-400"
                          onClick={() => { setSelected(b); setShowUpgrade(true); setServiceNote(''); }} />
                        <ActionBtn icon={CalendarDays} label="เปลี่ยนวันที่"
                          onClick={() => { setSelected(b); setShowModifyDates(true); setModifyDates({ checkIn: b.check_in, checkOut: b.check_out }); }} />
                        <ActionBtn icon={X} label="ยกเลิก" danger
                          onClick={async () => {
                            setSelected(b); setShowCancel(true);
                            setRefundEstimate(null); setRefundLoading(true);
                            try {
                              const r = await fetch(`/api/guest/bookings/${b.id}/refund-estimate`);
                              if (r.ok) setRefundEstimate(await r.json());
                            } finally { setRefundLoading(false); }
                          }} />
                      </>
                    )}

                    {canReview && (
                      <button
                        onClick={() => { setSelected(b); setShowReview(true); }}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl
                          bg-amber-600 dark:bg-amber-500 text-white hover:opacity-90 transition-opacity"
                      >
                        <Star className="h-3.5 w-3.5" /> รีวิวประสบการณ์
                      </button>
                    )}

                    <a href={`/api/guest/bookings/${b.id}/receipt`} target="_blank" rel="noreferrer">
                      <ActionBtn icon={Download} label="ใบเสร็จ" />
                    </a>
                    <Link href={`/portal/bookings/qr?code=${b.reservation_code}`}>
                      <ActionBtn icon={QrCode} label="QR" />
                    </Link>
                    {hotel.id && (
                      <Link href={`/booking/${hotel.slug || hotel.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl
                          bg-foreground text-background hover:opacity-90 transition-opacity">
                        จองอีกครั้ง <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── Modals ── */}

      {/* Cancel */}
      {showCancel && (
        <Sheet title="ยกเลิกการจอง" onClose={() => setShowCancel(false)}>
          <p className="text-sm text-muted-foreground mb-4">
            ยืนยันยกเลิกการจอง <span className="font-mono font-bold text-foreground">{selected?.reservation_code}</span>?
          </p>
          {refundLoading ? (
            <div className="rounded-xl bg-secondary px-4 py-3 mb-4 text-sm text-center text-muted-foreground animate-pulse">
              กำลังคำนวณเงินคืน...
            </div>
          ) : refundEstimate && (
            <div className={cn('rounded-xl border p-4 mb-4 text-sm',
              refundEstimate.refundPercent === 100 ? 'bg-emerald-500/10 border-emerald-500/20'
              : refundEstimate.refundPercent > 0 ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-destructive/10 border-destructive/20'
            )}>
              <p className="font-semibold mb-2 text-foreground">สรุปเงินคืน</p>
              <div className="space-y-1 text-xs">
                <Row label="นโยบาย" value={refundEstimate.rule} />
                <Row label="ยอดที่ชำระ" value={formatCurrency(refundEstimate.paidAmount)} />
                <Row label={`เงินคืน (${refundEstimate.refundPercent}%)`} value={formatCurrency(refundEstimate.refundAmount)}
                  valueClass={refundEstimate.refundAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'} />
                {refundEstimate.penaltyAmount > 0 && (
                  <Row label="ค่าธรรมเนียมยกเลิก" value={formatCurrency(refundEstimate.penaltyAmount)} valueClass="text-destructive" />
                )}
              </div>
            </div>
          )}
          <select value={cancelReason} onChange={e => setCancelReason(e.target.value)}
            className="w-full px-3 py-2.5 bg-secondary border border-input rounded-xl text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-ring">
            <option value="">เลือกเหตุผล...</option>
            <option value="change_plans">เปลี่ยนแผนการเดินทาง</option>
            <option value="found_better">พบที่พักอื่นที่เหมาะกว่า</option>
            <option value="emergency">เหตุฉุกเฉิน</option>
            <option value="other">อื่นๆ</option>
          </select>
          <div className="flex gap-3">
            <SheetBtn outline onClick={() => setShowCancel(false)}>ไม่ยกเลิก</SheetBtn>
            <SheetBtn danger onClick={doCancel} disabled={actionLoading || !cancelReason}>
              {actionLoading ? 'กำลังยกเลิก...' : 'ยืนยันยกเลิก'}
            </SheetBtn>
          </div>
        </Sheet>
      )}

      {/* Special requests */}
      {showRequests && (
        <Sheet title="คำขอพิเศษ" onClose={() => setShowRequests(false)}>
          <div className="space-y-4 mb-5">
            <SheetTextarea label="คำขอพิเศษ" value={requests.text} onChange={v => setRequests(p => ({ ...p, text: v }))}
              placeholder="เช่น ต้องการห้องชั้นสูง, ที่พักสัตว์เลี้ยง, แพ้อาหาร..." />
            <SheetInput label="เวลาเช็คอินโดยประมาณ" type="time" value={requests.arrival} onChange={v => setRequests(p => ({ ...p, arrival: v }))} />
          </div>
          <div className="flex gap-3">
            <SheetBtn outline onClick={() => setShowRequests(false)}>ยกเลิก</SheetBtn>
            <SheetBtn onClick={doUpdateRequests} disabled={actionLoading}>
              {actionLoading ? 'กำลังบันทึก...' : 'บันทึก'}
            </SheetBtn>
          </div>
        </Sheet>
      )}

      {/* Early check-in */}
      {showEarlyCheckin && (
        <Sheet title="ขอ Early Check-in" onClose={() => setShowEarlyCheckin(false)}>
          <p className="text-sm text-muted-foreground mb-4">ส่งคำขอ Early Check-in ให้ทางโรงแรม ขึ้นอยู่กับห้องว่างและดุลยพินิจของโรงแรม</p>
          <SheetInput label="เวลาที่ต้องการ Check-in" type="time" value={serviceNote} onChange={setServiceNote} />
          <div className="flex gap-3 mt-5">
            <SheetBtn outline onClick={() => setShowEarlyCheckin(false)}>ยกเลิก</SheetBtn>
            <SheetBtn onClick={() => doServiceRequest('request_early_checkin', 'ส่งคำขอ Early Check-in แล้ว')} disabled={actionLoading}>
              {actionLoading ? 'กำลังส่ง...' : 'ส่งคำขอ'}
            </SheetBtn>
          </div>
        </Sheet>
      )}

      {/* Late checkout */}
      {showLateCheckout && (
        <Sheet title="ขอ Late Checkout" onClose={() => setShowLateCheckout(false)}>
          <p className="text-sm text-muted-foreground mb-4">ส่งคำขอ Late Checkout ให้ทางโรงแรม ขึ้นอยู่กับห้องว่างและดุลยพินิจของโรงแรม</p>
          <SheetInput label="เวลาที่ต้องการ Check-out" type="time" value={serviceNote} onChange={setServiceNote} />
          <div className="flex gap-3 mt-5">
            <SheetBtn outline onClick={() => setShowLateCheckout(false)}>ยกเลิก</SheetBtn>
            <SheetBtn onClick={() => doServiceRequest('request_late_checkout', 'ส่งคำขอ Late Checkout แล้ว')} disabled={actionLoading}>
              {actionLoading ? 'กำลังส่ง...' : 'ส่งคำขอ'}
            </SheetBtn>
          </div>
        </Sheet>
      )}

      {/* Room upgrade */}
      {showUpgrade && (
        <Sheet title="ขอ Upgrade ห้อง" onClose={() => setShowUpgrade(false)}>
          <p className="text-sm text-muted-foreground mb-4">ส่งคำขออัพเกรดห้องพัก ทางโรงแรมจะพิจารณาตามห้องว่างและอาจมีค่าใช้จ่ายเพิ่มเติม</p>
          <SheetTextarea label="ประเภทห้องที่ต้องการ (ถ้ามี)" value={serviceNote} onChange={setServiceNote}
            placeholder="เช่น Deluxe Sea View, Suite..." rows={3} />
          <div className="flex gap-3 mt-5">
            <SheetBtn outline onClick={() => setShowUpgrade(false)}>ยกเลิก</SheetBtn>
            <SheetBtn onClick={() => doServiceRequest('request_upgrade', 'ส่งคำขออัพเกรดห้องแล้ว')} disabled={actionLoading}>
              {actionLoading ? 'กำลังส่ง...' : 'ส่งคำขอ'}
            </SheetBtn>
          </div>
        </Sheet>
      )}

      {/* Modify dates */}
      {showModifyDates && (
        <Sheet title="เปลี่ยนวันที่" onClose={() => setShowModifyDates(false)}>
          <p className="text-sm text-muted-foreground mb-4">ส่งคำขอเปลี่ยนวันเช็คอิน-เช็คเอาท์ ทางโรงแรมจะพิจารณาตามห้องว่าง</p>
          <div className="space-y-3 mb-5">
            <SheetInput label="วันเช็คอินใหม่" type="date" value={modifyDates.checkIn} onChange={v => setModifyDates(p => ({ ...p, checkIn: v }))} />
            <SheetInput label="วันเช็คเอาท์ใหม่" type="date" value={modifyDates.checkOut} onChange={v => setModifyDates(p => ({ ...p, checkOut: v }))} />
          </div>
          <div className="flex gap-3">
            <SheetBtn outline onClick={() => setShowModifyDates(false)}>ยกเลิก</SheetBtn>
            <SheetBtn onClick={() => doServiceRequest('request_date_change', 'ส่งคำขอเปลี่ยนวันแล้ว')}
              disabled={actionLoading || !modifyDates.checkIn || !modifyDates.checkOut}>
              {actionLoading ? 'กำลังส่ง...' : 'ส่งคำขอ'}
            </SheetBtn>
          </div>
        </Sheet>
      )}

      {/* Review */}
      {showReview && (
        <Sheet title={`รีวิว ${selected?.hotels?.name}`} onClose={() => setShowReview(false)}>
          <div className="space-y-4 mb-5">
            {([
              { key: 'rating', label: 'ภาพรวม' },
              { key: 'clean', label: 'ความสะอาด' },
              { key: 'service', label: 'บริการ' },
              { key: 'location', label: 'ทำเล' },
              { key: 'value', label: 'ความคุ้มค่า' },
            ] as const).map(({ key, label }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{label}</span>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} type="button"
                      onClick={() => setReview(p => ({ ...p, [key]: n }))}
                      className={cn(
                        'h-7 w-7 rounded-full text-xs font-bold transition-all',
                        (review as any)[key] >= n
                          ? 'bg-amber-500 dark:bg-amber-400 text-white scale-110'
                          : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                      )}>
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <SheetInput label="หัวข้อรีวิว (ไม่บังคับ)" value={review.title} onChange={v => setReview(p => ({ ...p, title: v }))} placeholder="สรุปประสบการณ์ของคุณ" />
            <SheetTextarea label="แชร์ประสบการณ์" value={review.comment} onChange={v => setReview(p => ({ ...p, comment: v }))}
              placeholder="บอกเล่าประสบการณ์การพักของคุณ..." rows={4} />
          </div>
          <div className="flex gap-3">
            <SheetBtn outline onClick={() => setShowReview(false)}>ยกเลิก</SheetBtn>
            <SheetBtn onClick={doReview} disabled={actionLoading}>
              {actionLoading ? 'กำลังส่ง...' : '⭐ ส่งรีวิว'}
            </SheetBtn>
          </div>
        </Sheet>
      )}

    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BookingDetail({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <Icon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-xs font-semibold text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, danger, iconColor }: {
  icon: any; label: string; onClick?: () => void; danger?: boolean; iconColor?: string;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        'flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors',
        danger
          ? 'border border-destructive/30 text-destructive hover:bg-destructive/10'
          : 'border border-border hover:bg-secondary text-foreground',
      )}
    >
      <Icon className={cn('h-3.5 w-3.5', iconColor || (danger ? 'text-destructive' : 'text-muted-foreground'))} />
      {label}
    </button>
  );
}

function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 32 }}
          className="relative w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-2xl border border-border shadow-2xl"
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h3 className="font-display font-semibold text-foreground">{title}</h3>
            <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-5 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function SheetBtn({ children, onClick, outline, danger, disabled }: {
  children: React.ReactNode; onClick?: () => void; outline?: boolean; danger?: boolean; disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50',
        outline && 'border border-border bg-transparent text-foreground hover:bg-secondary',
        danger && 'bg-destructive text-destructive-foreground hover:opacity-90',
        !outline && !danger && 'bg-amber-600 dark:bg-amber-500 text-white hover:opacity-90',
      )}
    >
      {children}
    </button>
  );
}

function SheetInput({ label, value, onChange, type = 'text', placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-secondary border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all" />
    </div>
  );
}

function SheetTextarea({ label, value, onChange, placeholder, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2.5 bg-secondary border border-input rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 transition-all" />
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn('font-medium text-foreground', valueClass)}>{value}</span>
    </div>
  );
}
