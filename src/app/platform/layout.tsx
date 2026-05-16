export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/app/admin/admin-sidebar';
import { AdminMobileHeader } from '@/app/admin/admin-mobile-header';
import { AdminLangProvider } from '@/contexts/admin-lang-context';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_platform_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_platform_admin) redirect('/dashboard');

  return (
    <AdminLangProvider>
      <div className="flex min-h-screen bg-[#111113]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminMobileHeader />
          <main className="flex-1 overflow-x-hidden p-6 text-white">
            {children}
          </main>
        </div>
      </div>
    </AdminLangProvider>
  );
}
