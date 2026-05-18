import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { createAdminClient } from '@/lib/supabase/server';

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
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email, password,
    email_confirm: true,
    user_metadata: { full_name: `${firstName} ${lastName||''}`.trim(), user_type: 'guest' },
  });
  if (authError) {
    if (authError.message?.toLowerCase().includes('already registered') || (authError as any).code === 'email_exists') {
      return NextResponse.json({ error: 'อีเมลนี้มีบัญชีอยู่แล้ว' }, { status: 409 });
    }
    return NextResponse.json({ error: 'สมัครไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 });
  }
  if (!authData.user) return NextResponse.json({ error: 'สมัครไม่สำเร็จ' }, { status: 500 });

  const { error } = await admin.from('guest_accounts').upsert({
    id: authData.user.id, email,
    first_name: firstName, last_name: lastName || null,
    phone: phone || null, marketing_consent: marketingConsent || false,
  }, { onConflict: 'id' });
  if (error) {
    console.error('[register] guest_accounts upsert failed:', error.code, error.message);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
