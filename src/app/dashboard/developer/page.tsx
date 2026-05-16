export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { DeveloperClient } from './developer-client';

export default async function DeveloperPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  const [keysRes, webhookRes] = await Promise.all([
    supabase.from('api_keys').select('id, name, key_prefix, scopes, created_at, last_used_at, revoked_at').eq('hotel_id', hotel.id).order('created_at', { ascending: false }),
    supabase.from('webhook_logs').select('id, event_type, url, status_code, success, created_at').eq('hotel_id', hotel.id).order('created_at', { ascending: false }).limit(100),
  ]);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Developer Tools" description="API Keys และ Webhook Event Logs" />
      <DeveloperClient hotelId={hotel.id} apiKeys={keysRes.data || []} webhookLogs={webhookRes.data || []} />
    </div>
  );
}
