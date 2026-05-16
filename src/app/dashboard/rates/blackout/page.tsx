export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { BlackoutClient } from './blackout-client';

export default async function BlackoutPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager']);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const { data: blackouts } = await supabase
    .from('blackout_dates')
    .select('*')
    .eq('hotel_id', hotel.id)
    .order('date_from', { ascending: true });

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="Blackout Dates" description="ปิดรับการจองทุกช่องทางพร้อมกัน 1 คลิก" />
      <BlackoutClient hotelId={hotel.id} initial={blackouts || []} />
    </div>
  );
}
