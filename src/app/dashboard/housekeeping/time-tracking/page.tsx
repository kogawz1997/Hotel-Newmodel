export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { TimeTrackingClient } from './time-tracking-client';

export default async function TimeTrackingPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'housekeeping_manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const today = new Date().toISOString().slice(0, 10);
  const [tasksRes, staffRes] = await Promise.all([
    supabase.from('housekeeping_tasks')
      .select('id, room_id, task_type, status, assigned_to, started_at, completed_at, created_at, rooms(room_number)')
      .eq('hotel_id', hotel.id)
      .gte('created_at', today)
      .order('created_at', { ascending: false }),
    supabase.from('user_profiles')
      .select('id, full_name')
      .eq('hotel_id', hotel.id)
      .in('role', ['housekeeper', 'housekeeping_manager']),
  ]);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Cleaning Time Tracking" description="ติดตามเวลาทำความสะอาดแต่ละห้อง" />
      <TimeTrackingClient hotelId={hotel.id} tasks={tasksRes.data || []} staff={staffRes.data || []} />
    </div>
  );
}
