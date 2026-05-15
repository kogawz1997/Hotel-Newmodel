export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { PartsClient } from './parts-client';

const ALLOWED_ROLES = [
  'owner',
  'admin',
  'manager',
  'maintenance_manager',
  'technician',
] as any[];

export default async function PartsPage() {
  const { profile } = await requireDashboardRole(ALLOWED_ROLES);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const { data: parts } = await admin
    .from('parts_inventory')
    .select('*')
    .eq('hotel_id', hotel.id)
    .order('name');

  const lowStock = (parts ?? []).filter((p: any) => p.quantity <= p.min_stock);

  return (
    <PartsClient
      hotelId={hotel.id}
      initialParts={parts ?? []}
      initialLowStock={lowStock}
    />
  );
}
