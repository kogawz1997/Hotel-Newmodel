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

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, role, organization_id, active_hotel_id')
    .eq('id', user.id)
    .single();

  if (!profile || !allowedRoles.includes(profile.role as StaffRole)) {
    redirect('/dashboard');
  }

  // Use the user's active hotel if set, otherwise fall back to first hotel in org
  let hotelId: string = (profile as any).active_hotel_id;
  if (!hotelId) {
    const { data: hotel } = await admin
      .from('hotels')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .limit(1)
      .single();

    if (!hotel) {
      redirect('/onboarding');
    }

    hotelId = hotel.id;
  }

  return { supabase, user, profile, hotelId };
}
