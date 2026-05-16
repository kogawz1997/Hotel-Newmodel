export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { HotelPreview } from '@/components/booking/hotel-preview';

export default async function PreviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('user_profiles').select('organization_id').eq('id', user.id).single();
  const { data: hotels } = await supabase.from('hotels').select('*').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) redirect('/dashboard/onboarding');

  const { data: gallery } = await supabase
    .from('hotel_gallery')
    .select('*')
    .eq('hotel_id', hotels[0].id)
    .order('display_order');

  return <HotelPreview hotel={hotels[0]} gallery={gallery || []} />;
}
