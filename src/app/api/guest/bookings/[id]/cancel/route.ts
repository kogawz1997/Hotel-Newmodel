import { NextResponse } from 'next/server';
import { z } from 'zod';
import { assertReservationAccess } from '@/lib/auth/guards';
import { calculateCancellationQuote } from '@/lib/pms/cancellation-policy';
import { apiError } from '@/lib/http/errors';

export const dynamic = 'force-dynamic';

const schema = z.object({ reason: z.string().max(500).optional().nullable(), confirm: z.boolean().default(false) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  const ctx = await assertReservationAccess(id);
  if (ctx.error) return ctx.error;
  if (!ctx.reservation) return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
  const quote = calculateCancellationQuote({ checkIn: ctx.reservation.check_in, totalAmount: Number(ctx.reservation.total_amount || 0), paidAmount: Number(ctx.reservation.paid_amount || 0), policy: ctx.reservation.cancellation_policy || null });
  if (!parsed.data.confirm) return NextResponse.json({ success: true, quote, requiresConfirm: true });
  const { data, error } = await ctx.supabase.from('reservations').update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: parsed.data.reason || null, cancellation_quote: quote }).eq('id', id).select().single();
  if (error) return apiError(error);
  return NextResponse.json({ success: true, reservation: data, quote });
}
