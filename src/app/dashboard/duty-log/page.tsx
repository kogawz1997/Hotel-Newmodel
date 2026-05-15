export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DutyLogClient } from './duty-log-client';

export default async function DutyLogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('user_profiles').select('id, organization_id, role, full_name').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id, name').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard');
  // Use work_orders table with type='other' and source='manual', notes as log body, title prefixed with "📋 Duty Log:"
  const { data: logs } = await supabase.from('work_orders')
    .select('id, title, notes, created_at, requested_by, requester:requested_by(full_name)')
    .eq('hotel_id', hotel.id)
    .eq('type', 'other')
    .like('title', 'Duty Log:%')
    .order('created_at', { ascending: false })
    .limit(50);
  return <DutyLogClient logs={logs ?? []} profile={profile} />;
}
