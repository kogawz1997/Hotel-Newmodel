# ULTIMATE DEPTH — Hotel-Newmodel Master Task List

> อัปเดต: 2026-05-17  
> แบ่งเป็น **P1 (Foundation)** → **P2 (Full Operations)** → **P3 (Excellence & Scale)**  
> Legend: `[ ]` ยังไม่ทำ · `[~]` มีบางส่วน · `[x]` เสร็จ+verified

**7-Question Gate** — ทุก feature ก่อนติ๊กเสร็จต้องตอบได้:
> 1.ใครใช้ · 2.เว็บไหน · 3.role/permission · 4.table · 5.scope(org/hotel/guest) · 6.failure/rollback · 7.test

---

## ภาพรวม 3 เว็บ

| เว็บ | Path | ผู้ใช้ | Scope |
|---|---|---|---|
| **Owner Admin / SaaS OS** | `/admin/*` | platform roles เท่านั้น | all organizations |
| **Hotel OS / Staff Dashboard** | `/dashboard/*` `/backoffice/*` `/mobile/*` | staff ของโรงแรม | `organization_id` + `hotel_id` ตัวเอง |
| **Guest Web / Booking + Portal** | `/h/[slug]` `/booking/*` `/portal/*` | anonymous + guest_account | public data + own booking only |

---

# P1 — FOUNDATION (Critical Path)

> P1 ต้องเสร็จก่อนระบบจะใช้งานได้เลย แม้แต่บางส่วน

---

## P1.1 Build & Baseline

- [x] `npm ci` ผ่านสะอาด
- [x] `npm run type-check` — 0 errors
- [x] `npm run lint` — 0 errors
- [x] `npm run build` — production build ผ่าน
- [x] `npm run check:strict` — type-check + lint + tests + 50 route-permission checks
- [ ] `npm run test` — ต้องรันและผ่านใน CI ทุก push

---

## P1.2 Web Contract Separation + Middleware

### 1.1 Owner Admin Contract (`/admin/*`)

- [~] `middleware.ts` — detect `/admin/*` path (มีแล้ว แต่ต้อง audit ให้ครบ)
- [ ] Enforce `/admin/*` ให้ **platform roles** เท่านั้น (`platform_owner`, `platform_support`, `platform_finance`, `platform_engineer`)
- [ ] Page loader guard — server-side check ก่อน render ทุก `/admin/*` page
- [ ] API guard — ทุก `/api/admin/*` ต้องมี `web: 'platform'` check
- [ ] DB/RLS — `platform_admin_select` policy
- [ ] Audit event — ทุก action ของ platform role เขียน audit log
- [ ] **Forbidden actions (ต้อง enforce ทั้ง UI + API + DB):**
  - [ ] ลบ tenant โดยไม่มี 2-step confirm + audit
  - [ ] export ข้อมูลแขก PDPA โดยไม่มี legal basis log
  - [ ] refund แทนโรงแรม
  - [ ] เปลี่ยน billing โดยไม่มี log
  - [ ] rotate tenant API key โดยไม่ audit
  - [ ] impersonate เกินเวลาที่กำหนด (`expiresAt` + auto revoke)

### 1.2 Tenant Dashboard Contract (`/dashboard/*` `/backoffice/*` `/mobile/*`)

- [~] `middleware.ts` — enforce tenant routes (ต้อง audit)
- [ ] ทุก API route ต้องใช้ context ครบ 8 fields:
  - [ ] `ctx.userId` / `ctx.email` / `ctx.role` / `ctx.permissions`
  - [ ] `ctx.organizationId` / `ctx.hotelId`
  - [ ] `ctx.subscriptionStatus` / `ctx.plan`
  - [ ] `ctx.impersonation?` (optional, ต้อง handle ถ้ามี)
- [ ] Flag ทุก API ที่ไม่มี context ครบ = "not ready"

### 1.3 Guest/Public Contract (`/h/[slug]` `/booking/*` `/portal/*`)

- [~] Public hotel pages ห้ามคืน internal data
- [ ] Response whitelist สำหรับ public API — ห้าม expose:
  - [ ] `internal_notes` / `staff_notes`
  - [ ] `cost` / `commission`
  - [ ] payment raw payload
  - [ ] guest full passport number
  - [ ] other guests' data
  - [ ] channel credentials
- [ ] Guest เห็นได้เฉพาะ booking ตัวเอง (RLS + API guard)
- [ ] Anonymous user ไม่สามารถ query private tables

---

## P1.3 Context System กลาง

> `src/lib/context/` ยังไม่มี — ต้องสร้างใหม่ทั้งหมด

- [ ] `src/lib/context/resolve-request-context.ts` — detect web type จาก hostname/path → route ไป resolver
- [ ] `src/lib/context/tenant-context.ts`
  - [ ] `TenantContext` type (8 fields + optional `impersonation`)
  - [ ] `resolveTenantContext(request)` function
  - [ ] Validate subscription status → reject ถ้า `suspended`/`cancelled`
  - [ ] Handle impersonation expiry
- [ ] `src/lib/context/guest-context.ts`
  - [ ] `GuestContext` type: `{ web, userId, guestAccountId, verifiedReservationIds }`
  - [ ] `resolveGuestContext(request)` — ดึง `verifiedReservationIds` จาก session
- [ ] `src/lib/context/platform-context.ts`
  - [ ] `PlatformContext` type: `{ web: 'platform', userId, isPlatformAdmin: true }`
  - [ ] `resolvePlatformContext(request)` — verify `isPlatformAdmin: true`

---

## P1.4 Golden Guard Pipeline

> `src/lib/http/api-guard.ts` — ต้องมีก่อน เพื่อบังคับ 12 steps ทุก route

- [ ] สร้าง `apiGuard(request, options)` function:
  1. [ ] Method check
  2. [ ] Rate limit (`rateLimit: [key, max, windowMs]`)
  3. [ ] Raw body handling (webhook mode)
  4. [ ] CSRF/origin check (cookie mutation)
  5. [ ] Auth/session resolve → เลือก context resolver จาก `web` field
  6. [ ] Tenant status check → reject ถ้า suspended/cancelled
  7. [ ] Plan/feature gate
  8. [ ] Permission check
  9. [ ] Zod schema validation (`schema` field)
  10. [ ] Return `{ ok: true, ctx, input }` หรือ `{ ok: false, response }`

```ts
// Template ทุก route ต้องใช้แบบนี้
export async function POST(request: NextRequest) {
  const guard = await apiGuard(request, {
    web: 'tenant',
    permission: 'reservations.create',
    feature: 'reservations',
    rateLimit: ['reservations.create', 20, 60_000],
    csrf: true,
    schema: CreateReservationSchema,
  });
  if (!guard.ok) return guard.response;
  const result = await createReservationService(guard.ctx, guard.input);
  return ok(result);
}
```

- [ ] Migrate `/api/reservations/*` routes → ใช้ `apiGuard()`
- [ ] Migrate `/api/payments/*` routes → ใช้ `apiGuard()`
- [ ] Migrate `/api/booking/*` routes → ใช้ `apiGuard()`
- [ ] Migrate `/api/guests/*` routes → ใช้ `apiGuard()`
- [ ] Migrate `/api/admin/*` routes → ใช้ `apiGuard()` + `web: 'platform'`
- [ ] Migrate `/api/ota/*` routes → ใช้ `apiGuard()`
- [ ] ห้ามมี route.ts ที่เขียน auth/permission check แบบ ad-hoc

---

## P1.5 Error Taxonomy

- [ ] สร้าง `src/lib/errors/error-codes.ts`:
  ```
  AUTH_REQUIRED · FORBIDDEN · TENANT_SUSPENDED
  FEATURE_NOT_AVAILABLE · USAGE_LIMIT_EXCEEDED
  VALIDATION_FAILED · ROOM_NOT_AVAILABLE
  PAYMENT_NOT_CONFIGURED · PAYMENT_WEBHOOK_INVALID
  OTA_MAPPING_MISSING · AI_PROVIDER_ERROR · RATE_LIMITED
  ```
- [ ] Response format เดียวทุก API:
  ```json
  { "error": { "code": "ROOM_NOT_AVAILABLE", "message": "...", "requestId": "..." } }
  ```
- [ ] Success format: `{ "data": ..., "meta": { "requestId": "..." } }`
- [ ] ห้าม return error format ต่างกันระหว่าง routes

---

## P1.6 Role System (Platform + Hotel Staff)

### Platform Roles (`/admin/*`)

- [x] `platform_owner` — สิทธิ์สูงสุดของ SaaS
- [ ] `platform_support` — read-only impersonation, ดู config/errors/audit
- [ ] `platform_finance` — billing, subscriptions, MRR/ARR
- [ ] `platform_engineer` — health checks, cron, webhook, queue, logs
- [ ] เพิ่มทั้ง 4 roles เข้า `PLATFORM_ROLES` array ใน `roles.ts`
- [ ] Route guards สำหรับแต่ละ sub-role:
  - [ ] `/admin/billing` → `platform_owner`, `platform_finance`
  - [ ] `/admin/system-health` → `platform_owner`, `platform_engineer`
  - [ ] `/admin/support` → `platform_owner`, `platform_support`
  - [ ] `/admin/impersonation` → `platform_owner` เท่านั้น

### Hotel Staff Roles (`/dashboard/*`)

- [x] `hotel_owner` / `general_manager` / `operations_manager`
- [x] `front_desk` / `receptionist` / `front_office_manager` / `reservation_agent` / `night_auditor`
- [x] `housekeeping_manager` / `housekeeper` / `room_inspector`
- [x] `maintenance_manager` / `technician` / `engineering`
- [x] `revenue_manager` / `marketing_staff` / `sales`
- [x] `accounting_manager` / `accounting_staff`
- [x] `fnb_manager` / `kitchen_staff` / `restaurant_staff` / `room_service_staff`
- [x] `concierge` / `guest_relations` / `bellboy` / `transport_driver`
- [x] `security_manager` / `security_staff`
- [x] `spa_manager` / `spa_staff`
- [x] `hr_manager`
- [ ] `it_admin` (IT/Integration Admin role)
- [ ] ตรวจสอบว่า `DEFAULT_LANDING` ครบทุก role
- [ ] ตรวจสอบว่า sidebar config แยกตาม role ครบ

---

## P1.7 Reservation as Ledger (Core)

- [~] `reservations` table — มีแล้ว ต้อง audit columns
- [ ] `reservation_events` table:
  ```sql
  id, reservation_id, hotel_id, event_type, actor_type, actor_id,
  before jsonb, after jsonb, metadata jsonb, created_at
  ```
- [ ] `reservation_status_history` table
- [ ] `reservation_price_snapshots` table
- [ ] Event types ครบ: `created` `confirmed` `checked_in` `room_moved`
  `stay_extended` `split` `merged` `cancelled` `no_show` `checked_out`
- [ ] ทุก action สำคัญเขียน event (check-in, check-out, room move, cancel, price change)

---

## P1.8 Race-Safe Booking RPC

- [ ] สร้าง Supabase function `create_reservation_safely()`:
  - [ ] `pg_advisory_xact_lock(hashtext(hotel_id || room_id || check_in))`
  - [ ] Recheck availability ภายใน transaction
  - [ ] Insert reservation + folio + event atomically
  - [ ] Idempotency key (`unique(hotel_id, idempotency_key)`)
  - [ ] Raise exception `ROOM_NOT_AVAILABLE` ถ้า conflict
- [ ] ห้าม pattern: check availability → (gap) → insert ในโค้ดใดก็ตาม
- [ ] Migration file สำหรับ RPC
- [ ] Test: 2 concurrent requests → 1 succeed, 1 get `ROOM_NOT_AVAILABLE`

---

## P1.9 System Event Bus

- [ ] สร้าง `src/lib/events/emit-system-event.ts`:
  ```ts
  await emitSystemEvent(ctx, {
    name: 'reservation.created',
    entityType: 'reservation',
    entityId,
    severity: 'info',
    metadata,
  });
  ```
- [ ] Routes ไปยัง: audit log · notification · automation · ops alert · analytics
- [ ] Core event names: `reservation.*` · `payment.*` · `invoice.*` · `tenant.*` · `ai.*` · `ota.*`

---

## P1.10 Payment Webhook Inbox

- [ ] `provider_events` table:
  ```sql
  id, provider, event_id, event_type, raw_payload jsonb,
  signature_valid bool, received_at, processed_at,
  process_status: received|validated|processing|processed|failed|dead_letter,
  error text
  ```
- [ ] Unique constraint: `(provider, event_id)` — idempotency
- [ ] Webhook receiver → insert inbox → return 200 immediately
- [ ] Worker: `processing` → `processed` | `failed` → retry (max 3) → `dead_letter`
- [ ] Alert เมื่อมี `dead_letter` events
- [~] `/api/webhooks/stripe` — migrate ให้ใช้ inbox pattern

---

## P1.11 Core DB + RLS (Priority Tables)

- [ ] RLS policies ครบ 7 แบบสำหรับ critical tables:
  `tenant_select` · `tenant_insert` · `tenant_update` · `tenant_delete`
  `guest_select_own` · `platform_admin_select` · `service_role_internal`
- [ ] `reservations` RLS ครบ
- [ ] `payments` RLS ครบ
- [ ] `rooms` RLS ครบ
- [ ] `guests` RLS ครบ
- [ ] RLS test cases ต้องผ่าน:
  - [ ] Hotel A user select hotel B reservation → 0 rows
  - [ ] Guest A select guest B booking → 0 rows
  - [ ] Anonymous select private table → denied

---

# P2 — FULL OPERATIONS

> P2 คือระบบครบสำหรับโรงแรมใช้งานจริง

---

## P2.1 Owner Admin / SaaS OS — Full Build

### Pages ที่ต้องมี

| Page | Status | Platform Role ที่เข้าได้ |
|---|---|---|
| `/admin` — Overview dashboard | [~] | owner, support |
| `/admin/orgs` — Tenant list | [~] | owner, support, finance |
| `/admin/orgs/[id]` — Tenant detail | [~] | owner, support |
| `/admin/hotels` — Hotel list | [~] | owner, support |
| `/admin/billing` — Subscriptions + MRR/ARR | [~] | owner, finance |
| `/admin/usage` — Usage per tenant | [~] | owner, support |
| `/admin/errors` — Error log per tenant | [~] | owner, support, engineer |
| `/admin/incidents` — Incident management | [ ] | owner, engineer |
| `/admin/audit` — Audit log ทั้งระบบ | [~] | owner |
| `/admin/feature-flags` — Feature gates | [~] | owner |
| `/admin/system-health` — Health checks, cron, queue | [~] | owner, engineer |
| `/admin/announcements` — Send to tenants | [~] | owner, support |
| `/admin/impersonation` — Impersonate tenant | [ ] | owner เท่านั้น |

### P2.1.1 Platform Owner Dashboard

- [ ] KPI cards: tenant count · active/trial/suspended/cancelled · MRR · ARR · churn · failed payment
- [ ] Top usage tenants list
- [ ] Tenant risk score
- [ ] System health summary
- [ ] **Actions:**
  - [ ] Suspend / reactivate tenant (ต้องมี reason + audit)
  - [ ] Change plan (ต้องมี log)
  - [ ] Extend trial
  - [ ] Impersonate tenant (ต้องมี `expiresAt`, max 2 ชั่วโมง)
  - [ ] View audit log ทั้งระบบ
  - [ ] View error ต่อ tenant
- [ ] **Forbidden UI guards:**
  - [ ] ลบ tenant → require 2-step confirm + reason
  - [ ] Export guest PDPA → require legal basis form
  - [ ] Refund แทนโรงแรม → ปิด button ถ้าไม่ใช่ billing context
  - [ ] Rotate API key → ต้องมี audit entry ก่อน rotate

### P2.1.2 Platform Support

- [ ] Tenant list + search
- [ ] Hotel detail view
- [ ] Recent errors ต่อ tenant
- [ ] Usage issue indicators
- [ ] Onboarding status timeline
- [ ] Integration status per hotel
- [ ] **Actions (read-only impersonation):**
  - [ ] View config (read-only)
  - [ ] View error timeline
  - [ ] View audit timeline
  - [ ] Send announcement
- [ ] **Forbidden (API guard):**
  - [ ] เปลี่ยน plan → 403
  - [ ] Suspend tenant → 403
  - [ ] Refund → 403
  - [ ] Delete data → 403
  - [ ] Rotate API key → 403

### P2.1.3 Platform Finance

- [ ] Subscriptions list + status
- [ ] Invoices SaaS (ไม่ใช่ hotel invoice)
- [ ] Failed billing list
- [ ] MRR / ARR chart
- [ ] Dunning status per tenant
- [ ] Payment history
- [ ] **Actions:**
  - [ ] Retry billing
  - [ ] Mark manual payment
  - [ ] Export revenue report
  - [ ] View SaaS invoice
- [ ] **Forbidden (API guard):**
  - [ ] Impersonate hotel operation → 403
  - [ ] แก้ hotel booking → 403
  - [ ] View guest private data เกินจำเป็น → filtered response

### P2.1.4 Platform Engineer / Ops

- [ ] Health checks dashboard (DB, storage, queue, cron)
- [ ] Cron job status + last run
- [ ] Webhook failure list
- [ ] Queue depth monitor
- [ ] OTA sync error summary
- [ ] AI cost spike alerts
- [ ] Sentry error feed
- [ ] **Actions:**
  - [ ] Re-run failed job
  - [ ] View raw logs (filtered, no payment raw)
  - [ ] Mark incident
  - [ ] Disable integration temporarily
- [ ] **Forbidden (API guard):**
  - [ ] View payment raw payload → filtered
  - [ ] Export guest data → 403
  - [ ] เปลี่ยน tenant billing → 403

---

## P2.2 Hotel OS — Front Desk

> เป้าหมาย UX: เร็ว ปุ่มใหญ่ ข้อมูลชัด check-in แขก ≤ 3 คลิก

### Pages

| Page | Status |
|---|---|
| `/dashboard/front-desk` — Today board | [~] |
| `/dashboard/reservations` — Reservation list + create | [~] |
| `/dashboard/calendar` — Availability calendar | [~] |
| `/dashboard/rooms` — Room status grid | [~] |
| `/dashboard/guests` — Guest lookup + history | [~] |
| `/dashboard/accounting/payments` — Payment collection | [~] |
| `/mobile/front-desk` — Mobile quick actions | [~] |

### Today Board หน้าหลัก

- [ ] Section: Arrivals today (รอ check-in)
- [ ] Section: Departures today (รอ check-out)
- [ ] Section: In-house guests
- [ ] Section: No-show risk (ยังไม่ arrive ภายใน X ชั่วโมง)
- [ ] VIP / Blacklist flag (ต้องโชว์ชัด)
- [ ] Special requests summary
- [ ] Payment due list

### Quick Booking Flow

- [ ] Walk-in booking form: date + room type + guest + payment
- [ ] Availability check ก่อน confirm (ผ่าน availability engine)
- [ ] Auto-assign room (ถ้าไม่ระบุ)
- [ ] Collect deposit

### Check-in Drawer

- [ ] Guest info display
- [ ] Room assignment
- [ ] Deposit collection
- [ ] ID/Passport scan/upload
- [ ] Notes field
- [ ] Write `reservation_event: checked_in`

### Check-out Drawer

- [ ] Folio summary
- [ ] Outstanding balance
- [ ] Payment collection
- [ ] Invoice download/print
- [ ] Auto-trigger housekeeping task

### Permissions (Front Desk)

```
reservations.read · reservations.create · reservations.modify
reservations.check_in · reservations.check_out
payments.create · folios.read · folios.write
guests.read · guests.create
```

### Forbidden (API guard + UI)

- [ ] Refund ใหญ่ → require approval
- [ ] Void invoice → 403
- [ ] Change room rate rules → 403
- [ ] Manage staff → 403
- [ ] Export all guest data → 403

---

## P2.3 Hotel OS — Reservation Agent

### Pages

| Page | Status |
|---|---|
| `/dashboard/reservations` | [~] |
| `/dashboard/calendar` | [~] |
| `/dashboard/rates` (read-only) | [~] |
| `/dashboard/guests` | [~] |
| `/dashboard/inbox` | [~] |

### Features

- [ ] Availability calendar + room filter
- [ ] Rate plan selection
- [ ] Promo code apply
- [ ] Guest history view
- [ ] Source/channel tracking
- [ ] Hold booking (temporary block)
- [ ] Send payment link
- [ ] Cancel request ตาม cancellation policy

### Permissions

```
reservations.read · reservations.create · reservations.modify
rates.read · guests.read · payments.request
```

### Forbidden

- [ ] Check-out → 403
- [ ] Refund → 403
- [ ] Invoice void → 403
- [ ] Staff settings → 403

---

## P2.4 Hotel OS — General Manager

### Pages

| Page | Status |
|---|---|
| `/dashboard` — Operations overview | [~] |
| `/dashboard/operations` | [~] |
| `/dashboard/reservations` | [~] |
| `/dashboard/rooms` | [~] |
| `/dashboard/rates` | [~] |
| `/dashboard/inbox` | [~] |
| `/dashboard/reports` | [~] |
| `/dashboard/approvals` | [~] |

### Features

- [ ] Today operations: arrivals, departures, occupancy, VIP, complaints, staff workload
- [ ] Pending approvals queue
- [ ] OTA issue alerts
- [ ] **Actions:**
  - [ ] Override booking (ต้อง log reason)
  - [ ] Approve late checkout
  - [ ] Approve refund ตาม limit (`payments.refund_manager`)
  - [ ] Assign staff to tasks
  - [ ] Edit rate/calendar
  - [ ] Modify reservation
  - [ ] Resolve guest complaint
  - [ ] Override overbooking (เฉพาะมี `reservations.override_overbooking`)

---

## P2.5 Hotel OS — Hotel Owner

### Pages

| Page | Status |
|---|---|
| `/dashboard/reports` — Landing page สำหรับ owner | [~] |
| `/dashboard/revenue` | [~] |
| `/dashboard/analytics` | [~] |
| `/dashboard/team` | [~] |
| `/dashboard/settings` | [~] |
| `/dashboard/billing` | [~] |

### Dashboard KPIs

- [ ] Revenue วันนี้ / เดือนนี้ / ปีนี้
- [ ] Occupancy rate (today + 7-day trend)
- [ ] ADR / RevPAR
- [ ] Booking pace (next 30 days)
- [ ] OTA performance per channel
- [ ] Payment pending
- [ ] Staff performance summary
- [ ] Guest satisfaction score
- [ ] AI cost (ถ้า enabled)
- [ ] Subscription plan + next renewal

### Permissions

- [ ] ดูทุก dashboard ใน hotel scope
- [ ] Manage staff (invite, disable, change role)
- [ ] Manage billing ของโรงแรม (ไม่ใช่ SaaS billing)
- [ ] ดู report ทุกชนิด
- [ ] ตั้งค่า integration
- [ ] Approve refund ใหญ่ (`payments.refund_owner`)
- [ ] เปลี่ยน rate strategy

### Forbidden

- [ ] เข้า `/admin/*` → 403
- [ ] เห็นข้อมูล tenant อื่น → RLS block

---

## P2.6 Hotel OS — Housekeeping

### Pages

| Page | Status |
|---|---|
| `/dashboard/housekeeping` — Room status board | [~] |
| `/dashboard/housekeeping/inspect` — Inspection queue | [~] |
| `/dashboard/housekeeping/auto-assign` | [~] |
| `/dashboard/housekeeping/amenities` | [~] |
| `/mobile/housekeeping` — Mobile for housekeeper | [~] |
| `/mobile/housekeeping/tasks/[id]` | [~] |

### Housekeeping Manager Features

- [ ] Room status board: dirty / cleaning / inspected / failed / available
- [ ] Staff workload view
- [ ] Checkout rooms priority
- [ ] VIP room flags
- [ ] Assign tasks to housekeeper
- [ ] Inspect room (pass/fail)
- [ ] Mark room available
- [ ] Create lost & found entry
- [ ] Report maintenance issue

### Housekeeper Features (Mobile-first)

- [ ] My tasks วันนี้ (room number, floor, task type, priority, notes, checkout time)
- [ ] Start cleaning (timestamp)
- [ ] Complete cleaning (timestamp)
- [ ] Before/after photo upload
- [ ] Add note
- [ ] Report lost item
- [ ] Report maintenance issue

### Permissions

```
Housekeeping Manager: housekeeping.read · housekeeping.assign · housekeeping.inspect
  rooms.read · rooms.update_status · maintenance.create

Housekeeper: housekeeping.read_own · housekeeping.start · housekeeping.complete
  housekeeping.photo_upload · maintenance.create_basic
```

### Forbidden (Housekeeper)

- [ ] Assign งานให้คนอื่น → 403
- [ ] Pass inspection → 403
- [ ] แก้ room rate → 403
- [ ] View guest payment → 403

---

## P2.7 Hotel OS — Maintenance

### Pages

| Page | Status |
|---|---|
| `/dashboard/maintenance` — Work order list | [~] |
| `/dashboard/maintenance/equipment` | [~] |
| `/dashboard/work-orders` | [~] |
| `/mobile/maintenance` | [~] |
| `/mobile/maintenance/tasks/[id]` | [~] |

### Maintenance Manager Features

- [ ] Open work orders list
- [ ] Blocked/OOO rooms
- [ ] Urgent issues + SLA overdue
- [ ] Vendor jobs
- [ ] Equipment history
- [ ] Assign technician
- [ ] Block room (`rooms.block`)
- [ ] Mark out-of-order
- [ ] Approve vendor
- [ ] Close maintenance job
- [ ] Record cost

### Technician Features (Mobile)

- [ ] Assigned jobs list
- [ ] Job detail (room, equipment, issue, photos, due time)
- [ ] Start job
- [ ] Add note + upload photo
- [ ] Mark resolved
- [ ] Request parts

### Permissions

```
Maintenance Manager: maintenance.read · maintenance.assign · maintenance.update
  rooms.block · rooms.maintenance_status · vendors.manage

Technician: maintenance.read_own · maintenance.start · maintenance.resolve
  maintenance.photo_upload
```

---

## P2.8 Hotel OS — Accounting

### Pages

| Page | Status |
|---|---|
| `/dashboard/accounting` — Overview | [~] |
| `/dashboard/accounting/folios` | [~] |
| `/dashboard/accounting/payments` | [~] |
| `/dashboard/accounting/invoices` | [~] |
| `/dashboard/accounting/refunds` | [~] |
| `/dashboard/accounting/vat` — VAT report | [~] |
| `/dashboard/accounting/eod` — End-of-day reconciliation | [~] |
| `/dashboard/accounting/fx` — FX handling | [~] |

### Features

- [ ] Payment list + search
- [ ] Folio management
- [ ] Unpaid balances
- [ ] Invoice creation (immutable after issue)
- [ ] Void invoice (+ reason required → write event)
- [ ] Refund ตาม permission limit
- [ ] VAT report export
- [ ] Cash drawer reconciliation
- [ ] End-of-day close + report
- [ ] Payment reconciliation

### Permissions

```
payments.read · payments.create · payments.reconcile · payments.refund_small
folios.read · folios.write · folios.close
invoices.create · invoices.void · reports.finance
```

### Forbidden

- [ ] Change hotel subscription → 403
- [ ] Manage staff role → 403
- [ ] Refund เกิน limit โดยไม่มี approval → require approval flow

---

## P2.9 Hotel OS — Revenue Manager

### Pages

| Page | Status |
|---|---|
| `/dashboard/rates` — Rate calendar | [~] |
| `/dashboard/pricing` — Dynamic pricing | [~] |
| `/dashboard/revenue` — Revenue analytics | [~] |
| `/dashboard/rates/parity` — Rate parity | [~] |
| `/dashboard/rates/blackout` — Blackout dates | [~] |
| `/dashboard/rates/competitor` — Competitor rates | [~] |
| `/dashboard/ota` — OTA performance | [~] |

### Features

- [ ] Occupancy forecast (30/60/90 days)
- [ ] ADR / RevPAR tracking
- [ ] Pickup report (reservations added per day)
- [ ] Competitor rate monitoring
- [ ] OTA performance per channel
- [ ] Rate parity check
- [ ] Demand forecast
- [ ] Edit rate calendar
- [ ] Create rate plan
- [ ] Set restrictions (min/max stay, CTA/CTD)
- [ ] Blackout date management
- [ ] Dynamic pricing rules
- [ ] Push rates to OTA

### Permissions

```
rates.read · rates.manage · pricing.manage · ota.push_rates · reports.revenue
```

---

## P2.10 Hotel OS — Sales / Marketing

### Pages

| Page | Status |
|---|---|
| `/dashboard/marketing` | [~] |
| `/dashboard/campaigns` | [~] |
| `/dashboard/loyalty` | [~] |
| `/dashboard/reviews` | [~] |
| `/dashboard/promotions` | [~] |
| `/dashboard/automation` | [~] |
| `/dashboard/crm` | [~] |

### Features

- [ ] Guest segments view
- [ ] Campaign performance
- [ ] Repeat guest analysis
- [ ] Loyalty program management
- [ ] Review management (reply, request)
- [ ] Abandoned booking list
- [ ] Promo code management
- [ ] Create email/LINE broadcast
- [ ] Upsell offer creation
- [ ] Marketing automation rules

### Permissions

```
marketing.read · campaigns.create · promotions.manage
loyalty.manage · reviews.reply · automation.marketing
```

### Forbidden

- [ ] View payment raw → 403
- [ ] Refund → 403
- [ ] Check-in/out → 403

---

## P2.11 Hotel OS — Concierge / Guest Relations

### Pages

| Page | Status |
|---|---|
| `/dashboard/concierge` | [~] |
| `/dashboard/guests` (read/preference write) | [~] |
| `/dashboard/inbox` | [~] |
| `/dashboard/concierge/activities` | [~] |
| `/dashboard/concierge/restaurant-rec` | [ ] |

### Features

- [ ] In-house guests list
- [ ] VIP guest flags
- [ ] Guest preferences (read + write)
- [ ] Service requests management
- [ ] Activity booking
- [ ] Restaurant recommendation
- [ ] Chat with guest
- [ ] Complaint handling

### Permissions

```
guests.read · guests.preferences_write · requests.manage
inbox.reply · concierge.manage
```

---

## P2.12 Hotel OS — F&B

### Pages

| Page | Status |
|---|---|
| `/dashboard/fb` — Overview | [~] |
| `/dashboard/fb/orders` | [~] |
| `/dashboard/fb/kds` — Kitchen Display | [~] |
| `/dashboard/fb/menu` | [~] |
| `/dashboard/fb/dietary-alerts` | [~] |
| `/dashboard/fb/recipe-cost` | [~] |
| `/dashboard/restaurant/reservations` | [~] |
| `/mobile/kitchen` — Kitchen staff mobile | [~] |

### F&B Manager Features

- [ ] Room service orders
- [ ] Restaurant reservations
- [ ] Menu management
- [ ] Inventory alerts
- [ ] Dietary alerts (allergy flags)
- [ ] Charge to room folio
- [ ] Table reservation management
- [ ] Recipe cost tracking

### Kitchen Staff Features (Mobile)

- [ ] Incoming orders (table/room number, dietary alert, prep time, priority)
- [ ] Accept order
- [ ] Mark preparing
- [ ] Mark ready
- [ ] Add kitchen note

### Permissions

```
F&B Manager: fb.read · fb.orders_manage · fb.menu_manage · fb.charge_to_room · folios.add_fb_charge

Kitchen Staff: fb.kds_read · fb.kds_update
```

### Forbidden (Kitchen)

- [ ] Charge/refund → 403
- [ ] Edit menu price → 403
- [ ] Access guest payment → 403

---

## P2.13 Hotel OS — Spa

### Pages

| Page | Status |
|---|---|
| `/dashboard/spa` — Calendar | [~] |
| `/dashboard/spa/services` | [~] |
| `/dashboard/spa/packages` | [~] |
| `/dashboard/spa/performance` | [~] |
| `/mobile/spa` — Therapist mobile | [~] |

### Spa Manager Features

- [ ] Spa calendar (therapist schedule)
- [ ] Service management
- [ ] Package bundling
- [ ] Appointment booking
- [ ] Room charge
- [ ] Therapist performance

### Therapist Features (Mobile)

- [ ] Assigned appointments (guest preference, service type, room, time)
- [ ] Start service
- [ ] Complete service
- [ ] Add note

### Permissions

```
Spa Manager: spa.read · spa.manage · spa.booking_manage · folios.add_spa_charge
Therapist: spa.read_own · spa.complete
```

---

## P2.14 Hotel OS — HR

### Pages

| Page | Status |
|---|---|
| `/dashboard/team` — Staff list | [~] |
| `/dashboard/hr` | [~] |
| `/dashboard/hr/payroll` | [~] |
| `/dashboard/hr/training` | [~] |
| `/dashboard/hr/performance` | [~] |

### Features

- [ ] Staff list + search
- [ ] Invite staff (เลือก role + department)
- [ ] Deactivate staff
- [ ] Assign/change department
- [ ] Payroll management
- [ ] Training record
- [ ] Performance review
- [ ] Onboarding checklist

### Permissions

```
staff.read · staff.invite · staff.disable · hr.manage · payroll.manage
```

### Forbidden

- [ ] Owner SaaS billing → 403
- [ ] Payment refund → 403
- [ ] Invoice void → 403

---

## P2.15 Hotel OS — IT / Integration Admin

### Pages

| Page | Status |
|---|---|
| `/dashboard/developer` — API keys | [~] |
| `/dashboard/settings/integrations` | [~] |
| `/dashboard/ota` — OTA connections | [~] |

### Features

- [ ] API key management (create, rotate, revoke)
- [ ] Webhook configuration
- [ ] Channel connection status
- [ ] LINE/WhatsApp/OTA integration status
- [ ] Sync logs
- [ ] Retry failed sync

### Permissions

```
integrations.manage · api_keys.manage · webhooks.read · webhooks.retry · ota.manage
```

### Forbidden

- [ ] Refund → 403
- [ ] Export guest data → 403
- [ ] Edit booking financials → 403

---

## P2.16 Role-Based Navigation (Sidebar per Role)

> ห้ามให้ทุก role เห็น sidebar เหมือนกัน

- [ ] **Front Desk Sidebar:** Dashboard · Arrivals · Reservations · Calendar · Rooms · Guests · Payments · Inbox
- [ ] **Housekeeping Sidebar:** My Tasks · Room Status · Inspection · Lost & Found · Maintenance Report
- [ ] **Accounting Sidebar:** Payments · Folios · Invoices · Refunds · VAT Report · Cash Drawer · Reconciliation
- [ ] **Revenue Manager Sidebar:** Rates · Pricing · Revenue · Forecast · OTA · Parity · Blackout
- [ ] **GM/Manager Sidebar:** Operations · Reservations · Rooms · Staff · Inbox · Reports · Approvals
- [ ] **Hotel Owner Sidebar:** Overview · Revenue · Analytics · Team · Settings · Billing · Integrations · Audit
- [ ] **Kitchen Sidebar:** KDS (only)
- [ ] **Therapist Sidebar:** My Schedule (only)
- [ ] **Technician Sidebar:** My Work Orders (only)
- [ ] **Housekeeper Sidebar:** My Tasks (only)
- [ ] ต้องมี unit test: role X → sidebar items ตรงกับ spec

---

## P2.17 Availability Engine

- [ ] `AvailabilityInput`: `hotelId, checkIn, checkOut, roomTypeId?, roomsRequested, source`
- [ ] `AvailabilityResult`: `roomTypeId, totalRooms, availableRooms, blockedRooms, reasons[], ratePlans[]`
- [ ] คำนวณจากทุก source: physical rooms · room status · maintenance blocks · blackout · reservations · group bookings · OTA locks · rate_calendar override · min/max stay · CTA/CTD · subscription active · hotel active
- [ ] Block reasons ครบ: `BOOKED` `MAINTENANCE` `BLACKOUT` `OUT_OF_ORDER` `CTA` `CTD` `MIN_STAY` `MAX_STAY` `TENANT_SUSPENDED` `NO_RATE`
- [ ] Unit tests: double-book prevention · OTA lock · suspended tenant · min stay rule

---

## P2.18 Booking Session + Payment Session

- [ ] `booking_sessions` table: `id, hotel_id, guest_data, room_type_id, check_in, check_out, status, price_snapshot, expires_at, idempotency_key`
  - Status flow: `draft → priced → awaiting_payment → payment_failed → paid → confirmed → expired`
- [ ] `payment_sessions` table: `id, booking_session_id, hotel_id, status, provider, provider_ref, amount, currency`
  - Status flow: `created → pending → authorized → paid → failed → expired`
- [ ] Booking flow ครบ: search → create session → freeze price → create payment session → webhook paid → create_reservation_safely() → confirmed → email
- [ ] Failure path: payment fail → `payment_failed` → guest data ยังอยู่ → retry payment → reservation ยัง NOT created

---

## P2.19 Payment Ledger

- [ ] `payment_ledger_entries` table: `id, hotel_id, reservation_id, payment_id, type (charge/refund/adjustment/void), amount, currency, status, provider, provider_ref`
- [ ] `paid_amount = sum(charge.paid) - sum(refund.completed)` — ห้ามคิดจาก single field
- [ ] Function `recalculate_paid_amount(reservation_id)` สำหรับ verify
- [ ] Materialized cache field ได้ แต่ต้อง regenerate ได้เสมอ

---

## P2.20 Invoice / Tax Ledger

- [ ] `invoices` · `invoice_lines` · `invoice_events` · `invoice_sequences` tables
- [ ] DB constraint: issued invoice → amount/lines immutable (trigger หรือ RLS)
- [ ] ถ้าผิด → void + issue ใหม่ (credit note)
- [ ] Invoice sequence per hotel (unique serial number)
- [ ] e-Tax flow (ถ้าต้องการ): `draft_xml → signed_xml → submitted → accepted/rejected → retry`

---

## P2.21 OTA Architecture

- [ ] `ota_webhook_inbox` · `ota_sync_jobs` · `ota_conflicts` · `ota_dead_letters` · `ota_inventory_snapshots` tables
- [ ] Sync job status: `queued → running → success | failed → retrying → dead_letter`
- [ ] Conflict types ครบ: `ROOM_UNAVAILABLE` `RATE_MISSING` `ROOM_MAPPING_MISSING` `DUPLICATE_EXTERNAL_ID` `DATE_MODIFICATION_CONFLICT` `PAYMENT_AMOUNT_MISMATCH`
- [ ] OTA import → reservation.source=ota + `external_booking_id` + `external_payload_snapshot`
- [ ] Inventory push: delta-based (reservation created/cancelled/modified → push to OTA → log response → retry on fail)
- [ ] ห้ามใช้ cron วิ่งแล้วภาวนา → ต้องเป็น event-driven delta

---

## P2.22 Secret Management

- [ ] `encrypted_secrets` table: `id, hotel_id, provider, key_name, ciphertext, iv, rotated_at`
- [ ] ห้ามเก็บ token เป็น plain text ใน DB
- [ ] Server-side only + service role only access
- [ ] Audit ทุกครั้งที่ read sensitive provider key
- [ ] Migrate existing plain-text credentials → `encrypted_secrets`

---

## P2.23 Guest Web — Public Booking Flow

> `/h/[slug]` `/booking/[hotelSlug]`

### Anonymous Guest

- [ ] Hotel public page: photo gallery · room list · amenities · policies · reviews
- [ ] Date search + availability display
- [ ] Room type cards (price from, description, amenities, max occupancy)
- [ ] **Booking flow (10 steps):**
  1. [ ] เลือกวันที่
  2. [ ] ดูห้องว่าง
  3. [ ] เลือก room + rate plan
  4. [ ] ใส่ข้อมูลแขก
  5. [ ] เลือก add-ons
  6. [ ] ตรวจราคา + breakdown
  7. [ ] จ่ายเงิน
  8. [ ] ได้ booking code
  9. [ ] Email/LINE confirmation
  10. [ ] Lookup booking with code+email (no login)
- [ ] Response ห้ามมี internal_notes / staff_notes / cost / commission / other guest data

### Design Guidelines (Guest Web)

- [ ] โทน: Luxury · Trust · Simple · Conversion-focused
- [ ] Hero gallery
- [ ] Sticky search bar
- [ ] Room cards with price breakdown
- [ ] Trust badges (security, cancellation policy)
- [ ] Mobile CTA (sticky bottom)

---

## P2.24 Guest Web — Guest Portal (Logged In)

> `/portal/*`

### Guest Account Features

- [ ] Login / register / forgot password
- [ ] Claim booking (code + email)
- [ ] My bookings list
- [ ] Booking detail (status, dates, room, payment, balance)
- [ ] Payment status + receipt download
- [ ] Stay timeline (pre-stay / during / post-stay)
- [ ] Service requests (room service, housekeeping, etc.)
- [ ] Chat with hotel
- [ ] Order room service
- [ ] Request housekeeping
- [ ] Book spa
- [ ] Submit review
- [ ] Cancel booking (ตาม cancellation policy)
- [ ] Request modification
- [ ] PDPA: export own data / delete account request

### Guest Portal Flow

1. [ ] Login/register
2. [ ] Claim booking
3. [ ] Stay timeline view
4. [ ] Pre-stay: update requests / preferences
5. [ ] During stay: service requests / chat
6. [ ] Post-stay: receipt download / review submission

---

# P3 — EXCELLENCE & SCALE

> P3 คือ competitive advantage — ยังไม่มีไม่ตาย แต่มีแล้วดีกว่าคู่แข่ง

---

## P3.1 AI Gateway (ครบ spec)

- [ ] `src/lib/ai/gateway.ts` — modes: `disabled · fallback · real · quota_exceeded · key_missing · provider_error`
- [ ] ทุก AI call ต้องผ่าน gateway (ห้าม call provider ตรง)
- [ ] Gateway steps: feature gate → quota check → PII redaction → prompt build → provider call → cost calculate → log → fallback
- [ ] **PII Redaction ก่อนส่งทุกครั้ง:** passport · phone · email · payment ref · full address
- [ ] Response metadata: `{ mode, provider, model, confidence, cost, fallbackUsed }`
- [ ] AI cost tracking ต่อ hotel ต่อ feature

---

## P3.2 Loyalty Program

- [ ] `loyalty_accounts` · `loyalty_transactions` · `loyalty_tiers` tables
- [ ] Point accumulation rules (per booking, per spend)
- [ ] Tier benefits (bronze/silver/gold/platinum)
- [ ] Birthday benefit automation
- [ ] Repeat guest offer triggers
- [ ] Wishlist feature
- [ ] Guest portal: redeem points + use member promo
- [ ] Quick book for loyalty members

---

## P3.3 Advanced Analytics

- [ ] Occupancy forecast (ML-based, 30/60/90 days)
- [ ] Demand forecast per room type
- [ ] Pickup report (speed of bookings)
- [ ] Booking pace vs. last year
- [ ] Competitor rate tracking
- [ ] Rate parity monitor (alert เมื่อ OTA ถูกกว่า direct)
- [ ] Revenue attribution (channel, campaign, promo)
- [ ] Guest LTV calculation
- [ ] Staff performance metrics

---

## P3.4 Advanced CRM / Campaigns

- [ ] Guest segmentation engine (RFM model)
- [ ] Campaign performance tracking
- [ ] A/B testing for email campaigns
- [ ] LINE OA integration (broadcast + chatbot)
- [ ] WhatsApp integration
- [ ] Automated marketing journeys
- [ ] Review request automation (post-checkout)
- [ ] Upsell automation (pre-arrival)

---

## P3.5 Database Ownership Ledger

- [ ] สร้าง `docs/DATABASE_OWNERSHIP_LEDGER.md`
- [ ] ทุก table ต้องมี: Owner Key · Public? · Tenant Read · Tenant Write · Guest Read · Admin Read
- [ ] ทุก table ที่ไม่มี owner key → ตัดสินใจ: เพิ่ม `organization_id` / `hotel_id` / join guard / ห้ามใช้ใน multi-tenant path

---

## P3.6 RLS Ultimate Audit (ทุก table)

- [ ] `folios` RLS ครบ 7 policies
- [ ] `invoices` RLS ครบ
- [ ] `channel_connections` RLS ครบ
- [ ] `reservation_events` RLS ครบ
- [ ] `payment_ledger_entries` RLS ครบ
- [ ] `provider_events` RLS ครบ
- [ ] `encrypted_secrets` RLS ครบ
- [ ] `loyalty_accounts` RLS ครบ
- [ ] Integration test: suspended tenant → 0 data

---

## P3.7 Testing Pyramid

### Unit Tests

- [~] Pricing calculation
- [ ] Availability logic (ทุก block reason)
- [x] Permission / feature gate
- [ ] Refund calculation
- [ ] Invoice sequence concurrency
- [ ] OTA mapper
- [ ] AI mode resolver
- [ ] PII redaction
- [ ] Sidebar items per role

### Integration Tests

- [ ] API guard — ทุก step ของ golden pipeline
- [ ] Supabase RLS — hotel A vs B isolation
- [ ] Payment webhook duplicate → idempotency
- [ ] Reservation RPC race condition
- [ ] Booking session flow: draft → confirmed
- [ ] Platform role guard — support ไม่สามารถ suspend

### E2E Tests

- [~] Booking flow (`booking-flow.spec.ts` — audit)
- [~] Multi-tenant isolation (`multi-tenant.spec.ts` — audit)
- [~] OTA sync (`ota-sync.spec.ts` — audit)
- [~] Payment flow (`payment-flow.spec.ts` — audit)
- [ ] Owner admin lifecycle (platform owner actions + audit trail)
- [ ] Hotel PMS lifecycle (owner → GM → front desk → housekeeping → accounting)
- [ ] Guest booking lifecycle (search → book → payment → portal → checkout → review)
- [ ] OTA lifecycle (import → conflict → resolve)
- [ ] Security bypass lifecycle (cross-tenant access attempts)
- [ ] Impersonation lifecycle (start → expire → auto-revoke)

### Chaos / Failure Tests

- [ ] Payment webhook duplicate → process 1 ครั้ง
- [ ] OTA timeout → retry → dead_letter
- [ ] AI provider down → fallback mode
- [ ] SendGrid fail → queue + retry
- [ ] Cron runs twice → idempotency
- [ ] DB transaction conflict → graceful error
- [ ] Suspended tenant → all actions blocked
- [ ] Race condition: 2 concurrent bookings → 1 win

---

## P3.8 Production Readiness Gate

> สร้าง `PRODUCTION_GATE.md` — ต้องผ่านทั้งหมดก่อน go-live

### Code Quality

- [ ] ไม่มี `PLACEHOLDER` ใน critical path (payment, booking, auth)
- [ ] ไม่มี `MOCK` ใน payment/booking/auth
- [ ] ทุก API route ผ่าน `apiGuard()`
- [ ] ทุก tenant data query scoped ด้วย `hotel_id` หรือ `organization_id`

### Race Condition & Concurrency

- [ ] Booking race test ผ่าน
- [ ] Payment duplicate webhook test ผ่าน
- [ ] Invoice concurrency test ผ่าน

### Security

- [ ] Suspended tenant ไม่สามารถ create reservation
- [ ] Guest ไม่สามารถเข้าถึง booking ของ guest อื่น
- [ ] `/admin/*` ไม่สามารถ access ได้จาก tenant owner
- [ ] Platform support ไม่สามารถ suspend tenant
- [ ] Impersonation expire ทำงานถูกต้อง

### Infrastructure

- [ ] Sentry enabled + ทดสอบ error capture
- [ ] Health check endpoints ผ่าน (`/api/health`)
- [ ] DB backup verified (restore test)
- [ ] All Supabase migrations applied
- [ ] ENV vars ครบ: `CRON_SECRET` · `STRIPE_WEBHOOK_SECRET` · OTA keys · SendGrid domain
- [ ] Rate limiting ทดสอบแล้ว

---

## Priority Summary

```
P1 — Critical Path (ต้องเสร็จก่อนระบบทำงานได้):
  1. Context System (P1.3)
  2. Golden Guard Pipeline (P1.4)
  3. Error Taxonomy (P1.5)
  4. Platform Roles แยกครบ 4 sub-roles (P1.6)
  5. Reservation Ledger + Events (P1.7)
  6. Race-Safe Booking RPC (P1.8)
  7. System Event Bus (P1.9)
  8. Payment Webhook Inbox (P1.10)
  9. Core RLS (P1.11)

P2 — Full Operations (โรงแรมใช้งานได้จริง):
  10. Owner Admin 4 roles ครบ (P2.1)
  11. Front Desk core flow (P2.2)
  12. Booking + Payment Sessions (P2.18)
  13. Payment Ledger (P2.19)
  14. Availability Engine (P2.17)
  15. Remaining staff roles UIs (P2.3–P2.15)
  16. Role-based navigation (P2.16)
  17. Guest booking flow + portal (P2.23–P2.24)
  18. OTA Architecture (P2.21)
  19. Invoice / Tax Ledger (P2.20)
  20. Secret Management (P2.22)

P3 — Excellence (Competitive advantage):
  21. AI Gateway (P3.1)
  22. Loyalty Program (P3.2)
  23. Advanced Analytics (P3.3)
  24. CRM / Campaigns (P3.4)
  25. Database Ownership Ledger (P3.5)
  26. RLS Ultimate Audit all tables (P3.6)
  27. Testing Pyramid full (P3.7)
  28. Production Gate (P3.8)
```

---

> **Rule:** ทุก task ที่ติ๊ก `[x]` ต้องมี: โค้ด commit + build ผ่าน + test ผ่าน  
> ถ้าติ๊กแล้วไม่มีของ 3 อย่างนี้ = ยังไม่นับ เหมือนประกาศ checkin แขก แต่ยังไม่ assign ห้อง
