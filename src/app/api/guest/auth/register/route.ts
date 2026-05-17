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

  try {
    const supabase = await createClient();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: String(email),
      password: String(password),
      options: {
        emailRedirectTo: `${appUrl}/portal/login?verified=1`,
        data: {
          full_name: `${firstName} ${lastName ?? ''}`.trim(),
          user_type: 'guest',
        },
      },
    });

    if (authError) return authApiError(authError);
    if (!authData.user)
      return NextResponse.json({ error: 'สมัครไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });

    // Supabase returns a user even for existing emails (to avoid enumeration).
    // identities === [] means the email is already registered.
    if (authData.user.identities?.length === 0) {
      return NextResponse.json(
        { error: 'อีเมลนี้ถูกลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ' },
        { status: 409 },
      );
    }

    const admin = createAdminClient();
    const { error: dbErr } = await admin.from('guest_accounts').insert({
      id: authData.user.id,
      email: String(email),
      first_name: String(firstName),
      last_name: lastName ? String(lastName) : null,
      phone: phone ? String(phone) : null,
      marketing_consent: Boolean(marketingConsent),
    });

    if (dbErr) {
      console.error('[guest/auth/register] guest_accounts insert failed', {
        code: dbErr.code,
        message: dbErr.message,
      });
      // 23505 = unique violation — email already exists in guest_accounts
      if (dbErr.code === '23505') {
        return NextResponse.json(
          { error: 'อีเมลนี้ถูกลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ' },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: 'บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[guest/auth/register] unexpected error', err);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่ในภายหลัง' }, { status: 500 });
  }
}

/** Map Supabase AuthError (has .status) to an appropriate HTTP response. */
function authApiError(error: { message?: string; status?: number; name?: string }): NextResponse {
  const status = typeof error.status === 'number' ? error.status : 500;
  const msg = error.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่';

  // Translate common Supabase auth messages to Thai user-friendly versions
  if (msg.includes('User already registered') || msg.includes('already been registered')) {
    return NextResponse.json(
      { error: 'อีเมลนี้ถูกลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ' },
      { status: 409 },
    );
  }
  if (msg.includes('Password should be')) {
    return NextResponse.json(
      { error: 'รหัสผ่านไม่ตรงตามเงื่อนไข กรุณาตรวจสอบอีกครั้ง' },
      { status: 400 },
    );
  }
  if (msg.includes('rate limit') || status === 429) {
    return NextResponse.json(
      { error: 'ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' },
      { status: 429 },
    );
  }
  if (status >= 400 && status < 500) {
    return NextResponse.json({ error: msg }, { status });
  }

  // 5xx from Supabase (project paused, network error, etc.)
  console.error('[guest/auth/register] Supabase auth error', { status, message: msg });
  return NextResponse.json(
    { error: 'ระบบยืนยันตัวตนขัดข้องชั่วคราว กรุณาลองใหม่ในภายหลัง' },
    { status: 503 },
  );
}
