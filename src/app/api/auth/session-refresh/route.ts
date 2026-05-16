import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { deriveSessionRefreshState } from '@/lib/auth/session-refresh';
import { rateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const schema = z.object({ refreshToken: z.string().min(20).optional() });

export async function GET(request: Request) {
  const limited = await rateLimit(request, 'auth.refresh', 20, 60_000);
  if (limited) return limited;

  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return NextResponse.json({ session: deriveSessionRefreshState(data.session?.expires_at) });
}

export async function POST(request: Request) {
  const limited = await rateLimit(request, 'auth.refresh', 20, 60_000);
  if (limited) return limited;

  let raw: unknown;
  try { raw = await request.json(); } catch { raw = {}; }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors }, { status: 422 });
  const supabase = await createClient();
  const { data, error } = parsed.data.refreshToken
    ? await supabase.auth.refreshSession({ refresh_token: parsed.data.refreshToken })
    : await supabase.auth.refreshSession();
  if (error) return NextResponse.json({ error: error.message }, { status: 401 });
  return NextResponse.json({ success: true, session: deriveSessionRefreshState(data.session?.expires_at) });
}
