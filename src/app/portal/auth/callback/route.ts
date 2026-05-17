import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/portal/bookings';

  if (!code) {
    return NextResponse.redirect(`${origin}/portal/login?error=oauth_failed`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/portal/login?error=oauth_failed`);
  }

  // Block staff accounts from using guest portal
  const { data: staffProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (staffProfile) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/portal/login?error=staff_account`);
  }

  // Create guest_account row for first-time social login users
  const { data: existingGuest } = await supabase
    .from('guest_accounts')
    .select('id')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!existingGuest) {
    const meta = data.user.user_metadata ?? {};
    const fullName: string = meta.full_name || meta.name || '';
    const [firstName, ...rest] = fullName.split(' ');
    await supabase.from('guest_accounts').insert({
      id: data.user.id,
      email: data.user.email!,
      first_name: firstName || meta.given_name || data.user.email!.split('@')[0],
      last_name: rest.join(' ') || meta.family_name || '',
      avatar_url: meta.avatar_url || meta.picture || null,
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
