export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { LeaveClient } from './leave-client';

const ALLOWED_ROLES = [
  'owner', 'admin', 'manager', 'hr_manager', 'department_head',
  'general_manager', 'operations_manager', 'front_office_manager',
  'housekeeping_manager', 'fb_manager', 'maintenance_manager',
  'staff', 'housekeeper', 'receptionist', 'bellboy', 'concierge',
] as any[];

export default async function LeavePage() {
  const { user, profile } = await requireDashboardRole(ALLOWED_ROLES);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const MANAGER_ROLES = [
    'owner', 'admin', 'manager', 'hr_manager', 'department_head',
    'general_manager', 'operations_manager', 'front_office_manager',
    'housekeeping_manager', 'fb_manager', 'maintenance_manager',
  ];
  const isManager = MANAGER_ROLES.includes(profile.role);

  let query = admin
    .from('leave_requests')
    .select('*, staff:staff_id(id, full_name, role), approver:approved_by(id, full_name)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (!isManager) {
    query = query.eq('staff_id', user.id);
  }

  const { data: leaveRequests } = await query;

  return (
    <LeaveClient
      hotel={hotel}
      profile={{ id: profile.id, role: profile.role }}
      initialRequests={leaveRequests ?? []}
      isManager={isManager}
      userId={user.id}
    />
  );
}
