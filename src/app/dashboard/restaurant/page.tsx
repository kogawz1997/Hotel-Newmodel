export const dynamic = 'force-dynamic';

import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { RestaurantClient } from './restaurant-client';

export default async function RestaurantPage() {
  const { profile } = await requireDashboardRole([
    'owner', 'admin', 'manager', 'fnb_manager', 'restaurant_staff', 'general_manager',
  ] as any);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        ไม่พบข้อมูลโรงแรม
      </div>
    );
  }

  const [
    { data: tables },
    { data: orders },
    { data: outlets },
    { data: menuItems },
  ] = await Promise.all([
    admin
      .from('restaurant_tables')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('floor')
      .order('table_no'),
    admin
      .from('restaurant_orders')
      .select('*')
      .eq('hotel_id', hotel.id)
      .in('status', ['open', 'billed'])
      .order('opened_at', { ascending: false })
      .limit(100),
    admin
      .from('fb_outlets')
      .select('id, name, type')
      .eq('hotel_id', hotel.id),
    admin
      .from('fb_menu_items')
      .select('id, name, price, category_id, is_available, allergy_tags, outlet_id')
      .eq('is_available', true)
      .limit(500),
  ]);

  return (
    <RestaurantClient
      hotelId={hotel.id}
      initialTables={tables ?? []}
      initialOrders={orders ?? []}
      outlets={outlets ?? []}
      menuItems={menuItems ?? []}
    />
  );
}
