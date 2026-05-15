export const dynamic = 'force-dynamic';

import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { KitchenClient } from './kitchen-client';

export default async function KitchenPage() {
  const { profile } = await requireDashboardRole([
    'owner', 'admin', 'manager', 'fnb_manager', 'kitchen_staff', 'general_manager',
  ] as any);

  const admin = createAdminClient();

  // Resolve hotel from organization
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

  const [{ data: queue }, { data: outlets }] = await Promise.all([
    admin
      .from('kitchen_queue')
      .select('*')
      .eq('hotel_id', hotel.id)
      .in('status', ['new', 'preparing', 'ready'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(100),
    admin
      .from('fb_outlets')
      .select('id, name, type')
      .eq('hotel_id', hotel.id),
  ]);

  return (
    <KitchenClient
      hotelId={hotel.id}
      initialQueue={queue ?? []}
      outlets={outlets ?? []}
    />
  );
}
