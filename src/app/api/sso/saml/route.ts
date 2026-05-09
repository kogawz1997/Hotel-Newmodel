import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/guards';
import { buildAuditEnvelope } from '@/lib/master-4p/production-suite';

export const dynamic = 'force-dynamic';

const schema = z.object({ organizationId: z.string().uuid().optional(), idpMetadataUrl: z.string().url().optional(), entityId: z.string().max(200).optional() });

export async function GET() {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  return NextResponse.json(buildAuditEnvelope('sso.saml.metadata', { status: 'ready_for_idp_metadata' }));
}

export async function POST(request: Request) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;
  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  return NextResponse.json(buildAuditEnvelope('sso.saml.configured', parsed.data));
}
