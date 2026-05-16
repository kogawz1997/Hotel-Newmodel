export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('role, organization_id, active_hotel_id, full_name, email')
    .eq('id', user.id)
    .single();

  const ownerRoles = ['owner', 'hotel_owner', 'general_manager'];
  if (!profile || !ownerRoles.includes(profile.role)) redirect('/dashboard');

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar
        hotelName={hotel?.name ?? 'My Hotel'}
        hotelId={hotel?.id}
        userName={(profile as any).full_name ?? undefined}
        userEmail={(profile as any).email ?? undefined}
        userRole={profile.role}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 overflow-x-hidden p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
