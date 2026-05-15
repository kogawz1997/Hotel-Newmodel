export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { SupportAdminClient } from './support-client';

export default async function SupportAdminPage() {
  const admin = createAdminClient();
  const { data: tickets } = await admin.from('support_tickets_internal')
    .select('*, hotels(name), user_profiles!requester_id(full_name, email)')
    .order('created_at', { ascending: false }).limit(100);
  return <SupportAdminClient tickets={tickets || []} />;
}
