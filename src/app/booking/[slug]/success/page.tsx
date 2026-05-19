export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { createAdminClient } from '@/lib/supabase/server';
import { formatCurrency } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { CheckCircle, MapPin, Download, QrCode, ArrowLeft } from 'lucide-react';

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

  const hotel  = reservation?.hotels as any;
  const rt     = reservation?.room_types as any;
  const nights = reservation?.nights ?? 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span className="font-display text-sm font-bold text-amber-700 dark:text-amber-400">M</span>
            </div>
            <span className="font-semibold text-foreground text-sm">Maitri Collection</span>
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-10">

        {/* Success header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border-4 border-emerald-100 dark:border-emerald-800 mb-5">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">การจองสำเร็จ!</h1>
          <p className="text-muted-foreground text-sm">ระบบได้ส่งอีเมลยืนยันไปที่กล่องจดหมายของคุณแล้ว</p>
        </div>

        {/* Booking code card */}
        <div className="bg-[#2A2522] rounded-2xl p-6 mb-5 text-center">
          <p className="text-white/50 text-xs uppercase tracking-widest mb-2">รหัสการจอง</p>
          <p className="text-white font-mono text-3xl font-bold tracking-widest">{code || '—'}</p>
          <p className="text-white/40 text-xs mt-2">แสดงรหัสนี้เมื่อถึงโรงแรม</p>
        </div>

        {/* Hotel details */}
        {hotel && (
          <div className="bg-card rounded-2xl border border-border overflow-hidden mb-5">
            {hotel.hero_image_url && (
              <div className="relative h-40 overflow-hidden">
                <Image src={hotel.hero_image_url} alt={hotel.name} fill className="object-cover" />
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
                <p className="text-xs text-muted-foreground mb-1">เช็คอิน</p>
                <p className="font-semibold text-foreground text-sm">
                  {reservation?.check_in
                    ? format(parseISO(reservation.check_in + 'T00:00:00'), 'EEE d MMM yyyy', { locale: th })
                    : '—'}
                </p>
                {hotel.check_in_time && (
                  <p className="text-xs text-muted-foreground mt-0.5">ตั้งแต่ {hotel.check_in_time}</p>
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">เช็คเอาท์</p>
                <p className="font-semibold text-foreground text-sm">
                  {reservation?.check_out
                    ? format(parseISO(reservation.check_out + 'T00:00:00'), 'EEE d MMM yyyy', { locale: th })
                    : '—'}
                </p>
                {hotel.check_out_time && (
                  <p className="text-xs text-muted-foreground mt-0.5">ก่อน {hotel.check_out_time}</p>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">ประเภทห้อง</p>
                <p className="font-semibold text-foreground text-sm">{rt?.name || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">จำนวน</p>
                <p className="font-semibold text-foreground text-sm">
                  {nights} คืน · {reservation?.adults || 1} ผู้ใหญ่
                  {reservation?.children ? ` · ${reservation.children} เด็ก` : ''}
                </p>
              </div>
            </div>

            {/* Total */}
            <div className="mx-5 mb-5 p-4 bg-muted/30 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">ยอดรวม</p>
                <p className="text-xl font-bold text-foreground">
                  {reservation?.total_amount ? formatCurrency(reservation.total_amount) : '—'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground mb-0.5">สถานะ</p>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full font-medium">
                  ยืนยันแล้ว ✓
                </span>
              </div>
            </div>

            {/* Special requests */}
            {reservation?.special_requests && (
              <div className="mx-5 mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg text-xs text-blue-800 dark:text-blue-300">
                <span className="font-semibold">คำขอพิเศษ: </span>{reservation.special_requests}
              </div>
            )}

            {/* Hotel contact */}
            {(hotel.phone || hotel.email) && (
              <div className="mx-5 mb-5 p-3 border border-border rounded-xl text-xs text-muted-foreground">
                <p className="font-semibold text-foreground mb-1">ติดต่อโรงแรม</p>
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
            <div key={t.label} className="bg-card border border-border rounded-xl py-3 px-2">
              <div className="text-xl mb-1">{t.icon}</div>
              <p className="text-2xs text-muted-foreground">{t.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/portal/trips"
            className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-sm font-bold transition-colors">
            ดูการจองของฉัน
          </Link>
          {code && (
            <Link href={`/portal/bookings/qr?code=${code}`}
              className="flex items-center justify-center gap-2 w-full py-3 border border-border bg-card rounded-xl text-sm font-medium text-foreground hover:bg-muted/30 transition-colors">
              <QrCode className="h-4 w-4" /> แสดง QR Code เช็คอิน
            </Link>
          )}
          {reservation?.id && (
            <a href={`/api/guest/bookings/${reservation.id}/receipt`} target="_blank" rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 border border-border bg-card rounded-xl text-sm font-medium text-foreground hover:bg-muted/30 transition-colors">
              <Download className="h-4 w-4" /> ดาวน์โหลดใบยืนยัน
            </a>
          )}
          <Link href={`/h/${slug}`}
            className="flex items-center justify-center gap-2 w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" /> กลับไปหน้าที่พัก
          </Link>
        </div>
      </main>
    </div>
  );
}
