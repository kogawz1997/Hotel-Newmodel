export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { SalesAdminClient } from './sales-client';

export default async function SalesAdminPage() {
  const admin = createAdminClient();
  const { data: leads } = await admin.from('platform_sales_leads')
    .select('*, user_profiles!assigned_to(full_name)')
    .order('created_at', { ascending: false });
  return <SalesAdminClient leads={leads || []} />;
}
