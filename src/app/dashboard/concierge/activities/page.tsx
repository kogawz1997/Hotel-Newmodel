export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { ActivitiesClient } from './activities-client';

export default async function ActivitiesPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'front_desk', 'concierge'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const { data: activities } = await supabase
    .from('concierge_bookings')
    .select('*')
    .eq('hotel_id', hotel.id)
    .gte('activity_date', new Date().toISOString().slice(0, 10))
    .order('activity_date', { ascending: true });

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="Activity & Tour Booking" description="จัดกิจกรรมและทัวร์ให้แขก" />
      <ActivitiesClient hotelId={hotel.id} initial={activities || []} />
    </div>
  );
}
