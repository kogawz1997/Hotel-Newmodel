import { NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month'); // YYYY-MM

  const ctx = await requireHotelAccess(searchParams.get('hotel_id') || searchParams.get('hotelId'));
  if (ctx.error) return ctx.error;

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: 'month param required (YYYY-MM)' }, { status: 400 });
  }

  const monthStart = `${month}-01T00:00:00.000Z`;
  const [year, mon] = month.split('-').map(Number);
  const nextMonth = mon === 12 ? `${year + 1}-01-01T00:00:00.000Z` : `${year}-${String(mon + 1).padStart(2, '0')}-01T00:00:00.000Z`;

  const { data: payments, error } = await ctx.supabase
    .from('payments')
    .select('amount, payment_method, status')
    .eq('hotel_id', ctx.hotelId)
    .eq('status', 'completed')
    .gte('created_at', monthStart)
    .lt('created_at', nextMonth);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const KNOWN_METHODS = ['card', 'promptpay', 'truemoney', 'shopeepay', 'cash', 'bank_transfer'];

  function normalizeMethod(raw: string): string {
    const m = (raw || '').toLowerCase().replace(/[\s-]/g, '_');
    if (KNOWN_METHODS.includes(m)) return m;
    if (m.includes('card') || m.includes('credit') || m.includes('debit')) return 'card';
    if (m.includes('prompt')) return 'promptpay';
    if (m.includes('true')) return 'truemoney';
    if (m.includes('shopee')) return 'shopeepay';
    if (m.includes('transfer') || m.includes('bank')) return 'bank_transfer';
    return 'card';
  }

  const methodTotals: Record<string, { amount: number; count: number }> = {};
  for (const method of KNOWN_METHODS) methodTotals[method] = { amount: 0, count: 0 };

  for (const p of payments || []) {
    const method = normalizeMethod(p.payment_method || '');
    methodTotals[method].amount += Number(p.amount || 0);
    methodTotals[method].count += 1;
  }

  const total = Object.values(methodTotals).reduce((s, v) => s + v.amount, 0);

  const methods = KNOWN_METHODS.map(method => ({
    method,
    amount: methodTotals[method].amount,
    count: methodTotals[method].count,
    pct: total > 0 ? Math.round((methodTotals[method].amount / total) * 1000) / 10 : 0,
  })).sort((a, b) => b.amount - a.amount);

  return NextResponse.json({ methods, total });
}
