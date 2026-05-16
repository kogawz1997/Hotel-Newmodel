export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { AutoAssignClient } from './auto-assign-client';

export default async function AutoAssignPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'housekeeping_manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const [unassignedRes, staffRes, roomsRes] = await Promise.all([
    supabase.from('housekeeping_tasks')
      .select('id, task_type, priority, status, room_id, rooms(id, room_number, floor)')
      .eq('hotel_id', hotel.id)
      .is('assigned_to', null)
      .in('status', ['pending', 'assigned']),
    supabase.from('user_profiles')
      .select('id, full_name, zone')
      .eq('hotel_id', hotel.id)
      .in('role', ['housekeeper', 'housekeeping_manager']),
    supabase.from('rooms').select('id, room_number, floor').eq('hotel_id', hotel.id).order('room_number'),
  ]);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Auto-Assign Tasks" description="มอบหมายงานอัตโนมัติตาม floor/zone" />
      <AutoAssignClient hotelId={hotel.id} tasks={(unassignedRes.data || []) as any[]} staff={(staffRes.data || []) as any[]} rooms={roomsRes.data || []} />
    </div>
  );
}
