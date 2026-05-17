import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { parseJson } from '@/lib/http/validation';
import { rateLimit } from '@/lib/security/rate-limit';
import { getPlan } from '@/lib/billing/plans';

export const dynamic = 'force-dynamic';

function toSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ก-๙]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'hotel';
}

function uniqueSlug(base: string) {
  return `${toSlug(base)}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function GET(request: Request) {
  const limited = await rateLimit(request, 'owner.hotels.get', 60, 60_000);
  if (limited) return limited;

  const sessionSupabase = await createClient();
  const { data: { user }, error: authError } = await sessionSupabase.auth.getUser();
  if (authError || !user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('user_profiles')
    .select('organization_id, role, active')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !profile.active) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!profile.organization_id) {
    return NextResponse.json({
      hotels: [],
      organization: null,
      plan: getPlan('starter'),
    });
  }

  const [{ data: org }, { data: hotels }] = await Promise.all([
    admin
      .from('organizations')
      .select('id, name, slug, subscription_plan, subscription_status, trial_ends_at')
      .eq('id', profile.organization_id)
      .maybeSingle(),
    admin
      .from('hotels')
      .select('id, name, slug, type, city, status, created_at')
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: true }),
  ]);

  const planKey = org?.subscription_plan || 'starter';
  const plan = getPlan(planKey);

  return NextResponse.json({
    hotels: hotels ?? [],
    organization: org ?? null,
    plan: {
      key: plan.key,
      name: plan.name,
      monthlyPrice: plan.monthlyPrice,
      limits: plan.limits,
    },
  });
}

const postSchema = z.object({
  name: z.string().trim().min(1).max(160),
  type: z.enum(['hotel', 'resort', 'boutique', 'hostel', 'pool_villa', 'serviced_apartment']).default('hotel'),
  city: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  const limited = await rateLimit(request, 'owner.hotels.post', 10, 60_000);
  if (limited) return limited;

  const parsed = await parseJson(request, postSchema);
  if (parsed.error) return parsed.error;
  const { name, type, city } = parsed.data;

  const sessionSupabase = await createClient();
  const { data: { user }, error: authError } = await sessionSupabase.auth.getUser();
  if (authError || !user?.id || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('user_profiles')
    .select('organization_id, role, active')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile || !profile.active) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let organizationId = profile.organization_id as string | null;

  if (!organizationId) {
    // New user — create org + hotel in one go
    const orgSlug = uniqueSlug(name);
    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({
        name,
        slug: orgSlug,
        billing_email: user.email,
      })
      .select('id')
      .single();

    if (orgError) {
      console.error('[owner/hotels POST] org create error', orgError);
      return NextResponse.json({ error: 'Failed to create organization' }, { status: 500 });
    }

    organizationId = org.id as string;

    // Link user to org
    const { error: profileUpdateError } = await admin
      .from('user_profiles')
      .update({ organization_id: organizationId })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('[owner/hotels POST] profile update error', profileUpdateError);
    }

    const hotelSlug = orgSlug;
    const { data: hotel, error: hotelError } = await admin
      .from('hotels')
      .insert({
        organization_id: organizationId,
        name,
        slug: hotelSlug,
        type,
        city: city ?? null,
        email: user.email,
        currency: 'THB',
        country: 'TH',
        timezone: 'Asia/Bangkok',
      })
      .select('id, name, slug, type, city, status, created_at')
      .single();

    if (hotelError) {
      console.error('[owner/hotels POST] hotel create error', hotelError);
      return NextResponse.json({ error: 'Failed to create hotel' }, { status: 500 });
    }

    return NextResponse.json({ hotel }, { status: 201 });
  }

  // Existing org — check hotel count vs plan limit
  const { data: org } = await admin
    .from('organizations')
    .select('subscription_plan')
    .eq('id', organizationId)
    .maybeSingle();

  const planKey = org?.subscription_plan || 'starter';
  const plan = getPlan(planKey);
  const hotelLimit = plan.limits.hotels;

  if (hotelLimit !== 'custom') {
    const { count } = await admin
      .from('hotels')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    const current = count ?? 0;
    if (current >= (hotelLimit as number)) {
      // Find the next plan that allows more hotels
      const { BILLING_PLANS } = await import('@/lib/billing/plans');
      const upgradePlan = BILLING_PLANS.find(p => {
        const l = p.limits.hotels;
        return l === 'custom' || (typeof l === 'number' && l > (hotelLimit as number));
      });
      return NextResponse.json(
        { error: 'limit', upgrade: upgradePlan?.key ?? 'pro', current, limit: hotelLimit },
        { status: 402 }
      );
    }
  }

  const hotelSlug = uniqueSlug(name);
  const { data: hotel, error: hotelError } = await admin
    .from('hotels')
    .insert({
      organization_id: organizationId,
      name,
      slug: hotelSlug,
      type,
      city: city ?? null,
      email: user.email,
      currency: 'THB',
      country: 'TH',
      timezone: 'Asia/Bangkok',
    })
    .select('id, name, slug, type, city, status, created_at')
    .single();

  if (hotelError) {
    console.error('[owner/hotels POST] hotel create error', hotelError);
    return NextResponse.json({ error: 'Failed to create hotel' }, { status: 500 });
  }

  return NextResponse.json({ hotel }, { status: 201 });
}
