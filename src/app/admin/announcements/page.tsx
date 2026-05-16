export const dynamic = 'force-dynamic';
import { requirePlatformAdmin } from '@/lib/auth/guards';
import { redirect } from 'next/navigation';
import { AnnouncementsAdminClient } from './announcements-admin-client';
import { createAdminClient } from '@/lib/supabase/server';

export default async function AdminAnnouncementsPage() {
  const ctx = await requirePlatformAdmin();
  if (ctx.error) redirect('/admin/login');

  const admin = createAdminClient();
  const { data: announcements } = await admin
    .from('platform_announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  const { data: orgsResult } = await admin
    .from('organizations')
    .select('id, name, subscription_plan, subscription_status')
    .order('name');

  return (
    <main className="text-white p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Announcements</h1>
        <p className="text-white/50 text-sm mt-1">ส่งข้อความถึง owner ทุกคน หรือกลุ่มที่เลือก</p>
      </div>
      <AnnouncementsAdminClient announcements={announcements || []} orgs={orgsResult || []} />
    </main>
  );
}
