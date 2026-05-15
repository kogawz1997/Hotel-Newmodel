export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { RankingDashboardClient } from './ranking-client';

export default async function RankingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  return <RankingDashboardClient />;
}
