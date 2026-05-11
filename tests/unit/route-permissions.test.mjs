/**
 * Route-level permission and tenant isolation static tests
 * Verifies that critical API routes have proper auth guards and hotel_id scoping.
 * True integration tests require a live environment — run with: npm run test:e2e
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read  = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));
const pass  = (m) => console.log(`✅ ${m}`);
const fail  = (m) => { console.error(`❌ ${m}`); process.exitCode = 1; };

// ─── 1. Hotel-scoped routes must use requireHotelAccess ─────────────────────
const hotelScopedRoutes = [
  'src/app/api/reservations/route.ts',
  'src/app/api/reservations/[id]/route.ts',
  'src/app/api/payments/refund/route.ts',
  'src/app/api/payments/reconcile/route.ts',
  'src/app/api/fb/orders/route.ts',
  'src/app/api/spa/bookings/route.ts',
  'src/app/api/storage/upload/route.ts',
];

for (const f of hotelScopedRoutes) {
  if (!exists(f)) { fail(`Missing hotel-scoped route: ${f}`); continue; }
  const src = read(f);
  if (!src.includes('requireHotelAccess')) {
    fail(`${path.basename(path.dirname(f))} route missing requireHotelAccess`);
  } else {
    pass(`${path.basename(path.dirname(f))} route uses requireHotelAccess`);
  }
}

// ─── 2. Admin routes must use requirePlatformAdmin ──────────────────────────
const adminRoutes = [
  'src/app/api/admin/orgs/route.ts',
  'src/app/api/admin/orgs/[id]/impersonate/route.ts',
  'src/app/api/admin/usage/route.ts',
];

for (const f of adminRoutes) {
  if (!exists(f)) { fail(`Missing admin route: ${f}`); continue; }
  const src = read(f);
  if (!src.includes('requirePlatformAdmin')) {
    fail(`Admin route ${path.basename(path.dirname(f))} missing requirePlatformAdmin`);
  } else {
    pass(`Admin route ${path.basename(path.dirname(f))} uses requirePlatformAdmin`);
  }
}

// ─── 3. Cron routes must validate CRON_SECRET ───────────────────────────────
const cronRoutes = [
  'src/app/api/cron/night-audit/route.ts',
  'src/app/api/cron/expire-pending/route.ts',
  'src/app/api/cron/billing-reconcile/route.ts',
  'src/app/api/cron/trial-expire/route.ts',
  'src/app/api/cron/no-show/route.ts',
];

for (const f of cronRoutes) {
  if (!exists(f)) { fail(`Missing cron route: ${f}`); continue; }
  const src = read(f);
  const hasCronGuard = src.includes('CRON_SECRET') || src.includes('requireCronSecret');
  if (!hasCronGuard) {
    fail(`Cron route ${path.basename(path.dirname(f))} missing CRON_SECRET guard`);
  } else {
    pass(`Cron route ${path.basename(path.dirname(f))} validates CRON_SECRET`);
  }
}

// ─── 4. Stripe webhook must verify signature ─────────────────────────────────
const stripeWebhook = read('src/app/api/billing/webhook/route.ts');
if (!stripeWebhook.includes('verifyStripeSignature')) {
  fail('Stripe webhook missing verifyStripeSignature call');
} else pass('Stripe webhook verifies signature');

if (!stripeWebhook.includes('stripe-signature')) {
  fail('Stripe webhook missing stripe-signature header check');
} else pass('Stripe webhook reads stripe-signature header');

// ─── 5. Stripe signature implementation is HMAC-SHA256 ───────────────────────
const stripeLib = read('src/lib/billing/stripe.ts');
if (!stripeLib.includes('createHmac') || !stripeLib.includes('sha256')) {
  fail('verifyStripeSignature must use HMAC-SHA256');
} else pass('verifyStripeSignature uses HMAC-SHA256');

if (!stripeLib.includes('timingSafeEqual')) {
  fail('verifyStripeSignature must use timingSafeEqual (prevents timing attacks)');
} else pass('verifyStripeSignature uses timingSafeEqual');

// ─── 6. Stripe webhook idempotency ───────────────────────────────────────────
if (!stripeWebhook.includes('duplicate') || !stripeWebhook.includes('eventId')) {
  fail('Stripe webhook must deduplicate by event ID');
} else pass('Stripe webhook deduplicates by event ID');

// ─── 7. Omise webhook must verify signature ──────────────────────────────────
const omiseWebhook = read('src/app/api/webhooks/omise/route.ts');
if (!omiseWebhook.includes('x-omise-webhook-secret') && !omiseWebhook.includes('omise-signature') && !omiseWebhook.includes('OMISE_WEBHOOK_SECRET')) {
  fail('Omise webhook missing signature verification');
} else pass('Omise webhook verifies signature');

// ─── 8. Storage upload scoped to hotel tenant ────────────────────────────────
const storageUpload = read('src/app/api/storage/upload/route.ts');
if (!storageUpload.includes('hotelId') || !storageUpload.includes('objectPath')) {
  fail('Storage upload route must scope path by hotelId');
} else pass('Storage upload scopes path to hotelId (tenant isolation)');

if (!storageUpload.includes('createSignedUploadUrl')) {
  fail('Storage upload must use createSignedUploadUrl (not direct write)');
} else pass('Storage upload uses createSignedUploadUrl (not direct write)');

// ─── 9. Payment refund scoped to hotel ───────────────────────────────────────
const refundRoute = read('src/app/api/payments/refund/route.ts');
if (!refundRoute.includes('hotel_id')) {
  fail('Refund route missing hotel_id scope on reservation lookup');
} else pass('Refund route scopes reservation lookup to hotel_id');

if (!refundRoute.includes('requireHotelAccess') || !refundRoute.includes("'owner'") || !refundRoute.includes("'admin'") || !refundRoute.includes("'manager'")) {
  fail('Refund route must require owner/admin/manager role');
} else pass('Refund route restricts to owner/admin/manager');

// ─── 10. Guards export all required functions ────────────────────────────────
const guards = read('src/lib/auth/guards.ts');
for (const fn of ['requireHotelAccess', 'requirePlatformAdmin', 'requireCronSecret', 'requireUser', 'assertReservationAccess']) {
  if (!guards.includes(fn)) {
    fail(`guards.ts missing export: ${fn}`);
  } else {
    pass(`guards.ts exports ${fn}`);
  }
}

// ─── 11. Housekeeping tasks require auth ─────────────────────────────────────
const hkComplete = read('src/app/api/housekeeping/tasks/[id]/complete/route.ts');
if (!hkComplete.includes('requireHotelAccess') && !hkComplete.includes('requireUser') && !hkComplete.includes('getUser')) {
  fail('Housekeeping task complete route missing auth guard');
} else pass('Housekeeping task complete route has auth guard');

// ─── 12. OTA process route uses webhook token auth (not hotel-scoped) ────────
const otaProcess = read('src/app/api/ota/process/route.ts');
if (!otaProcess.includes('verifyBearerOrHeaderToken') && !otaProcess.includes('CRON_SECRET') && !otaProcess.includes('webhook')) {
  fail('OTA process route missing authentication guard');
} else pass('OTA process route uses webhook/bearer token authentication');

// ─── 14. Public routes must NOT require auth ─────────────────────────────────
// These routes are intentionally public — we verify they don't accidentally
// call requireHotelAccess (which would break the booking flow)
const publicRoutes = [
  'src/app/api/public/search/route.ts',
  'src/app/api/public/availability/route.ts',
];
for (const f of publicRoutes) {
  if (!exists(f)) { fail(`Missing public route: ${f}`); continue; }
  const src = read(f);
  if (src.includes('requireHotelAccess')) {
    fail(`Public route ${path.basename(path.dirname(f))} incorrectly uses requireHotelAccess`);
  } else {
    pass(`Public route ${path.basename(path.dirname(f))} is correctly public`);
  }
}

if (!process.exitCode) pass('All route permission checks passed');
