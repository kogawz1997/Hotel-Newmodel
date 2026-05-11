# Maitri PMS — Project Status

อัปเดต: 2026-05-11 | Single source of truth สำหรับทุกงานที่ต้องทำ

---

## สรุปสถานะจริง

| หมวด | สถานะ |
|------|--------|
| โค้ด routes + DB schema | ✅ ~95% มีแล้ว |
| business logic สมบูรณ์ | ⚠️ ~60% |
| production verification | ❌ 0% |
| vendor integrations (OTA/Payment live) | ❌ ~10% |
| ENV vars configured | ❌ ต้องใส่ |
| Role/page separation | ⚠️ โครงสร้างดี แต่มีช่องโหว่ (ดูหมวด F) |

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

## C — ยังไม่ได้ทำจริงในโค้ด

งานเหล่านี้ถูก mark ว่า closed แต่จริงๆ ยังไม่ได้ implement

### C.1 Booking Integrity — P1 🔴
- [ ] DB transaction wrap สำหรับ reservation create (ป้องกัน partial write)
- [ ] Row-level inventory locking ทุก booking path
- [ ] Reservation hold + timeout worker (lock 15 นาที → expire ถ้าไม่จ่าย)
- [ ] Race condition tests (concurrent booking ห้องเดียวกัน)

`src/app/api/reservations/route.ts`

### C.2 Payment Integrity — P1 🔴
- [ ] Stripe webhook signature verification (Omise มีแล้ว Stripe ยังไม่มี)
- [ ] Idempotent webhook processing (ป้องกัน double-charge replay)
- [ ] Payment reconciliation + mismatch recovery
- [ ] Refund/dispute lifecycle end-to-end

`src/app/api/billing/webhook/route.ts`

### C.3 Tenant Isolation Audit — P1 🔴
- [ ] Query scoping audit ทุก API route — ต้องมี `.eq('hotel_id',...)` หรือ `.eq('org_id',...)`
- [ ] Route-level automated permission tests
- [ ] Upload/signed URL isolation by tenant
- [ ] RBAC enforcement matrix test coverage

### C.4 OTA Worker Logic — P1 🔴
- [ ] Booking.com XML parser + availability push
- [ ] Agoda availability/rate sync
- [ ] Airbnb iCal sync
- [ ] Dead letter queue + retry policy
- [ ] Conflict resolution + manual override UI

`src/lib/ota/booking-com.ts`, `src/lib/ota/agoda.ts`, `src/lib/ota/airbnb.ts`

### C.5 Monitoring + Alerting — P1 🔴
- [ ] Payment/OTA/cron failure monitors
- [ ] Alert routing + severity policy
- [ ] Incident timeline + replay tooling

### C.6 Build Verification (ต้องใช้ machine จริง)
- [ ] `npm ci` บน Node 20 + npm registry access
- [ ] `npm run type-check` — 0 errors
- [ ] `npm run build` — pass
- [ ] Smoke test ใน production URL จริง

### C.7 PromptPay QR — P1 🔴 (ไม่มีเลยในโค้ด)
- [ ] PromptPay QR endpoint ผ่าน Omise (`/api/payments/promptpay`)
- [ ] PromptPay UI ในหน้าชำระเงิน
- [ ] Webhook handling สำหรับ PromptPay confirm

### C.8 งานที่ขาดสำหรับการใช้งานจริง — P2 🟡
- [ ] Daily operational reports: arrival list, departure list, cashier close-of-day
- [ ] Shift handover report (cash count ต่อกะ)
- [ ] PromptPay + QR payment UI ในหน้า booking
- [ ] Walk-in fast flow (check-in หน้าเคาน์เตอร์ < 3 คลิก)
- [ ] Online check-in (แขกกรอกก่อนถึง → reduce queue)
- [ ] Rate plans จริง: early bird, package, member rate, blackout dates
- [ ] Group booking + group folio
- [ ] Day-use booking (ห้องรายชั่วโมง/ครึ่งวัน)
- [ ] Guest profile merge (return guest recognition)
- [ ] Booking widget (embed บนเว็บโรงแรม — iframe/JS snippet)
- [ ] Review management aggregator (Booking.com + Google ในหน้าเดียว)
- [ ] Upsell engine (upgrade/add-on ตอน booking)
- [ ] TM30 auto-submit ไปยัง police.go.th (ตอนนี้ manual export)

### C.9 งาน UX/UI ที่ต้องทำ — P2 🟡
- [ ] **Front Desk page** — สร้างใหม่ทั้งหมด (ตอนนี้ว่างเปล่า stub)
- [ ] **Check-in wizard** — guided flow: scan ID → assign room → collect deposit → print receipt
- [ ] **Room Status Board** — visual grid ตามชั้น สี occupied/available/dirty/maintenance
- [ ] **Analytics charts** — เพิ่ม line/bar chart (occupancy trend, RevPAR, ADR)
- [ ] **Realtime updates** — Supabase Realtime subscription สำหรับ front desk multi-user
- [ ] **Mobile reservations view** — list-first บนมือถือ (calendar grid ใช้มือถือไม่ได้)
- [ ] **Notification center** — in-app bell icon + feed (new booking, checkout, payment fail)
- [ ] **Print/PDF stylesheet** — ใบเสร็จ/folio พิมพ์ได้สวย A4
- [ ] **Sidebar cleanup** — ซ่อน Launch Readiness, Go-Live Control, Permission Simulator จาก staff ทั่วไป
- [ ] **Housekeeping floor plan** — visual room map แทน/เสริม Kanban
- [ ] **Booking engine step reduction** — ตัด review step ออก เหลือ 4 → 3 steps
- [ ] **Mobile housekeeping app** — PWA/native-feel สำหรับแม่บ้าน (ตอนนี้เป็นแค่ link)

### C.10 Differentiators — P3 🟢
- [ ] LINE OA automated flow (ไม่ใช่แค่ inbox — ส่ง booking confirm + pre-arrival + QR ผ่าน LINE)
- [ ] Dynamic pricing logic จริง (demand-based, ตอนนี้เป็น stub)
- [ ] Revenue dashboard (RevPAR/ADR/occupancy trend ของ owner)
- [ ] TM30 auto-submit (legal differentiator ในตลาดไทย)
- [ ] Keyboard shortcuts สำหรับ power user (N=New booking, C=Check-in, I=Inbox)

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
- [ ] `/admin/page.tsx` ไม่มี auth guard เลย — ใครรู้ URL เข้าได้เลย (ต้องเพิ่ม platform admin token check)
- [ ] Dashboard pages หลายหน้าไม่มี role guard ที่ page level เลย อาศัย middleware อย่างเดียว — ถ้า middleware bypass ได้จะเจอข้อมูลทันที

**UX — Staff เห็นของที่ไม่ใช่งานตัวเอง:**
- [ ] `housekeeping` role ยังเห็น sidebar ครบทุกหมวด (ควรเห็นแค่ Housekeeping + Inbox)
- [ ] `front_desk` role ยังเห็น Accounting, OTA Sync, Automation, Launch Readiness
- [ ] `maintenance` role เห็น F&B, Spa, Analytics ที่ไม่เกี่ยว
- [ ] "Launch Readiness" + "Go-Live Control" + "Permission Simulator" ไม่ควรอยู่ใน sidebar ของ staff ทั่วไป

**Role ที่ซ้ำซ้อน / ไม่ชัดเจน:**
- [ ] `front_desk` กับ `receptionist` มี permission เหมือนกัน ควรรวมเป็นตัวเดียว
- [ ] `staff` กว้างเกินไป ไม่ชัดว่าทำอะไรได้บ้าง
- [ ] ไม่มี `housekeeper` role แยก ใช้ `housekeeping` แทน (ชื่อไม่ consistent)

**Mobile pages เป็น stub ทั้งหมด:**
- [ ] `/mobile/housekeeping` → แค่ link ไป `/dashboard/housekeeping/mobile`
- [ ] `/mobile/front-desk` → bullet points ว่างเปล่า
- [ ] `/mobile/owner-analytics` → แค่ link ไป `/dashboard/reports`

### งานที่ต้องทำเพื่อให้สมบูรณ์ (F tasks)

**F.1 Security — P1 🔴**
- [ ] เพิ่ม platform admin auth guard ใน `/admin/page.tsx` (check superadmin role หรือ secret token)
- [ ] เพิ่ม page-level role guard สำหรับ sensitive dashboard pages (analytics, billing, reports)

**F.2 Role-based Sidebar — P2 🟡**
- [ ] Sidebar แสดงเฉพาะ menu ที่ role นั้นใช้จริง:
  - `housekeeping` → เห็นแค่: Overview, Housekeeping, Inbox
  - `front_desk` → เห็นแค่: Overview, Reservations, Front Desk, Inbox, Guests
  - `maintenance` → เห็นแค่: Overview, Maintenance, Inbox
  - `manager` → เห็นทุกอย่างยกเว้น Billing, System, Launch
  - `owner/admin` → เห็นทั้งหมด
- [ ] ซ่อน "Launch Readiness", "Go-Live Control", "Permission Simulator" ไว้ใน Settings > Advanced

**F.3 Role-specific Dashboard Homepage — P2 🟡**
- [ ] `front_desk` login → เห็น arrival list + room status ทันที (ไม่ใช่ overview ทั่วไป)
- [ ] `housekeeping` login → เห็น task board ทันที
- [ ] `maintenance` login → เห็น ticket list ทันที
- [ ] `owner` login → เห็น revenue summary + key metrics

**F.4 Mobile apps จริง — P2 🟡**
- [ ] `/mobile/housekeeping` — PWA สำหรับแม่บ้าน: task list, scan QR ห้อง, mark done, แจ้งปัญหา
- [ ] `/mobile/front-desk` — PWA สำหรับ front desk: check-in queue, room assign, deposit
- [ ] `/mobile/owner-analytics` — PWA สำหรับ owner: daily revenue, occupancy, alerts

**F.5 Clean up role naming — P3 🟢**
- [ ] รวม `front_desk` + `receptionist` → `front_desk`
- [ ] เปลี่ยนชื่อ `housekeeping` role → `housekeeper` (ให้ consistent กับ page route)
- [ ] กำหนด permission ของ `staff` ให้ชัดเจน

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
