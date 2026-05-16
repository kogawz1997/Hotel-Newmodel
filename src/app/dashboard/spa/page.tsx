export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { SpaFullClient } from './spa-full-client';
import { redirect } from 'next/navigation';

export default async function SpaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile) redirect('/auth/login');

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/onboarding');

  return (
    <SpaFullClient
      hotel={{ id: hotel.id, name: hotel.name }}
      profile={{ id: profile.id, role: profile.role }}
    />
  );
}
