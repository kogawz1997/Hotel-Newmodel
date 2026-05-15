export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { RepairsClient } from './repairs-client';

const ALLOWED_ROLES = [
  'owner',
  'admin',
  'manager',
  'maintenance_manager',
  'technician',
  'general_manager',
] as any[];

const MANAGER_ROLES = ['owner', 'admin', 'manager', 'maintenance_manager', 'general_manager'];

export default async function MyRepairsPage() {
  const { user, profile } = await requireDashboardRole(ALLOWED_ROLES);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const isManager = MANAGER_ROLES.includes(profile.role);

  // Technicians only see pending/in_progress; managers see everything
  let q = admin
    .from('maintenance_requests')
    .select(
      '*, room:rooms(room_number, floor), assigned_profile:user_profiles!assigned_to(id, full_name)'
    )
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (!isManager) {
    q = (q as any).in('status', ['pending', 'in_progress']);
  }

  const { data: requests } = await q;

  // Fetch parts for "use part" modal
  const { data: parts } = await admin
    .from('parts_inventory')
    .select('id, name, unit, quantity')
    .eq('hotel_id', hotel.id)
    .order('name');

  return (
    <RepairsClient
      hotelId={hotel.id}
      userId={user.id}
      isManager={isManager}
      initialRequests={requests ?? []}
      parts={parts ?? []}
    />
  );
}
