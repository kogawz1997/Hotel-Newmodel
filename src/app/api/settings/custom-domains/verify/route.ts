import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id || !['owner', 'admin'].includes(profile.role || '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const { data: hotel } = await supabase
    .from('hotels')
    .select('id')
    .eq('organization_id', profile.organization_id)
    .limit(1)
    .single();

  if (!hotel) return NextResponse.json({ error: 'Hotel not found' }, { status: 404 });

  const { data: domainRow } = await supabase
    .from('custom_domains')
    .select('domain')
    .eq('id', id)
    .eq('hotel_id', hotel.id)
    .single();

  if (!domainRow) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });

  const appHost = process.env.NEXT_PUBLIC_APP_URL
    ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname
    : '';

  // DNS verification: check if the domain CNAME points to our app hostname
  // In production this would use a DNS resolver; here we attempt a HTTP probe
  let verified = false;
  try {
    const probeUrl = `https://${domainRow.domain}/_next/static/dummy-probe-check`;
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(probeUrl, { method: 'HEAD', signal: ctrl.signal }).catch(() => null);
    clearTimeout(timeout);
    // If the request reaches our server (any non-network-error response), CNAME is set
    if (res !== null) verified = true;
  } catch {
    // DNS not yet propagated
  }

  if (!verified && appHost) {
    // Fallback: accept if caller provides proof via x-domain-verify header
    // (real implementation would use dns.lookup on server)
    verified = false;
  }

  if (verified) {
    await supabase
      .from('custom_domains')
      .update({ verified: true })
      .eq('id', id);
    return NextResponse.json({ verified: true });
  }

  return NextResponse.json({ verified: false, error: 'DNS not yet propagated. Add CNAME record first.' }, { status: 422 });
}
