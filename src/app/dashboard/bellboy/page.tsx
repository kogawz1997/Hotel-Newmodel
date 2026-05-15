export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { BellboyClient } from './bellboy-client';

export default async function BellboyPage() {
  const { user, profile } = await requireDashboardRole([
    'owner',
    'admin',
    'manager',
    'general_manager',
    'operations_manager',
    'concierge',
    'bellboy',
    'front_desk',
    'front_office_manager',
  ]);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const { data: tasks } = await admin
    .from('luggage_tasks')
    .select('*, assignee:assigned_to(id, full_name)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(200);

  const isManager = [
    'owner',
    'admin',
    'manager',
    'general_manager',
    'operations_manager',
    'front_office_manager',
  ].includes(profile.role);

  return (
    <BellboyClient
      hotel={hotel}
      profile={{ id: user.id, role: profile.role }}
      initialTasks={tasks ?? []}
      isManager={isManager}
    />
  );
}
