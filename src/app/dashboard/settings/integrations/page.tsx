import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { IntegrationsClient } from '@/components/settings/integrations-client';
import { maskCredential } from '@/lib/integration-credentials';

export const dynamic = 'force-dynamic';

export default async function IntegrationsSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/backoffice/login');

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!['owner', 'admin'].includes(profile?.role || '')) {
    redirect('/dashboard/settings');
  }

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile!.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const { data: rows } = await supabase
    .from('channel_integrations')
    .select('provider, enabled, config, last_sync_at, sync_status')
    .eq('hotel_id', hotel.id);

  const integrations: Record<string, {
    enabled: boolean;
    configured: boolean;
    maskedConfig: Record<string, string>;
    lastSyncAt: string | null;
    syncStatus: string;
  }> = {};

  for (const row of rows || []) {
    const cfg = (row.config as Record<string, string>) || {};
    const maskedConfig: Record<string, string> = {};
    for (const [k, v] of Object.entries(cfg)) {
      maskedConfig[k] = maskCredential(v);
    }
    integrations[row.provider] = {
      enabled: row.enabled,
      configured: Object.keys(cfg).length > 0,
      maskedConfig,
      lastSyncAt: row.last_sync_at,
      syncStatus: row.sync_status || 'idle',
    };
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integration Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          ตั้งค่า API keys สำหรับ LINE, WhatsApp, OTA, Email และบริการอื่น ๆ
        </p>
      </div>

      <div className="rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-700">
        Credentials ถูกเข้ารหัสใน database (Supabase RLS) · เฉพาะ owner/admin เท่านั้นที่เข้าถึงได้ · ค่าในตาราง env จะ override DB เสมอ
      </div>

      <IntegrationsClient initialIntegrations={integrations} />
    </div>
  );
}
