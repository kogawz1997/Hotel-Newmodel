import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { validateCsrfOrigin } from '@/lib/security/csrf';
import { redactPii } from '@/lib/utils/redact';
import { rateLimit } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'guest.auth.login', 5, 60_000);
  if (limited) return limited;

  const csrf = validateCsrfOrigin(request);
  if (csrf.ok === false) return NextResponse.json({ error: `CSRF validation failed: ${csrf.reason}` }, { status: 403 });

  const body = await request.json() as { email: string; password: string };
  const { email, password } = body;
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';

  // Look up guest by real email — guest auth emails are UUID-based (@guest.internal)
  // and never overlap with staff accounts.
  const admin = createAdminClient();
  const { data: guestAccount } = await admin
    .from('guest_accounts')
    .select('id,first_name,last_name')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (!guestAccount) {
    return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }

  // Reconstruct the internal auth email from the guest UUID
  const authEmail = `${guestAccount.id}@guest.internal`;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });
  if (error) {
    return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }

  // Basic IP anomaly signal for guest sign-ins.
  const { data: recentLogins } = await supabase
    .from('audit_logs')
    .select('changes')
    .eq('user_id', data.user.id)
    .eq('action', 'guest.login')
    .order('created_at', { ascending: false })
    .limit(5);
  const knownIps = new Set(
    (recentLogins || [])
      .map((x: { changes?: { ip?: string } }) => String(x?.changes?.ip || ''))
      .filter(Boolean)
  );
  const ipAnomaly = knownIps.size > 0 && !knownIps.has(ip);

  await supabase.from('audit_logs').insert({
    user_id: data.user.id,
    action: ipAnomaly ? 'guest.login.anomaly' : 'guest.login',
    entity_type: 'guest_account',
    entity_id: data.user.id,
    changes: redactPii({ ip, userAgent, ipAnomaly }),
  });

  return NextResponse.json({ success: true, guest: guestAccount });
}
