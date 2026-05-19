export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ItineraryClient } from './itinerary-client';

export default async function ItineraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/itinerary');

  const { data: reservation } = await supabase
    .from('reservations')
    .select('id, check_in, check_out, rooms(room_number)')
    .eq('guest_account_id', user.id)
    .in('status', ['confirmed', 'checked_in'])
    .order('check_in', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!reservation) redirect('/portal/home');

  const { data: items } = await supabase
    .from('itinerary_items')
    .select('*')
    .eq('reservation_id', reservation.id)
    .order('date', { ascending: true })
    .order('time', { ascending: true });

  return (
    <div className="min-h-screen bg-[#f5f7fa] dark:bg-background">
      <div className="sticky top-0 z-30 bg-[#f5f7fa]/90 dark:bg-background/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-border/40">
        <div className="px-4 h-14 flex items-center gap-3 max-w-screen-sm mx-auto">
          <Link href="/portal/stay"
            className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <p className="font-display font-bold text-foreground">My Itinerary</p>
            <p className="text-[10px] text-muted-foreground">ตารางกิจกรรมและแผนการเดินทาง</p>
          </div>
        </div>
      </div>
      <div className="px-4 py-5 pb-24 max-w-screen-sm mx-auto">
        <ItineraryClient reservation={reservation as any} items={items || []} />
      </div>
    </div>
  );
}
