export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { AnnouncementsClient } from './announcements-client';

const ALLOWED_ROLES = [
  'owner',
  'admin',
  'manager',
  'front_desk',
  'housekeeping',
  'maintenance',
  'concierge',
  'security',
  'accounting',
  'staff',
] as any[];

const MANAGER_ROLES = ['owner', 'admin', 'manager'];

export default async function AnnouncementsPage() {
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
  const now = new Date().toISOString();

  // Managers fetch all (including inactive) so they can manage them.
  // Staff fetch only active, non-expired.
  let query = admin
    .from('announcements')
    .select('*, creator:created_by(full_name)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (!isManager) {
    query = query
      .eq('is_active', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`);
  }

  const { data: announcements } = await query;

  // Staff: filter in-memory by target_roles
  const filtered = (announcements ?? []).filter((a: any) => {
    if (isManager) return true;
    const roles: string[] | null = a.target_roles;
    if (!roles || roles.length === 0) return true;
    return roles.includes(profile.role);
  });

  return (
    <AnnouncementsClient
      initialAnnouncements={filtered}
      profile={{
        id: profile.id,
        role: profile.role,
        full_name: (profile as any).full_name ?? null,
      }}
    />
  );
}
