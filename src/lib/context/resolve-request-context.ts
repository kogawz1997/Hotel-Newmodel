import { createClient, createAdminClient } from '@/lib/supabase/server';
import { type StaffRole } from '@/lib/auth/roles';
import { type TenantContext, type SubscriptionStatus, type PlanCode } from './tenant-context';
import { type GuestContext } from './guest-context';
import { type PlatformContext, type PlatformSubRole } from './platform-context';

export type RequestContext = TenantContext | GuestContext | PlatformContext;

type TenantContextError = { ok: false; status: number; code: string };
type TenantContextOk    = { ok: true; ctx: TenantContext };

/**
 * Resolves full TenantContext for a staff API request.
 * Fetches primary role + additional roles for the hotel and returns
 * `allRoles` = union, ready for permission checks.
 */
export async function resolveTenantContext(
  hotelId: string,
): Promise<TenantContextOk | TenantContextError> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { ok: false, status: 401, code: 'AUTH_REQUIRED' };

  const admin = createAdminClient();

  // Load profile + subscription in one query via join
  const { data: profile } = await admin
    .from('user_profiles')
    .select('id, email, role, organization_id')
    .eq('id', user.id)
    .eq('active', true)
    .single();

  if (!profile) return { ok: false, status: 403, code: 'FORBIDDEN' };

  // Verify hotel belongs to this org
  const { data: hotel } = await admin
    .from('hotels')
    .select('id, active')
    .eq('id', hotelId)
    .eq('organization_id', profile.organization_id)
    .single();

  if (!hotel) return { ok: false, status: 403, code: 'FORBIDDEN' };

  // Load subscription status + plan
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('status, plan_code')
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const subscriptionStatus = (subscription?.status ?? 'active') as SubscriptionStatus;
  if (subscriptionStatus === 'suspended' || subscriptionStatus === 'cancelled') {
    return { ok: false, status: 402, code: 'TENANT_SUSPENDED' };
  }

  // Load additional roles for this hotel
  const { data: additionalRows } = await admin
    .from('user_additional_roles')
    .select('role')
    .eq('user_id', user.id)
    .eq('hotel_id', hotelId);

  const additionalRoles = (additionalRows ?? []).map(r => r.role as StaffRole);
  const primaryRole     = profile.role as StaffRole;
  const allRoles        = [primaryRole, ...additionalRoles];

  return {
    ok: true,
    ctx: {
      web: 'tenant',
      userId: user.id,
      email: user.email ?? profile.email,
      role: primaryRole,
      additionalRoles,
      allRoles,
      organizationId: profile.organization_id,
      hotelId,
      plan: (subscription?.plan_code ?? 'starter') as PlanCode,
      subscriptionStatus,
    },
  };
}

/**
 * Resolves PlatformContext for /admin/* routes.
 * Checks is_platform_admin flag; maps DB role to PlatformSubRole.
 */
export async function resolvePlatformContext(): Promise<
  { ok: true; ctx: PlatformContext } | { ok: false; status: number; code: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, code: 'AUTH_REQUIRED' };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('user_profiles')
    .select('email, role, is_platform_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_platform_admin) {
    return { ok: false, status: 403, code: 'FORBIDDEN' };
  }

  const platformRoleMap: Record<string, PlatformSubRole> = {
    platform_owner:  'platform_owner',
    billing_admin:   'platform_finance',
    support_admin:   'platform_support',
    platform_ops:    'platform_engineer',
    dev_admin:       'platform_engineer',
  };

  return {
    ok: true,
    ctx: {
      web: 'platform',
      userId: user.id,
      email: user.email ?? profile.email,
      isPlatformAdmin: true,
      platformRole: platformRoleMap[profile.role] ?? 'platform_support',
    },
  };
}

/**
 * Resolves GuestContext for /portal/* routes.
 * Returns verifiedReservationIds from the guest session claim.
 */
export async function resolveGuestContext(): Promise<
  { ok: true; ctx: GuestContext } | { ok: false; status: number; code: string }
> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, status: 401, code: 'AUTH_REQUIRED' };

  const admin = createAdminClient();
  const { data: guestAccount } = await admin
    .from('guest_accounts')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  if (!guestAccount) return { ok: false, status: 403, code: 'FORBIDDEN' };

  // Load reservation IDs this guest has verified ownership of
  const { data: reservations } = await admin
    .from('reservations')
    .select('id')
    .eq('guest_account_id', guestAccount.id)
    .in('status', ['confirmed', 'checked_in', 'checked_out']);

  return {
    ok: true,
    ctx: {
      web: 'guest',
      userId: user.id,
      guestAccountId: guestAccount.id,
      verifiedReservationIds: (reservations ?? []).map(r => r.id),
    },
  };
}
