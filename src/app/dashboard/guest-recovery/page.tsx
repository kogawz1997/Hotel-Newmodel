export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GuestRecoveryClient } from './guest-recovery-client';

export default async function GuestRecoveryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('user_profiles').select('id, organization_id, role').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard');
  // Use maintenance_requests as complaint source, or work_orders with type='other' and specific tag
  const { data: complaints } = await supabase.from('work_orders')
    .select('id, title, description, notes, status, priority, created_at, guest_name, room_no')
    .eq('hotel_id', hotel.id)
    .eq('type', 'concierge')
    .order('created_at', { ascending: false })
    .limit(100);
  return <GuestRecoveryClient complaints={complaints ?? []} hotelId={hotel.id} profile={profile} />;
}
