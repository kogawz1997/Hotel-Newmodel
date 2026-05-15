export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { WorkOrdersClient } from './work-orders-client';

const ALLOWED_ROLES = ['hotel_owner','general_manager','operations_manager','front_office_manager',
  'housekeeping_manager','maintenance_manager','fnb_manager','security_manager','spa_manager',
  'hr_manager','accounting_manager','it_admin','revenue_manager','front_desk'];

export default async function WorkOrdersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  const { data: profile } = await supabase.from('user_profiles').select('id, organization_id, role, full_name').eq('id', user.id).single();
  const { data: hotel } = await supabase.from('hotels').select('id, name').eq('organization_id', profile?.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard');

  const { data: orders } = await supabase.from('work_orders')
    .select('*, assigned_user:assigned_to(full_name, role)')
    .eq('hotel_id', hotel.id)
    .order('created_at', { ascending: false })
    .limit(200);

  const { data: staff } = await supabase.from('user_profiles')
    .select('id, full_name, role')
    .eq('organization_id', profile?.organization_id)
    .order('full_name');

  return <WorkOrdersClient orders={orders ?? []} staff={staff ?? []} hotelId={hotel.id} profile={profile} />;
}
