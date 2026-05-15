export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { CrmClient } from './crm-client';

export default async function CrmPage() {
  const access = await requireDashboardRole(['hotel_owner','general_manager','operations_manager','revenue_manager','marketing_staff']);
  if ('redirect' in access) return null;
  const { hotelId } = access;
  const admin = createAdminClient();
  const [
    { data: topGuests },
    { data: segments },
    { data: loyalty },
  ] = await Promise.all([
    admin.from('guests').select('id, first_name, last_name, email, phone, nationality, loyalty_tier, loyalty_points, total_stays, total_spent, tags, notes, created_at')
      .eq('hotel_id', hotelId)
      .order('total_stays', { ascending: false }).limit(50),
    admin.from('guests').select('loyalty_tier').eq('hotel_id', hotelId),
    admin.from('guests').select('loyalty_tier, loyalty_points, total_spent')
      .eq('hotel_id', hotelId).not('loyalty_tier', 'is', null),
  ]);

  const segmentCounts = {
    bronze: segments?.filter(g => g.loyalty_tier === 'bronze').length || 0,
    silver: segments?.filter(g => g.loyalty_tier === 'silver').length || 0,
    gold: segments?.filter(g => g.loyalty_tier === 'gold').length || 0,
    platinum: segments?.filter(g => g.loyalty_tier === 'platinum').length || 0,
    vip: (topGuests || []).filter(g => g.tags?.includes('vip')).length,
  };

  return <CrmClient guests={topGuests || []} segmentCounts={segmentCounts} loyalty={loyalty || []} />;
}
