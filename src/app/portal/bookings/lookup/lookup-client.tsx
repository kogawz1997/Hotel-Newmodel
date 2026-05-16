'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { Search, Calendar, User, MapPin, Phone, Mail, ArrowLeft, LogIn } from 'lucide-react';

const STATUS: Record<string, { label: string; color: string }> = {
  confirmed:    { label: 'ยืนยันแล้ว',   color: 'bg-sky-100 text-sky-700' },
  checked_in:   { label: 'เช็คอินแล้ว',  color: 'bg-emerald-100 text-emerald-700' },
  checked_out:  { label: 'เช็คเอาท์แล้ว', color: 'bg-gray-100 text-gray-600' },
  cancelled:    { label: 'ยกเลิกแล้ว',   color: 'bg-red-100 text-red-600' },
  pending:      { label: 'รอยืนยัน',     color: 'bg-amber-100 text-amber-700' },
  pending_payment: { label: 'รอชำระเงิน', color: 'bg-orange-100 text-orange-700' },
  no_show:      { label: 'ไม่มาตามนัด',  color: 'bg-red-100 text-red-600' },
};

export function LookupClient() {
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reservation, setReservation] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !email.trim()) return;
    setLoading(true);
    setError('');
    setReservation(null);

    try {
      const res = await fetch('/api/public/booking-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาด');
      } else {
        setReservation(data.reservation);
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
    } finally {
      setLoading(false);
    }
  }

  const hotel = reservation?.hotels as any;
  const guest = reservation?.guests as any;
  const roomType = reservation?.room_types as any;
  const st = reservation ? (STATUS[reservation.status] || STATUS.confirmed) : null;

  const nights = reservation
    ? Math.max(1, Math.round((new Date(reservation.check_out).getTime() - new Date(reservation.check_in).getTime()) / 86400000))
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <div className="max-w-xl mx-auto px-4 py-12">
        <div className="mb-8 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-stone-900 text-white mb-4">
            <Search className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">ตรวจสอบการจอง</h1>
          <p className="mt-1 text-sm text-stone-500">กรอกรหัสการจองและอีเมลที่ใช้สมัคร</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">รหัสการจอง</label>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="เช่น RES-ABCD1234"
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm font-mono uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-stone-900"
              required
              autoComplete="off"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">อีเมลที่ใช้จอง</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full rounded-xl border border-stone-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !code.trim() || !email.trim()}
            className="w-full rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {loading ? 'กำลังค้นหา…' : 'ค้นหาการจอง'}
          </button>
        </form>

        {reservation && (
          <div className="mt-6 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="bg-stone-900 text-white px-6 py-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-stone-400 mb-0.5">รหัสการจอง</p>
                <p className="font-mono font-bold text-lg tracking-wider">{reservation.reservation_code}</p>
              </div>
              {st && (
                <span className={`mt-1 text-xs font-medium px-2.5 py-1 rounded-full ${st.color} bg-opacity-20`}>
                  {st.label}
                </span>
              )}
            </div>

            <div className="p-6 space-y-5">
              {hotel && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{hotel.name}</p>
                    {hotel.address && <p className="text-xs text-stone-500 mt-0.5">{hotel.address}</p>}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-stone-50 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
                    <Calendar className="h-3.5 w-3.5" /> เช็คอิน
                  </div>
                  <p className="font-medium text-sm">
                    {format(parseISO(reservation.check_in), 'd MMM yyyy', { locale: th })}
                  </p>
                  {hotel?.check_in_time && <p className="text-xs text-stone-500">หลัง {hotel.check_in_time}</p>}
                </div>
                <div className="rounded-xl bg-stone-50 p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
                    <Calendar className="h-3.5 w-3.5" /> เช็คเอาท์
                  </div>
                  <p className="font-medium text-sm">
                    {format(parseISO(reservation.check_out), 'd MMM yyyy', { locale: th })}
                  </p>
                  {hotel?.check_out_time && <p className="text-xs text-stone-500">ก่อน {hotel.check_out_time}</p>}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl bg-stone-50 p-3 text-center">
                  <p className="text-xs text-stone-500 mb-0.5">คืน</p>
                  <p className="font-semibold">{nights}</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3 text-center">
                  <p className="text-xs text-stone-500 mb-0.5">ผู้ใหญ่</p>
                  <p className="font-semibold">{reservation.num_adults}</p>
                </div>
                <div className="rounded-xl bg-stone-50 p-3 text-center">
                  <p className="text-xs text-stone-500 mb-0.5">เด็ก</p>
                  <p className="font-semibold">{reservation.num_children || 0}</p>
                </div>
              </div>

              {roomType && (
                <div className="rounded-xl border border-stone-200 p-3.5">
                  <p className="text-xs text-stone-500 mb-0.5">ประเภทห้อง</p>
                  <p className="font-medium text-sm">{roomType.name}</p>
                </div>
              )}

              {reservation.special_requests && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
                  <p className="text-xs text-amber-600 mb-0.5">ความต้องการพิเศษ</p>
                  <p className="text-sm">{reservation.special_requests}</p>
                </div>
              )}

              {guest && (
                <div className="border-t border-stone-100 pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-stone-400" />
                    <span>{guest.first_name} {guest.last_name}</span>
                  </div>
                  {hotel?.phone && (
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Phone className="h-4 w-4 text-stone-400" />
                      <a href={`tel:${hotel.phone}`} className="hover:underline">{hotel.phone}</a>
                    </div>
                  )}
                  {hotel?.email && (
                    <div className="flex items-center gap-2 text-sm text-stone-500">
                      <Mail className="h-4 w-4 text-stone-400" />
                      <a href={`mailto:${hotel.email}`} className="hover:underline">{hotel.email}</a>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-stone-100 pt-4 flex items-center justify-between">
                <p className="text-sm text-stone-500">ยอดรวม</p>
                <p className="font-semibold text-lg">
                  {formatCurrency(reservation.total_amount, hotel?.currency || 'THB')}
                </p>
              </div>

              {['confirmed', 'pending', 'pending_payment'].includes(reservation.status) && (
                <div className="pt-2">
                  <Link
                    href={`/portal/login?next=/portal/bookings`}
                    className="flex items-center justify-center gap-2 w-full rounded-xl bg-stone-900 text-white py-2.5 text-sm font-medium hover:bg-stone-800 transition-colors"
                  >
                    <LogIn className="h-4 w-4" />
                    เข้าสู่ระบบเพื่อจัดการการจอง
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/portal/bookings" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-700">
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าการจองของฉัน
          </Link>
        </div>
      </div>
    </div>
  );
}
