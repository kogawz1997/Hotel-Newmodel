import { NextResponse } from 'next/server';
import { assertReservationAccess } from '@/lib/auth/guards';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await assertReservationAccess(id);
  if (ctx.error) return ctx.error;
  if (!ctx.reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  const { data } = await ctx.supabase.from('folios').select('*, folio_items(*)').eq('reservation_id', id).limit(1).maybeSingle();
  return NextResponse.json({ success: true, invoice: { reservation: ctx.reservation, folio: data || null, downloadFormat: 'json_pdf_ready' } });
}
