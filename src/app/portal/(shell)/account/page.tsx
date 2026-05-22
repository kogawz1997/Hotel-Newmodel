export const dynamic = 'force-dynamic';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AccountClient } from './account-client';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/portal/login?next=/portal/account');

  const admin = createAdminClient();
  const { data: guest } = await admin
    .from('guest_accounts').select('*').eq('id', user.id).single();
  if (!guest) redirect('/portal/login');

  const { data: guests } = await supabase
    .from('guests')
    .select('loyalty_points, loyalty_tier, total_stays')
    .eq('email', guest.email);

  const loyaltyPoints = (guests || []).reduce((s: number, g: any) => s + (g.loyalty_points || 0), 0);
  const loyaltyTier = ['bronze', 'silver', 'gold', 'platinum']
    .slice().reverse()
    .find(t => (guests || []).some((g: any) => g.loyalty_tier === t)) || 'bronze';

  return (
    <AccountClient
      guest={guest}
      loyaltyPoints={loyaltyPoints}
      loyaltyTier={loyaltyTier}
    />
  );
}
