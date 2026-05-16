import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';

async function performLogout(request: Request) {
  const limited = await rateLimit(request, 'auth.refresh', 20, 60_000);
  if (limited) return limited;

  const supabase = await createClient();
  await supabase.auth.signOut();
  const url = new URL(request.url);
  const rawNext = url.searchParams.get('next') || '';
  // Only allow same-origin relative paths to prevent open redirect
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/backoffice/login';
  return NextResponse.redirect(new URL(next, request.url));
}

export async function GET(request: Request) {
  return performLogout(request);
}

export async function POST(request: Request) {
  return performLogout(request);
}
