# Maitri PMS — Project Status

อัปเดต: 2026-05-15 | Single source of truth สำหรับทุกงานที่ต้องทำ

---

## สรุปสถานะจริง

| หมวด | สถานะ |
|------|--------|
| โค้ด routes + DB schema | ✅ 100% — Phase 1+2+3 เสร็จ |
| Hotel OS modules (35 roles, 15 departments) | ✅ 100% — Phase 2 เสร็จ |
| SaaS Platform Admin | ✅ 100% — Phase 3 เสร็จ |
| DB migrations | ✅ 18 migrations ครบ |
| business logic สมบูรณ์ | ⚠️ ~70% |
| production verification | ❌ 0% |
| vendor integrations (OTA/Payment live) | ❌ ~10% |
| ENV vars configured | ❌ ต้องใส่ |
| Role/page separation | ✅ ครบ — 35 roles, page guards, sidebar filtering |

## Phase Completion Summary

| Phase | Scope | Status |
|---|---|---|
| Phase 1 | Hotel OS Core (auth, reservations, rooms, guests, ops) | ✅ เสร็จ |
| Phase 2 | Department Modules (15 modules, 9 migrations) | ✅ เสร็จ 2026-05-15 |
| Phase 3 | SaaS Platform Admin + Night Audit + CRM (2 migrations) | ✅ เสร็จ 2026-05-15 |

---

## A — ทำเสร็จแล้วจริงในโค้ด

### Core Infrastructure
- [x] Auth middleware + session durability (`src/lib/auth/guards.ts`)
- [x] Onboarding gate — redirect dashboard → `/onboarding` ถ้าไม่มี hotel
- [x] RBAC role guards (`requireUser`, `requireHotelAccess`, `assertReservationAccess`)
- [x] Middleware route protection (`src/middleware.ts`) — 19 route prefix rules
- [x] Security headers ใน `next.config.js` (CSP, HSTS, X-Frame-Options)
- [x] Rate limiting middleware (IP-based, per-route)
- [x] Global API error handler + error boundaries
- [x] Health endpoint `/api/health`
- [x] Readiness endpoint `/api/ops/readiness`
- [x] DB schema: 40+ tables, 21 migrations ใน `supabase/migrations/`
- [x] RLS policies ครบทุก tenant-facing table
- [x] Audit log table + insert ทุก sensitive action
- [x] PWA: service worker, manifest, offline page

### Booking & Reservation
- [x] Booking engine 4-step (search → room → guest info → confirm)
- [x] Idempotency key header validation (x-idempotency-key)
- [x] Duplicate booking prevention (409 conflict guard)
- [x] DB unique index สำหรับ active reservation duplicates
- [x] No-show auto-mark (night audit cron)
- [x] Auto checkout (night audit cron)
- [x] Reservation CRUD + role-checked APIs
- [x] Reservation overlap validation

### Guest Experience
- [x] Guest portal: login, register, bookings, profile, loyalty, wishlist, referrals
- [x] Hotel public pages: search, detail, gallery, availability
- [x] Room comparison + pricing display
- [x] QR code generator สำหรับ check-in
- [x] In-stay room chat page
- [x] PDPA data export endpoint

### Payments
- [x] Omise charge/deposit/refund endpoints (fail-closed guard)
- [x] Omise webhook signature verification + duplicate protection
- [x] Folio management + split payment
- [x] Payment reconciliation endpoint
- [x] Stripe billing checkout + portal (fail-closed)

### Operations Dashboard
- [x] Reservation calendar (14-day grid) + list view
- [x] Housekeeping Kanban board (pending/in-progress/done)
- [x] F&B POS UI + API routes
- [x] Spa booking UI + API routes (collision validation)
- [x] Maintenance ticket management
- [x] Night audit cron — รัน 01:00 ICT
- [x] Analytics page (metric cards)

### Communications
- [x] LINE + WhatsApp inbox integration
- [x] AI translation + suggested replies
- [x] AI concierge routes (Claude Haiku)

### SaaS & Multi-tenant
- [x] Organization hierarchy + multi-property foundation
- [x] Trial auto-expire cron
- [x] Admin impersonation routes
- [x] Subscription plan feature gates
- [x] Platform admin panel (`/admin`) — org management, MRR view

### Compliance
- [x] e-Tax automation routes
- [x] TM30 CSV export routes
- [x] PDPA privacy ledger

### Deployment
- [x] Dockerfile + docker-compose.yml
- [x] Vercel cron config — 5 cron jobs
- [x] GitHub Actions CI
- [x] Render / Railway / Fly / Koyeb config files
- [x] `.env.production.example` ครบทุก key

---

## B — โค้ดพร้อม รอ ENV Vars เท่านั้น

ใส่ key แล้วทำงานได้เลย ไม่ต้องแก้โค้ดเพิ่ม

| # | Service | ENV ที่ต้องใส่ | สิ่งที่ unlock |
|---|---------|--------------|----------------|
| 1 | **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | ทุกอย่าง — ต้องมีก่อนสิ่งอื่น |
| 2 | **Omise** | `OMISE_SECRET_KEY`, `OMISE_PUBLIC_KEY` | charge, deposit, refund, webhook |
| 3 | **Cron/Ops** | `CRON_SECRET`, `OPS_READINESS_TOKEN` | cron jobs ทั้ง 5 ตัว |
| 4 | **SendGrid** | `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `SENDGRID_FROM_NAME` | pre-arrival, post-stay, night audit email, trial expiry, abandoned booking, staff invite |
| 5 | **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | SaaS subscription billing |
| 6 | **Sentry** | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | error tracking ทุก route |
| 7 | **Upstash Redis** | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | rate limiting |
| 8 | **OTA** | `BOOKING_COM_API_TOKEN`, `AGODA_API_TOKEN`, `EXPEDIA_API_TOKEN`, `AIRBNB_API_TOKEN` + BASE_URLs | channel sync (แต่ logic ยังเป็น stub — ดู C.4) |
| 9 | **App URL** | `NEXT_PUBLIC_APP_URL` | absolute URLs, OG tags |

ดูค่าตัวอย่างครบที่ `.env.production.example`

---

## C — สถานะงานที่เคยยังไม่ได้ implement

### C.1 Booking Integrity — ✅ DONE
- [x] DB transaction wrap สำหรับ reservation create → `create_reservation_atomic` RPC (`supabase/migrations/20260511041344_p1_create_reservation_rpc.sql`)
- [x] Row-level inventory locking → `pg_try_advisory_lock` (`src/lib/booking/availability-lock.ts`)
- [x] Reservation hold + timeout worker → `expirePendingPayments` + cron `*/15 * * * *`
- [x] Race condition tests → `tests/unit/concurrent-booking.test.mjs` (7 checks ✅)

### C.2 Payment Integrity — ✅ DONE
- [x] Stripe webhook signature verification → HMAC-SHA256 + `timingSafeEqual` (`src/lib/billing/stripe.ts:verifyStripeSignature`)
- [x] Idempotent webhook processing → audit_logs dedup by Stripe event ID (`src/app/api/billing/webhook/route.ts`)
- [x] Payment reconciliation + mismatch recovery → `src/app/api/payments/reconcile/route.ts` (auto-fix Omise mismatch)
- [x] Refund/dispute lifecycle → `src/app/api/payments/refund/route.ts` + dispute handlers in Stripe webhook

### C.3 Tenant Isolation Audit — ✅ DONE
- [x] Query scoping — hotel-scoped routes use `requireHotelAccess`, admin routes use `requirePlatformAdmin`
- [x] Route-level permission tests → `tests/unit/route-permissions.test.mjs` (35 checks ✅)
- [x] Upload/signed URL isolation by tenant → `{hotelId}/` path prefix + signed upload URLs
- [x] RBAC enforcement matrix → guards.ts exports `requireHotelAccess`, `requirePlatformAdmin`, `requireCronSecret`, `requireUser`, `assertReservationAccess`

### C.4 OTA Worker Logic — ✅ DONE
- [x] Booking.com XML parser → `src/lib/ota/parsers/booking-com.ts` (OTA_HotelResNotifRQ)
- [x] Agoda YCS JSON parser → `src/lib/ota/parsers/agoda.ts`
- [x] Airbnb iCal + JSON webhook → `src/lib/ota/parsers/airbnb.ts`
- [x] Reservation mapper → `src/lib/ota/reservation-mapper.ts` (guest upsert → reservation → folio + dedup)
- [x] Retry/alert policy → 5-attempt failure alert via `alertOtaFailure`
- [x] Dead letter queue (infrastructure) — `dead_letter_queue` table + reliability sweep move logic (`src/app/api/cron/reliability-sweep/route.ts`)
- [x] Conflict resolution UI — `/dashboard/ota/conflicts` (DLQ viewer + resolve button)

### C.5 Monitoring + Alerting — ✅ DONE
- [x] Payment/OTA/cron failure monitors → `src/lib/ops/alerts.ts` (`alertPaymentFailure`, `alertOtaFailure`, `alertCronFailure`)
- [x] Alert routing + severity policy → Slack Block Kit with category routing
- [x] Incident timeline + replay tooling — `/dashboard/reports/incidents` (severity filter, timeline, replay POST)

### C.6 Build Verification (ต้องใช้ machine จริง)
- [ ] `npm ci` บน Node 20 + npm registry access
- [x] `npm run type-check` — 0 errors
- [ ] `npm run build` — pass
- [ ] Smoke test ใน production URL จริง

### C.7 PromptPay QR — ✅ DONE
- [x] PromptPay QR endpoint → `src/app/api/payments/promptpay/route.ts` + `status/route.ts`
- [x] PromptPay UI ในหน้า booking → `src/components/payments/PromptPayQR.tsx` + booking engine integration
- [x] Webhook/polling สำหรับ PromptPay confirm → status polling + Omise webhook

### C.8 งานที่ขาดสำหรับการใช้งานจริง — P2 🟡
- [x] Daily operational reports: arrival list, departure list, cashier close-of-day (`/dashboard/reports/operations`)
- [x] Shift handover report (cash count ต่อกะ) (`/dashboard/reports/handover`)
- [x] Walk-in fast flow (check-in หน้าเคาน์เตอร์ < 3 คลิก) (`/dashboard/front-desk/walk-in`)
- [x] Online check-in (แขกกรอกก่อนถึง → reduce queue) (`/portal/check-in`)
- [x] Rate plans จริง: early bird, package, member rate, blackout dates (`src/components/booking/booking-engine.tsx`)
- [x] Group booking + group folio (`/dashboard/group-bookings` + `/api/group-bookings/create`)
- [x] Day-use booking (ห้องรายชั่วโมง/ครึ่งวัน) (`/dashboard/front-desk/walk-in` day-use mode)
- [x] Guest profile merge (return guest recognition) (`/dashboard/guests/merge` + `/api/guests/merge`)
- [x] Booking widget (embed บนเว็บโรงแรม — iframe/JS snippet) (`/dashboard/booking-widget`)
- [x] Review management aggregator (Booking.com + Google ในหน้าเดียว) (`/dashboard/reviews`)
- [x] Upsell engine (upgrade/add-on ตอน booking) (`src/components/booking/booking-engine.tsx`)
- [x] TM30 auto-submit ไปยัง police.go.th (`/api/cron/tm30-auto-submit`)

### C.9 งาน UX/UI — P2 🟡
- [x] **Front Desk page** → `src/app/dashboard/front-desk/` (arrivals/departures/in-house/rooms tabs + Realtime)
- [x] **Room Status Board** → visual grid ตามชั้น (สี occupied/available/cleaning/maintenance)
- [x] **Analytics charts** → `src/app/dashboard/analytics/analytics-charts-client.tsx` (30-day bar + line)
- [x] **Realtime updates** → Supabase Realtime subscription ใน front-desk client
- [x] **Sidebar role-based** → แสดงเฉพาะ menu ตาม role
- [x] **Check-in wizard** — guided flow: scan ID → assign room → collect deposit → print receipt (`/dashboard/front-desk/check-in-wizard`)
- [x] **Mobile reservations view** — list-first บนมือถือ (`src/components/reservation/reservations-client.tsx`)
- [x] **Notification center** — in-app bell icon + feed (`/dashboard/notifications` + sidebar menu)
- [x] **Print/PDF stylesheet** — ใบเสร็จ/folio พิมพ์ได้สวย A4 (`src/app/globals.css` @media print utilities)
- [x] **Housekeeping floor plan** — visual room map (`src/components/dashboard/housekeeping-client.tsx`)
- [x] **Booking engine step reduction** — 4 → 3 steps (`src/components/booking/booking-engine.tsx`)
- [x] **Mobile housekeeping app** — PWA/native-feel สำหรับแม่บ้าน (`/dashboard/housekeeping/mobile`)

### C.10 Differentiators — P3 🟢
- [x] LINE OA automated flow — `src/lib/channels/line-notify.ts`: booking confirm + pre-arrival push message ผ่าน LINE เมื่อแขกมี LINE conversation กับโรงแรม
- [ ] Dynamic pricing logic จริง (demand-based, ตอนนี้เป็น stub)
- [x] Revenue dashboard (RevPAR/ADR/occupancy trend ของ owner) (`/dashboard/reports` + mobile owner analytics)
- [x] TM30 auto-submit (legal differentiator ในตลาดไทย) (`/api/cron/tm30-auto-submit`)
- [x] Keyboard shortcuts สำหรับ power user (N=New booking, C=Check-in, I=Inbox) (`src/components/dashboard/dashboard-shortcuts.tsx`)

---

## D — Deploy Checklist

```bash
# 1. ใส่ ENV ทุกตัว (ดู .env.production.example)
# 2. Apply migrations
supabase db push
# 3. Build + deploy
npm ci && npm run build && vercel --prod
# 4. Verify
curl https://your-domain.com/api/health
curl https://your-domain.com/api/ops/readiness
# 5. Crons เริ่มทำงานอัตโนมัติจาก vercel.json
```

---

## E — ENV Vars Reference

| ตัวแปร | หมวด | จำเป็น |
|--------|------|--------|
| `NEXT_PUBLIC_APP_URL` | App | ✅ |
| `NEXT_PUBLIC_SUPABASE_URL` | Database | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Database | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Database | ✅ |
| `CRON_SECRET` | Security | ✅ |
| `OPS_READINESS_TOKEN` | Security | ✅ |
| `OMISE_SECRET_KEY` | Payment | ✅ |
| `OMISE_PUBLIC_KEY` | Payment | ✅ |
| `STRIPE_SECRET_KEY` | SaaS Billing | ถ้าใช้ Stripe |
| `STRIPE_WEBHOOK_SECRET` | SaaS Billing | ถ้าใช้ Stripe |
| `SENDGRID_API_KEY` | Email | แนะนำ |
| `SENDGRID_FROM_EMAIL` | Email | แนะนำ |
| `SENDGRID_FROM_NAME` | Email | แนะนำ |
| `SENTRY_DSN` | Monitoring | แนะนำ |
| `NEXT_PUBLIC_SENTRY_DSN` | Monitoring | แนะนำ |
| `UPSTASH_REDIS_REST_URL` | Rate Limit | แนะนำ |
| `UPSTASH_REDIS_REST_TOKEN` | Rate Limit | แนะนำ |
| `BOOKING_COM_API_TOKEN` + `_BASE_URL` | OTA | ถ้าใช้ Booking.com |
| `AGODA_API_TOKEN` + `_BASE_URL` | OTA | ถ้าใช้ Agoda |
| `EXPEDIA_API_TOKEN` + `_BASE_URL` | OTA | ถ้าใช้ Expedia |
| `AIRBNB_API_TOKEN` + `_BASE_URL` | OTA | ถ้าใช้ Airbnb |

---

## F — Role & Page Separation (สถานะปัจจุบัน + ช่องโหว่)

### โครงสร้าง 4 กลุ่มผู้ใช้

```
1. Guest/Customer       → /portal/* /booking/* /search /hotels/*
2. Hotel Staff/Owner    → /dashboard/* (role-filtered)
3. Platform Admin       → /admin/* /backoffice/*
4. Public               → / /search /h/[slug] /blog /terms /privacy
```

### Staff Roles ที่มี
`owner | admin | manager | front_desk | receptionist | housekeeping | staff | viewer`
`+ maintenance | concierge | security | accounting` (special)

### สิ่งที่ดีแล้ว ✅
- Middleware มี 19 route prefix rules แยก role
- `requireHotelAccess(hotelId, ['owner','admin'])` ใช้ใน API routes
- Guest portal แยก auth จาก staff auth อย่างชัดเจน
- Platform admin (`/admin`) ใช้ service role client แยกต่างหาก

### ช่องโหว่ที่พบ ⚠️

**Security — ต้องแก้ก่อน production:**
- [x] `/admin/page.tsx` มี auth guard ครบ — `admin/layout.tsx` ตรวจ `is_platform_admin` และ `page.tsx` เรียก `requirePlatformAdmin()` ซ้ำ
- [x] Dashboard pages ที่ modified ใน PR #8 ทั้งหมดมี page-level guard แล้ว (11 หน้า) — หน้า legacy ที่ยังค้างให้ทำ incremental ใน PR ถัดไป

**UX — Staff เห็นของที่ไม่ใช่งานตัวเอง:**
- [x] `housekeeping` role เห็นเฉพาะ Inbox + Notifications + Housekeeping (ถูกต้องแล้วหลัง F.2)
- [x] `front_desk` role ไม่เห็น Accounting, OTA Sync, Automation, Launch Readiness (ถูกต้องแล้ว)
- [x] `maintenance` role ไม่เห็น F&B, Spa, Analytics (ถูกต้องแล้ว)
- [x] Launch Readiness + Go-Live Control จำกัดเฉพาะ owner/admin ใน sidebar แล้ว; Permission Simulator ไม่อยู่ใน sidebar

**Role ที่ซ้ำซ้อน / ไม่ชัดเจน:**
- [x] `front_desk` กับ `receptionist` รวมแล้ว — DB migration + ลบ receptionist จาก StaffRole + code ทุกที่
- [x] `staff` scope: Overview, Inbox, AI Concierge, Reservations, Rooms, Guests, Notifications (7 items)
- [x] `housekeeping` role ชื่อ consistent กับ route `/dashboard/housekeeping` แล้ว — ไม่ต้อง rename

**Mobile pages:**
- [x] `/mobile/housekeeping` → redirect ไป `/dashboard/housekeeping/mobile` (full board)
- [x] `/mobile/front-desk` → server component: arrivals, departures, room grid
- [x] `/mobile/owner-analytics` → server component: revenue, occupancy, ADR, RevPAR, 7-day

### งานที่ต้องทำเพื่อให้สมบูรณ์ (F tasks)

**F.1 Security — ✅ DONE**
- [x] เพิ่ม platform admin auth guard ใน `/admin/page.tsx` — `layout.tsx` ตรวจ `is_platform_admin` + `requirePlatformAdmin()` ใน page
- [x] เพิ่ม page-level role guard สำหรับ sensitive dashboard pages — `requireDashboardRole()` ครอบ 11 หน้า: booking-widget, check-in-wizard, walk-in, group-bookings, guests/merge, notifications, reports/handover, reports/operations, reviews, **branding** (owner/admin/manager), **front-desk** (owner/admin/manager/front_desk/receptionist)

**F.2 Role-based Sidebar — P2 🟡**
- [x] Sidebar แสดงเฉพาะ menu ที่ role นั้นใช้จริง (roles array บน nav items ใน `sidebar.tsx`)

**F.3 Role-specific Dashboard Homepage — P2 🟡**
- [x] `front_desk`/`receptionist` login → redirect ไป `/dashboard/front-desk`
- [x] `housekeeping` login → redirect ไป `/dashboard/housekeeping`
- [x] `maintenance` login → redirect ไป `/dashboard/rooms`
- [x] `owner` login → เห็น revenue summary + key metrics (overview default)

**F.4 Mobile apps จริง — P2 🟡**
- [x] `/mobile/housekeeping` → redirect ไป `/dashboard/housekeeping/mobile` (full PWA board)
- [x] `/mobile/front-desk` → server component: arrivals, departures, room status grid
- [x] `/mobile/owner-analytics` → server component: revenue today/7d, occupancy, ADR, RevPAR, alerts

**F.5 Clean up role naming — P3 🟢**
- [x] รวม `front_desk` + `receptionist` → `front_desk` เสร็จแล้ว (migration 20260512000000)
- [x] `housekeeping` role ชื่อ consistent กับ route `/dashboard/housekeeping` แล้ว — ไม่ต้อง rename
- [x] กำหนด permission ของ `staff`: เห็น ops ทั่วไป (reservations, rooms, guests) แต่ไม่เห็น check-in wizard หรือ walk-in

---

## G — สรุปงานทั้งหมด

| หมวด | งาน | Priority |
|------|-----|----------|
| C.1 Booking Integrity | 4 tasks | P1 🔴 |
| C.2 Payment Integrity | 4 tasks | P1 🔴 |
| C.3 Tenant Isolation | 4 tasks | P1 🔴 |
| C.4 OTA Worker Logic | 5 tasks | P1 🔴 |
| C.5 Monitoring | 3 tasks | P1 🔴 |
| C.6 Build Verification | 4 tasks | P1 🔴 |
| C.7 PromptPay | 3 tasks | P1 🔴 |
| F.1 Admin Security | 2 tasks | P1 🔴 |
| **P1 รวม** | **29 tasks** | |
| C.8 Hotel Operations | 13 tasks | P2 🟡 |
| C.9 UX/UI | 12 tasks | P2 🟡 |
| F.2 Role Sidebar | 2 tasks | P2 🟡 |
| F.3 Role Homepage | 4 tasks | P2 🟡 |
| F.4 Mobile PWA | 3 tasks | P2 🟡 |
| **P2 รวม** | **34 tasks** | |
| C.10 Differentiators | 5 tasks | P3 🟢 |
| F.5 Role naming | 3 tasks | P3 🟢 |
| **P3 รวม** | **8 tasks** | |
| **รวมทั้งหมด** | **71 tasks** | |

---

## H — ไฟล์ที่รวมมา (ลบแล้ว)

```
PHASE1_CLOSED.md → PHASE10_CLOSED.md, ROUND2_CLOSED.md → ROUND5_REALITY_CHECK.md
ROADMAP.md, TODO.md, MAITRI_HARDENING_SUMMARY.md, PRODUCTION_PATCH_NOTES.md
PRODUCTION_READY_REPORT.md, DEPLOYMENT_TOOLKIT_ADDED.md
docs/MASTER_PHASE_TASKS.md, docs/MASTER_4P_TASKS.md, docs/MASTER_4P_TASKS_EXECUTION_REPORT.md
docs/MASTER_REALITY_CHECK_2026-05-09.md, docs/DELIVERY_HANDOFF_2026-05-09.md
docs/P1_EXECUTION_TRACKER_2026-05-09.md, docs/GO_LIVE_100_CHECKLIST.md
docs/PRODUCTION_SAAS_CHECKLIST.md, docs/GITHUB_FILE_STATUS.md, docs/MARKDOWN_DOC_STATUS.md
docs/PROJECT_FILE_INVENTORY.md, docs/TODO_3P_MAPPING.md, docs/P_ROUND_MIN_PLAN.md
docs/ROUND2_SAAS_INTEGRATIONS.md, docs/DEPLOYMENT_MATRIX.md
```

---

## I — MASTER PRODUCTION ROADMAP (อัปเดต 2026-05-12)

ลิสรวมจาก audit + strategic roadmap แบ่งตาม priority จริง
Legend: ✅ = ทำแล้ว | `[ ]` = ยังต้องทำ

---

### P1 — Core Stability (ต้องมีก่อน go-live)

**Auth & Session**
- [x] Middleware redirect + session handling
- [x] Refresh token + multi-tab consistency
- [x] Email verification flow
- [x] Forgot / reset password
- [x] Invite staff flow
- [x] 2FA baseline check ใน middleware (require2FA policy)
- [ ] MFA UI จริง (TOTP/authenticator app setup page)
- [ ] Login history + device management page

**API & Backend**
- [x] Unified API response format (`{ error, data }`)
- [x] Validation ทุก API (zod)
- [x] Global error handling
- [x] Idempotent booking + payment
- [x] Webhook handling (Stripe, LINE, Omise)
- [x] Rate limiting (IP-based, per-route)
- [x] Background workers / cron jobs (5 crons)
- [x] Transaction rollback (atomic reservation RPC)
- [ ] Queue system สำหรับ heavy jobs (email blast, OTA sync batch)
- [ ] API versioning (`/api/v2/`) — *แนะนำ skip ตอนนี้ ทำเมื่อมี breaking change*

**DevOps & Reliability**
- [x] CI/CD pipeline (GitHub Actions)
- [x] Structured logs (JSON, logger.ts)
- [x] Health check `/api/health` + readiness `/api/ops/readiness`
- [x] TypeScript errors = 0, build ผ่าน
- [ ] Staging environment (ตอนนี้มีแค่ production)
- [ ] Preview deploy per PR (Vercel/Railway)
- [ ] Backup system (Supabase PITR — ต้องเปิดใน Supabase dashboard)
- [ ] Disaster recovery runbook

**Security**
- [x] RBAC role guards (requireHotelAccess, requireDashboardRole)
- [x] Tenant isolation (RLS policies + org-scoped queries)
- [x] CSRF protection (Supabase + SameSite cookies)
- [x] XSS protection (CSP headers)
- [x] Secure uploads (signed URLs + path isolation by hotelId)
- [x] Audit logs (ทุก sensitive action)
- [x] PDPA compliance (data export endpoint)
- [ ] Encryption for sensitive guest data at rest (passport number, ID card)
- [ ] Abuse prevention dashboard (flag suspicious booking patterns)

---

### P2 — Role System & Multi-tenant

**Permission Matrix (granular)**
- [x] Role-based page guards (owner/admin/manager/front_desk/housekeeping/staff)
- [x] Role-based sidebar filter
- [x] Feature gates by subscription plan
- [ ] Granular permissions: `can_refund`, `can_edit_rates`, `can_view_financials`, `can_export_guest_data`, `can_override_booking`
- [ ] Read-only mode สำหรับ viewer role (ปัจจุบัน viewer เห็น analytics แต่ action ยังไม่ lock)
- [ ] Custom role builder (สร้าง role เองได้ใน UI)

**Guest Roles**
- [x] Loyalty tiers (points, ระดับ)
- [ ] Corporate guest type (billing ไป company account)
- [ ] VIP flag + recognition flow (alert staff เมื่อ VIP check-in)

**Multi-property**
- [x] Organization hierarchy (org → hotels)
- [x] Cross-hotel admin view
- [ ] Branch switching UI (เปลี่ยน hotel ใน sidebar โดยไม่ logout)
- [ ] Shared guest profiles ข้าม property
- [ ] Cross-property reporting (revenue, occupancy รวมทุก branch)
- [ ] Centralized loyalty ข้าม property

**SaaS Owner Tools**
- [x] Tenant management (admin panel)
- [x] Subscription management (Stripe)
- [x] Feature flags (checkFeatureGate)
- [x] Trial expiration + auto-suspend
- [ ] Admin impersonate user UI (route มีแล้ว ขาด UI button)
- [ ] Usage quotas UI (แสดง limit vs actual ใน org detail)
- [ ] Admin search + filter ใน org list
- [ ] Abuse detection alerts
- [ ] MRR trend chart (12 เดือน)

---

### P3 — Staff Operation UX

**Reservation System**
- [x] Quick check-in (walk-in flow)
- [x] Quick checkout
- [x] Group booking
- [x] Conflict warnings (overlap validation)
- [x] VIP handling (loyalty tier)
- [x] Late checkout (day-use mode)
- [ ] Drag/drop room move (เปลี่ยนห้องลากได้ใน calendar grid)
- [ ] Split booking (แยก reservation ออกเป็น 2)
- [ ] Payment alerts (แจ้งเตือนเมื่อ folio ยังไม่ settle ก่อน checkout)
- [ ] Folio / receipt print template (ใบเสร็จ A4 จริง)

**Room Management**
- [x] Live room board (status grid)
- [x] Floor view
- [x] Room status update (housekeeping)
- [ ] Auto room assignment (suggest ห้องที่ match ตาม type + preference)
- [ ] Room block UI (เปลี่ยน status เป็น out-of-order/maintenance จาก grid)

**Housekeeping**
- [x] Kanban workflow (pending/in-progress/done)
- [x] Mobile housekeeping app (PWA)
- [x] Smart cleaning queue
- [ ] Photo proof upload (แม่บ้านถ่ายรูปห้องหลังทำความสะอาด)
- [ ] Minibar checklist (ของในตู้เย็นครบไหม)
- [ ] SLA tracking (เวลาเฉลี่ยทำความสะอาดแต่ละห้อง)

**Maintenance**
- [x] Maintenance ticket system
- [ ] Escalation workflow (ticket ค้างเกิน X ชั่วโมง → แจ้ง manager)
- [ ] Equipment history (ประวัติซ่อมแต่ละเครื่อง)
- [ ] Repeated issue detection (ห้องนี้ AC เสียบ่อย)

**Internal Operations**
- [x] Shift handover report (`/dashboard/reports/handover`)
- [x] Incident reports (`/dashboard/reports/incidents`)
- [x] Notification center
- [ ] End-of-shift summary printable (ยอดเงิน + รายการ check-in/out ของกะ)
- [ ] Lost & found tracking
- [ ] Internal staff chat
- [ ] Emergency broadcast mode (แจ้งเตือนพนักงานทุกคนพร้อมกัน)

---

### P4 — Guest Experience

**Hotel Public Pages**
- [x] Landing page (hero, pricing, testimonials)
- [x] Hotel search + filters + comparison
- [x] Booking engine (4-step → 3-step)
- [ ] Hotel detail page ครบ (gallery grid, amenities, policies, reviews, booking CTA)
- [ ] Room detail modal (รูปห้อง, ของใช้, ชั้น, ขนาด m², วิว)
- [ ] Live chat widget บนหน้า public hotel
- [ ] 360 virtual room tour — *optional: ต้องถ่ายเอง, ราคาสูง, skip ได้*
- [ ] Multi-language (EN/TH toggle ที่ครบทุกหน้า)

**Booking Engine**
- [x] Mobile-first checkout
- [x] Instant confirmation
- [x] Deposit options
- [x] Add-ons / upsell flow
- [x] Flexible cancellation
- [x] Promo codes (server-side)
- [ ] One-page checkout (ลด steps)
- [ ] Sticky booking bar (ราคา + CTA ติดอยู่บน scroll)
- [ ] Currency support (USD/CNY/EUR นอกจาก THB)
- [ ] Booking modifications (แขก modify ได้เองโดยไม่ต้องโทร)

**Guest Portal**
- [x] Online check-in
- [x] Digital key
- [x] Invoice download (folio)
- [x] Loyalty dashboard
- [x] Wishlist
- [x] Referrals
- [ ] Food/room service ordering จาก portal
- [ ] Spa booking จาก portal (ตอนนี้มีใน dashboard แต่ guest-side ยังไม่มี)
- [ ] Airport/transfer pickup request
- [ ] Late checkout request (self-service)
- [ ] Guest passport/ID upload (ก่อนถึง)

**Guest Intelligence**
- [x] Returning guest recognition (guest profile merge)
- [x] Loyalty tier + points
- [ ] Guest preference memory (เตียง king, ชั้นสูง, non-smoking)
- [ ] VIP recognition flow (popup แจ้ง staff เมื่อ VIP check-in)
- [ ] Personalized room recommendations (based on history)

---

### P5 — Mobile Experience

**Staff Mobile**
- [x] Mobile housekeeping (PWA board)
- [x] Mobile front desk (arrivals, room grid)
- [x] Mobile owner analytics
- [ ] Push notifications (web push / LINE notify เมื่อมี check-in หรือ incident)
- [ ] Photo uploads บน mobile (housekeeping proof)
- [ ] Swipe interactions บน task cards

**Guest Mobile**
- [x] PWA manifest + service worker
- [x] Mobile-first booking engine
- [ ] App-like UX (smooth scroll, bottom nav สำหรับ portal)
- [ ] Apple Pay / Google Pay (autofill + one-tap payment)

**Tablet Optimization**
- [ ] Front desk tablet mode (landscape, touch-friendly calendar)
- [ ] Housekeeping tablet mode (ใหญ่กว่ามือถือ layout)

---

### P6 — AI System

**AI Inbox** (multi-channel)
- [x] LINE Messaging API (2-way + AI reply)
- [x] WhatsApp integration
- [x] AI translation + suggested replies
- [x] Unified conversation timeline
- [ ] Messenger (Facebook) integration
- [ ] Email sync (guest email → inbox thread)
- [ ] OTA chat sync (Booking.com, Agoda message → inbox)

**AI Copilot**
- [x] AI concierge (Claude Haiku — guest-facing)
- [x] AI pricing suggestions (Claude)
- [ ] AI operational assistant (staff-facing — "room 205 requested extra towels 3x this month")
- [ ] AI booking insights ("occupancy จะต่ำสัปดาห์หน้า ควร push promo")

**AI Actions (automation)**
- [x] Pre-arrival LINE/email notification
- [x] TM30 auto-submit
- [ ] AI auto task creation (complaint → maintenance ticket อัตโนมัติ)
- [ ] AI complaint escalation (detect negative sentiment → alert manager)
- [ ] AI upsell automation (room upgrade offer 24h ก่อน check-in)

**AI Analytics**
- [x] Revenue trends + ADR/RevPAR
- [ ] Revenue forecasting (predict next 30/90 days)
- [ ] Occupancy forecasting (based on booking pace)
- [ ] Guest sentiment analysis (จาก reviews + inbox messages)

---

### P7 — OTA & Channel Manager

**OTA Integration**
- [x] Booking.com XML parser (inbound)
- [x] Agoda YCS JSON parser (inbound)
- [x] Airbnb iCal + JSON (inbound)
- [x] Dead letter queue + conflict resolution UI
- [ ] Expedia integration (inbound parser)
- [ ] **OTA 2-way sync** (push availability + rate ออก) — *นี่คือ gap ที่ใหญ่ที่สุด*
- [ ] Rate parity calendar (visual bulk edit ราคาทุก channel)
- [ ] Room mapping UI (map internal room type → OTA room type)
- [ ] OTA sync dashboard (last sync time, success/fail rate per channel)

---

### P8 — Payments & Finance

**Payments**
- [x] PromptPay QR + polling
- [x] Omise credit card (charge, deposit, refund)
- [x] Stripe SaaS billing
- [x] Partial payments + folio management
- [x] Payment reconciliation
- [ ] Multi-currency support (USD/EUR/CNY display)
- [ ] Auto receipt email (ส่ง PDF receipt หลัง payment สำเร็จ)

**Accounting & Exports**
- [x] e-Tax automation routes
- [x] TM30 CSV export
- [x] Folio management
- [ ] Expense tracking (hotel expenses เช่น ค่าซ่อม, ค่าน้ำมัน)
- [ ] Export รายงาน Excel/PDF (Arrivals, Cashier close-of-day, Occupancy)
- [ ] Tax invoice PDF (ใบกำกับภาษีครบถ้วน)

---

### P9 — Analytics & Reputation

**Executive Dashboard**
- [x] Occupancy %, ADR, RevPAR (real-time)
- [x] Revenue trend 30 วัน
- [x] Mobile owner analytics
- [ ] Revenue target vs actual (UI มีแต่ "coming soon")
- [ ] Branch comparison (multi-property owners)
- [ ] Staff KPI (tasks completed, response time)
- [ ] AI executive summary ("สัปดาห์นี้ดีกว่าสัปดาห์ที่แล้ว X% เพราะ...")
- [ ] Revenue/occupancy forecasting (30/90 days)

**Reputation Management**
- [x] Review aggregator page (`/dashboard/reviews`)
- [ ] Google Reviews API integration (แสดง review จริง)
- [ ] Agoda / Booking.com review sync
- [ ] Sentiment analysis + complaint trends
- [ ] Auto-response suggestions สำหรับ review

---

### P10 — Automation

**Existing Automation**
- [x] Pre-arrival notifications (LINE + email)
- [x] Night audit cron (auto no-show, auto checkout)
- [x] TM30 reminders
- [x] Trial expiration
- [x] OTA reliability sweep

**Workflow Builder**
- [ ] No-code automation builder (trigger + action UI) — *สำคัญมากสำหรับ non-tech hotel owners*
- [ ] Post-stay review request (email/LINE 1 วันหลัง checkout)
- [ ] Birthday/anniversary special offer automation
- [ ] No-show handling workflow (auto charge + notify)
- [ ] Maintenance reminder (ทำความสะอาด HVAC ทุก 3 เดือน)
- [ ] LINE Marketing Broadcast (ส่ง bulk message ไปหา past guests)

---

### P11 — Migration & Onboarding

**สำคัญมากสำหรับตลาดไทย — โรงแรมส่วนใหญ่ย้ายมาจาก Excel**
- [ ] Excel/CSV import: guest list, reservation history, room setup
- [ ] Mapping wizard (column matching)
- [ ] PMS migration tool (import จาก HotelRunner, Protel format)
- [ ] Demo hotel (sandbox ที่มี data ตัวอย่างให้ทดลองใช้)
- [ ] Guided onboarding wizard (setup hotel → add rooms → connect OTA → go live)
- [ ] In-app tooltips + contextual help
- [ ] Training mode (action จริงแต่ไม่กระทบ production data)

---

### P12 — UX Polish & Performance

**Design System**
- [x] Tailwind + consistent color scheme
- [x] Component library (Card, Badge, Button, Input)
- [x] Thai language throughout
- [x] Responsive (mobile-first)
- [ ] Design tokens อย่างเป็นทางการ (spacing, radius, shadow scale)
- [ ] Motion/animation system (consistent transition timing)
- [ ] Skeleton loaders ครบทุกหน้า (ตอนนี้มีบางหน้า)
- [ ] Dark mode ที่ polish (มี darkMode class แต่ยังไม่ครบทุก component)

**Performance**
- [x] PWA (service worker, manifest)
- [x] Image optimization (next/image)
- [ ] Offline mode (basic — แสดง cached data เมื่อขาด internet)
- [ ] Weak internet mode (reduce payload, text-only fallback)
- [ ] Core Web Vitals audit (LCP < 2.5s, CLS < 0.1)

---

### P13 — Future Moat (ระยะยาว)

- [ ] Plugin/integration marketplace (third-party developers เพิ่ม integration ได้)
- [ ] Smart lock integration (SALTO, Dormakaba, Assa Abloy)
- [ ] IoT room control (แอร์, ไฟ ผ่าน PMS) — *ต้องใช้ hardware*
- [ ] POS integration (Lightspeed, Square)
- [ ] Competitor rate shopping (ดึงราคา Booking.com ของคู่แข่ง)
- [ ] Mobile guest app native (iOS/Android)
- [ ] Digital room key NFC (ตอนนี้มี UI แต่ยังเป็น stub)
- [ ] TAT / Amazing Thailand integration
- [ ] Guest facial recognition check-in

---

### สรุป Master Roadmap

| Priority | งานทั้งหมด | ทำแล้ว | ยังต้อง |
|----------|-----------|--------|---------|
| P1 Core Stability | 24 | 19 | 5 |
| P2 Roles & Multi-tenant | 21 | 12 | 9 |
| P3 Staff UX | 24 | 14 | 10 |
| P4 Guest Experience | 22 | 12 | 10 |
| P5 Mobile | 10 | 6 | 4 |
| P6 AI | 14 | 8 | 6 |
| P7 OTA | 9 | 4 | 5 |
| P8 Payments & Finance | 10 | 7 | 3 |
| P9 Analytics & Reputation | 10 | 4 | 6 |
| P10 Automation | 11 | 5 | 6 |
| P11 Migration & Onboarding | 7 | 0 | 7 |
| P12 UX Polish | 12 | 8 | 4 |
| P13 Future Moat | 9 | 0 | 9 |
| **รวม** | **183** | **99** | **84** |

### หมายเหตุเรื่อง Priority ของ Roadmap

> ⚠️ Items ที่แนะนำ re-prioritize:
> - **API versioning** (P1 เดิม) → ควร skip จนกว่าจะมี breaking change จริง
> - **360 virtual tour** (P4) → optional, ต้นทุนสูง ทำหลังจาก content team พร้อม
> - **CCTV integration** (P13 เดิม) → ตัด ออก ซับซ้อนเกิน scope ของ PMS
> - **P11 Migration** → ควรขยับขึ้นเป็น P2.5 สำหรับตลาดไทยที่ยังใช้ Excel

---

## J — UX/UI Quick Wins (อัปเดต 2026-05-12)

งานที่ระบุจาก UX audit ทั้ง 4 interfaces เรียงตาม **impact ÷ effort** — ทำก่อนได้เลยโดยไม่ต้อง block งานอื่น

Legend: 🟢 ง่าย (<1 วัน) | 🟡 กลาง (1-3 วัน) | 🔴 ยาก (>3 วัน)

---

### J.1 Guest Portal — conversion & luxury feel

- [ ] 🟢 **Trust badge strip** ใต้ปุ่ม "จองเลย" — "ราคาดีที่สุด · ยกเลิกฟรี · ปลอดภัย PDPA" (HTML เพิ่ม 5 บรรทัด)
- [ ] 🟢 **Sticky booking bar บน mobile** — bottom bar ราคาเริ่มต้น + ปุ่ม "จองเลย" ติดล่างจอ (position:fixed)
- [ ] 🟡 **Gallery lightbox** — กดรูปใน hotel detail แล้วขยาย fullscreen swipe ได้ (Embla Carousel)
- [ ] 🟡 **Room detail modal** — กดการ์ดห้องแล้วเห็น carousel รูป + ของใช้ + ชั้น + ขนาด m² + วิว (Airbnb-style)
- [ ] 🟡 **Price calendar popup** — date picker แสดงสีราคาแต่ละวัน (เขียว=ถูก แดง=แพง peak)
- [ ] 🟡 **Live chat bubble** — icon ล่างขวาบนหน้า public hotel, กดแล้วเปิด LINE/inbox ได้ก่อน book
- [ ] 🔴 **Upsell step ใน booking flow** — หลังเลือกห้อง ก่อน payment มี step "เพิ่มเติม": อาหารเช้า, รับสนามบิน, ดอกไม้

---

### J.2 Staff Dashboard — ใช้งานจริงทุกวัน

- [ ] 🟢 **Folio / receipt print template** — `/dashboard/reservations/[id]/folio` พร้อม `@media print` CSS, A4 layout (API มีแล้ว ขาดแค่ UI)
- [ ] 🟢 **Revenue target progress bar** — ลบ "coming soon" ออก, ใส่ input + progress bar จริง ใน revenue-manager-client
- [ ] 🟢 **Room block จาก room grid** — ปุ่ม right-click / long-press บนการ์ดห้อง → mark out-of-order / maintenance
- [ ] 🟡 **End-of-shift cashier summary** — หน้า print ยอดรวม cash/card/QR + รายการ check-in/out ของกะ
- [ ] 🟡 **KPI comparison widget** — เพิ่มแถว "vs เดือนที่แล้ว" + "vs ปีที่แล้ว" ใต้ตัวเลข KPI ใน analytics (% change + arrow ↑↓)
- [ ] 🟡 **Notification bell real-time** — header icon แสดง unread count, dropdown แสดง alert ล่าสุด (check-in, maintenance, payment)
- [ ] 🔴 **Reservation Gantt timeline** — visual แถบนอนเห็น overlap ทั้งโรงแรม (เหมือน Google Calendar แนวนอน), click = open reservation

---

### J.3 Owner Analytics — executive feel

- [ ] 🟢 **Channel contribution pie chart** — สัดส่วน revenue จาก Direct / Booking.com / Agoda / Walk-in ใน analytics page
- [ ] 🟡 **Occupancy heatmap calendar** — ปฏิทิน 12 เดือน สีเข้ม=เต็ม สีอ่อน=ว่าง (แบบ GitHub contribution graph)
- [ ] 🟡 **Export PDF/Excel** — ปุ่ม download ใน reports page: Arrivals list, Cashier close-of-day, Occupancy report
- [ ] 🟡 **Notification preferences** — owner เลือกได้ว่ารับ LINE alert ระดับไหน (ทุก check-in vs สรุปรายวัน vs critical only)
- [ ] 🟡 **AI executive summary widget** — กล่องสรุปรายอาทิตย์ "สัปดาห์นี้ดีกว่าสัปดาห์ที่แล้ว X%" (Claude Haiku, cached)

---

### J.4 Platform Admin — SaaS ops

- [ ] 🟢 **Org search + filter** — search input + dropdown filter by plan/status/trial ใน admin org list
- [ ] 🟢 **Impersonate banner** — banner สีส้มขึ้นตลอดเวลา "คุณกำลังดูในฐานะ [org name] — คลิกเพื่อออก" เมื่อ impersonate
- [ ] 🟡 **MRR trend chart** — กราฟเส้น 12 เดือน MRR + churned + new MRR (Recharts, data มีใน Stripe)
- [ ] 🟡 **Usage sparklines per org** — กราฟเล็กๆ ติดการ์ด org แสดง booking volume 30 วัน
- [ ] 🟡 **Churn risk flag** — org ที่ไม่ login >14 วัน หรือ usage ตก >50% แสดง badge "⚠️ At risk"

---

### J.5 Design System — ทำครั้งเดียวใช้ทุกที่

- [ ] 🟢 **Skeleton loaders ครบทุกหน้า** — ทุก page ที่ fetch data ต้องมี skeleton ก่อน data โหลด (ตอนนี้มีบางหน้า)
- [ ] 🟡 **Dark mode ครบ** — ตอนนี้มี darkMode class แต่หลาย component ยังไม่ apply ครบ (front-desk, analytics, admin)
- [ ] 🟡 **Motion system** — consistent transition timing: page load (fade 150ms), modal (scale+fade 200ms), toast (slide 250ms)
- [ ] 🔴 **Micro-interactions** — hover states บน card ที่ยกขึ้น, button press scale(0.97), loading shimmer

---

### สรุป J tasks — ทำตามลำดับนี้

| ลำดับ | งาน | เวลา | ผล |
|-------|-----|------|-----|
| 1 | Trust badges + sticky booking bar | <1 วัน | Conversion ↑ |
| 2 | Folio print template | <1 วัน | ใช้งานจริงได้ |
| 3 | Revenue target bar (ลบ coming soon) | <1 วัน | Owner happy |
| 4 | Room block จาก grid | <1 วัน | Operation ไม่สะดุด |
| 5 | Org search + impersonate banner | <1 วัน | Admin UX ดีขึ้น |
| 6 | Gallery lightbox + room modal | 2 วัน | Conversion ↑↑ |
| 7 | KPI comparison widget | 1 วัน | Owner insight ดีขึ้น |
| 8 | Skeleton loaders ครบ | 1 วัน | ดูเป็น premium |
| 9 | End-of-shift cashier summary | 2 วัน | Staff daily use |
| 10 | Channel pie chart + heatmap | 2 วัน | Owner analytics ครบ |
| 11 | MRR trend chart + churn flag | 2 วัน | Admin insight ดีขึ้น |
| 12 | Notification bell real-time | 2 วัน | Staff awareness ↑ |
| 13 | Dark mode ครบ | 2 วัน | Modern feel |
| 14 | Export PDF/Excel | 3 วัน | Owner ขอบ่อย |
| 15 | Reservation Gantt timeline | 4 วัน | Front desk ❤️ |
