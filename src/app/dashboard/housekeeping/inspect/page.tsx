export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { InspectClient } from './inspect-client';

export default async function InspectPage() {
  const { profile, user } = await requireDashboardRole([
    'owner',
    'admin',
    'manager',
    'housekeeping_manager',
    'room_inspector',
    'general_manager',
    'operations_manager',
  ] as any[]);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const today = new Date().toISOString().slice(0, 10);

  const { data: tasks } = await admin
    .from('housekeeping_tasks')
    .select(
      `id, hotel_id, room_id, assigned_to, status, task_type, priority,
       photo_urls, inspector_id, inspection_score, inspection_note,
       inspected_at, created_at,
       rooms(id, room_no, floor),
       housekeeper:user_profiles!assigned_to(id, full_name)`
    )
    .eq('hotel_id', hotel.id)
    .in('status', ['clean', 'inspected', 'rejected_inspection'])
    .order('created_at', { ascending: false })
    .limit(200);

  const allTasks = tasks || [];

  const awaiting = allTasks.filter(
    (t: any) => t.status === 'clean'
  );
  const passed = allTasks.filter((t: any) => t.status === 'inspected');
  const rejected = allTasks.filter(
    (t: any) => t.status === 'rejected_inspection'
  );

  const todayPassed = passed.filter(
    (t: any) => t.inspected_at && t.inspected_at.startsWith(today)
  ).length;
  const todayRejected = rejected.filter(
    (t: any) => t.inspected_at && t.inspected_at.startsWith(today)
  ).length;

  return (
    <InspectClient
      hotelId={hotel.id}
      userId={user.id}
      awaiting={awaiting}
      passed={passed}
      rejected={rejected}
      stats={{
        awaiting: awaiting.length,
        passed: todayPassed,
        rejected: todayRejected,
      }}
    />
  );
}
