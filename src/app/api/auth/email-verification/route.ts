import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildAuthRedirect } from '@/lib/auth/session-refresh';
import { rateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const schema = z.object({ email: z.string().email(), redirectTo: z.string().optional().default('/dashboard') });

export async function POST(request: Request) {
  const limited = await rateLimit(request, 'auth.reset', 5, 60_000);
  if (limited) return limited;

  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  const supabase = await createClient();
  const result = await supabase.auth.resend({ type: 'signup', email: parsed.data.email, options: { emailRedirectTo: buildAuthRedirect(parsed.data.redirectTo) } });
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ success: true, message: 'Verification email queued' });
}
