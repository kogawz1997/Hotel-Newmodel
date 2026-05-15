export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { PMClient } from './pm-client';

const ALLOWED_ROLES = [
  'owner',
  'admin',
  'manager',
  'maintenance_manager',
] as any[];

export default async function PMPage() {
  const { profile } = await requireDashboardRole(ALLOWED_ROLES);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const [{ data: pmTasks }, { data: staff }] = await Promise.all([
    admin
      .from('preventive_maintenance')
      .select('*, assigned_staff:user_profiles!assigned_to(id, full_name)')
      .eq('hotel_id', hotel.id)
      .eq('is_active', true)
      .order('next_due_at', { ascending: true }),
    admin
      .from('user_profiles')
      .select('id, full_name, role')
      .eq('organization_id', profile.organization_id)
      .eq('active', true)
      .order('full_name'),
  ]);

  return (
    <PMClient
      hotelId={hotel.id}
      initialTasks={pmTasks ?? []}
      staffList={staff ?? []}
    />
  );
}
