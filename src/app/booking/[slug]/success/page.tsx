export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { CheckCircle, Calendar, Bed, Users, MapPin, Download, QrCode, ArrowLeft, Share2 } from 'lucide-react';

export default async function BookingSuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { slug } = await params;
  const { code } = await searchParams;

  let reservation: any = null;
  if (code) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('reservations')
        .select(`
          id, reservation_code, check_in, check_out, nights,
          total_amount, status, adults, children, special_requests,
          hotels(id, name, slug, city, hero_image_url, check_in_time, check_out_time, phone, email),
          room_types(name, base_rate)
        `)
        .eq('reservation_code', code)
        .single();
      reservation = data;
    } catch {}
  }

  const hotel = reservation?.hotels as any;
  const rt    = reservation?.room_types as any;
  const nights = reservation?.nights ?? 1;

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* Nav */}
      <nav className="bg-white border-b border-black/5 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="font-serif text-xl font-medium text-[#2A2522]">🪷 Maitri</Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 border-4 border-emerald-100 mb-5">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-[#2A2522] mb-1">การจองสำเร็จ!</h1>
          <p className="text-[#2A2522]/50 text-sm">ระบบได้ส่งอีเมลยืนยันไปที่กล่องจดหมายของคุณแล้ว</p>
        </div>

        {/* Booking code card */}
        <div className="bg-[#2A2522] rounded-2xl p-6 mb-5 text-center">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-2">รหัสการจอง</p>
          <p className="text-white font-mono text-3xl font-bold tracking-widest">{code || '—'}</p>
          <p className="text-white/40 text-xs mt-2">แสดงรหัสนี้เมื่อถึงโรงแรม</p>
        </div>

        {/* Hotel details */}
        {hotel && (
          <div className="bg-white rounded-2xl border border-black/5 overflow-hidden mb-5">
            {hotel.hero_image_url && (
              <div className="relative h-40 overflow-hidden">
                <img src={hotel.hero_image_url} alt={hotel.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-5 text-white">
                  <p className="font-bold text-lg">{hotel.name}</p>
                  {hotel.city && (
                    <p className="text-white/70 text-xs flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3" />{hotel.city}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-[#2A2522]/40 mb-1">เช็คอิน</p>
                <p className="font-semibold text-[#2A2522] text-sm">
                  {reservation?.check_in
                    ? format(parseISO(reservation.check_in + 'T00:00:00'), 'EEE d MMM yyyy', { locale: th })
                    : '—'}
                </p>
                {hotel.check_in_time && (
                  <p className="text-xs text-[#2A2522]/40 mt-0.5">ตั้งแต่ {hotel.check_in_time}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-[#2A2522]/40 mb-1">เช็คเอาท์</p>
                <p className="font-semibold text-[#2A2522] text-sm">
                  {reservation?.check_out
                    ? format(parseISO(reservation.check_out + 'T00:00:00'), 'EEE d MMM yyyy', { locale: th })
                    : '—'}
                </p>
                {hotel.check_out_time && (
                  <p className="text-xs text-[#2A2522]/40 mt-0.5">ก่อน {hotel.check_out_time}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-[#2A2522]/40 mb-1">ประเภทห้อง</p>
                <p className="font-semibold text-[#2A2522] text-sm">{rt?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-[#2A2522]/40 mb-1">จำนวน</p>
                <p className="font-semibold text-[#2A2522] text-sm">
                  {nights} คืน · {reservation?.adults || 1} ผู้ใหญ่
                  {reservation?.children ? ` · ${reservation.children} เด็ก` : ''}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="mx-5 mb-5 p-4 bg-[#FAF7F2] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-[#2A2522]/40 mb-0.5">ยอดรวม</p>
                <p className="text-xl font-bold text-[#2A2522]">
                  {reservation?.total_amount ? formatCurrency(reservation.total_amount) : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#2A2522]/40 mb-0.5">สถานะ</p>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
                  ยืนยันแล้ว ✓
                </span>
              </div>
            </div>

            {/* Special requests */}
            {reservation?.special_requests && (
              <div className="mx-5 mb-5 p-3 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-800">
                <span className="font-semibold">คำขอพิเศษ: </span>{reservation.special_requests}
              </div>
            )}

            {/* Hotel contact */}
            {(hotel.phone || hotel.email) && (
              <div className="mx-5 mb-5 p-3 border border-black/5 rounded-xl text-xs text-[#2A2522]/60">
                <p className="font-semibold text-[#2A2522] mb-1">ติดต่อโรงแรม</p>
                {hotel.phone && <p>📞 {hotel.phone}</p>}
                {hotel.email && <p>✉️ {hotel.email}</p>}
              </div>
            )}
          </div>
        )}

        {/* Trust strip */}
        <div className="grid grid-cols-3 gap-3 mb-6 text-center">
          {[
            { icon: '🔒', label: 'ชำระเงินปลอดภัย' },
            { icon: '✓', label: 'ยืนยันทันที' },
            { icon: '📧', label: 'อีเมลยืนยัน' },
          ].map(t => (
            <div key={t.label} className="bg-white border border-black/5 rounded-xl py-3 px-2">
              <div className="text-xl mb-1">{t.icon}</div>
              <p className="text-2xs text-[#2A2522]/60">{t.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/portal/bookings"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#C66A30] hover:bg-[#A4522A] text-white rounded-xl text-sm font-bold transition-colors">
            ดูการจองของฉัน
          </Link>
          {code && (
            <Link href={`/portal/bookings/qr?code=${code}`}
              className="flex items-center justify-center gap-2 w-full py-3 border border-black/10 bg-white rounded-xl text-sm font-medium text-[#2A2522] hover:bg-[#FAF7F2] transition-colors">
              <QrCode className="h-4 w-4" /> แสดง QR Code เช็คอิน
            </Link>
          )}
          {reservation?.id && (
            <a href={`/api/guest/bookings/${reservation.id}/receipt`} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 border border-black/10 bg-white rounded-xl text-sm font-medium text-[#2A2522] hover:bg-[#FAF7F2] transition-colors">
              <Download className="h-4 w-4" /> ดาวน์โหลดใบยืนยัน
            </a>
          )}
          <Link href={`/h/${slug}`}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm text-[#2A2522]/50 hover:text-[#2A2522] transition-colors">
            <ArrowLeft className="h-4 w-4" /> กลับไปหน้าที่พัก
          </Link>
        </div>
      </main>
    </div>
  );
}
