export const dynamic = 'force-dynamic';
/**
 * /platform/feature-gates — Feature flag management for platform admins.
 * Reads/writes feature_flags table via the existing /api/admin/flags route.
 */
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeatureGatesClient } from './feature-gates-client';

export default async function FeatureGatesPage() {
  const ctx = await requirePlatformAdmin();
  if (ctx.error) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: flags } = await admin
    .from('feature_flags')
    .select('*')
    .order('key');

  const enabledCount  = (flags ?? []).filter((f: any) => f.enabled).length;
  const disabledCount = (flags ?? []).length - enabledCount;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Feature Gates</h1>
        <p className="text-gray-400 text-sm">
          Toggle features globally or per tenant. Changes take effect immediately.
        </p>
      </div>

      <div className="flex gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1">
          <div className="text-xs text-gray-400">Enabled</div>
          <div className="text-3xl font-bold text-green-400">{enabledCount}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1">
          <div className="text-xs text-gray-400">Disabled</div>
          <div className="text-3xl font-bold text-gray-400">{disabledCount}</div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex-1">
          <div className="text-xs text-gray-400">Total Flags</div>
          <div className="text-3xl font-bold text-white">{(flags ?? []).length}</div>
        </div>
      </div>

      <FeatureGatesClient flags={flags ?? []} />
    </div>
  );
}
