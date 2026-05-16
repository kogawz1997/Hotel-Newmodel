export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { TableReservationsClient } from './table-reservations-client';

export default async function TableReservationsPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'front_desk', 'restaurant_manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const today = new Date().toISOString().slice(0, 10);
  const { data: reservations } = await supabase
    .from('table_reservations')
    .select('*')
    .eq('hotel_id', hotel.id)
    .gte('reservation_date', today)
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true });

  return (
    <div className="container max-w-4xl py-8 animate-fade-in">
      <TopBar title="Table Reservations" description="จองโต๊ะร้านอาหารในโรงแรม" />
      <TableReservationsClient hotelId={hotel.id} initial={reservations || []} />
    </div>
  );
}
