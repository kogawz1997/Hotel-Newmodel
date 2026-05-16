# Hotel OS / PMS SaaS — Implementation Checklist

> อัปเดต: 2026-05-16  
> ใช้ไฟล์นี้เป็น single source of truth สำหรับ track งานทั้งหมด  
> ติ๊ก `[x]` เมื่อทำเสร็จจริง (มีโค้ด + build/test ผ่าน)

**Legend:**
- `[ ]` — ยังไม่ได้ทำ / **ควรทำ**
- `[~]` — มีบางส่วนแล้ว แต่ยังไม่ครบ (ต้อง audit/complete)
- `[x]` — เสร็จแล้วจริง (โค้ดมี + verified)
- `[?]` — ไม่แน่ใจว่าจำเป็น / ต้องประเมินก่อน
- `[-]` — ข้ามได้ / ไม่ apply กับโปรเจกต์นี้

---

## P1 — FOUNDATION & CORE OPERATION

### P1.1 Build & Baseline Verification

- [x] `npm ci` — รัน และผ่านสะอาด
- [x] `npm run type-check` — ผ่าน 0 errors
- [x] `npm run lint` — ผ่าน 0 errors (79 warnings, 0 errors)
- [x] `npm run build` — ผ่าน production build
- [ ] `npm run check:strict` — ผ่านทุก strict check
- [ ] สร้าง/อัปเดต `docs/PRODUCTION_GAP_REPORT.md` พร้อม: commands run, pass/fail, files changed, remaining risks

---

### P1.2 Central Role & Permission System

#### สร้าง `src/lib/auth/roles.ts` (Single Source of Truth)

- [x] `StaffRole` type — ครบทุก role จาก DB constraint (50+ roles)
- [x] Role groups (Core / Executive / Front Office / etc.)
- [x] Page permissions map (ROUTE_ROLES)
- [x] API permissions map (ACTION_PERMISSIONS)
- [x] Action permissions map
- [x] Approval permissions map (APPROVAL_PERMISSIONS)
- [x] Sidebar visibility per role (ใช้ role groups)
- [x] Default landing page per role (DEFAULT_LANDING)
- [x] Department mapping per role (ROLE_DEPARTMENT)
- [x] Mobile role behavior (MOBILE_ROLE_CONFIG)

**Required Roles — Core:**
- [x] `owner`
- [x] `admin`
- [x] `manager`
- [x] `staff`
- [x] `viewer`

**Required Roles — Executive:**
- [x] `hotel_owner`
- [x] `general_manager`
- [x] `operations_manager`

**Required Roles — Front Office:**
- [x] `front_office_manager`
- [x] `front_desk`
- [x] `receptionist`
- [x] `reservation_agent`
- [x] `night_auditor`

**Required Roles — Housekeeping:**
- [x] `housekeeping_manager`
- [x] `housekeeper`
- [x] `room_inspector`

**Required Roles — Maintenance:**
- [x] `maintenance_manager`
- [x] `technician`
- [x] `engineering`

**Required Roles — Revenue & Marketing:**
- [x] `revenue_manager`
- [x] `marketing_staff`
- [x] `sales`

**Required Roles — Accounting:**
- [x] `accounting_manager`
- [x] `accounting_staff`

**Required Roles — F&B:**
- [x] `fnb_manager`
- [x] `kitchen_staff`
- [x] `restaurant_staff`
- [x] `room_service_staff`

**Required Roles — Guest Services:**
- [x] `concierge`
- [x] `guest_relations`
- [x] `bellboy`
- [x] `transport_driver`

**Required Roles — Security:**
- [x] `security_manager`
- [x] `security_staff`

**Required Roles — Spa:**
- [x] `spa_manager`
- [x] `spa_staff`

**Required Roles — HR:**
- [x] `hr_manager`
- [x] `hr_staff`

**Required Roles — IT:**
- [x] `it_admin`
- [x] `it_support`

**Required Roles — Purchasing:**
- [x] `purchasing_manager`
- [x] `purchasing_staff`

**Refactor ที่ต้องทำหลังสร้าง roles.ts:**
- [x] `src/lib/auth/guards.ts` — import StaffRole จาก roles.ts
- [x] `src/lib/auth/page-guards.ts` — import จาก roles.ts
- [x] `src/components/layout/sidebar.tsx` — import role groups จาก roles.ts
- [x] `src/middleware.ts` — import ROUTE_ROLES จาก roles.ts
- [x] DB constraints ครบ (0003_staff_hr.sql มี constraint ครบ 50+ roles)

---

### P1.3 Security & Tenant Isolation

**Audit API routes:**
- [~] `src/app/api/**` — ทุก route ต้องมี auth + role check
- [~] Hotel data queries scoped by `hotel_id` / `organization_id`
- [~] Dashboard pages มี page-level role protection
- [x] Platform routes require platform admin (แก้ admin/ranking-weights + admin/platform-config แล้ว)
- [x] Cron routes require `CRON_SECRET` (ครบทุก cron route)
- [~] Webhook routes verify signature
- [~] Payment routes idempotent
- [ ] Service role client ไม่ถูกใช้ unsafely
- [x] Audit log เขียนทุก sensitive action (`src/lib/audit.ts` + check-in/out/HK/WO)

**Add Tests:**
- [~] Tenant isolation tests — มี `tests/e2e/tenant-isolation.spec.ts`
- [~] Route permission tests — มี `tests/unit/route-permissions.test.mjs`
- [ ] API permission tests (ครบทุก endpoint)

---

### P1.4 Workflow Engine Foundation

**Database Tables:**
- [x] `work_orders` — ครบ (0003_staff_hr.sql)
- [x] `task_assignments` — ครบ (0003_staff_hr.sql)
- [x] `approvals` — สร้างใน 0006_workflow_engine.sql
- [x] `approval_logs` — สร้างใน 0006_workflow_engine.sql
- [x] `notifications` / `staff_notifications` — สร้างใน 0006_workflow_engine.sql
- [x] `activity_logs` / `audit_logs` — ครบ (0001_core_schema.sql)
- [x] `department_sla_rules` — สร้างใน 0006_workflow_engine.sql
- [x] `guest_request_routes` — สร้างใน 0006_workflow_engine.sql
- [x] `room_status_events` — สร้างใน 0006_workflow_engine.sql
- [x] `workflow_templates` — สร้างใน 0006_workflow_engine.sql
- [x] `task_comments` — สร้างใน 0006_workflow_engine.sql
- [x] `task_attachments` — สร้างใน 0006_workflow_engine.sql
- [x] `operational_incidents` — สร้างใน 0006_workflow_engine.sql
- [x] `shift_handovers` — สร้างใน 0006_workflow_engine.sql

**Modules:**
- [x] `src/lib/workflows/room-status.ts` — room status automation ครบ
- [~] `src/lib/tasks/*` — ใช้ work_orders + housekeeping_tasks
- [x] `src/lib/approvals/index.ts` — approval engine ครบ
- [x] `src/lib/notifications.ts` — notification queuing ครบ
- [x] `src/lib/audit.ts` — audit log writer ครบ
- [x] `src/lib/sla/index.ts` — SLA breach checker ครบ

**Every workflow must have:**
- [ ] Owner role defined
- [ ] Assigned user/department
- [ ] Status lifecycle
- [ ] SLA config
- [ ] Notification triggers
- [ ] Audit log on every state change
- [ ] Tenant/hotel scope enforced

---

### P1.5 Core Front Desk & Booking Flow

- [~] Quick check-in — มีใน dashboard
- [~] Quick checkout — มีใน dashboard
- [~] Walk-in booking — มี `walk-in-quick-client.tsx`
- [ ] Room move
- [ ] Extend stay
- [ ] Early check-in
- [ ] Late checkout
- [~] Deposit handling — มี API
- [ ] Split folio
- [~] Print receipt/folio — มี PDF module
- [~] Fast guest lookup — มี search API
- [~] Room readiness real-time — มี live components
- [~] Create reservation — มีครบ
- [~] Modify reservation — มี API
- [~] Cancel reservation with reason — มี API
- [~] No-show — มี night audit
- [~] Availability check — มี API
- [ ] Duplicate guest warning (UI)
- [~] OTA/manual/source tagging — มีบางส่วน

**Add Tests:**
- [~] Booking lifecycle tests
- [~] Check-in lifecycle tests
- [ ] Checkout lifecycle tests
- [~] Reservation overlap tests
- [~] Idempotency tests

---

### P1.6 Room Status Automation

- [x] Check-in → room `occupied` (reservation PATCH + onCheckIn)
- [x] Checkout → room `dirty` + HK tasks (reservation PATCH + onCheckout)
- [x] Dirty room → create housekeeping task (onCheckout side-effect)
- [x] Housekeeping done → create inspection task (housekeeping complete + onHousekeepingDone)
- [x] Inspection approved → room `available` (inspect route + onInspectionPass)
- [x] Maintenance OOO → block room inventory (work-order PATCH + onMaintenanceOOO)
- [x] Maintenance fixed → create inspection task (work-order PATCH + onMaintenanceFixed)

**Every room status change must create:**
- [x] `room_status_event` record (ใน transitionRoomStatus)
- [x] Notification (if needed) (ใน handleSideEffects)
- [x] Audit log entry (ใน transitionRoomStatus)

---

## P2 — DEPARTMENT COMPLETION & CONNECTED HOTEL OS

### P2.1 Housekeeping

- [~] Housekeeping board — มีใน dashboard
- [~] My rooms for housekeeper — มีบางส่วน
- [~] Room assignment by manager — มีบางส่วน
- [ ] Start/pause/done cleaning (real workflow)
- [~] Inspection workflow — มีบางส่วน
- [ ] Reject inspection with reason
- [?] Lost & found tracking
- [ ] Laundry/linen tracking
- [ ] Minibar reporting
- [ ] Damage reporting
- [~] Photo upload — มี `photo-capture.tsx`
- [?] QR room scan
- [?] Mobile housekeeping PWA

---

### P2.2 Maintenance

- [~] Maintenance tickets — มี `/dashboard/work-orders`
- [~] Assign technician — มีบางส่วน
- [ ] Technician "my repairs" view
- [ ] Start/done repair workflow
- [ ] Parts used tracking
- [ ] Photo evidence on repair
- [ ] Request out-of-order
- [ ] Approve out-of-order
- [?] Preventive maintenance schedule
- [?] Asset/room repair history
- [ ] Downtime report
- [?] Mobile technician view

---

### P2.3 Accounting & Payments

- [~] Folio management — มี API
- [~] Payment posting — มี API
- [~] Deposit tracking — มี API
- [ ] Refund request workflow
- [ ] Refund approval workflow
- [ ] Void approval workflow
- [ ] Payment reconciliation
- [ ] Cashier close process
- [?] AR aging report
- [~] e-Tax invoice — มีใน docs/integrations/eTax
- [~] Receipt reprint log — มีบางส่วน
- [ ] Payment mismatch alert

---

### P2.4 Revenue, Rates & OTA

- [~] Rate calendar — มีใน dashboard
- [~] Rate plans — มี API
- [?] Package rates
- [?] Member rates
- [?] Promo codes
- [?] Blackout dates
- [?] Dynamic pricing engine
- [~] OTA parity checker — มีบางส่วน
- [~] OTA sync monitor — มีบางส่วน
- [ ] Failed OTA alert (real-time)
- [?] Revenue forecast
- [?] Occupancy forecast

---

### P2.5 F&B / Room Service

- [~] Restaurant POS — มี `/dashboard/restaurant`
- [~] Kitchen display system — มี `/dashboard/kitchen`
- [~] Menu management — มี `/dashboard/menu`
- [ ] Order lifecycle: new → cooking → ready → delivered (connected)
- [~] Room service delivery queue — มี `/dashboard/room-service`
- [~] Post charge to folio — มีบางส่วน
- [ ] Void/discount approval workflow
- [ ] Stock low alert
- [ ] Revenue by outlet report

---

### P2.6 Spa / Experiences / Transport

- [~] Spa booking calendar — มีใน dashboard
- [~] Therapist assignment — มีบางส่วน
- [~] Spa service menu — มีบางส่วน
- [~] Spa charge posting — มีบางส่วน
- [?] Experience booking
- [~] Transport booking — มี `/dashboard/transport`
- [~] Driver mobile view — มีบางส่วน
- [ ] Late pickup alert
- [?] Package upsell

---

### P2.7 Concierge / Guest Relations

- [~] Guest request queue — มีใน dashboard
- [~] VIP alerts — มี live components
- [?] Complaint recovery workflow
- [~] Guest preference notes — มีบางส่วน
- [~] AI guest summary — มี AI module
- [?] Recovery voucher approval
- [?] Sentiment alert
- [?] Tour/transport coordination

---

### P2.8 HR / Staff Operations

- [~] Staff directory — มีใน dashboard
- [~] Attendance tracking — มีครบ
- [~] Leave request — มีใน dashboard
- [~] Leave approval — มีบางส่วน
- [~] Shift scheduling — มีใน dashboard
- [ ] Overtime report
- [?] Training/certification record
- [~] Role assignment — มีบางส่วน
- [ ] Shift conflict warning

---

### P2.9 Notification & Approval Center

**Centralized Notifications:**
- [~] Role-aware notifications — มีบางส่วน
- [ ] Priority levels (critical/high/normal/low)
- [ ] Actionable notifications (approve/reject in-notification)
- [ ] Approval queue UI
- [ ] Escalation rules
- [ ] SLA breach alert
- [?] Mobile push notifications
- [ ] Notification grouping

**Approval Types:**
- [ ] Refund approval
- [ ] Discount approval
- [ ] Void approval
- [ ] Compensation approval
- [ ] Out-of-order approval
- [ ] Purchasing approval
- [ ] Leave approval

---

## P3 — SAAS SCALE, OWNER, CUSTOMER WEBSITE & PREMIUM UX

### P3.1 Platform Owner Website

**Routes:**
- [~] `/platform` — มีบางส่วนใน `/admin`
- [ ] `/platform/overview` (MRR/ARR dashboard)
- [~] `/platform/tenants` — มีใน `/admin/orgs`
- [~] `/platform/tenants/[id]`
- [ ] `/platform/plans`
- [~] `/platform/billing` — มีใน `/admin/billing`
- [ ] `/platform/feature-gates`
- [?] `/platform/trials`
- [~] `/platform/onboarding` — มีบางส่วน
- [~] `/platform/support` — มีใน `/admin/support`
- [?] `/platform/system-health`
- [?] `/platform/jobs`
- [?] `/platform/webhooks`
- [~] `/platform/security` — มีใน `/admin/security`
- [~] `/platform/audit` — มีบางส่วน
- [?] `/platform/leads`
- [?] `/platform/content`
- [~] `/platform/settings` — มีบางส่วน

**Features:**
- [~] MRR / ARR metrics — มีบางส่วน
- [~] Tenant management — มีบางส่วน
- [?] Tenant health score
- [~] Billing control — มีบางส่วน
- [~] Subscription management — มีบางส่วน
- [?] Plan/package editor
- [?] Feature gate editor
- [?] Usage quota
- [?] Trial extension
- [?] Suspend/unsuspend tenant
- [ ] Impersonation with audit log (reason + timeout + visible banner)
- [~] Support ticket center — มีใน admin
- [?] System health center
- [?] Webhook/cron/job monitor
- [?] Failed job retry UI
- [?] Lead/demo CRM

---

### P3.2 Hotel Owner Website

**Routes:**
- [~] `/owner` — มีบางส่วน
- [ ] `/owner/overview`
- [~] `/owner/properties` — มีใน dashboard
- [~] `/owner/revenue` — มีบางส่วน
- [~] `/owner/operations` — มีบางส่วน
- [~] `/owner/staff` — มีบางส่วน
- [~] `/owner/guests` — มีบางส่วน
- [?] `/owner/reviews`
- [~] `/owner/analytics` — มีบางส่วน
- [~] `/owner/accounting` — มีบางส่วน
- [ ] `/owner/approvals`
- [~] `/owner/security` — มีบางส่วน
- [?] `/owner/reputation`
- [?] `/owner/crm`
- [~] `/owner/settings`

**Features:**
- [~] Occupancy metrics
- [~] ADR (Average Daily Rate)
- [~] RevPAR
- [~] Revenue today/week/month/year
- [?] Multi-property overview
- [?] Staff productivity report
- [?] Department KPI dashboard
- [?] Guest satisfaction score
- [?] Reviews/reputation dashboard
- [?] Maintenance downtime report
- [?] Housekeeping performance
- [~] Outstanding payments
- [ ] Executive approval center
- [~] AI executive summary — มีบางส่วน
- [?] Forecasting
- [?] Profit/loss insight

---

### P3.3 Customer Website / Direct Booking

**Public Routes:**
- [~] `/` — มี landing page
- [~] `/hotels` — มีหน้า listing
- [~] `/h/[slug]` — มี hotel detail
- [~] `/h/[slug]/rooms` — มีบางส่วน
- [~] `/h/[slug]/gallery` — มีบางส่วน
- [?] `/h/[slug]/offers`
- [~] `/h/[slug]/spa` — มีบางส่วน
- [~] `/h/[slug]/restaurant` — มีบางส่วน
- [?] `/h/[slug]/experiences`
- [?] `/h/[slug]/reviews`
- [~] `/h/[slug]/location` — มีบางส่วน
- [?] `/h/[slug]/faq`
- [~] `/h/[slug]/booking` — มี booking engine
- [~] `/h/[slug]/checkout` — มีบางส่วน
- [~] `/h/[slug]/confirmation` — มีบางส่วน

**Guest Portal:**
- [~] `/portal` — มีแล้ว
- [~] `/portal/bookings`
- [~] `/portal/profile`
- [~] `/portal/preferences`
- [~] `/portal/payments`
- [~] `/portal/loyalty`
- [?] `/portal/messages`

**Features:**
- [~] Luxury landing page — มีบางส่วน
- [~] Hotel detail page — มีแล้ว
- [~] Room detail page — มีแล้ว
- [~] Gallery — มีบางส่วน
- [?] Offers/packages page
- [?] Reviews section
- [?] Location/FAQ page
- [?] Sticky booking bar
- [~] Mobile-first booking — มีบางส่วน
- [?] Room comparison
- [?] Add-ons/upsells
- [?] Promo code input
- [?] Loyalty/member rate
- [?] Apple Pay / Google Pay / PromptPay
- [~] Omise / Stripe integration — มีบางส่วน
- [~] Booking confirmation page
- [~] Guest portal — มีแล้ว
- [~] Modify/cancel booking — มีบางส่วน
- [?] Pre-arrival check-in (digital)
- [~] AI concierge — มีบางส่วน
- [?] SEO structured data (JSON-LD)

---

### P3.4 Complete UX/UI Overhaul

**Design System:**
- [~] Shared card system — มีบางส่วนใน `ui/card.tsx`
- [~] Table system — มีบางส่วน
- [~] Form system — มีบางส่วน
- [~] Modal/dialog system — มีใน `ui/dialog.tsx`
- [~] Status badge system — มีใน `ui/badge.tsx`
- [~] Toast/notification system — มี sonner
- [ ] Loading states (skeleton-first, ไม่ใช่ spinner เดียว)
- [~] Empty states — มีใน `ui/empty-state.tsx`
- [ ] Error states (per-component, ไม่ใช่แค่ global)
- [~] Mobile responsive layouts — มีบางส่วน
- [~] Role-aware sidebar — มีบางส่วน
- [?] Command palette (Cmd+K)
- [?] Quick actions panel
- [?] Keyboard shortcuts
- [?] Saved views/filters
- [?] Dark/light mode toggle
- [~] Thai/English UI — มี i18n

**UX Principles (audit):**
- [ ] ลด clicks — audit workflow ที่ยาวเกิน
- [ ] ลด clutter — audit dashboard หน้าหลัก
- [ ] แสดงเฉพาะ actions ที่ role นั้นทำได้
- [ ] Mobile operations เร็ว (housekeeping, maintenance)

---

### P3.5 AI Layer

- [~] AI inbox routing — มีบางส่วน
- [~] AI suggested replies — มีบางส่วน
- [?] AI translation
- [~] AI guest summary — มีใน `lib/ai/`
- [?] AI VIP insight
- [?] AI anomaly detection
- [~] AI revenue insight — มีบางส่วน
- [?] AI room recommendation
- [?] AI upsell suggestions
- [?] AI support summaries
- [~] AI executive briefing — มีบางส่วน

---

### P3.6 Analytics & Growth

- [?] Booking funnel tracking
- [?] Drop-off analytics
- [?] Upsell conversion tracking
- [?] OTA vs direct booking comparison
- [?] Campaign tracking
- [?] Review sentiment analysis
- [?] Churn risk scoring
- [?] Tenant health score
- [?] A/B testing framework
- [?] Conversion dashboard

---

### P3.7 Production Readiness

**Build & CI:**
- [ ] `npm ci` ผ่าน
- [ ] `npm run type-check` ผ่าน 0 errors
- [ ] `npm run lint` ผ่าน 0 errors
- [ ] `npm run build` ผ่าน
- [ ] `npm run check:strict` ผ่าน

**Deployments & Services:**
- [ ] Smoke test production URL
- [ ] Supabase migrations applied (production)
- [ ] ENV production config ครบทุกตัว
- [~] Sentry configured — มี sentry config files
- [ ] SendGrid working (email delivery confirmed)
- [ ] Omise/Stripe working (sandbox test)
- [ ] LINE/WhatsApp webhook working
- [ ] OTA integration tested (test mode)
- [ ] Backup/restore runbook verified
- [ ] Disaster recovery checklist completed

---

## FINAL DOCUMENTATION

- [~] `docs/STATUS.md` — มีแล้ว แต่ต้อง update ให้ตรงจริง
- [ ] `docs/PRODUCTION_GAP_REPORT.md` — ต้องสร้างจาก build จริง
- [ ] `docs/ROLE_MATRIX.md` — ต้องสร้างจาก roles.ts ที่ครบ
- [ ] `docs/WORKFLOW_ENGINE.md` — ต้องสร้าง
- [ ] `docs/UX_SYSTEM.md` — ต้องสร้าง
- [ ] `docs/DEPLOYMENT_CHECKLIST.md` — ต้องสร้าง

---

## FINAL ACCEPTANCE CRITERIA

- [ ] Build ผ่านสมบูรณ์
- [ ] type-check ผ่าน
- [ ] lint ผ่าน
- [ ] Tests ผ่าน
- [ ] Role permissions บังคับใช้จริงทุก route
- [ ] Tenant isolation บังคับใช้จริงทุก query
- [ ] Workflows เชื่อมต่อข้าม departments จริง
- [ ] Platform owner controls ทำงานได้จริง
- [ ] Hotel owner dashboard ทำงานได้จริง
- [ ] Staff operations ทำงานได้จริง
- [ ] Guest direct booking ทำงานได้จริง
- [ ] UI รู้สึก premium และ organized
- [ ] ทำงานได้บน mobile
- [ ] ไม่มี fake dashboards หรือ mock data
- [ ] ไม่มี disconnected CRUD pages

---

## สรุปความสำคัญ: ควรทำก่อน vs รอได้

### 🔴 Critical — ทำก่อนเลย (P1)

1. **Build verification** — ถ้า build fail ทำอย่างอื่นไม่ได้
2. **roles.ts central file** — ทุกอย่างอื่นขึ้นกับอันนี้
3. **Room status automation** — core workflow ที่ทุก dept ต้องใช้
4. **Cron secret protection** — security gap ชัดเจน
5. **Tenant isolation audit** — ข้อมูลรั่วข้าม hotel เป็นปัญหาใหญ่

### 🟡 Important — ทำใน P2

6. **Workflow engine** (approval, SLA, notifications ที่ connected จริง)
7. **Housekeeping + Maintenance workflows** — staff ใช้งานจริงได้
8. **Folio/Payment flows ครบ** — refund, void, reconciliation
9. **Notification & Approval center** — เชื่อม dept เข้าหากัน
10. **P1.5 Front desk flows ที่ยังขาด** (room move, split folio)

### 🟢 Nice to have — P3 / ทำได้ทีหลัง

11. Platform owner analytics (MRR/ARR etc.)
12. AI layer features ต่างๆ
13. Analytics & Growth tracking
14. Dark mode, command palette
15. A/B testing framework

### ⚪ ประเมินก่อน — `[?]` items

- Features ที่มี `[?]` ให้ประเมินก่อนว่า hotel ลูกค้าต้องการจริงไหม
- บางอย่าง (เช่น A/B testing, churn risk) อาจไม่จำเป็นสำหรับ MVP
