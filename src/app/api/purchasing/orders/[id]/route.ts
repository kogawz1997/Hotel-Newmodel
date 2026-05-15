import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

const ALLOWED_ROLES = [
  'owner', 'admin', 'manager', 'purchasing_manager', 'purchasing_staff',
  'accounting_manager', 'general_manager',
];
const APPROVER_ROLES = ['owner', 'admin', 'manager', 'purchasing_manager', 'accounting_manager', 'general_manager'];

async function getContext(orderId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, role, organization_id')
    .eq('id', user.id)
    .single();

  if (!profile || !ALLOWED_ROLES.includes(profile.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  const { data: hotel } = await admin
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) return { error: NextResponse.json({ error: 'Hotel not found' }, { status: 404 }) };

  const { data: order } = await admin
    .from('purchase_orders')
    .select('*')
    .eq('id', orderId)
    .eq('hotel_id', hotel.id)
    .single();

  if (!order) return { error: NextResponse.json({ error: 'Order not found' }, { status: 404 }) };

  return { user, profile, hotel, admin, order };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ctx = await getContext(id);
  if ('error' in ctx) return ctx.error;
  const { admin, hotel, user, profile, order } = ctx;

  const body = await req.json();
  const { action } = body as { action: 'submit' | 'approve' | 'order' | 'receive' | 'cancel' };

  // Approve/Order requires elevated roles
  if ((action === 'approve') && !APPROVER_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: 'ไม่มีสิทธิ์อนุมัติ' }, { status: 403 });
  }

  const validTransitions: Record<string, string[]> = {
    draft: ['submitted', 'cancelled'],
    submitted: ['approved', 'cancelled'],
    approved: ['ordered', 'cancelled'],
    ordered: ['received'],
    received: [],
    cancelled: [],
  };

  // Map action -> new status
  const actionToStatus: Record<string, string> = {
    submit: 'submitted',
    approve: 'approved',
    order: 'ordered',
    receive: 'received',
    cancel: 'cancelled',
  };

  const newStatus = actionToStatus[action];
  if (!newStatus) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  if (!validTransitions[order.status]?.includes(newStatus)) {
    return NextResponse.json(
      { error: `ไม่สามารถเปลี่ยนจาก ${order.status} เป็น ${newStatus} ได้` },
      { status: 400 }
    );
  }

  const updates: Record<string, unknown> = { status: newStatus };
  const now = new Date().toISOString();

  if (action === 'approve') {
    updates.approved_by = user.id;
    updates.approved_at = now;
  }
  if (action === 'order') {
    updates.ordered_at = now;
  }
  if (action === 'receive') {
    updates.received_at = now;

    // Update inventory: create stock_transactions and update inventory_items qty
    const items = order.items as Array<{
      name: string;
      qty: number;
      unit?: string;
      unit_price?: number;
      inventory_item_id?: string;
    }>;

    for (const item of items) {
      if (item.inventory_item_id) {
        // Record stock transaction
        await admin.from('stock_transactions').insert({
          hotel_id: hotel.id,
          item_id: item.inventory_item_id,
          type: 'in',
          quantity: item.qty,
          reference_type: 'purchase_order',
          reference_id: order.id,
          performed_by: user.id,
          note: `รับสินค้าจาก PO ${order.po_number}`,
        });

        // Increment inventory quantity
        const { data: invItem } = await admin
          .from('inventory_items')
          .select('quantity')
          .eq('id', item.inventory_item_id)
          .single();

        if (invItem) {
          await admin
            .from('inventory_items')
            .update({ quantity: (invItem.quantity ?? 0) + item.qty, updated_at: now })
            .eq('id', item.inventory_item_id);
        }
      }
    }
  }

  const { data, error } = await admin
    .from('purchase_orders')
    .update(updates)
    .eq('id', order.id)
    .select('*, supplier:supplier_id(id, name), requester:requested_by(id, full_name), approver:approved_by(id, full_name)')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ order: data });
}
