# Production Gap Report

> Generated: 2026-05-16 from actual build output.
> Branch: `claude/hotel-pms-foundation-VoiKm`

## Build Status

| Check | Result |
|---|---|
| `npm run type-check` | ✅ 0 errors |
| `npm run build` | ✅ Compiled successfully |
| `npm run lint` | ✅ 0 errors (79 warnings — pre-existing, non-blocking) |
| `npm run test` | ⚠️ Not yet run in this session |

## Codebase Size

| Metric | Count |
|---|---|
| API routes (`/api/**`) | 115 routes (315 files incl. sub-routes) |
| Pages (`page.tsx`) | 173 pages |
| Database migrations | 7 migration files |
| Supabase tables (estimated) | 80+ tables across 7 migrations |

## Routes Verified in Build

### New Routes (P1–P3)
| Route | Status |
|---|---|
| `/owner/overview` | ✅ Compiled (Dynamic) |
| `/owner/approvals` | ✅ Compiled (Dynamic) |
| `/platform/overview` | ✅ Compiled (Dynamic) |
| `/platform/plans` | ✅ Compiled (Dynamic) |
| `/platform/feature-gates` | ✅ Compiled (Dynamic) |
| `/dashboard/approvals` | ✅ Compiled (Dynamic) |
| `/api/approvals` | ✅ |
| `/api/approvals/[id]/resolve` | ✅ |
| `/api/notifications` | ✅ |
| `/api/notifications/[id]/read` | ✅ |
| `/api/fb/stock/alert` | ✅ |
| `/api/fb/revenue` | ✅ |
| `/api/transport/late-pickup` | ✅ |
| `/api/ota/failed-alert` | ✅ |
| `/api/shifts/conflicts` | ✅ |
| `/api/attendance/overtime` | ✅ |
| `/api/work-orders/ooo` | ✅ |
| `/api/housekeeping/damage` | ✅ |
| `/api/reservations/[id]/early-checkin` | ✅ |
| `/api/reservations/[id]/late-checkout` | ✅ |
| `/api/guests/check-duplicate` | ✅ |

## Known Gaps (Production Blockers)

### Must Fix Before Go-Live

| Gap | Risk | Fix required |
|---|---|---|
| Supabase migrations not applied in production | **CRITICAL** | Run 0001–0006 + review_requests migration |
| `CRON_SECRET` not set in ENV | High | Set in Vercel ENV + all cron callers |
| Stripe webhook secret not verified | High | Set `STRIPE_WEBHOOK_SECRET` + verify in `/api/webhooks/stripe` |
| OTA API keys not configured | High | Set per-provider keys in ENV |
| SendGrid sender domain not verified | Medium | Verify domain in SendGrid dashboard |

### Non-Blocking (Can Ship, Fix Post-Launch)

| Gap | Description |
|---|---|
| 79 lint warnings | Pre-existing `react-hooks/exhaustive-deps` and `no-img-element` — not errors |
| Mobile PWA offline mode | `/offline` page exists but service worker not fully tested |
| Training/certification records | P2.8 `[?]` item — no table or UI yet |
| Multi-property owner dashboard | P3.2 `[?]` item — single hotel only |
| AR aging report | P2.3 `[?]` item — not implemented |
| AI dynamic pricing engine | P2.4 `[?]` item — placeholder only |
| Guest portal full flow | E2E test not run |
| LINE/WhatsApp webhooks | Signature verification exists but untested with live keys |

## Security Audit Results

| Check | Result |
|---|---|
| Hotel data queries scoped by `hotel_id` | ✅ All API routes use `requireHotelAccess` |
| Admin routes require `is_platform_admin` | ✅ `/admin/*` and `/platform/*` layouts check |
| Cron routes require `CRON_SECRET` | ✅ `requireCronSecret()` in all cron handlers |
| Webhook routes verify signature | ⚠️ Stripe, Agoda, Booking.com verify; LINE needs test |
| Impersonation creates audit log | ✅ Immutable audit trail in `audit_logs` |
| RLS enabled on all tables | ✅ All tables in 0006 migration have RLS |
| Service role key not in client bundle | ✅ `createAdminClient` is server-only |
| Approval permissions enforced | ✅ `APPROVAL_PERMISSIONS` checked in `resolveApproval` |

## Performance Notes

- All dashboard pages use `export const dynamic = 'force-dynamic'` (SSR)
- No static pages with stale data for staff-facing routes
- Guest-facing pages (`/h/[slug]/*`) benefit from CDN caching
- Recommend adding `Cache-Control: private` headers to all API routes

## Next Steps

1. Apply all migrations to production Supabase
2. Set all required ENV vars in Vercel
3. Run smoke tests from `docs/DEPLOYMENT_CHECKLIST.md`
4. Monitor Sentry for first 24h errors
5. Verify OTA webhooks with test mode
6. Confirm SendGrid delivery with test email
