export const dynamic = 'force-dynamic';

import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { InternalRequestsClient } from './internal-requests-client';

const ALL_ROLES = ['owner', 'admin', 'manager', 'front_desk', 'housekeeping', 'staff', 'viewer'] as const;

export default async function InternalRequestsPage() {
  const { profile, user } = await requireDashboardRole([...ALL_ROLES]);

  const supabase = await createClient();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard/onboarding');

  const isManager = ['owner', 'admin', 'manager'].includes(profile.role);

  let query = supabase
    .from('internal_requests')
    .select('*, requester:user_profiles!requester_id(id, full_name, role), approver:user_profiles!approved_by(id, full_name)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (!isManager) {
    query = query.eq('requester_id', user.id);
  }

  const { data: requests } = await query;

  return (
    <InternalRequestsClient
      hotelId={hotel.id}
      requests={requests ?? []}
      userId={user.id}
      userRole={profile.role}
      isManager={isManager}
    />
  );
}
