import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { requireHotelAccess } from '@/lib/auth/guards';
import { z } from 'zod';

const patchSchema = z.object({
  status: z.enum(['new', 'preparing', 'ready', 'delivered', 'cancelled']),
  kitchen_note: z.string().optional().nullable(),
});

const STATUS_TRANSITIONS: Record<string, string[]> = {
  new: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { status, kitchen_note } = parsed.data;
  const admin = createAdminClient();

  // Fetch current record
  const { data: existing, error: fetchErr } = await admin
    .from('kitchen_queue')
    .select('id, status, hotel_id, fb_orders(hotel_id)')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Validate transition
  const allowed = STATUS_TRANSITIONS[existing.status] ?? [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `Cannot transition from "${existing.status}" to "${status}"` },
      { status: 409 }
    );
  }

  // Build timestamp fields
  const now = new Date().toISOString();
  const timestampPatch: Record<string, string | null> = {};
  if (status === 'preparing') timestampPatch.started_at = now;
  if (status === 'ready') timestampPatch.ready_at = now;
  if (status === 'delivered') timestampPatch.delivered_at = now;

  const updatePayload: Record<string, unknown> = {
    status,
    ...timestampPatch,
  };
  if (kitchen_note !== undefined) updatePayload.kitchen_note = kitchen_note;

  const { data, error } = await admin
    .from('kitchen_queue')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}
