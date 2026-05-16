export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RoutingRulesClient } from './routing-rules-client';

export default async function RoutingRulesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  const { data: hotels } = await supabase
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile?.organization_id)
    .limit(1);

  if (!hotels?.[0]) redirect('/dashboard/onboarding');
  return <RoutingRulesClient hotelId={hotels[0].id} />;
}
