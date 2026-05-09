export type Master4PStatus = 'code_closed' | 'handoff_required' | 'production_ready';

export type Master4PTask = {
  id: string;
  pillar: 'P1' | 'P2' | 'P3' | 'P4';
  title: string;
  status: Master4PStatus;
  anchors: string[];
  productionEvidence: string[];
};

export const master4PCompletionDate = '2026-05-09';

export const master4PClosedTasks: Master4PTask[] = [
  { id: 'VAL-LOCKFILE', pillar: 'P1', title: 'regenerate package-lock.json', status: 'code_closed', anchors: ['package-lock.json'], productionEvidence: ['npm ci uses deterministic lockfile'] },
  { id: 'VAL-NODE20', pillar: 'P1', title: 'Node 20 verify commands', status: 'handoff_required', anchors: ['docs/PRODUCTION_HANDOFF_4P.md', 'scripts/collect-go-live-evidence.mjs'], productionEvidence: ['Run commands on CI/host with Node 20 and real env'] },
  { id: 'VAL-VENDOR', pillar: 'P1', title: 'production/vendor setup handoff', status: 'handoff_required', anchors: ['docs/OPS_HANDOFF_GO_LIVE.md', 'docs/PRODUCTION_HANDOFF_4P.md'], productionEvidence: ['Vendor credentials and webhook dashboards must be configured outside repo'] },
  { id: 'P2-AUTH-EMAIL', pillar: 'P2', title: 'Email verification fix', status: 'code_closed', anchors: ['src/app/api/auth/email-verification/route.ts', 'src/lib/auth/session-refresh.ts'], productionEvidence: ['Supabase email confirmation toggle and redirect URL verified'] },
  { id: 'P2-AUTH-SESSION', pillar: 'P2', title: 'Session refresh stability', status: 'code_closed', anchors: ['src/app/api/auth/session-refresh/route.ts', 'src/lib/auth/session-refresh.ts'], productionEvidence: ['Refresh token smoke test from browser session'] },
  { id: 'P2-AUTH-MAGIC', pillar: 'P2', title: 'Social login / Magic link login', status: 'code_closed', anchors: ['src/app/api/auth/magic-link/route.ts', 'src/app/api/auth/social/[provider]/route.ts'], productionEvidence: ['Provider credentials set in Supabase auth providers'] },
  { id: 'P2-ORG-INVITES', pillar: 'P2', title: 'Invite staff / Organization switching', status: 'code_closed', anchors: ['src/app/api/organizations/switch/route.ts', 'src/app/dashboard/organizations/page.tsx'], productionEvidence: ['Staff invite email and org switch browser test'] },
  { id: 'P2-SETUP-CHECKLIST', pillar: 'P2', title: 'Setup policies, taxes, payments, OTA, notifications', status: 'code_closed', anchors: ['src/app/api/onboarding/setup-checklist/route.ts', 'src/app/dashboard/setup/page.tsx'], productionEvidence: ['Owner can complete checklist in staging'] },
  { id: 'P2-DEMO-PROGRESS', pillar: 'P2', title: 'Guided first booking / Progress tracking / Demo data', status: 'code_closed', anchors: ['src/app/api/onboarding/demo-data/route.ts', 'src/app/onboarding/page.tsx'], productionEvidence: ['Demo data loaded in staging tenant'] },
  { id: 'P2-GROWTH-CMS', pillar: 'P2', title: 'Blog system / Knowledge base / Contact sales', status: 'code_closed', anchors: ['src/app/blog/page.tsx', 'src/app/knowledge-base/page.tsx', 'src/app/contact-sales/page.tsx', 'src/app/api/contact-sales/route.ts'], productionEvidence: ['Contact form email/destination tested'] },
  { id: 'P2-BOOKING-OPTIONS', pillar: 'P2', title: 'Coupon / Upsell / Add-on services / Package selection', status: 'code_closed', anchors: ['src/app/api/booking/options/route.ts', 'src/app/api/public/promo/route.ts'], productionEvidence: ['Quote includes selected add-ons and package'] },
  { id: 'P2-CANCEL-INVOICE', pillar: 'P2', title: 'Cancellation flow / Invoice download', status: 'code_closed', anchors: ['src/app/api/guest/bookings/[id]/cancel/route.ts', 'src/app/api/guest/bookings/[id]/invoice/route.ts'], productionEvidence: ['Guest cancel and invoice PDF smoke test'] },
  { id: 'P2-GUEST-PROFILE', pillar: 'P2', title: 'Guest profile / Preferences / Stay history', status: 'code_closed', anchors: ['src/app/api/guest/profile/route.ts', 'src/app/portal/profile/page.tsx'], productionEvidence: ['Guest portal profile update test'] },
  { id: 'P2-REVIEWS', pillar: 'P2', title: 'Reviews / Ratings / Moderation', status: 'code_closed', anchors: ['src/app/api/admin/reviews/moderation/route.ts', 'src/app/api/guest/reviews/route.ts'], productionEvidence: ['Review approval/reject test'] },
  { id: 'P3-RESERVATION-CALENDAR', pillar: 'P3', title: 'Reservations drag-drop calendar, group booking, split, room move, waitlist', status: 'code_closed', anchors: ['src/app/api/pms/reservations/calendar/route.ts', 'src/app/api/pms/reservations/waitlist/route.ts'], productionEvidence: ['Calendar drag/drop and waitlist test'] },
  { id: 'P3-NOSHOW-TIMELINE', pillar: 'P3', title: 'No-show automation / Auto check-in-out / Reservation timeline', status: 'code_closed', anchors: ['src/app/api/pms/reservations/timeline/route.ts', 'src/app/api/cron/no-show/route.ts'], productionEvidence: ['Cron creates timeline/audit event'] },
  { id: 'P3-FRONT-DESK', pillar: 'P3', title: 'Front desk wizard, ID-passport scan, deposit, walk-in, quick assign', status: 'code_closed', anchors: ['src/app/dashboard/front-desk/page.tsx', 'src/app/api/pms/front-desk/check-in/route.ts'], productionEvidence: ['Front desk check-in smoke test'] },
  { id: 'P3-KEYCARD-TM30', pillar: 'P3', title: 'Keycard integration placeholder / TM30 workflow', status: 'code_closed', anchors: ['src/app/api/pms/keycards/route.ts', 'src/app/api/compliance/tm30/route.ts'], productionEvidence: ['TM30 export and keycard vendor dry-run'] },
  { id: 'P3-HOUSEKEEPING', pillar: 'P3', title: 'Housekeeping mobile app + real-time room status + checklist + photo + assignment + supervisor approval', status: 'code_closed', anchors: ['src/app/api/pms/housekeeping/tasks/route.ts', 'src/app/mobile/housekeeping/page.tsx'], productionEvidence: ['Mobile housekeeping checklist approval test'] },
  { id: 'P3-MAINT-ESCALATION', pillar: 'P3', title: 'Maintenance escalation', status: 'code_closed', anchors: ['src/app/api/pms/maintenance/escalations/route.ts'], productionEvidence: ['SLA escalation job/manual trigger test'] },
  { id: 'P3-MAINT-TICKETS', pillar: 'P3', title: 'Maintenance tickets / preventive maintenance / equipment tracking / vendor management / SLA', status: 'code_closed', anchors: ['src/app/api/pms/maintenance/tickets/route.ts', 'src/app/dashboard/maintenance/page.tsx'], productionEvidence: ['Ticket lifecycle test'] },
  { id: 'P3-FOLIO', pillar: 'P3', title: 'Folio management / split payment / refunds / tax invoices', status: 'code_closed', anchors: ['src/app/api/pms/folio/route.ts', 'src/app/api/pms/folio/refund/route.ts', 'src/app/api/compliance/etax/route.ts'], productionEvidence: ['Payment split/refund/eTax test'] },
  { id: 'P3-REVENUE-NIGHT-AUDIT', pillar: 'P3', title: 'Revenue reports / night audit / cashier close shift', status: 'code_closed', anchors: ['src/app/api/pms/night-audit/route.ts', 'src/app/api/pms/cashier-close/route.ts'], productionEvidence: ['Night audit close and report export test'] },
  { id: 'P4-OTA-PROVIDERS', pillar: 'P4', title: 'Booking.com / Agoda / Expedia / Airbnb sync', status: 'code_closed', anchors: ['src/app/api/ota/workers/expedia/route.ts', 'src/app/api/ota/workers/airbnb/route.ts', 'src/lib/ota/provider-workers.ts'], productionEvidence: ['Vendor sandbox credentials configured'] },
  { id: 'P4-OTA-ARI', pillar: 'P4', title: 'Availability / Rate / Inventory sync', status: 'code_closed', anchors: ['src/app/api/ota/inventory/route.ts', 'src/app/api/cron/ota-sync/route.ts'], productionEvidence: ['ARI push/pull dry-run with vendor sandbox'] },
  { id: 'P4-OTA-CONFLICTS', pillar: 'P4', title: 'Conflict handling', status: 'code_closed', anchors: ['src/app/api/ota/conflicts/route.ts', 'src/lib/channel-manager/conflict.ts'], productionEvidence: ['Conflict created and resolved from OTA duplicate'] },
  { id: 'P4-OTA-MAPPING', pillar: 'P4', title: 'OTA mapping UI', status: 'code_closed', anchors: ['src/app/dashboard/ota/page.tsx', 'src/app/api/ota/mappings/route.ts'], productionEvidence: ['Map room/rate plan in UI'] },
  { id: 'P4-OTA-RETRY', pillar: 'P4', title: 'Retry queue / Sync logs', status: 'code_closed', anchors: ['src/app/api/ota/retry-queue/route.ts', 'src/app/api/ota/logs/route.ts'], productionEvidence: ['Failed OTA event retries and logs visible'] },
  { id: 'P4-AI-OPS', pillar: 'P4', title: 'Auto room assignment / staff workload balancing / complaint detection', status: 'code_closed', anchors: ['src/app/api/ai/operations/route.ts', 'src/lib/ai/operations.ts'], productionEvidence: ['AI ops recommendation reviewed by manager'] },
  { id: 'P4-MULTI-PROPERTY', pillar: 'P4', title: 'Multi-property support / cross-property reporting', status: 'code_closed', anchors: ['src/app/dashboard/properties/page.tsx', 'src/app/api/properties/route.ts', 'src/app/api/reports/cross-property/route.ts'], productionEvidence: ['Cross-property report validates tenant isolation'] },
  { id: 'P4-ENTERPRISE-BRANDING', pillar: 'P4', title: 'Organization hierarchy / white-label / custom branding', status: 'code_closed', anchors: ['src/app/api/enterprise/organization/route.ts', 'src/app/api/enterprise/branding/route.ts'], productionEvidence: ['Branding settings render on hotel pages'] },
  { id: 'P4-ENTERPRISE-API', pillar: 'P4', title: 'API access / webhooks / SSO / advanced permissions', status: 'code_closed', anchors: ['src/app/api/developer/api-keys/route.ts', 'src/app/api/developer/webhook-subscriptions/route.ts', 'src/app/api/sso/saml/route.ts', 'src/app/api/enterprise/permissions/route.ts'], productionEvidence: ['Developer API key and webhook delivery test'] },
  { id: 'P4-GDPR-ACTIVITY', pillar: 'P4', title: 'Data export / GDPR tools / activity center', status: 'code_closed', anchors: ['src/app/api/enterprise/activity/route.ts', 'src/app/api/compliance/export/route.ts', 'src/app/api/guest/delete-account/route.ts'], productionEvidence: ['Export/delete request audited'] },
  { id: 'P4-SCALE', pillar: 'P4', title: 'Horizontal scaling prep / multi-region strategy', status: 'code_closed', anchors: ['src/lib/ops/scaling.ts', 'deploy/multi-region.json', 'docs/SCALE_AND_RESTORE_RUNBOOK.md'], productionEvidence: ['Multi-region failover drill planned'] },
  { id: 'P4-RESTORE', pillar: 'P4', title: 'Backup automation / restore testing', status: 'code_closed', anchors: ['scripts/restore-drill.mjs', 'docs/SCALE_AND_RESTORE_RUNBOOK.md'], productionEvidence: ['Restore drill evidence attached'] },
  { id: 'P4-MOBILE-OPS', pillar: 'P4', title: 'Mobile housekeeping UI / mobile front desk UI', status: 'code_closed', anchors: ['src/app/mobile/housekeeping/page.tsx', 'src/app/mobile/front-desk/page.tsx'], productionEvidence: ['Mobile Safari/Chrome front desk + HK test'] },
];

export function getMaster4PTask(id: string) {
  return master4PClosedTasks.find((task) => task.id === id) || null;
}

export function getMaster4PSummary() {
  const total = master4PClosedTasks.length;
  const codeClosed = master4PClosedTasks.filter((task) => task.status === 'code_closed').length;
  const handoffRequired = master4PClosedTasks.filter((task) => task.status === 'handoff_required').length;
  return { total, codeClosed, handoffRequired, closedAt: master4PCompletionDate };
}

export function buildAuditEnvelope(action: string, payload: Record<string, unknown> = {}) {
  return {
    success: true,
    action,
    payload,
    master4P: getMaster4PSummary(),
    generatedAt: new Date().toISOString(),
  };
}

export function normalizeChannel(channel: string) {
  return channel.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-');
}

export function buildRetryPolicy(attempts: number, baseMinutes = 5) {
  const safeAttempts = Math.max(0, Math.min(10, Number(attempts) || 0));
  const delayMinutes = Math.min(240, baseMinutes * Math.pow(2, safeAttempts));
  return {
    attempts: safeAttempts,
    nextAttemptInMinutes: delayMinutes,
    nextAttemptAt: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
  };
}
