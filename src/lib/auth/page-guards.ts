import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import type { StaffRole } from '@/lib/auth/guards';

export async function requireDashboardRole(allowedRoles: StaffRole[]) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role as StaffRole)) {
    redirect('/dashboard');
  }

  const admin = createAdminClient();
  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) {
    redirect('/onboarding');
  }

  return { supabase, user, profile, hotelId: hotel.id };
}
