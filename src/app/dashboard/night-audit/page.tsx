export const dynamic = 'force-dynamic';
import { createAdminClient } from '@/lib/supabase/server';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { NightAuditClient } from './night-audit-client';

export default async function NightAuditPage() {
  const access = await requireDashboardRole(['hotel_owner','general_manager','operations_manager','accounting_manager','night_auditor']);
  if ('redirect' in access) return null;
  const { hotelId } = access;
  const admin = createAdminClient();
  const today = new Date().toISOString().split('T')[0];
  const [
    { data: reservations },
    { data: cashierSessions },
    { data: folios },
  ] = await Promise.all([
    admin.from('reservations').select('id, reservation_no, guest_name, room_no, check_in, check_out, status, total_amount')
      .eq('hotel_id', hotelId)
      .in('status', ['checked_in','due_out'])
      .order('check_out'),
    admin.from('cashier_sessions').select('*').eq('hotel_id', hotelId)
      .gte('opened_at', today).order('opened_at', { ascending: false }),
    admin.from('folios').select('*, reservations(reservation_no, guest_name)')
      .eq('hotel_id', hotelId)
      .eq('status', 'open').order('created_at', { ascending: false }).limit(50),
  ]);
  return (
    <NightAuditClient
      reservations={reservations || []}
      cashierSessions={cashierSessions || []}
      folios={folios || []}
      today={today}
    />
  );
}
