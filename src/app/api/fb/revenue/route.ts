/**
 * GET /api/fb/revenue?hotelId=&from=YYYY-MM-DD&to=YYYY-MM-DD
 * Revenue breakdown by F&B outlet for a date range.
 * Aggregates paid fb_orders.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  const from    = searchParams.get('from') ?? new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0];
  const to      = searchParams.get('to')   ?? new Date().toISOString().split('T')[0];

  const ctx = await requireHotelAccess(hotelId, [
    'owner', 'admin', 'manager', 'fnb_manager', 'revenue_manager', 'accounting_manager',
  ]);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();

  const { data: orders, error } = await admin
    .from('fb_orders')
    .select('outlet_id, subtotal, service_charge, tax, total, payment_method, created_at, fb_outlets(name)')
    .eq('hotel_id', ctx.hotelId)
    .eq('status', 'paid')
    .gte('created_at', from + 'T00:00:00')
    .lte('created_at', to + 'T23:59:59');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Aggregate by outlet
  const byOutlet = new Map<string, {
    outletId:      string;
    outletName:    string;
    orderCount:    number;
    subtotal:      number;
    serviceCharge: number;
    tax:           number;
    total:         number;
    byPayment:     Record<string, number>;
  }>();

  for (const order of orders ?? []) {
    const key  = order.outlet_id ?? '__none__';
    const name = (order.fb_outlets as any)?.name ?? 'ไม่ระบุ Outlet';

    if (!byOutlet.has(key)) {
      byOutlet.set(key, { outletId: key, outletName: name, orderCount: 0, subtotal: 0, serviceCharge: 0, tax: 0, total: 0, byPayment: {} });
    }

    const entry = byOutlet.get(key)!;
    entry.orderCount    += 1;
    entry.subtotal      += Number(order.subtotal || 0);
    entry.serviceCharge += Number(order.service_charge || 0);
    entry.tax           += Number(order.tax || 0);
    entry.total         += Number(order.total || 0);

    const method = order.payment_method ?? 'unknown';
    entry.byPayment[method] = (entry.byPayment[method] ?? 0) + Number(order.total || 0);
  }

  const outlets = Array.from(byOutlet.values())
    .sort((a, b) => b.total - a.total)
    .map(e => ({
      ...e,
      subtotal:      +e.subtotal.toFixed(2),
      serviceCharge: +e.serviceCharge.toFixed(2),
      tax:           +e.tax.toFixed(2),
      total:         +e.total.toFixed(2),
    }));

  const grandTotal = outlets.reduce((s, o) => s + o.total, 0);

  return NextResponse.json({
    from,
    to,
    hotel_id:    ctx.hotelId,
    grand_total: +grandTotal.toFixed(2),
    order_count: (orders ?? []).length,
    outlets,
  });
}
