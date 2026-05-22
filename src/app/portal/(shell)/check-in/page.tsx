'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Search, CheckCircle2, ClipboardCheck, Clock, MessageSquare,
  BedDouble, CalendarDays, Loader2, QrCode, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';

type Step = 'verify' | 'details' | 'success';

const ARRIVAL_TIMES = [
  '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
];

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

export default function OnlineCheckInPage() {
  const supabase = createClient();

  const [step, setStep] = useState<Step>('verify');
  const [loading, setLoading] = useState(false);

  const [code, setCode]     = useState('');
  const [booking, setBooking] = useState<any>(null);

  const [arrival, setArrival]   = useState('14:00');
  const [requests, setRequests] = useState('');
  const [idType, setIdType]     = useState<'passport' | 'id_card'>('id_card');
  const [idNumber, setIdNumber] = useState('');
  const [idError, setIdError]   = useState('');

  function validateId(value: string, type: 'id_card' | 'passport'): string {
    if (!value.trim()) return '';
    if (type === 'id_card') {
      if (!/^\d+$/.test(value)) return 'เลขบัตรประชาชนต้องเป็นตัวเลขเท่านั้น';
      if (value.length !== 13)  return `เลขบัตรประชาชนต้องมี 13 หลัก (ตอนนี้ ${value.length} หลัก)`;
    } else {
      if (!/^[A-Z0-9]+$/i.test(value)) return 'เลขหนังสือเดินทางต้องเป็นตัวอักษรหรือตัวเลขเท่านั้น';
      if (value.length < 6 || value.length > 9) return `ควรมี 6–9 ตัวอักษร (ตอนนี้ ${value.length} ตัว)`;
    }
    return '';
  }

  function handleIdChange(value: string) {
    setIdNumber(value);
    setIdError(validateId(value, idType));
  }

  function handleIdTypeChange(t: 'id_card' | 'passport') {
    setIdType(t);
    setIdError(validateId(idNumber, t));
  }

  async function verifyBooking() {
    if (!code.trim()) {
      toast.error('กรุณากรอกเลขที่การจอง');
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error('กรุณาเข้าสู่ระบบก่อน'); return; }

      const { data, error } = await supabase
        .from('reservations')
        .select(`
          id, reservation_code, check_in, check_out, status,
          hotels ( name, city ),
          room_types ( name ),
          rooms ( room_number )
        `)
        .eq('reservation_code', code.trim().toUpperCase())
        .eq('guest_account_id', user.id)
        .single();

      if (error || !data) {
        toast.error('ไม่พบข้อมูลการจอง กรุณาตรวจสอบเลขที่การจอง');
        return;
      }
      if (data.status === 'cancelled') { toast.error('การจองนี้ถูกยกเลิกแล้ว'); return; }
      if (data.status === 'checked_out') { toast.error('การจองนี้ Check-out แล้ว'); return; }

      setBooking(data);
      setStep('details');
    } finally {
      setLoading(false);
    }
  }

  async function submitCheckIn() {
    if (!booking) return;
    const err = validateId(idNumber, idType);
    if (err) { setIdError(err); toast.error(err); return; }
    setLoading(true);
    try {
      const { error } = await supabase
        .from('reservations')
        .update({
          estimated_arrival:  arrival || null,
          special_requests:   requests || null,
          id_type:            idType,
          id_number:          idNumber || null,
          online_checkin_at:  new Date().toISOString(),
        })
        .eq('id', booking.id);

      if (error) { toast.error('ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่'); return; }
      setStep('success');
    } finally {
      setLoading(false);
    }
  }

  const hotel    = booking?.hotels as any;
  const roomType = booking?.room_types as any;
  const room     = booking?.rooms as any;

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/90 dark:bg-background/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <Link href="/portal/stay"
            className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="font-display font-bold text-foreground">Online Check-in</p>
            <p className="text-[10px] text-muted-foreground">เช็กอินออนไลน์ ไม่ต้องรอคิว</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 pb-24 max-w-screen-sm mx-auto">
        {/* Step indicator */}
        {step !== 'success' && (
          <div className="flex items-center gap-2 mb-6">
            {(['verify', 'details'] as const).map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={cn(
                  'h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                  step === s
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : step === 'details' && s === 'verify'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground',
                )}>
                  {step === 'details' && s === 'verify' ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={cn('text-xs font-medium hidden sm:block',
                  step === s ? 'text-foreground' : 'text-muted-foreground')}>
                  {s === 'verify' ? 'ยืนยันการจอง' : 'ข้อมูลเพิ่มเติม'}
                </span>
                {i === 0 && <div className="flex-1 h-px w-8 bg-border mx-1" />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">

          {/* ── Step 1: Verify ── */}
          {step === 'verify' && (
            <motion.div key="verify" {...fadeUp} className="space-y-4">
              <div className="bg-blue-500/8 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                <ClipboardCheck className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    เช็กอินออนไลน์ได้ตั้งแต่ 24 ชม. ก่อนวันเข้าพัก
                  </p>
                  <p className="text-xs text-blue-700/70 dark:text-blue-400/70 mt-0.5">
                    กรอกเลขที่การจองเพื่อเริ่มต้น Online Check-in
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-card border border-gray-100 dark:border-border/60 rounded-2xl p-5 space-y-4 shadow-sm">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    เลขที่การจอง
                  </label>
                  <input
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && verifyBooking()}
                    placeholder="เช่น MT-123456"
                    className="w-full px-4 py-3 bg-white dark:bg-background border border-gray-200 dark:border-input rounded-xl text-sm
                      font-mono tracking-wider placeholder:text-muted-foreground/40 placeholder:font-sans placeholder:tracking-normal
                      focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  />
                </div>

                <button
                  onClick={verifyBooking}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 dark:bg-blue-500
                    text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />กำลังค้นหา...</>
                    : <><Search className="h-4 w-4" />ค้นหาการจอง</>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Details ── */}
          {step === 'details' && booking && (
            <motion.div key="details" {...fadeUp} className="space-y-4">
              {/* Booking card */}
              <div className="bg-white dark:bg-card border border-gray-100 dark:border-border/60 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/5 border-b border-border/40 px-5 py-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{hotel?.name || 'โรงแรม'}</p>
                      {hotel?.city && <p className="text-xs text-muted-foreground mt-0.5">{hotel.city}</p>}
                    </div>
                    <span className="text-xs bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-full font-medium">
                      ยืนยันแล้ว
                    </span>
                  </div>
                </div>
                <div className="px-5 py-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">เช็กอิน</p>
                      <p className="font-medium text-xs">{format(parseISO(booking.check_in), 'd MMM yyyy', { locale: th })}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">เช็กเอาท์</p>
                      <p className="font-medium text-xs">{format(parseISO(booking.check_out), 'd MMM yyyy', { locale: th })}</p>
                    </div>
                  </div>
                </div>
                {(roomType || room) && (
                  <div className="px-5 pb-4 flex items-center gap-2">
                    <BedDouble className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {roomType?.name || (room?.room_number ? `ห้อง ${room.room_number}` : 'ยังไม่กำหนด')}
                    </span>
                  </div>
                )}
              </div>

              {/* Arrival time */}
              <div className="bg-white dark:bg-card border border-gray-100 dark:border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  เวลาเดินทางถึงโดยประมาณ
                </h3>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {ARRIVAL_TIMES.map(t => (
                    <button key={t} onClick={() => setArrival(t)}
                      className={cn(
                        'py-2 rounded-xl text-xs font-medium transition-all border',
                        arrival === t
                          ? 'bg-blue-600 dark:bg-blue-500 text-white border-transparent'
                          : 'bg-white dark:bg-background border-gray-200 dark:border-input text-foreground hover:border-blue-500/50',
                      )}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* ID */}
              <div className="bg-white dark:bg-card border border-gray-100 dark:border-border/60 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-sm font-semibold text-foreground">เอกสารประจำตัว</h3>
                <div className="flex gap-2">
                  {(['id_card', 'passport'] as const).map(t => (
                    <button key={t} onClick={() => handleIdTypeChange(t)}
                      className={cn(
                        'flex-1 py-2.5 rounded-xl text-xs font-medium border transition-all',
                        idType === t
                          ? 'bg-blue-600 dark:bg-blue-500 text-white border-transparent'
                          : 'bg-white dark:bg-background border-gray-200 dark:border-input text-muted-foreground hover:text-foreground',
                      )}>
                      {t === 'id_card' ? 'บัตรประชาชน' : 'หนังสือเดินทาง'}
                    </button>
                  ))}
                </div>
                <div>
                  <input
                    value={idNumber}
                    onChange={e => handleIdChange(e.target.value)}
                    placeholder={idType === 'id_card' ? 'เลขบัตรประชาชน 13 หลัก' : 'เลขหนังสือเดินทาง'}
                    maxLength={idType === 'id_card' ? 13 : 9}
                    className={cn(
                      'w-full px-4 py-3 bg-white dark:bg-background rounded-xl text-sm transition-all',
                      'font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:text-muted-foreground/40',
                      'focus:outline-none focus:ring-2 focus:border-blue-500/50',
                      idError
                        ? 'border-2 border-red-400 focus:ring-red-400/30'
                        : 'border border-gray-200 dark:border-input focus:ring-blue-500/30',
                    )}
                  />
                  <AnimatePresence>
                    {idError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-1.5 text-xs text-red-500 font-medium px-1">
                        {idError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Special requests */}
              <div className="bg-white dark:bg-card border border-gray-100 dark:border-border/60 rounded-2xl p-5 shadow-sm space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  คำขอพิเศษ <span className="text-xs font-normal text-muted-foreground">(ไม่บังคับ)</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {['ห้องชั้นสูง', 'เตียงเสริม', 'ห้องเงียบ', 'วันครบรอบ'].map(r => (
                    <button key={r}
                      onClick={() => setRequests(p => p ? `${p}, ${r}` : r)}
                      className="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 border border-border/60 rounded-full text-foreground transition-colors">
                      + {r}
                    </button>
                  ))}
                </div>
                <textarea
                  value={requests}
                  onChange={e => setRequests(e.target.value)}
                  rows={3}
                  placeholder="ระบุความต้องการเพิ่มเติม..."
                  className="w-full px-4 py-3 bg-white dark:bg-background border border-gray-200 dark:border-input rounded-xl text-sm resize-none
                    placeholder:text-muted-foreground/40
                    focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('verify')}
                  className="flex items-center gap-1.5 px-4 py-3 border border-border/60 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                  <ArrowLeft className="h-4 w-4" /> ย้อนกลับ
                </button>
                <button
                  onClick={submitCheckIn}
                  disabled={loading || !!idError}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 dark:bg-blue-500
                    text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {loading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />กำลังส่ง...</>
                    : <>ยืนยัน Online Check-in <ChevronRight className="h-4 w-4" /></>}
                </button>
              </div>
            </motion.div>
          )}

          {/* ── Step 3: Success ── */}
          {step === 'success' && (
            <motion.div key="success" {...fadeUp} className="text-center space-y-6">
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="h-20 w-20 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Check-in สำเร็จแล้ว!</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    โรงแรมได้รับข้อมูลของคุณแล้ว — พบกันวันเช็กอิน
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-card border border-gray-100 dark:border-border/60 rounded-2xl overflow-hidden text-left shadow-sm">
                <div className="bg-gradient-to-r from-blue-600/10 to-blue-500/5 border-b border-border/40 px-5 py-4">
                  <p className="font-semibold text-foreground">{hotel?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {booking && format(parseISO(booking.check_in), 'd MMM', { locale: th })} —{' '}
                    {booking && format(parseISO(booking.check_out), 'd MMM yyyy', { locale: th })}
                  </p>
                </div>
                <div className="px-5 py-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" /> เวลาเดินทางถึง
                    </span>
                    <span className="font-medium">ประมาณ {arrival} น.</span>
                  </div>
                  {requests && (
                    <div className="flex items-start justify-between gap-4">
                      <span className="text-muted-foreground flex items-center gap-2 shrink-0">
                        <MessageSquare className="h-3.5 w-3.5" /> คำขอพิเศษ
                      </span>
                      <span className="font-medium text-right text-xs">{requests}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <QrCode className="h-3.5 w-3.5" /> รหัสการจอง
                    </span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {booking?.reservation_code}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-muted/50 border border-dashed border-border/60 rounded-2xl p-8 flex flex-col items-center gap-3">
                <QrCode className="h-16 w-16 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">QR Code สำหรับเช็กอินที่เคาน์เตอร์จะส่งทางอีเมลก่อนวันเข้าพัก</p>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/portal/trips"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 dark:bg-blue-500
                    text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity">
                  ดูการจองของฉัน <ChevronRight className="h-4 w-4" />
                </Link>
                <Link href="/portal/services"
                  className="w-full flex items-center justify-center gap-2 py-3 border border-border/60 rounded-xl
                    text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all">
                  สั่งบริการล่วงหน้า
                </Link>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
