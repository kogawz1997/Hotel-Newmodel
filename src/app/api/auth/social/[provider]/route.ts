import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildAuthRedirect } from '@/lib/auth/session-refresh';
import { rateLimit } from '@/lib/security/rate-limit';

export const dynamic = 'force-dynamic';

const providers = new Set(['google', 'facebook', 'github', 'azure']);

export async function GET(request: Request, { params }: { params: Promise<{ provider: string }> }) {
  const limited = await rateLimit(request, 'auth.social', 10, 60_000);
  if (limited) return limited;

  const { provider } = await params;
  const url = new URL(request.url);
  if (!providers.has(provider)) return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as any,
    options: { redirectTo: buildAuthRedirect(url.searchParams.get('redirectTo') || '/dashboard') },
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.redirect(data.url);
}
