import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { deriveSessionRefreshState } from '@/lib/auth/session-refresh';

export const dynamic = 'force-dynamic';

const schema = z.object({ refreshToken: z.string().min(20).optional() });

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getSession();
  return NextResponse.json({ session: deriveSessionRefreshState(data.session?.expires_at) });
}

export async function POST(request: Request) {
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
