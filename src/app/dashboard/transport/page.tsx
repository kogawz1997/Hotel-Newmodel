export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { TransportClient } from './transport-client';

export default async function TransportPage() {
  const { user, profile } = await requireDashboardRole([
    'owner',
    'admin',
    'manager',
    'general_manager',
    'operations_manager',
    'concierge',
    'transport_driver',
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

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().slice(0, 10);
  const weekLaterStr = new Date(today.getTime() + 7 * 86400000).toISOString().slice(0, 10);

  const [{ data: todayTasks }, { data: upcomingTasks }, { data: drivers }] =
    await Promise.all([
      admin
        .from('transport_tasks')
        .select('*, driver:driver_id(id, full_name)')
        .eq('hotel_id', hotel.id)
        .gte('pickup_time', `${todayStr}T00:00:00.000Z`)
        .lt('pickup_time', `${todayStr}T23:59:59.999Z`)
        .order('pickup_time', { ascending: true })
        .limit(100),
      admin
        .from('transport_tasks')
        .select('*, driver:driver_id(id, full_name)')
        .eq('hotel_id', hotel.id)
        .gte('pickup_time', `${tomorrowStr}T00:00:00.000Z`)
        .lte('pickup_time', `${weekLaterStr}T23:59:59.999Z`)
        .not('status', 'in', '("completed","cancelled")')
        .order('pickup_time', { ascending: true })
        .limit(50),
      admin
        .from('user_profiles')
        .select('id, full_name')
        .eq('organization_id', profile.organization_id)
        .eq('role', 'transport_driver')
        .eq('active', true),
    ]);

  const isManager = ['owner', 'admin', 'manager', 'general_manager', 'operations_manager', 'front_office_manager'].includes(
    profile.role
  );

  return (
    <TransportClient
      hotel={hotel}
      profile={{ id: user.id, role: profile.role }}
      todayTasks={todayTasks ?? []}
      upcomingTasks={upcomingTasks ?? []}
      drivers={drivers ?? []}
      isManager={isManager}
    />
  );
}
