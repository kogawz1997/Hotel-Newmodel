import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import StaffLoginForm from './staff-login-form';

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SlugStaffLoginPage({ params }: Props) {
  const { slug } = await params;
  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (!hotel) notFound();

  return <StaffLoginForm hotelName={hotel.name} hotelSlug={hotel.slug} />;
}
