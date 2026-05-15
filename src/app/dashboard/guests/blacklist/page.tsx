export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BlacklistClient } from './blacklist-client';

export default async function BlacklistPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('user_profiles').select('id, organization_id, role').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard');
  const { data: guests } = await supabase.from('guests').select('id, full_name, email, phone, is_blacklisted, blacklist_reason, created_at').eq('hotel_id', hotel.id).eq('is_blacklisted', true).order('full_name');
  return <BlacklistClient guests={guests ?? []} />;
}
