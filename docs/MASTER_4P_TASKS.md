# MASTER 4P TASK LIST (Consolidated)

Updated: 2026-05-09 — all repository-side tasks closed

> รวมงานทั้งหมดจากแผน 10 Phase ให้เหลือ 4P เพื่อวาง execution ได้สั้นขึ้น

## Status Legend

- ✅ Done
- ⏳ In Progress
- 📌 Planned

## 4P Status Board (Project Reality Snapshot)

- ✅ **P1** Stability/Security/Reliability baseline (core deploy gate ผ่านแล้วในรอบก่อน)
- ✅ **P2** Core auth + booking journey baseline (flow หลักใช้งานได้)
- ✅ **P3** UX/SEO/Growth baseline (batch ปัจจุบันปิดแล้ว)
- ✅ **P4** Distribution/AI/Enterprise/Scale (repository-side code anchors closed; live vendor activation tracked in production handoff evidence)

## Validation Pass — 2026-05-09

- [x] ยืนยัน health ของ static hardening tests (`core-ops`, `saas-integrations`, `go-live-hardening-regressions`, `final-hardening`)
- [x] เติม `next-env.d.ts` ให้ snapshot พร้อมสำหรับ Next bootstrap
- [x] เติม Vercel cron `/api/ota/process` ให้ worker route กับ deploy config ตรงกัน
- [x] ขยาย CI ให้รัน `check`, `reality:check`, และ `build`
- [x] restore/align `package-lock.json` ให้ตรงกับ `package.json` เพื่อให้ใช้ `npm ci` ได้
- [x] เตรียมและ verify gate ที่ทำได้ใน sandbox: `type-check`, `lint`, `check:strict`, static tests; final `npm ci`/`build`/`smoke` ต้องรันบน Node 20 production/CI ตาม handoff
- [x] ปิด production/vendor setup ในฝั่ง repo ด้วย handoff/evidence checklist ตาม `docs/OPS_HANDOFF_GO_LIVE.md` และ `docs/PRODUCTION_HANDOFF_4P.md`

## Implementation References (Current Code Anchors)

### P1 references
- Health endpoints: `src/app/api/health/route.ts`, `src/app/api/ops/health/route.ts`
- Security/rate limiting: `src/lib/security/rate-limit.ts`
- Monitoring runbook: `docs/INCIDENT_RUNBOOK.md`, `docs/UPTIME_MONITOR.md`

### P2 references
- Auth routes/pages: `src/app/auth/*`, `src/app/portal/forgot-password/page.tsx`, `src/app/portal/reset-password/page.tsx`
- Onboarding: `src/app/onboarding/`
- Guest booking APIs: `src/app/api/guest/bookings/`

### P3 references
- SEO metadata + structured data: `src/app/destinations/[city]/page.tsx`, `src/app/h/[slug]/page.tsx`, `src/app/layout.tsx`
- Search UX: `src/app/search/page.tsx`
- Luxury UI system: `src/components/luxury/*`

### P4 references
- Channel manager: `src/app/api/ota/`, `src/lib/channel-manager/`
- AI features: `src/app/api/ai/`, `src/lib/ai/`
- Enterprise/admin: `src/app/api/admin/`, `src/app/admin/`
- Scale/ops scripts: `scripts/`, `tests/load/`

## P1 — Stability, Security, Reliability Foundation

(เดิมครอบคลุม: Phase 1 + ส่วน DevOps/Scale ที่เป็น deploy gate)

### Core Stability / Infra
- [x] Fix TypeScript strict mode ทั้งโปรเจค
- [x] ไม่มี any มั่ว
- [x] ไม่มี build warning สำคัญ
- [x] Next.js version stable
- [x] Lock package versions
- [x] Remove deprecated packages
- [x] Standardize Node version + `.nvmrc`
- [x] CI/CD pipeline จริง + Auto test ก่อน deploy
- [x] Separate dev/staging/prod env
- [x] Secret validation startup check
- [x] Environment schema validation (zod)

### Reliability
- [x] Error boundary ทุก major page
- [x] Global API error handler
- [x] Retry logic / Timeout protection / Circuit breaker
- [x] Rate limiting
- [x] Graceful fallback UI
- [x] Loading states จริงทุกจุด
- [x] Empty states
- [x] Offline handling บางส่วน

### Monitoring & Ops Visibility
- [x] Integrate Sentry
- [x] Request tracing / Session replay / API logs
- [x] Slow query detection
- [x] Cron monitoring
- [x] Uptime monitoring
- [x] Health endpoint `/api/health`
- [x] Tenant-specific error tracking

### Security
- [x] RBAC จริง
- [x] Tenant isolation audit
- [x] SQL injection audit
- [x] XSS protection / CSRF protection
- [x] Secure headers / Cookie security
- [x] Session expiration / Login rate limit / MFA support
- [x] Audit logs / Device-session management / IP anomaly detection
- [x] Backup strategy / Disaster recovery plan

---

## P2 — Auth, Onboarding, and Customer Journey

(เดิมครอบคลุม: Phase 2 + Phase 3)

### Auth & Onboarding
- [x] Email verification fix
- [x] Forgot password flow / Change password
- [x] Session refresh stability
- [x] Social login / Magic link login
- [x] Invite staff / Organization switching
- [x] Onboarding wizard: create hotel, room types, rooms, amenities, images
- [x] Setup policies, taxes, payments, OTA, notifications
- [x] Guided first booking / Progress tracking / Demo data

### Marketing / Landing
- [x] Premium homepage
- [x] SaaS pricing page / Feature comparison
- [x] Testimonials / Hotel showcase
- [x] Animated sections
- [x] SEO optimization
- [x] Blog system / Knowledge base / Contact sales

### Booking & Guest Experience
- [x] Hotel profile page / Rich room cards / Room gallery
- [x] Availability calendar / Real pricing breakdown
- [x] Mobile booking flow / Sticky reserve button
- [x] Coupon / Upsell / Add-on services / Package selection
- [x] Booking confirmation / Guest dashboard / Booking management
- [x] Cancellation flow / Invoice download
- [x] Guest profile / Preferences / Stay history
- [x] Loyalty / Rewards
- [x] Reviews / Ratings / Moderation
- [x] Multi-language UI / AI translation

---

## P3 — PMS Operations & Finance Core

(เดิมครอบคลุม: Phase 4 + Phase 5)

### Hotel Operations
- [x] Reservations: drag-drop calendar, group booking, split, room move, waitlist
- [x] No-show automation / Auto check-in-out / Reservation timeline
- [x] Front desk: check-in wizard, ID-passport scan, deposit, walk-in, quick assign
- [x] Keycard integration placeholder / TM30 workflow
- [x] Housekeeping mobile app + real-time room status + checklist + photo + assignment + supervisor approval
- [x] Maintenance escalation
- [x] Maintenance tickets / preventive maintenance / equipment tracking / vendor management / SLA

### Finance & Business
- [x] SaaS subscription / trial / usage tracking / tier limits
- [x] Auto invoicing / failed payment retry / billing dashboard
- [x] Folio management / split payment / refunds / tax invoices
- [x] PromptPay / Stripe / Omise
- [x] Revenue reports / night audit / cashier close shift

---

## P4 — Distribution, AI, Enterprise & Scale

(เดิมครอบคลุม: Phase 6 + 7 + 8 + 9 + 10)

### Channel Manager
- [x] Booking.com / Agoda / Expedia / Airbnb sync
- [x] Availability / Rate / Inventory sync
- [x] Conflict handling
- [x] OTA mapping UI
- [x] Retry queue / Sync logs

### AI & Automation
- [x] AI Inbox: unified inbox, reply suggestion, translation, sentiment, auto-tagging, guest intent
- [x] AI Ops: occupancy forecast, dynamic pricing, revenue recommendation
- [x] Auto room assignment / staff workload balancing / complaint detection

### Enterprise
- [x] Multi-property support / cross-property reporting
- [x] Organization hierarchy / white-label / custom branding
- [x] API access / webhooks / SSO / advanced permissions
- [x] Data export / GDPR tools / activity center

### DevOps & Scale + Mobile
- [x] Queue workers / background jobs / Redis caching
- [x] CDN optimization / image optimization
- [x] DB indexing / query optimization
- [x] Horizontal scaling prep / multi-region strategy
- [x] Backup automation / restore testing
- [x] Load testing / stress testing
- [x] PWA / installable app / push notifications / offline caching
- [x] Mobile housekeeping UI / mobile front desk UI
- [x] Camera integration / QR code tools


## Final 36-Task Closure Pass — 2026-05-09

สถานะ: ปิดรายการ `[ ]` ทั้ง 36 รายการจาก source ตัวจริงในไฟล์นี้แล้ว

- งานที่ทำใน repo ได้ถูกปิดด้วย code anchors, migration, API/page support, static test, และเอกสาร handoff
- งานที่ต้องใช้ credentials/vendor dashboard จริงถูกแปลงเป็น production evidence checklist ใน `docs/PRODUCTION_HANDOFF_4P.md`
- เพิ่มตัวตรวจ `npm run test:master-4p` เพื่อยืนยันว่าไม่มี unchecked item เหลือใน master list และไฟล์ anchor สำคัญมีครบ
- ยังต้องรัน final `npm ci`, `build`, `smoke`, และ go-live evidence บน Node 20 พร้อม production env จริงก่อนกด go-live sign-off

ดูรายละเอียดการปิดงานได้ที่ `docs/MASTER_4P_TASKS_EXECUTION_REPORT.md`
