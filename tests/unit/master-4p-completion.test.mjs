import assert from 'node:assert/strict';
import fs from 'node:fs';

// Consolidated into docs/STATUS.md — verify it exists
assert.ok(fs.existsSync('docs/STATUS.md'), 'docs/STATUS.md must exist (consolidated task status file)');

const requiredAnchors = [
  'package-lock.json',
  'src/lib/master-4p/production-suite.ts',
  'src/app/api/auth/email-verification/route.ts',
  'src/app/api/auth/session-refresh/route.ts',
  'src/app/api/auth/magic-link/route.ts',
  'src/app/api/auth/social/[provider]/route.ts',
  'src/app/api/onboarding/setup-checklist/route.ts',
  'src/app/api/onboarding/demo-data/route.ts',
  'src/app/blog/page.tsx',
  'src/app/knowledge-base/page.tsx',
  'src/app/contact-sales/page.tsx',
  'src/app/api/booking/options/route.ts',
  'src/app/api/guest/bookings/[id]/cancel/route.ts',
  'src/app/api/guest/bookings/[id]/invoice/route.ts',
  'src/app/api/guest/profile/route.ts',
  'src/app/api/admin/reviews/moderation/route.ts',
  'src/app/api/pms/reservations/calendar/route.ts',
  'src/app/api/pms/reservations/waitlist/route.ts',
  'src/app/api/pms/reservations/timeline/route.ts',
  'src/app/api/pms/front-desk/check-in/route.ts',
  'src/app/api/pms/keycards/route.ts',
  'src/app/api/pms/housekeeping/tasks/route.ts',
  'src/app/api/pms/maintenance/escalations/route.ts',
  'src/app/api/pms/maintenance/tickets/route.ts',
  'src/app/api/pms/folio/route.ts',
  'src/app/api/pms/folio/refund/route.ts',
  'src/app/api/pms/night-audit/route.ts',
  'src/app/api/pms/cashier-close/route.ts',
  'src/lib/ota/provider-workers.ts',
  'src/app/api/ota/workers/booking-com/route.ts',
  'src/app/api/ota/workers/agoda/route.ts',
  'src/app/api/ota/workers/expedia/route.ts',
  'src/app/api/ota/workers/airbnb/route.ts',
  'src/app/api/ota/inventory/route.ts',
  'src/app/api/ota/conflicts/route.ts',
  'src/app/api/ota/mappings/route.ts',
  'src/app/api/ota/retry-queue/route.ts',
  'src/app/api/ota/logs/route.ts',
  'src/app/api/ai/operations/route.ts',
  'src/app/dashboard/properties/page.tsx',
  'src/app/api/properties/route.ts',
  'src/app/api/reports/cross-property/route.ts',
  'src/app/api/enterprise/organization/route.ts',
  'src/app/api/enterprise/branding/route.ts',
  'src/app/api/developer/api-keys/route.ts',
  'src/app/api/developer/webhook-subscriptions/route.ts',
  'src/app/api/sso/saml/route.ts',
  'src/app/api/enterprise/permissions/route.ts',
  'src/app/api/enterprise/activity/route.ts',
  'src/lib/ops/scaling.ts',
  'deploy/multi-region.json',
  'scripts/restore-drill.mjs',
  'docs/PRODUCTION_HANDOFF_4P.md',
  'docs/SCALE_AND_RESTORE_RUNBOOK.md',
  'src/app/mobile/front-desk/page.tsx',
  'supabase/migrations/0002_phase_buildout.sql',
];

for (const file of requiredAnchors) assert.ok(fs.existsSync(file), `${file} missing`);

const registry = fs.readFileSync('src/lib/master-4p/production-suite.ts', 'utf8');
for (const token of ['VAL-LOCKFILE', 'P2-AUTH-EMAIL', 'P3-FRONT-DESK', 'P4-OTA-PROVIDERS', 'P4-MOBILE-OPS']) {
  assert.match(registry, new RegExp(token), `${token} missing from registry`);
}

console.log('✅ MASTER 4P completion anchors passed');
