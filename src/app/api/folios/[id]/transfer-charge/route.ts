/**
 * Transfer folio items from one folio to another.
 * Used for: room-to-room charge transfer, comp posting, split-bill corrections.
 * POST /api/folios/{id}/transfer-charge
 * Body: { itemIds: string[], targetFolioId: string, note?: string }
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseJson } from '@/lib/http/validation';
import { requireHotelAccess } from '@/lib/auth/guards';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';

const schema = z.object({
  itemIds: z.array(z.string().uuid()).min(1).max(50),
  targetFolioId: z.string().uuid(),
  note: z.string().max(500).optional().nullable(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const limited = await rateLimit(request, 'folios.transfer-charge', 20, 60_000);
  if (limited) return limited;

  const { id: sourceFolioId } = await params;

  const parsed = await parseJson(request, schema);
  if (parsed.error) return parsed.error;

  const { itemIds, targetFolioId, note } = parsed.data;

  if (sourceFolioId === targetFolioId) {
    return NextResponse.json({ error: 'Source and target folio must be different' }, { status: 400 });
  }

  const admin = createAdminClient();

  const [{ data: sourceFolio }, { data: targetFolio }] = await Promise.all([
    admin.from('folios').select('id, hotel_id, status').eq('id', sourceFolioId).single(),
    admin.from('folios').select('id, hotel_id, status').eq('id', targetFolioId).single(),
  ]);

  if (!sourceFolio) return NextResponse.json({ error: 'Source folio not found' }, { status: 404 });
  if (!targetFolio) return NextResponse.json({ error: 'Target folio not found' }, { status: 404 });

  if (sourceFolio.hotel_id !== targetFolio.hotel_id) {
    return NextResponse.json({ error: 'Cannot transfer between different hotels' }, { status: 400 });
  }

  const ctx = await requireHotelAccess(sourceFolio.hotel_id, ['owner', 'admin', 'manager', 'front_desk', 'accounting', 'accounting_manager']);
  if (ctx.error) return ctx.error;

  if (sourceFolio.status === 'closed') {
    return NextResponse.json({ error: 'Cannot transfer from a closed folio' }, { status: 409 });
  }
  if (targetFolio.status === 'closed') {
    return NextResponse.json({ error: 'Cannot transfer to a closed folio' }, { status: 409 });
  }

  // Verify all items belong to source folio
  const { data: items, error: itemsErr } = await admin
    .from('folio_items')
    .select('id, amount, description')
    .eq('folio_id', sourceFolioId)
    .in('id', itemIds);

  if (itemsErr) return NextResponse.json({ error: 'Failed to fetch folio items' }, { status: 500 });

  const foundIds = new Set((items || []).map((i: any) => i.id));
  const missing = itemIds.filter(id => !foundIds.has(id));
  if (missing.length > 0) {
    return NextResponse.json({ error: `Items not found in source folio: ${missing.join(', ')}` }, { status: 400 });
  }

  const totalTransferred = (items || []).reduce((s: number, i: any) => s + Number(i.amount || 0), 0);

  // Move items to target folio
  const { error: moveErr } = await admin
    .from('folio_items')
    .update({ folio_id: targetFolioId })
    .in('id', itemIds);

  if (moveErr) return NextResponse.json({ error: 'Failed to transfer items' }, { status: 500 });

  // Add audit note items to both folios
  const transferNote = note || `Transferred ${itemIds.length} item(s) to folio ${targetFolioId.slice(0, 8)}`;
  const receiveNote = `Received ${itemIds.length} item(s) from folio ${sourceFolioId.slice(0, 8)}`;

  await Promise.all([
    admin.from('folio_items').insert({
      folio_id: sourceFolioId,
      type: 'adjustment',
      description: transferNote,
      amount: 0,
      quantity: 1,
      posted_by: ctx.user?.id || null,
      reference_type: 'transfer_out',
      reference_id: targetFolioId,
    }),
    admin.from('folio_items').insert({
      folio_id: targetFolioId,
      type: 'adjustment',
      description: receiveNote,
      amount: 0,
      quantity: 1,
      posted_by: ctx.user?.id || null,
      reference_type: 'transfer_in',
      reference_id: sourceFolioId,
    }),
  ]);

  // Recalculate both folio totals
  await Promise.all([
    admin.rpc('recalculate_folio_totals', { p_folio_id: sourceFolioId }).catch(() => null),
    admin.rpc('recalculate_folio_totals', { p_folio_id: targetFolioId }).catch(() => null),
  ]);

  await admin.from('audit_logs').insert({
    hotel_id: sourceFolio.hotel_id,
    user_id: ctx.user?.id || null,
    action: 'folio.charge_transferred',
    entity_type: 'folio',
    entity_id: sourceFolioId,
    changes: { itemIds, targetFolioId, totalTransferred, note },
  });

  return NextResponse.json({
    success: true,
    itemsTransferred: itemIds.length,
    totalTransferred,
    sourceFolioId,
    targetFolioId,
  });
}
