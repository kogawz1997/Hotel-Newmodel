export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LiveBoardClient } from './live-board-client';

const ALLOWED = ['general_manager','operations_manager','hotel_owner','front_office_manager'];

export default async function LiveBoardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('user_profiles').select('id, organization_id, role, full_name').eq('id', user.id).single();
  if (!ALLOWED.includes(profile?.role ?? '')) redirect('/dashboard');

  const { data: hotel } = await supabase.from('hotels').select('id, name').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard');

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const [
    { data: rooms },
    { data: staff },
    { data: pendingTasks },
    { data: todayReservations },
  ] = await Promise.all([
    supabase.from('rooms').select('id, room_number, floor, status').eq('hotel_id', hotel.id).order('floor').order('room_number'),
    supabase.from('user_profiles').select('id, full_name, role').eq('organization_id', profile?.organization_id).order('full_name'),
    supabase.from('work_orders').select('*, assigned_user:assigned_to(full_name,role)').eq('hotel_id', hotel.id).not('status','in','(done,cancelled)').order('created_at', { ascending: false }).limit(100),
    supabase.from('reservations').select('id, guest_name, check_in_date, room_number').eq('hotel_id', hotel.id).gte('check_in_date', today).lt('check_in_date', `${today}T23:59:59`).limit(20),
  ]);

  // Build alerts from urgent tasks and SLA breaches
  const alerts: any[] = [];
  for (const t of (pendingTasks ?? [])) {
    if (t.priority === 'urgent') {
      alerts.push({ id: `urgent-${t.id}`, type: 'urgent_task', message: `งานวิกฤต: ${t.title}`, time: t.created_at, severity: 'high' });
    } else if (t.sla_deadline && new Date(t.sla_deadline) < new Date(now)) {
      alerts.push({ id: `sla-${t.id}`, type: 'sla_breach', message: `เกิน SLA: ${t.title}`, time: t.sla_deadline, severity: 'high' });
    }
  }

  return (
    <LiveBoardClient
      hotelId={hotel.id}
      rooms={rooms ?? []}
      staff={staff ?? []}
      pendingTasks={pendingTasks ?? []}
      todayArrivals={todayReservations ?? []}
      alerts={alerts.slice(0, 20)}
      profile={profile}
    />
  );
}
