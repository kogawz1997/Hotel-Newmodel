export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminLangProvider } from '@/contexts/admin-lang-context';
import { AdminSidebar } from './admin-sidebar';
import { AdminMobileHeader } from './admin-mobile-header';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles').select('is_platform_admin').eq('id', user.id).single();

  if (!profile?.is_platform_admin) redirect('/dashboard');

  return (
    <AdminLangProvider>
      <div className="flex min-h-screen bg-[#111113]">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminMobileHeader />
          <main className="flex-1 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </AdminLangProvider>
  );
}
