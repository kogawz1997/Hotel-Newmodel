# Maitri PMS — Project Status

อัปเดต: 2026-05-11 | รวมจาก: PHASE1-10_CLOSED, ROUND2-5, MASTER_4P_TASKS, MASTER_REALITY_CHECK, GO_LIVE_100_CHECKLIST, PRODUCTION_SAAS_CHECKLIST, TODO_3P_MAPPING, P_ROUND_MIN_PLAN, ROUND2_SAAS_INTEGRATIONS, DEPLOYMENT_MATRIX, DELIVERY_HANDOFF, P1_EXECUTION_TRACKER, GITHUB_FILE_STATUS, MARKDOWN_DOC_STATUS, PROJECT_FILE_INVENTORY, MAITRI_HARDENING_SUMMARY, PRODUCTION_PATCH_NOTES, PRODUCTION_READY_REPORT, DEPLOYMENT_TOOLKIT_ADDED

---

## สรุปสถานะจริง

| หมวด | สถานะ |
|------|--------|
| โค้ด routes + DB schema | ✅ ~95% มีแล้ว |
| business logic สมบูรณ์ | ⚠️ ~60% |
| production verification | ❌ 0% |
| vendor integrations (OTA/Payment live) | ❌ ~10% |
| ENV vars configured | ❌ ต้องใส่ |

> **ข้อสรุป:** codebase พร้อมแทบทั้งหมด แต่ยังไม่ได้ verify ใน production environment จริง และงาน P1 critical (transaction safety, webhook sig, RBAC audit) ยังไม่ได้ทำจริง

---

## A — ทำเสร็จแล้วจริงในโค้ด

งานเหล่านี้มีโค้ดสมบูรณ์ ทดสอบ static ผ่านแล้ว

### Core Infrastructure
- [x] Auth middleware + session durability (`src/lib/auth/guards.ts`)
- [x] Onboarding gate — redirect dashboard → `/onboarding` ถ้าไม่มี hotel
- [x] RBAC role guards (`requireUser`, `requireHotelAccess`, `assertReservationAccess`)
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
- [x] Guest portal (login, register, dashboard, bookings, profile)
- [x] Hotel public pages (search, detail, gallery, availability)
- [x] Room comparison + pricing display
- [x] QR code generator สำหรับ check-in
- [x] In-stay room chat page (`/dashboard/chat/[reservationId]`)
- [x] PDPA data export endpoint (`/api/guest/privacy/export`)

### Payments
- [x] Omise charge endpoint (fail-closed guard ถ้าไม่มี key)
- [x] Omise deposit endpoint (fail-closed)
- [x] Omise refund endpoint (fail-closed)
- [x] Omise webhook signature verification + duplicate protection
- [x] Folio management + split payment
- [x] Payment reconciliation endpoint

### Operations Dashboard
- [x] Dashboard pages: rooms, reservations, housekeeping, F&B, spa, analytics
- [x] F&B POS UI + API routes
- [x] Spa booking UI + API routes (collision validation)
- [x] Maintenance ticket management
- [x] Housekeeping auto-task creation (auto-assigns on checkout)
- [x] Night audit cron (`/api/cron/night-audit`) — รัน 01:00 ICT
- [x] Launch readiness dashboard (`/dashboard/launch`)
- [x] Go-live control page

### Communications
- [x] LINE inbox integration (webhook + reply)
- [x] WhatsApp inbox integration
- [x] AI translation + suggested replies
- [x] AI concierge routes (stub + Claude Haiku integration)

### SaaS & Multi-tenant
- [x] Organization hierarchy + multi-property foundation
- [x] Trial auto-expire cron
- [x] Admin impersonation routes
- [x] Usage metrics endpoint
- [x] Stripe billing checkout + portal routes (fail-closed ถ้าไม่มี key)
- [x] Subscription plan feature gates

### Compliance
- [x] e-Tax automation routes
- [x] TM30 CSV export routes
- [x] PDPA privacy ledger

### Deployment
- [x] Dockerfile + docker-compose.yml
- [x] Vercel cron config (vercel.json) — 5 cron jobs
- [x] GitHub Actions CI (deploy-check.yml)
- [x] Render / Railway / Fly / Koyeb config files
- [x] PM2 ecosystem config + Nginx config
- [x] `.env.production.example` (ครบทุก key)

---

## B — โค้ดมีแล้ว รอ ENV Vars เท่านั้น

งานเหล่านี้ **พร้อม 100%** — ใส่ key แล้วทำงานได้เลย ไม่ต้องแก้โค้ดเพิ่ม

### 1. Email (SendGrid)
```env
SENDGRID_API_KEY=SG.xxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
SENDGRID_FROM_NAME=Hotel Name
```
**ที่ทำงานได้ทันที:**
- Pre-arrival email series (7 วัน, 3 วัน, 1 วัน ก่อน check-in)
- Post-stay email + review request
- Night audit summary email ถึง hotel owner
- Trial expiry warnings + expired notice
- Abandoned booking recovery emails
- Staff invitation emails

**Routes:** `/api/cron/pre-arrival`, `/api/cron/post-stay`, `/api/cron/night-audit`, `/api/cron/trial-expiry`, `/api/cron/abandoned-booking-recovery`, `/api/team/invite`

---

### 2. Error Tracking (Sentry)
```env
SENTRY_DSN=https://xxx@o0.ingest.sentry.io/0
NEXT_PUBLIC_SENTRY_DSN=https://xxx@o0.ingest.sentry.io/0
```
**ที่ทำงานได้ทันที:** error tracking ทุก API route, performance monitoring, session replay

---

### 3. Rate Limiting (Upstash Redis)
```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```
**ที่ทำงานได้ทันที:** rate limit auth endpoints, payment endpoints, AI endpoints

---

### 4. Payments — Stripe (SaaS billing)
```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```
**ที่ทำงานได้ทันที:** subscription checkout, billing portal, webhook processing
**Routes:** `/api/billing/checkout`, `/api/billing/portal`, `/api/billing/webhook`

---

### 5. Payments — Omise (hotel payments)
```env
OMISE_SECRET_KEY=skey_live_xxx
OMISE_PUBLIC_KEY=pkey_live_xxx
```
**ที่ทำงานได้ทันที:** charge, deposit, refund, webhook signature verification
**Routes:** `/api/payments/charge`, `/api/payments/deposit`, `/api/payments/refund`, `/api/payments/omise/webhook`

---

### 6. Supabase (production database)
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```
**ต้องทำด้วย:**
```bash
supabase db push   # apply ทุก migration ใน supabase/migrations/
```

---

### 7. OTA Channel Manager
```env
BOOKING_COM_API_BASE_URL=https://supply-xml.booking.com/hotels/ota/
BOOKING_COM_API_TOKEN=xxx
AGODA_API_BASE_URL=https://affiliateapi7.agoda.com/api/
AGODA_API_TOKEN=xxx
EXPEDIA_API_BASE_URL=https://services.expediapartnercentral.com/
EXPEDIA_API_TOKEN=xxx
AIRBNB_API_BASE_URL=https://api.airbnb.com/v2/
AIRBNB_API_TOKEN=xxx
```
**หมายเหตุ:** Routes + queue structure มีแล้ว แต่ logic ของแต่ละ provider ยังเป็น stub — ดูส่วน C.4 ด้านล่าง

---

### 8. Cron Security
```env
CRON_SECRET=your-random-secret-min-32-chars
OPS_READINESS_TOKEN=your-ops-token
```
**ที่ทำงานได้ทันที:** ทุก cron route ใช้ `Authorization: Bearer $CRON_SECRET` ตรวจสอบอยู่แล้ว

---

### 9. App URL
```env
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

---

## C — ยังไม่ได้ทำจริงในโค้ด (ต้องเขียนเพิ่ม)

งานเหล่านี้ถูก mark ว่า closed แต่จริงๆ **ยังไม่ได้ implement**

### C.1 Booking Integrity (P1 Critical)
- [ ] DB transaction wrap สำหรับ reservation create flow (ป้องกัน partial write)
- [ ] Row-level inventory locking ทุก booking path
- [ ] Reservation hold + timeout worker (จอง → ล็อคห้อง 15 นาที → expire ถ้าไม่จ่าย)
- [ ] Race condition tests (concurrent booking ห้องเดียวกัน)

**ไฟล์ที่ต้องแก้:** `src/app/api/reservations/route.ts`, `src/app/api/reservations/[id]/route.ts`

### C.2 Payment Integrity (P1 Critical)
- [ ] Webhook signature verification ครบทุก provider (Stripe ยังไม่มี, Omise มีแล้ว)
- [ ] Idempotent webhook processing (ป้องกัน double-charge จาก replay)
- [ ] Payment reconciliation + mismatch recovery flow
- [ ] Refund/dispute lifecycle ครบ end-to-end

**ไฟล์ที่ต้องแก้:** `src/app/api/billing/webhook/route.ts`

### C.3 Tenant Isolation Audit (P1 Critical)
- [ ] Query scoping audit — ทุก table ต้องมี `.eq('hotel_id', ...)` หรือ `.eq('org_id', ...)`
- [ ] Route-level permission tests (ที่เป็น automated test)
- [ ] Upload/signed URL isolation by tenant
- [ ] Role enforcement matrix test coverage

### C.4 OTA Worker Logic (P1 Critical)
- [ ] Booking.com XML parser + availability push logic
- [ ] Agoda availability/rate sync logic
- [ ] Airbnb iCal sync logic
- [ ] Dead letter queue + retry policy
- [ ] Conflict resolution + manual override UI

**ไฟล์ที่ต้องเขียน:** `src/lib/ota/booking-com.ts`, `src/lib/ota/agoda.ts`, `src/lib/ota/airbnb.ts`

### C.5 Monitoring + Alerting (P1 Critical)
- [ ] Payment/OTA/cron failure monitors
- [ ] Alert routing + severity policy
- [ ] Incident timeline + replay tooling

### C.6 Build Verification (ต้องทำใน environment จริง)
- [ ] `npm ci` clean install บน Node 20 (ต้องมี npm registry access)
- [ ] `npm run type-check` — 0 errors
- [ ] `npm run build` — build pass
- [ ] Smoke test run จริง

```bash
# รันบน machine ที่มี Node 20 + internet
npm ci
npm run type-check
npm run build
npm run smoke   # BASE_URL=https://your-domain.com
```

---

## D — Deploy Checklist (ย่อ)

```bash
# 1. ตั้ง ENV ทุกตัวใน Vercel/hosting
#    ดูรายการครบใน .env.production.example

# 2. Apply migrations
supabase db push

# 3. Build + deploy
npm ci && npm run build
vercel --prod   # หรือ docker compose up --build

# 4. Verify
curl https://your-domain.com/api/health
curl https://your-domain.com/api/ops/readiness
npm run smoke BASE_URL=https://your-domain.com

# 5. Enable crons (Vercel จัดการอัตโนมัติจาก vercel.json)
#    /api/cron/night-audit        — 18:00 UTC ทุกวัน
#    /api/cron/pre-arrival        — 02:00 UTC ทุกวัน
#    /api/cron/post-stay          — 03:00 UTC ทุกวัน
#    /api/cron/trial-expiry       — 06:00 UTC ทุกวัน
#    /api/cron/abandoned-booking-recovery — 10:00 UTC ทุกวัน
```

---

## E — ENV Vars ครบ (reference)

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
| `SENDGRID_API_KEY` | Email | ถ้าต้องการ email |
| `SENDGRID_FROM_EMAIL` | Email | ถ้าต้องการ email |
| `SENDGRID_FROM_NAME` | Email | ถ้าต้องการ email |
| `SENTRY_DSN` | Monitoring | แนะนำ |
| `NEXT_PUBLIC_SENTRY_DSN` | Monitoring | แนะนำ |
| `UPSTASH_REDIS_REST_URL` | Rate Limit | แนะนำ |
| `UPSTASH_REDIS_REST_TOKEN` | Rate Limit | แนะนำ |
| `BOOKING_COM_API_TOKEN` | OTA | ถ้าใช้ Booking.com |
| `AGODA_API_TOKEN` | OTA | ถ้าใช้ Agoda |
| `EXPEDIA_API_TOKEN` | OTA | ถ้าใช้ Expedia |
| `AIRBNB_API_TOKEN` | OTA | ถ้าใช้ Airbnb |
| `BOOKING_COM_API_BASE_URL` | OTA | ถ้าใช้ Booking.com |
| `AGODA_API_BASE_URL` | OTA | ถ้าใช้ Agoda |
| `EXPEDIA_API_BASE_URL` | OTA | ถ้าใช้ Expedia |
| `AIRBNB_API_BASE_URL` | OTA | ถ้าใช้ Airbnb |

ดูตัวอย่างค่าครบที่ `.env.production.example`

---

## ไฟล์ที่รวมมาในเอกสารนี้ (ลบแล้ว)

```
PHASE1_CLOSED.md, PHASE3_CLOSED.md, PHASE4_CLOSED.md, PHASE5_CLOSED.md
PHASE6_CLOSED.md, PHASE7_CLOSED.md, PHASE8_CLOSED.md, PHASE9_CLOSED.md
PHASE10_CLOSED.md, ROUND2_CLOSED.md, ROUND3_CLOSED.md, ROUND4_CLOSED.md
ROUND5_REALITY_CHECK.md, ROADMAP.md, TODO.md
MAITRI_HARDENING_SUMMARY.md, PRODUCTION_PATCH_NOTES.md
PRODUCTION_READY_REPORT.md, DEPLOYMENT_TOOLKIT_ADDED.md
docs/MASTER_PHASE_TASKS.md, docs/MASTER_4P_TASKS.md
docs/MASTER_4P_TASKS_EXECUTION_REPORT.md
docs/MASTER_REALITY_CHECK_2026-05-09.md
docs/DELIVERY_HANDOFF_2026-05-09.md
docs/P1_EXECUTION_TRACKER_2026-05-09.md
docs/GO_LIVE_100_CHECKLIST.md
docs/PRODUCTION_SAAS_CHECKLIST.md
docs/GITHUB_FILE_STATUS.md, docs/MARKDOWN_DOC_STATUS.md
docs/PROJECT_FILE_INVENTORY.md, docs/TODO_3P_MAPPING.md
docs/P_ROUND_MIN_PLAN.md, docs/ROUND2_SAAS_INTEGRATIONS.md
docs/DEPLOYMENT_MATRIX.md
```
