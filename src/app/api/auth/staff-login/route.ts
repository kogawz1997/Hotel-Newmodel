import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { validateCsrfOrigin } from '@/lib/security/csrf';

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'auth.staff-login', 5, 60_000);
  if (limited) return limited;

  const csrf = validateCsrfOrigin(request);
  if (csrf.ok === false) return NextResponse.json({ error: `CSRF: ${csrf.reason}` }, { status: 403 });

  const body = await request.json() as { email: string; password: string };
  const { email, password } = body;
  if (!email || !password) return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });

  const admin = createAdminClient();

  // Look up the staff profile by real_email.
  // Accounts created by hotel owners store real_email; self-registered owners
  // have real_email = NULL and use their actual email directly in auth.users.
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, real_email, active, role, organization_id')
    .eq('real_email', email.toLowerCase())
    .eq('active', true)
    .maybeSingle();

  let authEmail: string;

  if (profile) {
    // Hotel-created staff account: reconstruct internal auth email from UUID
    authEmail = `${profile.id}@staff.internal`;
  } else {
    // Self-registered owner: auth email IS the real email
    authEmail = email.toLowerCase();
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: authEmail, password });

  if (error) {
    return NextResponse.json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' }, { status: 401 });
  }

  // For self-registered owners: fetch profile by auth user id
  const resolvedProfile = profile ?? await (async () => {
    const { data: p } = await admin
      .from('user_profiles')
      .select('id, active, role, organization_id')
      .eq('id', data.user.id)
      .maybeSingle();
    return p;
  })();

  if (!resolvedProfile || !resolvedProfile.active) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: 'บัญชีนี้ถูกระงับการใช้งาน' }, { status: 403 });
  }

  const ownerRoles = ['owner', 'hotel_owner', 'general_manager', 'admin'];
  const isOwner = ownerRoles.includes(resolvedProfile.role || '');

  let redirectTo: string;
  if (isOwner && !resolvedProfile.organization_id) {
    redirectTo = '/admin';
  } else if (isOwner) {
    redirectTo = '/owner/hotels';
  } else {
    redirectTo = '/dashboard';
  }

  return NextResponse.json({ success: true, redirectTo });
}
