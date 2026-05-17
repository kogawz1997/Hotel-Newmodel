'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Receipt, Loader2, AlertCircle, Calendar, BedDouble } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

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
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/portal" className="p-2 rounded-lg hover:bg-muted transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="font-semibold">ใบบัญชี (Folio)</h1>
            <p className="text-xs text-muted-foreground">รายละเอียดค่าใช้จ่ายระหว่างเข้าพัก</p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {!loading && !error && !reservation && (
          <EmptyState
            icon={Receipt}
            title="ไม่พบการเข้าพักที่ active"
            description="ใบบัญชีจะแสดงเมื่อคุณ Check-in แล้ว"
            action={<Link href="/portal/bookings" className="text-sm text-primary hover:underline">ดูการจองของฉัน</Link>}
          />
        )}

        {!loading && reservation && (
          <div className="space-y-4">
            {/* Reservation summary */}
            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-2">
              {hotel && <p className="font-semibold text-sm">{hotel.name}</p>}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <BedDouble className="h-3.5 w-3.5" />
                <span>{roomType?.name || 'ห้องพัก'}{room ? ` · ห้อง ${room.room_number}` : ''}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {format(parseISO(reservation.check_in), 'd MMM', { locale: th })} →{' '}
                  {format(parseISO(reservation.check_out), 'd MMM yyyy', { locale: th })}
                </span>
              </div>
            </div>

            {/* Charges */}
            <div className="rounded-xl border border-border overflow-hidden">
              <div className="bg-muted/30 px-4 py-2.5 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground">รายการค่าใช้จ่าย</p>
              </div>

              {/* Room charge row */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div>
                  <p className="text-sm">{roomType?.name || 'ค่าห้องพัก'}</p>
                  <p className="text-xs text-muted-foreground">ค่าห้องพัก</p>
                </div>
                <p className="text-sm font-medium">{formatCurrency(reservation.room_charge, currency)}</p>
              </div>

              {/* Folio items */}
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0">
                  <div>
                    <p className="text-sm">{item.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">{ITEM_TYPE_LABELS[item.item_type] || item.item_type}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(item.created_at), 'd MMM HH:mm', { locale: th })}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm font-medium">{formatCurrency(item.amount, currency)}</p>
                </div>
              ))}

              {items.length === 0 && (
                <div className="px-4 py-3 text-xs text-muted-foreground">
                  ยังไม่มีค่าใช้จ่ายเพิ่มเติม
                </div>
              )}
            </div>

            {/* Totals */}
            <div className="rounded-xl border border-border divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3 text-sm text-muted-foreground">
                <span>ชำระแล้ว</span>
                <span>{formatCurrency(reservation.paid_amount, currency)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <p className="font-semibold">ยอดค้างชำระ</p>
                <p className={`text-lg font-bold ${reservation.outstanding > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  {formatCurrency(reservation.outstanding, currency)}
                </p>
              </div>
            </div>

            {reservation.outstanding > 0 ? (
              <Link href="/portal/folio/express-checkout"
                className="block w-full rounded-xl bg-primary text-primary-foreground text-center py-3 text-sm font-semibold hover:opacity-90 transition-opacity">
                Express Check-out
              </Link>
            ) : (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-700 text-center font-medium">
                ชำระครบแล้ว — ขอบคุณที่ใช้บริการ 🙏
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              ยอดนี้อาจยังไม่รวมค่าใช้จ่ายล่าสุด — ยอดสุดท้ายคำนวณ ณ วันเช็คเอาท์
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
