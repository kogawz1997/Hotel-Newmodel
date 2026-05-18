import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { apiError } from '@/lib/http/errors';

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'guest.auth.register', 10, 60_000);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { email, password, firstName, lastName, phone, marketingConsent } =
    body as Record<string, unknown>;

  if (!email || !password || !firstName)
    return NextResponse.json({ error: 'กรุณากรอกข้อมูลให้ครบ' }, { status: 400 });
  if (typeof password === 'string' && password.length < 8)
    return NextResponse.json({ error: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' }, { status: 400 });

  const supabase = await createClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email, password,
    options: {
      emailRedirectTo: `${appUrl}/portal/login?verified=1`,
      data: { full_name: `${firstName} ${lastName||''}`.trim(), user_type: 'guest' },
    },
  });
  if (authError) return apiError(authError);
  if (!authData.user) return NextResponse.json({ error: 'สมัครไม่สำเร็จ' }, { status: 500 });

  const admin = createAdminClient();
  // Use upsert: a DB trigger may have already created a partial guest_accounts row
  // on auth.users insert. Upserting ensures our full data wins without 409 conflicts.
  const { error } = await admin.from('guest_accounts').upsert({
    id: authData.user.id, email,
    first_name: firstName, last_name: lastName || null,
    phone: phone || null, marketing_consent: marketingConsent || false,
  }, { onConflict: 'id' });
  if (error) return NextResponse.json({ error: dbError(error) }, { status: 500 });
  return NextResponse.json({ success: true });
}
