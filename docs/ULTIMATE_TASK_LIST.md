# ULTIMATE DEPTH — Hotel-Newmodel Task List

> อัปเดต: 2026-05-17  
> ทุก task ต้องตอบ 7 ข้อก่อนติ๊ก: ใครใช้ / เว็บไหน / role ไหน / table ไหน / scope ยังไง / failure/rollback / test ยังไง

**Legend:**
- `[ ]` — ยังไม่ได้ทำ
- `[~]` — มีบางส่วนแล้ว แต่ยังไม่ครบ
- `[x]` — เสร็จแล้วจริง (โค้ดมี + verified)

---

## 0. Prerequisite: 7-Question Gate (ทำทุก feature ก่อนเริ่ม)

> ก่อนเริ่ม feature ใดให้ตอบ 7 ข้อนี้ก่อนเสมอ:

```
[ ] 1. ใครใช้ (role/user type)
[ ] 2. ใช้ผ่านเว็บไหน (/admin /dashboard /h/[slug] /portal)
[ ] 3. ใช้ role/permission อะไร
[ ] 4. อ่าน/เขียน table ไหน
[ ] 5. scope ด้วย org_id/hotel_id/guest_id ยังไง
[ ] 6. failure แล้ว rollback/retry ยังไง
[ ] 7. มี test พิสูจน์ยังไง
```

---

## 1. Web Contract Separation (3 เว็บ = 3 contract)

### 1.1 Owner/Platform Admin Contract (`/admin/*`, `/platform/*`)

- [~] `middleware.ts` — enforce `/admin/*` ให้ `platform_admin` เท่านั้น (มี middleware แต่ต้อง audit ให้ครบ)
- [ ] Page loader guard — ทุก page ใน `/admin/*` ต้องมี server-side guard ก่อน render
- [ ] API guard — ทุก `/api/admin/*` ต้องมี `web: 'platform'` check ก่อน logic
- [ ] DB/RLS policy — `platform_admin_select` policy ทุก table ที่ admin ต้องเห็น
- [ ] Audit event — ทุก action ของ platform_admin ต้องเขียน audit log
- [ ] **Forbidden actions enforcement:**
  - [ ] ห้าม refund แทนโรงแรม
  - [ ] ห้าม export PDPA data แขก โดยไม่มี legal basis
  - [ ] ห้ามเปลี่ยน owner email โดยไม่มี confirmation flow
  - [ ] ห้าม rotate tenant API key โดยไม่มี audit entry
  - [ ] ห้าม impersonate เกินเวลาที่กำหนด (ต้องมี `expiresAt` + auto revoke)

### 1.2 Tenant Dashboard Contract (`/dashboard/*`, `/backoffice/*`, `/mobile/*`)

- [~] `middleware.ts` — enforce tenant routes (มีแต่ต้อง audit)
- [ ] ทุก API route ใน tenant path ต้องใช้ context ครบ 8 fields:
  - [ ] `ctx.userId`
  - [ ] `ctx.organizationId`
  - [ ] `ctx.hotelId`
  - [ ] `ctx.role`
  - [ ] `ctx.permissions`
  - [ ] `ctx.subscriptionStatus`
  - [ ] `ctx.plan`
  - [ ] `ctx.impersonation` (optional แต่ต้อง handle)
- [ ] Audit ทุก API ที่ไม่มี context ทั้ง 8 fields = flag เป็น "not ready"

### 1.3 Guest/Public Contract (`/h/[slug]`, `/booking/*`, `/portal/*`)

- [~] Public hotel pages ห้ามคืน internal data (ต้องทำ response whitelist)
- [ ] **ห้ามคืนใน public API:**
  - [ ] `internal_notes` / `staff_notes`
  - [ ] `cost` / `commission`
  - [ ] `payment` raw payload
  - [ ] guest full passport number
  - [ ] other guests' data
  - [ ] channel credentials
- [ ] Guest เห็นได้เฉพาะ booking ตัวเอง (RLS + API guard)
- [ ] Anonymous user ไม่สามารถ query private tables

---

## 2. Golden Guard Pipeline (API Standard)

### 2.1 สร้าง `src/lib/http/api-guard.ts`

- [ ] Unified `apiGuard()` function ที่ครอบ 12 steps:
  1. [ ] Method check
  2. [ ] Rate limit
  3. [ ] Raw body handling (webhook mode)
  4. [ ] CSRF/origin check (cookie mutation)
  5. [ ] Auth/session resolve
  6. [ ] Tenant status check (`active` | `trialing` | else reject)
  7. [ ] Plan/feature gate
  8. [ ] Permission check
  9. [ ] Zod schema validation
  10. [ ] Return guard context
  11. [ ] (Caller does: DB transaction/service)
  12. [ ] (Caller does: audit/system event + safe response)

### 2.2 Migrate existing routes ให้ใช้ `apiGuard()`

- [ ] Audit ทุก route ใน `/api/reservations/*` — migrate ให้ใช้ guard
- [ ] Audit ทุก route ใน `/api/payments/*`
- [ ] Audit ทุก route ใน `/api/guests/*`
- [ ] Audit ทุก route ใน `/api/booking/*`
- [ ] Audit ทุก route ใน `/api/admin/*`
- [ ] Audit ทุก route ใน `/api/ota/*`
- [ ] ห้ามมี route.ts ที่เขียน auth/permission check แบบ ad-hoc (ต้องผ่าน guard)

---

## 3. Context System กลาง

### 3.1 สร้าง `src/lib/context/` (ยังไม่มี — ต้องสร้างใหม่ทั้งหมด)

- [ ] `src/lib/context/resolve-request-context.ts`
  - [ ] Detect web type จาก hostname/path
  - [ ] Route ไปยัง resolver ที่ถูก
- [ ] `src/lib/context/tenant-context.ts`
  - [ ] `TenantContext` type ครบ 8 fields
  - [ ] `resolveTenantContext(request)` function
  - [ ] Validate subscription status
  - [ ] Validate plan
  - [ ] Handle impersonation (ต้องมี `expiresAt` check)
- [ ] `src/lib/context/guest-context.ts`
  - [ ] `GuestContext` type
  - [ ] `resolveGuestContext(request)` function
  - [ ] `verifiedReservationIds` — ดึงจาก session
- [ ] `src/lib/context/platform-context.ts`
  - [ ] `PlatformContext` type
  - [ ] `resolvePlatformContext(request)` function
  - [ ] Verify `isPlatformAdmin: true`

---

## 4. Database Ownership Ledger

### 4.1 สร้าง `docs/DATABASE_OWNERSHIP_LEDGER.md` (ยังไม่มี)

- [ ] List ทุก table พร้อม:
  - Owner key (org_id / hotel_id / guest_id)
  - Public? (yes/no/partial)
  - Tenant Read permission
  - Tenant Write permission
  - Guest Read permission
  - Admin Read permission
- [ ] ทุก table ที่ไม่มี owner key ต้องตัดสินใจ:
  - [ ] เพิ่ม `organization_id`
  - [ ] เพิ่ม `hotel_id`
  - [ ] ทำ join guard
  - [ ] ห้ามใช้ใน multi-tenant path

---

## 5. RLS Ultimate Audit

### 5.1 Policy ครบ 7 แบบต่อ table

- [ ] `tenant_select` policy
- [ ] `tenant_insert` policy
- [ ] `tenant_update` policy
- [ ] `tenant_delete` policy
- [ ] `guest_select_own` policy
- [ ] `platform_admin_select` policy
- [ ] `service_role_internal` policy

### 5.2 Table Priority (ต้องทำก่อน)

- [ ] `reservations` — RLS ครบ 7 policies
- [ ] `payments` — RLS ครบ 7 policies
- [ ] `rooms` — RLS ครบ 7 policies
- [ ] `guests` — RLS ครบ 7 policies
- [ ] `folios` — RLS ครบ 7 policies
- [ ] `channel_connections` — RLS ครบ 7 policies
- [ ] `invoices` — RLS ครบ 7 policies

### 5.3 RLS Tests (ต้องผ่านทุกข้อ)

- [ ] Hotel A user select hotel B reservation → 0 rows
- [ ] Guest A select guest B booking → 0 rows
- [ ] Anonymous select private table → denied
- [ ] Suspended tenant select data → denied (or 0 rows)

---

## 6. Reservation as Ledger

### 6.1 Tables (ต้องสร้างถ้ายังไม่มี)

- [~] `reservations` — มีแล้ว แต่ต้อง audit columns
- [ ] `reservation_events` table:
  ```sql
  id, reservation_id, hotel_id, event_type, actor_type, actor_id,
  before jsonb, after jsonb, metadata jsonb, created_at
  ```
- [ ] `reservation_room_assignments` table
- [ ] `reservation_status_history` table
- [ ] `reservation_price_snapshots` table

### 6.2 Event Types ต้องครบ

- [ ] `created`
- [ ] `confirmed`
- [ ] `checked_in`
- [ ] `room_moved`
- [ ] `stay_extended`
- [ ] `split`
- [ ] `merged`
- [ ] `cancelled`
- [ ] `no_show`
- [ ] `checked_out`

### 6.3 ทุก action ต้องเขียน event

- [ ] Check-in → event
- [ ] Check-out → event
- [ ] Room move → event
- [ ] Cancellation → event
- [ ] Price adjustment → event
- [ ] Status change → event

---

## 7. Availability Engine

### 7.1 Input/Output ครบตาม spec

- [ ] `AvailabilityInput` type: `hotelId, checkIn, checkOut, roomTypeId?, roomsRequested, source`
- [ ] `AvailabilityResult` type: `roomTypeId, totalRooms, availableRooms, blockedRooms, reasons, ratePlans`

### 7.2 คำนวณจากทุก source

- [ ] Physical rooms inventory
- [ ] Room status (clean/dirty/OOO)
- [ ] Maintenance blocks
- [ ] Blackout dates
- [ ] Existing reservations (no double-book)
- [ ] Group bookings
- [ ] OTA locks
- [ ] Rate calendar inventory override
- [ ] Min/Max stay rules
- [ ] CTA (Closed to Arrival) / CTD (Closed to Departure)
- [ ] Subscription active check
- [ ] Hotel active check

### 7.3 Block Reasons ครบ

- [ ] `BOOKED` / `MAINTENANCE` / `BLACKOUT` / `OUT_OF_ORDER`
- [ ] `CTA` / `CTD` / `MIN_STAY` / `MAX_STAY`
- [ ] `TENANT_SUSPENDED` / `NO_RATE`

### 7.4 Tests

- [ ] Unit test: double-book prevention
- [ ] Unit test: OTA lock blocks availability
- [ ] Unit test: suspended tenant returns TENANT_SUSPENDED
- [ ] Unit test: min stay rule enforcement

---

## 8. Booking Transaction — Race Condition Prevention

### 8.1 RPC `create_reservation_safely()` (ยังไม่มี)

- [ ] สร้าง Supabase function ใน migration:
  - [ ] `pg_advisory_xact_lock(hashtext(hotel_id || room_id || check_in))`
  - [ ] Recheck availability ภายใน transaction
  - [ ] Insert reservation + folio + event atomically
  - [ ] Handle idempotency key (ห้าม duplicate)
  - [ ] Raise exception `ROOM_NOT_AVAILABLE` ถ้า conflict
- [ ] ห้ามมี pattern: check availability → (gap) → insert reservation ในโค้ดใดก็ตาม

### 8.2 Migration

- [ ] สร้าง migration file สำหรับ RPC นี้
- [ ] Test: concurrent booking → 1 ได้, 1 fail gracefully

---

## 9. Booking Session + Payment Session

### 9.1 Tables (ยังไม่มี)

- [ ] `booking_sessions` table:
  - `id, hotel_id, guest_data, room_type_id, check_in, check_out`
  - `status: draft | priced | awaiting_payment | payment_failed | paid | confirmed | expired`
  - `price_snapshot jsonb, expires_at, idempotency_key`
- [ ] `payment_sessions` table:
  - `id, booking_session_id, hotel_id`
  - `status: created | pending | authorized | paid | failed | expired`
  - `provider, provider_ref, amount, currency, created_at`

### 9.2 Booking Flow ต้องครบ

- [ ] Step 1: Public search → `create booking_session` (draft)
- [ ] Step 2: Price freeze → `booking_session.status = priced`
- [ ] Step 3: Create `payment_session`
- [ ] Step 4: Process payment
- [ ] Step 5: Webhook paid → call `create_reservation_safely()`
- [ ] Step 6: `booking_session.status = confirmed`, send confirmation email
- [ ] **Failure path:**
  - [ ] Payment fail → `booking_session.status = payment_failed`
  - [ ] Guest data ยังอยู่ (ไม่หาย)
  - [ ] Retry payment ได้
  - [ ] Reservation ยัง NOT created จนกว่า payment จะ paid

---

## 10. Payment Ledger

### 10.1 Table `payment_ledger_entries` (ยังไม่มี)

- [ ] สร้าง table:
  ```sql
  id, hotel_id, reservation_id, payment_id,
  type: charge | refund | adjustment | void,
  amount, currency, status, provider, provider_ref, created_at
  ```
- [ ] ห้ามคิด `paid_amount` จาก single field — ต้อง query จาก ledger เสมอ:
  ```sql
  sum(charge.amount where paid) - sum(refund.amount where completed)
  ```
- [ ] Materialized/cache field ได้ แต่ต้อง regenerate จาก ledger ได้เสมอ
- [ ] สร้าง function `recalculate_paid_amount(reservation_id)` เพื่อ verify

---

## 11. Payment Webhook Inbox

### 11.1 Table `provider_events` (ยังไม่มี)

- [ ] สร้าง table:
  ```sql
  id, provider, event_id, event_type, raw_payload jsonb,
  signature_valid bool, received_at, processed_at,
  process_status: received | validated | processing | processed | failed | dead_letter,
  error text
  ```
- [ ] Unique constraint: `(provider, event_id)` — prevent duplicate processing

### 11.2 Worker/Process

- [ ] Webhook receiver → insert to `provider_events` (sync)
- [ ] Worker process → update status เป็น `processing` → process → `processed`
- [ ] Failure → `failed` → retry (max 3) → `dead_letter`
- [ ] Alert เมื่อมี dead_letter events

### 11.3 Stripe Webhook

- [~] `/api/webhooks/stripe` มีแล้ว — ต้อง migrate ให้ใช้ inbox pattern
- [ ] Verify `STRIPE_WEBHOOK_SECRET` ก่อน insert

---

## 12. Invoice / Tax Ledger

### 12.1 Tables

- [ ] `invoices` — immutable หลัง `status = issued`
- [ ] `invoice_lines` — immutable หลัง invoice issued
- [ ] `invoice_events` — track ทุก action
- [ ] `invoice_sequences` — serial number per hotel ต้อง unique

### 12.2 Rules

- [ ] Issued invoice: amount ห้ามแก้
- [ ] Issued invoice: lines ห้ามแก้
- [ ] ถ้าผิด → void + issue ใหม่ (credit note)
- [ ] DB constraint enforce immutability (trigger หรือ RLS)

### 12.3 e-Tax (ถ้าต้องการ)

- [ ] `draft_xml` → `signed_xml` → `submitted` → `accepted/rejected`
- [ ] Retry flow สำหรับ rejected

---

## 13. OTA Architecture

### 13.1 Tables (audit ว่ามีครบไหม)

- [~] `channel_credentials` — มีบางส่วน
- [~] `channel_connections` / `channel_mappings` — ต้อง audit
- [ ] `ota_webhook_inbox` table
- [ ] `ota_sync_jobs` table:
  - `status: queued | running | success | failed | retrying | dead_letter`
- [ ] `ota_conflicts` table
- [ ] `ota_dead_letters` table
- [ ] `ota_inventory_snapshots` table

### 13.2 Conflict Types ต้องครบ

- [ ] `ROOM_UNAVAILABLE`
- [ ] `RATE_MISSING`
- [ ] `ROOM_MAPPING_MISSING`
- [ ] `DUPLICATE_EXTERNAL_ID`
- [ ] `DATE_MODIFICATION_CONFLICT`
- [ ] `PAYMENT_AMOUNT_MISMATCH`

### 13.3 OTA Import

- [ ] OTA reservation ต้องมี:
  - [ ] `source = 'ota'`
  - [ ] `channel` field
  - [ ] `external_booking_id`
  - [ ] `external_payload_snapshot jsonb`
- [ ] สร้าง `reservation_event` ทุกครั้งที่ OTA import

### 13.4 Inventory Push (Delta-based ไม่ใช่ cron)

- [ ] reservation created/cancelled/modified → compute `inventory_delta`
- [ ] Push delta ไปแต่ละ OTA channel
- [ ] Log response per channel
- [ ] Retry on failure → `ota_sync_jobs`

---

## 14. AI Gateway

### 14.1 สร้าง `src/lib/ai/gateway.ts` (มีบางส่วนแต่ต้องครบ)

- [ ] AI mode resolver:
  - [ ] `disabled` / `fallback` / `real` / `quota_exceeded` / `key_missing` / `provider_error`
- [ ] ทุก AI call ต้องผ่าน gateway — ห้าม call provider ตรง
- [ ] Gateway steps ครบ:
  1. [ ] Feature gate check
  2. [ ] Quota check
  3. [ ] PII redaction (ก่อนส่ง prompt)
  4. [ ] Prompt build
  5. [ ] Provider call
  6. [ ] Cost calculation
  7. [ ] Log (provider, model, tokens, cost)
  8. [ ] Fallback handling

### 14.2 PII Redaction (ก่อนส่ง AI ทุกครั้ง)

- [ ] Redact: passport number
- [ ] Redact: phone number
- [ ] Redact: email address
- [ ] Redact: payment reference
- [ ] Redact: full address

### 14.3 Response Metadata

- [ ] ทุก AI response ต้องมี:
  ```json
  {
    "mode": "real|fallback|...",
    "provider": "anthropic|openai|...",
    "model": "...",
    "confidence": 0.84,
    "cost": 0.0032,
    "fallbackUsed": false
  }
  ```

---

## 15. Secret Management

### 15.1 Table `encrypted_secrets` (ยังไม่มี)

- [ ] สร้าง table:
  ```sql
  id, hotel_id, provider, key_name, ciphertext, iv, rotated_at, created_at
  ```
- [ ] ห้ามเก็บ token เป็น plain text ใน DB
- [ ] Secret access: server-side only, service role only
- [ ] Audit ทุกครั้งที่ read sensitive provider key

### 15.2 Migration

- [ ] Migrate existing plain-text credentials → encrypted_secrets
- [ ] Rotate keys สำหรับ active integrations

---

## 16. System Event Bus

### 16.1 สร้าง `src/lib/events/emit-system-event.ts`

- [ ] `emitSystemEvent(ctx, event)` function:
  ```ts
  await emitSystemEvent(ctx, {
    name: 'reservation.created',
    entityType: 'reservation',
    entityId,
    severity: 'info',
    metadata,
  });
  ```
- [ ] Event routes ไปยัง:
  - [ ] Audit log
  - [ ] Notification system
  - [ ] Automation triggers
  - [ ] Ops alert (severity = error/critical)
  - [ ] Analytics

### 16.2 Event Names ครบ (ตัวอย่างสำคัญ)

- [ ] `reservation.created` / `reservation.cancelled` / `reservation.checked_in` / `reservation.checked_out`
- [ ] `payment.received` / `payment.failed` / `payment.refunded`
- [ ] `invoice.issued` / `invoice.voided`
- [ ] `ota.sync_failed` / `ota.conflict_detected`
- [ ] `tenant.suspended` / `tenant.reactivated`
- [ ] `ai.quota_exceeded` / `ai.provider_error`

---

## 17. Error Taxonomy

### 17.1 สร้าง `src/lib/errors/error-codes.ts`

- [ ] Error codes กลางครบ:
  ```
  AUTH_REQUIRED, FORBIDDEN, TENANT_SUSPENDED,
  FEATURE_NOT_AVAILABLE, USAGE_LIMIT_EXCEEDED,
  VALIDATION_FAILED, ROOM_NOT_AVAILABLE,
  PAYMENT_NOT_CONFIGURED, PAYMENT_WEBHOOK_INVALID,
  OTA_MAPPING_MISSING, AI_PROVIDER_ERROR, RATE_LIMITED
  ```

### 17.2 Response Format ทุก API ต้องใช้ format เดียว

- [ ] Success: `{ data: ..., meta: { requestId } }`
- [ ] Error:
  ```json
  {
    "error": {
      "code": "ROOM_NOT_AVAILABLE",
      "message": "Room is not available for selected dates",
      "requestId": "..."
    }
  }
  ```
- [ ] ห้าม return error format ต่างกันระหว่าง routes

---

## 18. Testing Pyramid

### 18.1 Unit Tests

- [~] Pricing calculation (บางส่วนมีแล้ว)
- [~] Availability logic (ต้องเพิ่ม)
- [~] Permission check (feature-gate.test.ts มีแล้ว)
- [ ] Refund calculation
- [ ] Invoice sequence
- [ ] OTA mapper
- [ ] AI mode resolver
- [ ] PII redaction

### 18.2 Integration Tests

- [ ] API guard (test ทุก step ของ golden pipeline)
- [ ] Supabase RLS (hotel A vs hotel B isolation)
- [ ] Payment webhook (duplicate event handling)
- [ ] Reservation RPC (race condition)
- [ ] Booking session flow (draft → confirmed)

### 18.3 E2E Tests

- [~] Booking flow (`booking-flow.spec.ts` มีแล้ว — ต้อง audit)
- [~] Multi-tenant isolation (`multi-tenant.spec.ts` มีแล้ว — ต้อง audit)
- [~] OTA sync (`ota-sync.spec.ts` มีแล้ว — ต้อง audit)
- [~] Payment flow (`payment-flow.spec.ts` มีแล้ว — ต้อง audit)
- [ ] Owner admin lifecycle (admin actions + audit trail)
- [ ] Guest booking lifecycle (search → book → payment → confirmation)
- [ ] Security bypass lifecycle (ทดสอบ cross-tenant access)

### 18.4 Chaos / Failure Tests

- [ ] Payment webhook duplicate → process 1 ครั้ง (idempotency)
- [ ] OTA timeout → retry + dead_letter
- [ ] AI provider down → fallback mode
- [ ] SendGrid fail → queue + retry
- [ ] Cron runs twice → idempotency
- [ ] DB transaction conflict → graceful error

---

## 19. Production Readiness Gate

### 19.1 สร้าง `PRODUCTION_GATE.md` (ยังไม่มี)

- [ ] สร้างไฟล์ `PRODUCTION_GATE.md` ที่ root

### 19.2 Checklist ต้องผ่านทั้งหมดก่อน go-live

**Code Quality:**
- [ ] ไม่มี `PLACEHOLDER` ใน critical path (payment, booking, auth)
- [ ] ไม่มี `MOCK` ใน payment/booking/auth
- [ ] ทุก API route ผ่าน `apiGuard()`
- [ ] ทุก tenant data query scoped ด้วย `hotel_id` หรือ `organization_id`

**Race Condition & Concurrency:**
- [ ] Booking race test ผ่าน (2 concurrent → 1 win, 1 fail gracefully)
- [ ] Payment duplicate webhook test ผ่าน
- [ ] Invoice concurrency test ผ่าน

**Security:**
- [ ] Suspended tenant test ผ่าน (ไม่สามารถ create reservation)
- [ ] Guest ไม่สามารถเข้าถึง booking ของ guest อื่น
- [ ] Owner admin route ไม่สามารถ access ได้จาก tenant owner
- [ ] Impersonation expire ทำงานถูกต้อง

**Infrastructure:**
- [ ] Sentry enabled + ทดสอบ error capture
- [ ] Health check endpoints ผ่าน (`/api/health`)
- [ ] DB backup verified (restore test)
- [ ] All Supabase migrations applied in production
- [ ] Environment variables ครบทุกตัว (`CRON_SECRET`, `STRIPE_WEBHOOK_SECRET`, etc.)
- [ ] SendGrid sender domain verified

---

## Priority Order (แนะนำ)

```
CRITICAL (ทำก่อน — blocking everything):
1. Context System (§3) — foundation ของทุก guard
2. Golden Guard Pipeline (§2) — api-guard.ts
3. Booking RPC race prevention (§8) — กัน double-book
4. Payment Webhook Inbox (§11) — กัน duplicate charge

HIGH (ทำหลัง critical):
5. Reservation as Ledger (§6) — reservation_events
6. Booking + Payment Sessions (§9)
7. Payment Ledger (§10)
8. RLS Audit (§5) — ต้องผ่านก่อน production

MEDIUM (สำคัญแต่ไม่ blocking):
9. OTA Architecture (§13)
10. AI Gateway (§14)
11. System Event Bus (§16)
12. Error Taxonomy (§17)
13. Secret Management (§15)

DOCUMENTATION:
14. DATABASE_OWNERSHIP_LEDGER.md (§4)
15. PRODUCTION_GATE.md (§19)
16. Web Contract audit (§1)
17. Invoice/Tax Ledger (§12)

TESTING:
18. Integration + E2E tests (§18)
19. Chaos tests (§18.4)
```

---

> **Rule:** ทุก task ที่ติ๊ก `[x]` ต้องมี: โค้ด commit + build ผ่าน + test ผ่าน  
> ถ้าติ๊กแล้วไม่มีของ 3 อย่างนี้ = ยังไม่นับ
