import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { createAdminClient } from '@/lib/supabase/server';
import { randomUUID } from 'node:crypto';

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'guest.auth.register', 10, 60_000);
  if (limited) return limited;

  const body = await request.json() as {
    email: string; password: string; firstName: string;
    lastName?: string; phone?: string; marketingConsent?: boolean;
  };
  const { email, password, firstName, lastName, phone, marketingConsent } = body;
  if (!email || !password || !firstName)
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
  if (typeof password === 'string' && password.length < 8)
    return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });

  const admin = createAdminClient();

  // Check for duplicate email in guest_accounts (real email)
  const { data: existing } = await admin
    .from('guest_accounts').select('id').eq('email', email.toLowerCase()).maybeSingle();
  if (existing) return NextResponse.json({ error: 'อีเมลนี้มีบัญชีอยู่แล้ว' }, { status: 409 });

  // Create auth user with internal UUID-based email so guest credentials
  // never collide with staff accounts in auth.users.
  const guestId = randomUUID();
  const authEmail = `${guestId}@guest.internal`;
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    id: guestId,
    email: authEmail,
    password,
    email_confirm: true,
    user_metadata: { real_email: email.toLowerCase(), full_name: `${firstName} ${lastName||''}`.trim(), user_type: 'guest' },
  });
  if (authError) {
    console.error('[register] createUser failed:', authError.message);
    return NextResponse.json({ error: 'สมัครไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
  }
  if (!authData.user) return NextResponse.json({ error: 'สมัครไม่สำเร็จ' }, { status: 500 });

  const { error } = await admin.from('guest_accounts').insert({
    id: guestId,
    email: email.toLowerCase(),
    first_name: firstName,
    last_name: lastName || null,
    phone: phone || null,
    marketing_consent: marketingConsent || false,
  });
  if (error) {
    // Rollback auth user to avoid orphaned records
    await admin.auth.admin.deleteUser(guestId);
    console.error('[register] guest_accounts insert failed:', error.code, error.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
