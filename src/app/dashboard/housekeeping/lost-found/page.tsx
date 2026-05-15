export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { createAdminClient } from '@/lib/supabase/server';
import { LostFoundClient } from './lost-found-client';

export default async function LostFoundPage() {
  const { profile, user } = await requireDashboardRole([
    'owner',
    'admin',
    'manager',
    'housekeeping_manager',
    'housekeeper',
    'room_inspector',
    'front_desk',
    'front_office_manager',
  ] as any[]);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const { data: items } = await admin
    .from('lost_found')
    .select(
      `id, hotel_id, room_no, description, found_by, found_at,
       location, photo_url, status, claimed_by, claimed_at, notes,
       finder:user_profiles!found_by(id, full_name)`
    )
    .eq('hotel_id', hotel.id)
    .order('found_at', { ascending: false })
    .limit(300);

  return (
    <LostFoundClient
      hotelId={hotel.id}
      userId={user.id}
      items={items || []}
    />
  );
}
