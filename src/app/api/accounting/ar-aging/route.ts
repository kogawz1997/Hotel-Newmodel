/**
 * GET /api/accounting/ar-aging?hotelId=&asOf=YYYY-MM-DD
 * Accounts Receivable Aging Report.
 * Buckets open folios + unpaid invoices by days overdue:
 *   Current (not yet due), 1-30, 31-60, 61-90, 90+
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

type Bucket = 'current' | '1_30' | '31_60' | '61_90' | 'over_90';

function getBucket(daysOverdue: number): Bucket {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1_30';
  if (daysOverdue <= 60) return '31_60';
  if (daysOverdue <= 90) return '61_90';
  return 'over_90';
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  const asOf    = searchParams.get('asOf') ?? new Date().toISOString().split('T')[0];

  const ctx = await requireHotelAccess(hotelId, [
    'owner', 'admin', 'manager', 'accounting_manager', 'accounting', 'accounting_staff',
  ]);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();
  const asOfDate = new Date(asOf);

  // Open folios with positive balance
  const { data: folios } = await admin
    .from('folios')
    .select('id, reservation_id, balance, created_at, reservations(reservation_code, guests(first_name, last_name, email))')
    .eq('hotel_id', ctx.hotelId)
    .eq('status', 'open')
    .gt('balance', 0)
    .order('created_at', { ascending: true });

  const buckets: Record<Bucket, { count: number; amount: number; items: any[] }> = {
    current:  { count: 0, amount: 0, items: [] },
    '1_30':   { count: 0, amount: 0, items: [] },
    '31_60':  { count: 0, amount: 0, items: [] },
    '61_90':  { count: 0, amount: 0, items: [] },
    over_90:  { count: 0, amount: 0, items: [] },
  };

  for (const folio of folios ?? []) {
    const createdAt   = new Date(folio.created_at);
    const daysOverdue = Math.floor((asOfDate.getTime() - createdAt.getTime()) / 864e5);
    const bucket      = getBucket(daysOverdue);
    const balance     = Number(folio.balance);
    const guest       = (folio.reservations as any)?.guests;
    const guestName   = guest ? `${guest.first_name ?? ''} ${guest.last_name ?? ''}`.trim() : 'ไม่ระบุ';

    buckets[bucket].count  += 1;
    buckets[bucket].amount += balance;
    buckets[bucket].items.push({
      folioId:    folio.id,
      reservationCode: (folio.reservations as any)?.reservation_code ?? '-',
      guestName,
      balance:    +balance.toFixed(2),
      daysOverdue,
      createdAt:  folio.created_at,
    });
  }

  const totalBalance = Object.values(buckets).reduce((s, b) => s + b.amount, 0);
  const totalCount   = Object.values(buckets).reduce((s, b) => s + b.count, 0);

  return NextResponse.json({
    hotel_id:      ctx.hotelId,
    as_of:         asOf,
    total_balance: +totalBalance.toFixed(2),
    total_count:   totalCount,
    buckets: {
      current:  { ...buckets.current,  amount: +buckets.current.amount.toFixed(2),  label: 'ยังไม่ถึงกำหนด' },
      '1_30':   { ...buckets['1_30'],  amount: +buckets['1_30'].amount.toFixed(2),   label: '1-30 วัน' },
      '31_60':  { ...buckets['31_60'], amount: +buckets['31_60'].amount.toFixed(2),  label: '31-60 วัน' },
      '61_90':  { ...buckets['61_90'], amount: +buckets['61_90'].amount.toFixed(2),  label: '61-90 วัน' },
      over_90:  { ...buckets.over_90,  amount: +buckets.over_90.amount.toFixed(2),   label: '90+ วัน' },
    },
  });
}
