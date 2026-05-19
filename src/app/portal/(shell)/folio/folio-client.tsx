'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Receipt, Loader2, AlertCircle, Calendar, BedDouble, CreditCard, CheckCircle2 } from 'lucide-react';

const ITEM_TYPE_LABELS: Record<string, string> = {
  room_charge: 'ค่าห้องพัก',
  food_beverage: 'Food & Beverage',
  spa: 'Spa',
  laundry: 'ซักรีด',
  minibar: 'Minibar',
  phone: 'โทรศัพท์',
  damage: 'ค่าความเสียหาย',
  other: 'อื่นๆ',
};

export function FolioClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/guest/folio')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('โหลดข้อมูลไม่สำเร็จ'); setLoading(false); });
  }, []);

  const reservation = data?.reservation;
  const hotel = reservation?.hotels as any;
  const roomType = reservation?.room_types as any;
  const room = reservation?.rooms as any;
  const items: any[] = reservation?.folio_items || [];
  const currency = hotel?.currency || 'THB';

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/90 dark:bg-background/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <Link href="/portal/stay"
            className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-foreground">ใบบัญชี (Folio)</p>
            <p className="text-[10px] text-muted-foreground">รายละเอียดค่าใช้จ่ายระหว่างเข้าพัก</p>
          </div>
          <Receipt className="h-4 w-4 text-muted-foreground/40" />
        </div>
      </div>

      <div className="px-4 py-5 pb-24 max-w-screen-sm mx-auto">

        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
            <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 rounded-2xl bg-red-500/8 border border-red-500/20 p-4 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && !reservation && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-20 w-20 rounded-full bg-muted/50 border border-dashed border-border flex items-center justify-center mb-5">
              <Receipt className="h-9 w-9 text-muted-foreground/30" />
            </div>
            <h2 className="font-display font-bold text-foreground text-lg mb-2">ไม่พบการเข้าพัก</h2>
            <p className="text-sm text-muted-foreground mb-6">ใบบัญชีจะแสดงเมื่อคุณ Check-in แล้ว</p>
            <Link href="/portal/trips"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              ดูการจองของฉัน
            </Link>
          </div>
        )}

        {!loading && reservation && (
          <div className="space-y-3">
            {/* Reservation summary */}
            <div className="rounded-2xl border border-gray-100 dark:border-border/60 bg-white dark:bg-card p-4 shadow-sm">
              {hotel && (
                <p className="font-display font-bold text-foreground mb-3">{hotel.name}</p>
              )}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <BedDouble className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{roomType?.name || 'ห้องพัก'}{room ? ` · ห้อง ${room.room_number}` : ''}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>
                    {format(parseISO(reservation.check_in), 'd MMM', { locale: th })} →{' '}
                    {format(parseISO(reservation.check_out), 'd MMM yyyy', { locale: th })}
                  </span>
                </div>
              </div>
            </div>

            {/* Charges */}
            <div className="rounded-2xl border border-gray-100 dark:border-border/60 bg-white dark:bg-card overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-border/40">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">รายการค่าใช้จ่าย</p>
              </div>

              {/* Room charge */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/30">
                <div>
                  <p className="text-sm font-medium text-foreground">{roomType?.name || 'ค่าห้องพัก'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">ค่าห้องพัก</p>
                </div>
                <p className="text-sm font-semibold text-foreground">{formatCurrency(reservation.room_charge, currency)}</p>
              </div>

              {/* Folio items */}
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3.5 border-b border-border/30 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">{ITEM_TYPE_LABELS[item.item_type] || item.item_type}</span>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(item.created_at), 'd MMM HH:mm', { locale: th })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-foreground">{formatCurrency(item.amount, currency)}</p>
                </div>
              ))}

              {items.length === 0 && (
                <div className="px-4 py-4 text-xs text-muted-foreground text-center">
                  ยังไม่มีค่าใช้จ่ายเพิ่มเติม
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="rounded-2xl border border-gray-100 dark:border-border/60 bg-white dark:bg-card overflow-hidden shadow-sm divide-y divide-border/30">
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm text-muted-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> ชำระแล้ว
                </span>
                <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(reservation.paid_amount, currency)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-4">
                <p className="font-bold text-foreground">ยอดค้างชำระ</p>
                <p className={`text-lg font-bold ${reservation.outstanding > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                  {formatCurrency(reservation.outstanding, currency)}
                </p>
              </div>
            </div>

            {reservation.outstanding > 0 ? (
              <Link href="/portal/folio/express-checkout"
                className="flex items-center justify-center gap-2 w-full rounded-2xl bg-blue-600 dark:bg-blue-500 text-white py-3.5 text-sm font-bold shadow-sm hover:opacity-90 transition-opacity">
                <CreditCard className="h-4 w-4" />
                Express Check-out
              </Link>
            ) : (
              <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 dark:text-emerald-400 text-center font-semibold">
                ชำระครบแล้ว — ขอบคุณที่ใช้บริการ 🙏
              </div>
            )}

            <p className="text-xs text-muted-foreground/60 text-center pb-2">
              ยอดนี้อาจยังไม่รวมค่าใช้จ่ายล่าสุด — ยอดสุดท้ายคำนวณ ณ วันเช็คเอาท์
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
