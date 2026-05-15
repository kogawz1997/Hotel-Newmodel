export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { HrClient } from './hr-client';

const ALLOWED_ROLES = [
  'owner', 'admin', 'manager', 'hr_manager', 'hr_staff', 'general_manager',
] as any[];

export default async function HrPage() {
  const { user, profile } = await requireDashboardRole(ALLOWED_ROLES);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const [
    { data: staff },
    { data: payrollPeriods },
    { data: onboardingTasks },
    { data: leaveRequests },
  ] = await Promise.all([
    admin
      .from('user_profiles')
      .select('id, full_name, role, email, created_at')
      .eq('hotel_id', hotel.id)
      .order('full_name'),
    admin
      .from('payroll_periods')
      .select('*, approver:approved_by(id, full_name)')
      .eq('hotel_id', hotel.id)
      .order('period_start', { ascending: false })
      .limit(20),
    admin
      .from('onboarding_tasks')
      .select('*, staff:staff_id(id, full_name, role)')
      .eq('hotel_id', hotel.id)
      .order('due_date'),
    admin
      .from('leave_requests')
      .select('*, staff:staff_id(id, full_name, role), approver:approved_by(id, full_name)')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  const pendingLeaveCount = (leaveRequests ?? []).filter((r: any) => r.status === 'pending').length;

  return (
    <HrClient
      hotel={hotel}
      profile={{ id: profile.id, role: profile.role }}
      userId={user.id}
      staff={staff ?? []}
      payrollPeriods={payrollPeriods ?? []}
      onboardingTasks={onboardingTasks ?? []}
      leaveRequests={leaveRequests ?? []}
      pendingLeaveCount={pendingLeaveCount}
    />
  );
}
