export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { CompetitorClient } from './competitor-client';

export default async function CompetitorRatesPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id, currency').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const [ratesRes, roomTypesRes] = await Promise.all([
    supabase.from('competitor_rates')
      .select('*')
      .eq('hotel_id', hotel.id)
      .gte('check_date', new Date().toISOString().slice(0, 10))
      .order('check_date', { ascending: true })
      .order('competitor_name', { ascending: true }),
    supabase.from('room_types').select('id, name, base_price').eq('hotel_id', hotel.id).limit(10),
  ]);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Competitor Rate Tracking" description="ติดตามราคาคู่แข่งและปรับ positioning ของคุณ" />
      <CompetitorClient hotelId={hotel.id} rates={ratesRes.data || []} roomTypes={roomTypesRes.data || []} currency={hotel.currency || 'THB'} />
    </div>
  );
}
