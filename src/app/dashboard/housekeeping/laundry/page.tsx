export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { LaundryClient } from './laundry-client';

export default async function LaundryPage() {
  const { profile, user } = await requireDashboardRole([
    'owner',
    'admin',
    'manager',
    'housekeeping_manager',
    'housekeeper',
  ] as any[]);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const { data: batches } = await admin
    .from('laundry_batches')
    .select(
      `id, hotel_id, batch_no, collected_at, returned_at,
       items_count, items_detail, assigned_to, vendor, status, notes,
       assignee:user_profiles!assigned_to(id, full_name)`
    )
    .eq('hotel_id', hotel.id)
    .order('collected_at', { ascending: false })
    .limit(200);

  return (
    <LaundryClient
      hotelId={hotel.id}
      userId={user.id}
      batches={batches || []}
    />
  );
}
