/**
 * POST /api/approvals/[id]/resolve
 * Body: { decision: 'approved' | 'rejected'; note?: string }
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireUser } from '@/lib/auth/guards';
import { resolveApproval } from '@/lib/approvals';

const schema = z.object({
  decision: z.enum(['approved', 'rejected']),
  note:     z.string().max(500).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireUser();
  if (ctx.error) return ctx.error;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  try {
    const result = await resolveApproval(id, ctx.user!.id, parsed.data.decision, parsed.data.note);
    return NextResponse.json(result);
  } catch (err: any) {
    const status = err.message?.includes('permission') ? 403 : 500;
    return NextResponse.json({ error: err.message }, { status });
  }
}
