import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/security/rate-limit';
import { sendPasswordResetEmail } from '@/lib/email-templates';

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, 'guest.auth.forgot-password', 5, 60_000);
  if (limited) return limited;

  const body = await request.json() as { email: string };
  const { email } = body;

  // Always return success to avoid email enumeration
  if (!email) return NextResponse.json({ success: true });

  const admin = createAdminClient();
  const { data: guest } = await admin
    .from('guest_accounts')
    .select('id,first_name')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (!guest) return NextResponse.json({ success: true });

  const authEmail = `${guest.id}@guest.internal`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const { data: linkData, error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: authEmail,
    options: { redirectTo: `${appUrl}/portal/reset-password` },
  });

  if (error || !linkData?.properties?.action_link) {
    console.error('[forgot-password] generateLink failed:', error?.message);
    return NextResponse.json({ success: true }); // silent fail to avoid enumeration
  }

  try {
    await sendPasswordResetEmail({
      to: email,
      guestName: guest.first_name || 'คุณ',
      resetUrl: linkData.properties.action_link,
    });
  } catch (e) {
    console.error('[forgot-password] sendPasswordResetEmail failed:', e);
  }

  return NextResponse.json({ success: true });
}
