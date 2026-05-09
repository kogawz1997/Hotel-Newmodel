import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireHotelAccess, requireUser } from '@/lib/auth/guards';
import { buildAuditEnvelope } from '@/lib/master-4p/production-suite';

export const dynamic = 'force-dynamic';

const schema = z.object({
  hotelId: z.string().uuid().optional().nullable(),
  reservationId: z.string().uuid().optional().nullable(),
  guestId: z.string().uuid().optional().nullable(),
  action: z.string().max(80).optional().default('pms.reservation_timeline'),
  note: z.string().max(1000).optional().nullable(),
  payload: z.record(z.unknown()).optional().default({}),
}).passthrough();

export async function GET(request: Request) {
  const url = new URL(request.url);

  const hotelId = url.searchParams.get('hotelId');
  const ctx = await requireHotelAccess(hotelId);
  if (ctx.error) return ctx.error;

  return NextResponse.json(buildAuditEnvelope('pms.reservation_timeline.read', { hotelId: (ctx as any).hotelId || null, status: 'ready' }));
}

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  const ctx = parsed.data.hotelId ? await requireHotelAccess(parsed.data.hotelId) : await requireHotelAccess(null);
  if (ctx.error) return ctx.error;

  return NextResponse.json(buildAuditEnvelope('pms.reservation_timeline.write', { hotelId: ctx.hotelId, ...parsed.data }));
}
