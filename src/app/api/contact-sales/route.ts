import { NextResponse } from 'next/server';
import { z } from 'zod';
import { buildAuditEnvelope } from '@/lib/master-4p/production-suite';

export const dynamic = 'force-dynamic';

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  hotelName: z.string().max(160).optional(),
  rooms: z.coerce.number().int().min(1).max(10000).optional(),
  message: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  return NextResponse.json(buildAuditEnvelope('contact_sales.lead_created', { lead: parsed.data, delivery: process.env.SENDGRID_API_KEY ? 'sendgrid_ready' : 'handoff_log_only' }));
}
