export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { requireDashboardRole } from '@/lib/auth/page-guards';
import { PurchasingClient } from './purchasing-client';

const ALLOWED_ROLES = [
  'owner', 'admin', 'manager', 'purchasing_manager', 'purchasing_staff',
  'accounting_manager', 'general_manager',
] as any[];

export default async function PurchasingPage() {
  const { user, profile } = await requireDashboardRole(ALLOWED_ROLES);

  const admin = createAdminClient();

  const { data: hotel } = await admin
    .from('hotels')
    .select('id, name')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) redirect('/dashboard');

  const [
    { data: orders },
    { data: suppliers },
    { data: inventoryAll },
  ] = await Promise.all([
    admin
      .from('purchase_orders')
      .select('*, supplier:supplier_id(id, name, contact_name, phone), requester:requested_by(id, full_name), approver:approved_by(id, full_name)')
      .eq('hotel_id', hotel.id)
      .order('created_at', { ascending: false })
      .limit(100),
    admin
      .from('suppliers')
      .select('*')
      .eq('hotel_id', hotel.id)
      .eq('is_active', true)
      .order('name'),
    admin
      .from('inventory_items')
      .select('*, supplier:supplier_id(id, name)')
      .eq('hotel_id', hotel.id)
      .order('name'),
  ]);

  const lowStockItems = (inventoryAll ?? []).filter(
    (i: any) => i.min_stock != null && i.quantity <= i.min_stock
  );

  return (
    <PurchasingClient
      hotel={hotel}
      profile={{ id: profile.id, role: profile.role }}
      userId={user.id}
      initialOrders={orders ?? []}
      initialSuppliers={suppliers ?? []}
      initialInventory={inventoryAll ?? []}
      lowStockCount={lowStockItems.length}
    />
  );
}
