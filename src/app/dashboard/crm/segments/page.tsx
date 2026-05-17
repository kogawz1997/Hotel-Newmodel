export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { SegmentsClient } from './segments-client';

export default async function SegmentsPage() {
  const access = await requireDashboardRole(['hotel_owner','general_manager','operations_manager','revenue_manager','marketing_staff']);
  if ('redirect' in access) redirect('/dashboard');
  const { hotelId } = access;

  return <SegmentsClient hotelId={hotelId} />;
}
