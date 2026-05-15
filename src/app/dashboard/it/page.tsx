export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { ITClient } from './it-client';

const ALLOWED_ROLES = [
  'owner',
  'admin',
  'manager',
  'it_admin',
  'it_support',
  'general_manager',
] as any[];

export default async function ITPage() {
  const { user, profile } = await requireDashboardRole(ALLOWED_ROLES);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const [{ data: tickets }, { data: devices }] = await Promise.all([
    admin
      .from('support_tickets_internal')
      .select(
        '*, requester:user_profiles!requester_id(id, full_name), assignee:user_profiles!assigned_to(id, full_name)'
      )
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false })
      .limit(200),
    admin
      .from('device_registry')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('name'),
  ]);

  return (
    <ITClient
      hotelId={hotel.id}
      userId={user.id}
      initialTickets={tickets ?? []}
      initialDevices={devices ?? []}
    />
  );
}
