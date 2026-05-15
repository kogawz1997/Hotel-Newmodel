export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AttendanceClient } from './attendance-client';

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id, organization_id, role, full_name, avatar_url')
    .eq('id', user.id)
    .single();

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile?.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: todayRecord },
    { data: history },
    { data: todayShift },
  ] = await Promise.all([
    supabase
      .from('attendance_records')
      .select('*')
      .eq('staff_id', user.id)
      .eq('work_date', today)
      .single(),
    supabase
      .from('attendance_records')
      .select('*, shifts(name, start_time, end_time)')
      .eq('staff_id', user.id)
      .order('work_date', { ascending: false })
      .limit(14),
    supabase
      .from('shift_assignments')
      .select('*, shifts(name, start_time, end_time, color)')
      .eq('staff_id', user.id)
      .eq('work_date', today)
      .single(),
  ]);

  return (
    <AttendanceClient
      hotel={hotel}
      profile={profile}
      todayRecord={todayRecord ?? null}
      history={history ?? []}
      todayShift={todayShift ?? null}
    />
  );
}
