import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { ACCESS_POLICIES } from '@/lib/security/access-policies';
import { ROUTE_ROLES } from '@/lib/auth/roles';

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Portal pages that don't require a session (auth flow pages)
const PORTAL_PUBLIC = [
  '/portal/login',
  '/portal/forgot-password',
  '/portal/reset-password',
  '/portal/auth',
];

const KNOWN_HOSTNAME_PATTERNS = ['localhost', '127.0.0.1', 'vercel.app', 'vercel.dev'];

function isKnownHost(host: string): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const appHost = appUrl ? new URL(appUrl).hostname : '';
  const configured = [
    appHost,
    process.env.NEXT_PUBLIC_PORTAL_HOST,
    process.env.NEXT_PUBLIC_BACKOFFICE_HOST,
  ].filter(Boolean);
  return (
    KNOWN_HOSTNAME_PATTERNS.some(p => host === p || host.endsWith(`.${p}`)) ||
    configured.some(h => host === h || host.endsWith(`.${h!}`))
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const portalHost = process.env.NEXT_PUBLIC_PORTAL_HOST;
  const backofficeHost = process.env.NEXT_PUBLIC_BACKOFFICE_HOST;
  const host = request.nextUrl.hostname;
  const hostWithPort = request.nextUrl.host;

  // ─── Custom domain routing ──────────────────────────────────────────
  if (!isKnownHost(host)) {
    const domainClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll() { return request.cookies.getAll(); }, setAll() {} } }
    );
    const { data: domainRow } = await domainClient
      .from('custom_domains')
      .select('hotels(slug)')
      .eq('domain', host)
      .eq('verified', true)
      .maybeSingle();

    const slug = (domainRow?.hotels as any)?.slug;
    if (slug) {
      const url = request.nextUrl.clone();
      url.pathname = `/h/${slug}${pathname === '/' ? '' : pathname}`;
      return NextResponse.rewrite(url);
    }
  }

  // Early return for fully public paths — no auth checks needed
  const protectedPrefixes = [
    '/portal',   // ALL portal pages (public sub-paths listed in PORTAL_PUBLIC above)
    '/dashboard', '/admin', '/auth', '/backoffice', '/mobile', '/owner',
  ];
  if (!protectedPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Optional host split: serve portal and backoffice on separate domains
  if (portalHost && backofficeHost) {
    const isPortalPath = pathname.startsWith('/portal');
    const subdomainEnabled = process.env.NEXT_PUBLIC_BACKOFFICE_SUBDOMAIN_ENABLED === 'true';
    const backofficeHostAllowed = subdomainEnabled
      ? (hostWithPort === backofficeHost || hostWithPort.endsWith(`.${backofficeHost}`))
      : hostWithPort === backofficeHost;

    if (isPortalPath) {
      if (hostWithPort !== portalHost) {
        const url = request.nextUrl.clone();
        url.host = portalHost;
        return NextResponse.redirect(url);
      }
    } else if (!backofficeHostAllowed) {
      const url = request.nextUrl.clone();
      url.host = backofficeHost;
      return NextResponse.redirect(url);
    }
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Fetch staff profile for all paths that need role checks
  const needsProfile = user && (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/backoffice') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/owner') ||
    pathname.startsWith('/portal')   // needed to redirect staff away from guest portal
  );

  const { data: profile } = needsProfile
    ? await supabase
        .from('user_profiles')
        .select('id, role, organization_id, active, onboarding_completed')
        .eq('id', user!.id)
        .maybeSingle()
    : { data: null };

  // ─── Access policy enforcement (session timeout + 2FA baseline) ───
  if (user && (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/backoffice') ||
    (pathname.startsWith('/owner') && !pathname.startsWith('/owner/login'))
  )) {
    const role = (profile?.role || 'staff') as keyof typeof ACCESS_POLICIES.sessionTimeoutMinutes;
    const timeoutMin = ACCESS_POLICIES.sessionTimeoutMinutes[role] || ACCESS_POLICIES.sessionTimeoutMinutes.staff;
    const signedAt = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : Date.now();
    const expired = (Date.now() - signedAt) > timeoutMin * 60_000;
    if (expired) {
      const isOwnerPath = pathname.startsWith('/owner');
      const logoutNext = isOwnerPath ? '/owner/login?error=session_expired' : '/backoffice/login?error=session_expired';
      return NextResponse.redirect(new URL(`/api/auth/logout?next=${encodeURIComponent(logoutNext)}`, request.url));
    }

    if (ACCESS_POLICIES.require2FA.includes(role as any)) {
      const mfaVerified = Boolean((user.user_metadata as any)?.mfa_verified);
      if (!mfaVerified) {
        const isOwnerPath = pathname.startsWith('/owner');
        return NextResponse.redirect(new URL(isOwnerPath ? '/owner/login?error=2fa_required' : '/backoffice/login?error=2fa_required', request.url));
      }
    }
  }

  // ─── Guest portal — complete isolation ─────────────────────────────
  // All /portal/* routes except PORTAL_PUBLIC require a guest_accounts row.
  // Staff users are sent back to their own system; no cross-access allowed.
  if (pathname.startsWith('/portal')) {
    const isPublicPortalPath = PORTAL_PUBLIC.some(p => pathname.startsWith(p));

    if (!isPublicPortalPath) {
      // Protected portal page — must have a guest session
      if (!user) {
        const url = new URL('/portal/login', request.url);
        url.searchParams.set('next', pathname);
        return NextResponse.redirect(url);
      }

      const { data: guestAccount } = await supabase
        .from('guest_accounts')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!guestAccount) {
        // Logged-in but NOT a guest (staff account) — send to staff portal
        if (profile) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        // Authenticated but no guest_accounts and no profile — force re-login
        return NextResponse.redirect(new URL('/portal/login', request.url));
      }
    } else {
      // Public portal page (/portal/login etc.) — redirect if already authenticated
      if (user) {
        const { data: guestAccount } = await supabase
          .from('guest_accounts')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        if (guestAccount) {
          // Already logged in as guest → guest home
          return NextResponse.redirect(new URL('/portal/bookings', request.url));
        }
        if (profile && !pathname.startsWith('/portal/login')) {
          // Staff hitting /portal/forgot-password etc. → staff portal
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        if (profile && pathname.startsWith('/portal/login')) {
          // Staff hitting /portal/login → redirect to staff portal
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }
    }

    return response;
  }

  // ─── Staff-facing login pages — block guest users ──────────────────
  // Guests who land on /backoffice, /auth, or /owner/login are sent home.
  if (
    pathname.startsWith('/backoffice') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/owner/login')
  ) {
    if (user) {
      const { data: guestAccount } = await supabase
        .from('guest_accounts')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (guestAccount) {
        return NextResponse.redirect(new URL('/portal/bookings', request.url));
      }
    }
  }

  // ─── Web admin area ─────────────────────────────────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url));

    if (!profile || !profile.active || !['owner', 'admin'].includes(profile.role || '')) {
      return NextResponse.redirect(new URL('/backoffice/login?error=forbidden', request.url));
    }
  }

  // ─── Hotel staff dashboard ───────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!user) return NextResponse.redirect(new URL('/backoffice/login', request.url));

    if (!profile) return NextResponse.redirect(new URL('/onboarding', request.url));
    if (!profile.active) return NextResponse.redirect(new URL('/backoffice/login?error=inactive', request.url));
    if (!profile.organization_id) return NextResponse.redirect(new URL('/onboarding', request.url));

    const { data: hotel } = await supabase
      .from('hotels')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .limit(1)
      .maybeSingle();

    if (!hotel) return NextResponse.redirect(new URL('/onboarding', request.url));

    const [{ data: roomType }, { data: room }] = await Promise.all([
      supabase.from('room_types').select('id').eq('hotel_id', hotel.id).limit(1).maybeSingle(),
      supabase.from('rooms').select('id').eq('hotel_id', hotel.id).limit(1).maybeSingle(),
    ]);

    if (!profile.onboarding_completed || !roomType || !room) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }

    const routeRule = ROUTE_ROLES.find(rule => pathname.startsWith(rule.prefix));
    if (routeRule && !routeRule.roles.includes(profile.role || 'staff')) {
      return NextResponse.redirect(new URL('/dashboard?error=forbidden', request.url));
    }
  }

  // ─── Owner portal ────────────────────────────────────────────────
  if (pathname.startsWith('/owner') && !pathname.startsWith('/owner/login') && pathname !== '/owner') {
    if (!user) return NextResponse.redirect(new URL('/owner/login', request.url));

    const ownerRoles = ['owner', 'hotel_owner', 'general_manager', 'admin'];
    if (!profile || !profile.active || !ownerRoles.includes(profile.role || '')) {
      return NextResponse.redirect(new URL('/owner/login?error=forbidden', request.url));
    }
  }

  // Redirect logged-in owners away from owner/login
  if (pathname.startsWith('/owner/login') && user && profile) {
    const ownerRoles = ['owner', 'hotel_owner', 'general_manager', 'admin'];
    if (ownerRoles.includes(profile.role || '')) {
      return NextResponse.redirect(new URL('/owner/hotels', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml)).*)',
  ],
};
