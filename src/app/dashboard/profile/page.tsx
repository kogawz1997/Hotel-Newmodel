export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProfileClient } from './profile-client';

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select([
      'id', 'organization_id', 'email', 'full_name',
      'first_name', 'last_name', 'role', 'language', 'phone',
      'active', 'created_at', 'last_login_at', 'avatar_url',
      'notification_prefs', 'dept_prefs', 'appearance_prefs',
    ].join(', '))
    .eq('id', user.id)
    .single();

  const orgId = (profile as unknown as Record<string, unknown>)?.organization_id as string | undefined;
  const { data: hotel } = orgId
    ? await supabase
        .from('hotels')
        .select('id, name, timezone, currency')
        .eq('organization_id', orgId)
        .limit(1)
        .single()
    : { data: null };

  return <ProfileClient profile={profile} user={user} hotel={hotel} />;
}
