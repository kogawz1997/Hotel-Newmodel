export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { ICalClient } from './ical-client';

export default async function ICalPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id, slug').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const { data: feeds } = await supabase
    .from('ical_feeds')
    .select('*')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false });

  const exportUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/api/ical/export/${hotel.slug || hotel.id}`;

  return (
    <div className="container max-w-3xl py-8 animate-fade-in">
      <TopBar title="iCal Sync" description="นำเข้า/ส่งออกปฏิทิน Airbnb, VRBO, Booking.com" />
      <ICalClient hotelId={hotel.id} feeds={feeds || []} exportUrl={exportUrl} />
    </div>
  );
}
