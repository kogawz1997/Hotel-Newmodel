/**
 * GET /api/fb/stock/alert?hotelId=
 * Returns menu items whose stock_quantity <= low_stock_threshold.
 * Optionally triggers notification to purchasing/fnb_manager if ?notify=true
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { queueNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hotelId = searchParams.get('hotelId');
  const notify  = searchParams.get('notify') === 'true';

  const ctx = await requireHotelAccess(hotelId, [
    'owner', 'admin', 'manager', 'fnb_manager', 'purchasing_manager', 'purchasing_staff',
  ]);
  if (ctx.error) return ctx.error;

  const admin = createAdminClient();

  // Supabase doesn't support column-to-column filter; fetch tracked items and filter in JS
  const { data: allTracked } = await admin
    .from('fb_menu_items')
    .select('id, name, outlet_id, stock_quantity, low_stock_threshold, unit')
    .eq('hotel_id', ctx.hotelId)
    .not('stock_quantity', 'is', null)
    .not('low_stock_threshold', 'is', null);

  const low = (allTracked ?? []).filter(
    (item: any) => Number(item.stock_quantity) <= Number(item.low_stock_threshold),
  );

  if (notify && low.length > 0) {
    await queueNotification({
      hotelId:  ctx.hotelId!,
      type:     'stock_low',
      priority: 'high',
      roles:    ['fnb_manager', 'purchasing_manager', 'purchasing_staff', 'manager'],
      title:    `สต็อกต่ำ ${low.length} รายการ`,
      body:     low.slice(0, 3).map((i: any) => `${i.name} (${i.stock_quantity} ${i.unit ?? ''})`).join(', '),
      deepLink: '/dashboard/inventory',
      metadata: { low_item_ids: low.map((i: any) => i.id) },
    });
  }

  return NextResponse.json({
    hotel_id:   ctx.hotelId,
    low_count:  low.length,
    items:      low,
    notified:   notify && low.length > 0,
  });
}
