export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { SettingsClient } from '@/components/dashboard/settings-client';
import Link from 'next/link';
import { Globe } from 'lucide-react';

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('user_profiles').select('*').eq('id', user!.id).single();
  const { data: hotels } = await supabase
    .from('hotels').select('*').eq('organization_id', profile?.organization_id).limit(1);
  if (!hotels?.[0]) return null;

  const isOwnerAdmin = ['owner', 'admin'].includes(profile?.role || '');

  return (
    <div>
      {isOwnerAdmin && (
        <div className="max-w-5xl mx-auto px-4 pt-4">
          <Link
            href="/dashboard/settings/domains"
            className="inline-flex items-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2 text-sm text-sky-700 hover:bg-sky-100"
          >
            <Globe className="h-4 w-4" />
            Custom Domain Settings
          </Link>
        </div>
      )}
      <SettingsClient hotel={hotels[0]} profile={profile} />
    </div>
  );
}
