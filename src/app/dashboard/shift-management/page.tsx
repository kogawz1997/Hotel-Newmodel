export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ShiftManagementClient } from './shift-management-client';

export default async function ShiftManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('user_profiles').select('id, organization_id, role, full_name').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id, name').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard');

  const today = new Date();
  const weekStart = new Date(today); weekStart.setDate(today.getDate() - today.getDay() + 1);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const [{ data: shifts }, { data: staff }, { data: assignments }] = await Promise.all([
    supabase.from('shifts').select('*').eq('hotel_id', hotel.id).order('start_time'),
    supabase.from('user_profiles').select('id, full_name, role').eq('organization_id', profile?.organization_id).order('full_name'),
    supabase.from('shift_assignments').select('*, shifts(name, start_time, end_time, color), staff:staff_id(full_name, role)')
      .eq('hotel_id', hotel.id).gte('work_date', fmt(weekStart)).lte('work_date', fmt(weekEnd)),
  ]);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i); return fmt(d);
  });

  return <ShiftManagementClient shifts={shifts ?? []} staff={staff ?? []} assignments={assignments ?? []} days={days} hotelId={hotel.id} />;
}
