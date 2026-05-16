export const dynamic = 'force-dynamic';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { redirect } from 'next/navigation';
import { TopBar } from '@/components/layout/top-bar';
import { DietaryAlertsClient } from './dietary-alerts-client';

export default async function DietaryAlertsPage() {
  const { supabase, profile } = await requireDashboardRole(['owner', 'admin', 'manager', 'fnb_manager', 'restaurant_staff'] as any[]);
  const { data: hotel } = await supabase.from('hotels').select('id').eq('organization_id', profile.organization_id).limit(1).single();
  if (!hotel) redirect('/dashboard/onboarding');

  // Fetch active reservations with dietary preferences for guests currently staying
  const today = new Date().toISOString().slice(0, 10);
  const [reservationsRes, ordersRes] = await Promise.all([
    supabase.from('reservations')
      .select('id, guest_name, room_id, dietary_requirements, allergies, special_requests, rooms(room_number)')
      .eq('hotel_id', hotel.id)
      .eq('status', 'checked_in')
      .not('dietary_requirements', 'is', null),
    supabase.from('fb_orders')
      .select('id, created_at, table_number, status, reservation_id, fb_order_items(name, qty, menu_item_id)')
      .eq('hotel_id', hotel.id)
      .in('status', ['open', 'preparing'])
      .gte('created_at', today + 'T00:00:00'),
  ]);

  return (
    <div className="container max-w-5xl py-8 animate-fade-in">
      <TopBar title="Dietary & Allergy Alerts" description="แจ้งเตือนครัวเมื่อแขกมีข้อจำกัดด้านอาหาร" />
      <DietaryAlertsClient hotelId={hotel.id} guests={(reservationsRes.data || []) as any[]} activeOrders={(ordersRes.data || []) as any[]} />
    </div>
  );
}
