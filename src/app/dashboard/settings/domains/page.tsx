import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CustomDomainsClient } from '@/components/settings/custom-domains-client';

export const dynamic = 'force-dynamic';

export default async function CustomDomainsPage() {
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
    .select('id, slug')
    .eq('organization_id', profile!.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const { data: domains } = await supabase
    .from('custom_domains')
    .select('id, domain, verified, ssl_active, created_at')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Custom Domains</h1>
        <p className="text-sm text-slate-500 mt-1">
          ใช้โดเมนของคุณเองสำหรับหน้าจองห้องพัก เช่น <code className="bg-slate-100 px-1 rounded">book.yourhotel.com</code>
        </p>
      </div>

      <div className="rounded-xl border bg-amber-50 border-amber-200 p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">วิธีตั้งค่า DNS</p>
        <ol className="list-decimal list-inside space-y-1 text-amber-700">
          <li>เพิ่มโดเมนด้านล่าง</li>
          <li>ไปที่ DNS provider ของคุณ และเพิ่ม CNAME record:</li>
          <li className="ml-4 font-mono text-xs bg-amber-100 p-1 rounded">
            {`book.yourhotel.com → ${new URL(appUrl || 'https://app.example.com').hostname}`}
          </li>
          <li>รอ DNS propagate (ปกติ 5-30 นาที) แล้วกด Verify</li>
        </ol>
      </div>

      <CustomDomainsClient
        initialDomains={domains || []}
        hotelSlug={hotel.slug}
        appUrl={appUrl}
      />
    </div>
  );
}
