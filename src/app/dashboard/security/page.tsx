export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SecurityClient } from './security-client';

export default async function SecurityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, organization_id, role, full_name')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const [
    { data: incidents },
    { data: visitors },
    { data: staffOnDuty },
  ] = await Promise.all([
    supabase
      .from('security_incidents')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('visitor_log')
      .select('*')
      .eq('hotel_id', hotel.id)
      .order('checked_in_at', { ascending: false })
      .limit(50),
    supabase
      .from('user_profiles')
      .select('id, full_name, role, phone')
      .eq('organization_id', profile?.organization_id)
      .eq('active', true)
      .in('role', ['security', 'manager', 'admin'])
      .limit(10),
  ]);

  return (
    <SecurityClient
      hotel={hotel}
      profile={profile}
      initialIncidents={incidents || []}
      initialVisitors={visitors || []}
      staffOnDuty={staffOnDuty || []}
    />
  );
}
