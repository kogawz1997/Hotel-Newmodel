import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireCronSecret } from '@/lib/auth/guards';
import { prepareOtaJob } from '@/lib/ota/provider-workers';

export const dynamic = 'force-dynamic';

const schema = z.object({ hotelId: z.string().uuid().optional().nullable(), type: z.string().default('reservation_pull'), attempts: z.coerce.number().int().min(0).default(0), payload: z.record(z.unknown()).optional().default({}) });

export async function POST(request: Request) {
  const unauthorized = requireCronSecret(request);
  if (unauthorized) return unauthorized;
  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  return NextResponse.json({ success: true, job: prepareOtaJob({ provider: 'trip_com', ...parsed.data }) });
}
