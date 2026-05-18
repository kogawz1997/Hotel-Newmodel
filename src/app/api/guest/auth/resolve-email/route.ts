import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';

// Returns the internal auth email for a guest real email.
// Called client-side before signInWithPassword so the browser Supabase client
// can manage the session cookie directly (avoids server-side cookie forwarding issues).
export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'guest.auth.resolve', 10, 60_000);
  if (limited) return limited;

  const body = await request.json() as { email: string };
  const { email } = body;
  if (!email) return NextResponse.json({ error: 'Missing email' }, { status: 400 });

  const admin = createAdminClient();
  const { data: guest } = await admin
    .from('guest_accounts')
    .select('id')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (!guest) {
    // Return a fake-looking auth email so the client gets a generic wrong-password error
    // rather than revealing whether the email exists.
    return NextResponse.json({ authEmail: `unknown@guest.internal` });
  }

  return NextResponse.json({ authEmail: `${guest.id}@guest.internal` });
}
