export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MyTasksClient } from './my-tasks-client';

export default async function MyTasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('user_profiles').select('id, organization_id, role, full_name').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id, name').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard');

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: myTasks }, { data: availableTasks }] = await Promise.all([
    supabase.from('work_orders')
      .select('*, task_photos(*)')
      .eq('hotel_id', hotel.id)
      .eq('assigned_to', user.id)
      .not('status', 'in', '(cancelled)')
      .order('created_at', { ascending: false }),
    supabase.from('work_orders')
      .select('*')
      .eq('hotel_id', hotel.id)
      .eq('status', 'pending')
      .is('assigned_to', null)
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  return <MyTasksClient myTasks={myTasks ?? []} availableTasks={availableTasks ?? []} profile={profile} hotelId={hotel.id} today={today} />;
}
