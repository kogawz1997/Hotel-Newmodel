export const dynamic = 'force-dynamic';

import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { RoomServiceClient } from './room-service-client';

export default async function RoomServicePage() {
  const { profile } = await requireDashboardRole([
    'owner', 'admin', 'manager', 'fnb_manager', 'room_service_staff', 'general_manager',
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

  const { data: orders } = await admin
    .from('fb_orders')
    .select('*, fb_outlets(id, name)')
    .eq('hotel_id', hotel.id)
    .eq('order_type', 'room_service')
    .not('status', 'in', '("cancelled")')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <RoomServiceClient
      hotelId={hotel.id}
      initialOrders={orders ?? []}
    />
  );
}
