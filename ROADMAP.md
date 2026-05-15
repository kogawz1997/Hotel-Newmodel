# 🗺️ Maitri PMS — 3P Roadmap (Checklist)

**อัปเดต**: 2026-05-15  
**สถานะโปรเจกต์**: Code ~100% | Integration ~20% | Production ~30%

---

## ตำนาน (Legend)

| สัญลักษณ์ | ความหมาย |
|-----------|---------|
| `[ ]` | ยังไม่เสร็จ |
| `[x]` | เสร็จแล้ว |
| ✅ | โค้ดครบ พร้อมใช้ |
| 🔑 | รอแค่ใส่ Key / API / Credentials |
| 🔄 | ต้องเขียนโค้ดเพิ่ม |
| 🔁 | ซ้ำกับข้ออื่นในลิสต์ |

---

## P1 — Core PMS ให้ใช้งานจริงก่อน

> เป้าหมาย: สมัคร → ตั้งค่า → เพิ่มห้อง → รับจอง → เช็คอิน/เช็คเอาท์ → รับเงิน → ออกเอกสาร

---

### 1. Auth / Account / Onboarding

#### ต้องแก้
- [x] แก้ทุกไฟล์ที่ใช้ `user!.id` โดยไม่ check null ✅
- [x] ทำ `requireUser()` ✅ — `src/lib/auth/`
- [x] ทำ `requireProfile()` ✅ — `src/lib/auth/`
- [x] ทำ `requireHotelContext()` ✅ — `src/lib/auth/`
- [x] ถ้าไม่มี user → redirect `/auth/login` ✅ — `src/middleware.ts`
- [x] ถ้าไม่มี hotel → redirect `/onboarding` ✅ — middleware
- [x] กัน redirect loop ใน middleware ✅
- [x] แยก role ชัดเจน ✅ — 35 roles ใน `migrations/00004_roles_expanded.sql`
  - [x] `owner` ✅
  - [x] `admin` ✅
  - [x] `manager` ✅
  - [x] `front_desk` ✅
  - [x] `housekeeping` ✅
  - [x] `accounting` ✅
  - [x] `staff` ✅

#### ต้องเพิ่ม
- [x] `/onboarding` ✅ — route มีแล้ว
  - [ ] Step 1: Create Organization 🔄 — UI ต้องตรวจสอบว่า flow ครบ
  - [ ] Step 2: Create Hotel 🔄
  - [ ] Step 3: Create Room Types 🔄
  - [ ] Step 4: Bulk Add Rooms 🔄
  - [ ] Step 5: Ready checklist 🔄
- [x] Invite staff ✅ — email invitation ทำแล้ว
- [x] Staff role management ✅
- [ ] Disable staff 🔄 — schema มี `is_active` แต่ต้องตรวจ UI
- [x] Forgot password ✅ — `/auth/forgot-password`
- [x] Reset password ✅ — `/auth/reset-password`
- [x] Verify email page ✅ — Supabase auth callback
- [x] Auth callback page ✅ — `/auth/callback`
- [x] Profile settings ✅ — `/dashboard/profile`

---

### 2. Dashboard หลัก

#### ต้องเพิ่ม/แก้
- [ ] Dashboard ใช้ข้อมูลจริงทุก card 🔄
  - [ ] Today check-in (real data) 🔄
  - [ ] Today check-out (real data) 🔄
  - [ ] Occupancy (real data) 🔄
  - [ ] Revenue today (real data) 🔄
  - [ ] Open inbox count 🔄
  - [ ] Housekeeping pending 🔄
  - [ ] Payment pending 🔄
  - [ ] OTA sync warning 🔄
- [ ] Empty state แบบแนะนำขั้นตอนต่อไป 🔄
- [x] Quick actions ✅ — มีแล้วใน dashboard
  - [x] สร้าง booking ✅
  - [x] เพิ่มห้อง ✅
  - [x] เปิด inbox ✅
  - [ ] รับเงิน 🔄
  - [ ] ออก invoice 🔄
- [ ] Mobile dashboard 🔄 — ยังไม่ fully responsive
- [x] Notification center ✅ — `/api/notifications/`
- [x] Global search ✅ — `CommandSearch` component
  - [x] booking code ✅
  - [x] guest ✅
  - [x] room ✅
  - [ ] phone 🔄
  - [ ] email 🔄

---

### 3. Rooms / Room Types / Rates

#### Room Types
- [x] เพิ่มประเภทห้อง ✅
- [x] แก้ประเภทห้อง ✅
- [x] ลบ/ปิดใช้งานประเภทห้อง ✅
- [x] base rate ✅
- [x] max occupancy ✅
- [x] bed type ✅
- [x] amenities ✅
- [x] room images ✅ — `/migrations/00004_hotel_gallery_and_branding.sql`
- [x] description ไทย/อังกฤษ ✅

#### Rooms
- [x] เพิ่มห้องเดี่ยว ✅
- [x] เพิ่มห้องแบบ bulk (เช่น 101-120) ✅
- [x] แก้เลขห้อง ✅
- [x] ชั้น (floor) ✅
- [x] สถานะห้อง ✅
  - [x] `available` ✅
  - [x] `occupied` ✅
  - [x] `dirty` ✅
  - [x] `cleaning` ✅
  - [x] `maintenance` ✅
  - [x] `blocked` ✅
- [x] block room ตามช่วงวัน ✅
- [x] room detail drawer ✅
- [ ] room timeline 🔄 — UI ต้องตรวจสอบ

#### Rates
- [x] rate plan ✅
- [x] refundable / non-refundable ✅
- [x] breakfast included ✅
- [ ] rate calendar 🔄 — schema มี แต่ UI calendar อาจยังไม่ครบ
- [x] weekday/weekend pricing ✅
- [x] seasonal pricing ✅
- [x] min stay / max stay ✅
- [ ] closed to arrival 🔄
- [ ] closed to departure 🔄

---

### 4. Reservations

#### Core booking
- [x] สร้าง booking ใหม่ ✅
- [x] เลือก guest เดิม / สร้าง guest ใหม่ ✅
- [x] เลือกวันที่ ✅
- [x] เลือก room type ✅
- [x] assign room ✅
- [x] คำนวณ nights ✅
- [x] คำนวณ total ✅
- [x] deposit ✅
- [x] balance ✅
- [x] special requests ✅
- [x] internal notes ✅

#### Calendar
- [x] calendar 14/30 วัน ✅
- [ ] drag & drop ย้ายห้อง 🔄
- [ ] drag resize วันพัก 🔄
- [x] conflict warning ✅
- [x] overbooking guard ✅ — pessimistic lock
- [x] filter by room type ✅
- [x] filter by status ✅

#### Booking actions
- [x] confirm booking ✅
- [x] check-in ✅
- [x] check-out ✅
- [x] cancel booking ✅
- [x] no-show ✅ — night audit cron
- [ ] extend stay 🔄
- [x] move room ✅
- [ ] split booking 🔄
- [ ] merge booking 🔄
- [x] group booking ✅ — `GroupBookingClient`
- [ ] booking timeline 🔄

---

### 5. Guest / CRM

- [x] guest profile ✅
- [x] stay history ✅
- [x] payment history ✅
- [x] message history ✅
- [x] preferences ✅
- [x] nationality ✅
- [x] passport/id card ✅
- [x] VIP flag ✅
- [x] blacklist flag ✅
- [x] loyalty points ✅
- [ ] merge duplicate guests 🔄
- [x] PDPA consent ✅
- [x] export guest data ✅ — `/api/guests/[id]/export`
- [x] delete/anonymize guest data ✅

---

### 6. Folio / Payment / Invoice

#### Folio
- [x] folio detail ✅
- [x] room charge auto post ✅
- [x] add manual charge ✅
- [x] minibar charge ✅
- [x] service charge ✅
- [x] discount ✅
- [x] tax calculation ✅
- [ ] split folio 🔄
- [ ] transfer charge 🔄
- [x] close folio ✅
- [x] lock after checkout ✅

#### Payment
- [x] cash payment ✅
- [x] bank transfer ✅
- [x] PromptPay ✅ — Omise 🔑 ต้องใส่ `OMISE_PUBLIC_KEY` + `OMISE_SECRET_KEY`
- [x] credit/debit card ✅ — Omise 🔑
- [x] partial payment ✅
- [x] refund ✅
- [x] payment receipt ✅
- [x] payment timeline ✅
- [x] payment status ✅
  - [x] `pending` ✅
  - [x] `completed` ✅
  - [x] `failed` ✅
  - [x] `refunded` ✅

#### Invoice
- [x] receipt ✅
- [x] tax invoice ✅
- [x] invoice PDF ✅
- [x] send invoice email ✅ — SendGrid 🔑 ต้องใส่ `SENDGRID_API_KEY`
- [x] regenerate invoice ✅
- [ ] void invoice 🔄
- [x] running invoice number ✅
- [x] VAT report ✅

---

### 7. Housekeeping / Maintenance

#### Housekeeping
- [x] kanban board ✅
- [x] mobile view ✅ — basic
- [x] auto create task after checkout ✅
- [x] assign housekeeper ✅
- [x] start cleaning ✅
- [x] complete cleaning ✅
- [x] inspection pass/fail ✅
- [x] room status sync ✅
- [ ] photo before/after 🔄 — schema มี แต่ UI upload ต้องตรวจ
- [x] notes ✅

#### Maintenance
- [x] create maintenance request ✅
- [x] assign technician ✅
- [x] priority ✅
- [x] due date ✅
- [x] status ✅
- [x] room block from maintenance ✅
- [x] resolution notes ✅
- [x] cost tracking ✅

---

### ✅ P1 Done Checklist (End-to-end flow)

- [ ] สมัครสมาชิก → สร้างโรงแรม
- [ ] เพิ่มประเภทห้อง → เพิ่มห้อง
- [ ] สร้าง booking → รับเงิน
- [ ] check-in → housekeeping
- [ ] check-out → ออก invoice

> ✅ P1 ถือว่าเสร็จเมื่อทำ flow ข้างบนได้ครบโดยไม่ error

---

---

## P2 — Booking + AI Inbox + OTA

> เป้าหมาย: ระบบช่วยหาเงิน ลดงาน admin และตอบลูกค้าไวกว่าเจ้าอื่น

---

### 1. Public Booking Engine

#### หน้าเว็บลูกค้า
- [x] `/booking/[hotelSlug]` ✅
- [x] landing hotel page ✅ — `/h/[slug]/`
- [x] gallery ✅
- [x] room list ✅
- [x] room detail ✅
- [x] amenities ✅
- [x] policy ✅
- [ ] map/contact 🔄 — ต้องฝัง Google Maps API
- [x] multi-language ✅
  - [x] th ✅
  - [x] en ✅
  - [ ] zh 🔄
  - [ ] ja 🔄

#### Search flow
- [x] check-in/check-out date picker ✅
- [x] guests count ✅
- [x] room count ✅
- [x] availability search ✅
- [x] price calculation ✅
- [x] rate plan selection ✅
- [x] add-ons ✅
  - [x] breakfast ✅
  - [x] airport pickup ✅
  - [x] late checkout ✅
  - [x] extra bed ✅

#### Checkout
- [x] guest info ✅
- [x] coupon/promo code ✅
- [x] deposit payment ✅ — 🔑 ต้องใส่ Omise keys
- [x] full payment ✅ — 🔑
- [x] booking confirmation ✅
- [x] email confirmation ✅ — 🔑 ต้องใส่ `SENDGRID_API_KEY`
- [ ] LINE confirmation 🔑 — ต้องใส่ `LINE_CHANNEL_ACCESS_TOKEN`
- [x] manage booking page ✅
- [x] cancel request ✅

#### UX
- [x] mobile-first ✅
- [x] sticky booking bar ✅
- [x] trust badges ✅
- [x] cancellation policy ชัด ✅
- [x] total price breakdown ✅
- [x] loading skeleton ✅
- [x] SEO ✅
- [x] OpenGraph image ✅

---

### 2. AI Unified Inbox

#### Core inbox
- [x] conversation detail route `/dashboard/inbox/[id]` ✅
- [x] guest profile sidebar ✅
- [x] reservation context sidebar ✅
- [x] assign staff ✅
- [x] assign department ✅
- [x] close/snooze/spam ✅
- [x] internal note ✅
- [x] tags ✅
- [x] priority ✅
- [ ] SLA timer (countdown UI) 🔄 — logic มีแต่ UI countdown ยังไม่ครบ

#### AI features — 🔑 ต้องใส่ `ANTHROPIC_API_KEY`
- [x] AI suggested reply ✅ — Claude API 🔑
- [x] AI translate inbound ✅ — 14 ภาษา 🔑
- [x] AI translate outbound ✅ — 🔑
- [x] AI confidence score ✅
- [x] AI human handoff ✅
- [x] AI summarize conversation ✅
- [x] AI detect sentiment ✅
- [x] AI detect intent ✅
  - [x] booking ✅
  - [x] complaint ✅
  - [x] payment ✅
  - [x] check-in ✅
  - [x] cancellation ✅
- [x] AI upsell suggestion ✅
- [x] AI auto-fill guest profile ✅
- [x] AI knowledge base RAG ✅

#### Templates
- [x] quick reply templates ✅
- [x] variable replacement ✅
  - [x] `guest_name` ✅
  - [x] `check_in_date` ✅
  - [x] `room_type` ✅
  - [x] `balance` ✅
- [x] template categories ✅
- [x] multi-language templates ✅

#### Channels
- [ ] LINE webhook production 🔑 — ต้องใส่ `LINE_CHANNEL_ACCESS_TOKEN` + `LINE_CHANNEL_SECRET`
- [ ] WhatsApp webhook production 🔑 — ต้องใส่ `WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_VERIFY_TOKEN`
- [ ] Email inbound/outbound 🔑 — ต้องใส่ `SENDGRID_API_KEY` + inbound parse webhook
- [ ] Facebook Messenger 🔑 — ต้องใส่ `FACEBOOK_PAGE_ACCESS_TOKEN`
- [ ] Instagram DM 🔑 — ต้องใส่ Facebook token (same platform)
- [ ] WeChat 🔑 — ต้องใส่ `WECHAT_APP_ID` + `WECHAT_APP_SECRET`
- [ ] Booking.com message 🔑 — ต้องใส่ `BOOKING_COM_API_TOKEN`
- [ ] Agoda message 🔑 — ต้องใส่ `AGODA_API_TOKEN`
- [ ] Airbnb message 🔑 — ต้องใส่ `AIRBNB_API_TOKEN`

---

### 3. Channel Manager / OTA

#### Connection
- [x] channel connection page ✅
- [ ] HotelRunner integration 🔄 — stub เท่านั้น ต้องทำ adapter
- [ ] Booking.com direct integration 🔑 — parser ✅ แต่ต้องใส่ `BOOKING_COM_API_TOKEN`
- [ ] Agoda integration 🔑 — parser ✅ แต่ต้องใส่ `AGODA_API_TOKEN`
- [ ] Airbnb integration 🔑 — stub ✅ แต่ต้องใส่ `AIRBNB_API_TOKEN`
- [ ] Expedia integration 🔑 — stub ✅ แต่ต้องใส่ `EXPEDIA_API_TOKEN`
- [x] credential encryption ✅
- [x] connection health status ✅

#### Mapping
- [x] room type mapping ✅
- [x] rate plan mapping ✅
- [x] external room id ✅
- [x] external rate id ✅
- [x] mapping validation ✅

#### Sync
- [x] push availability ✅ — 🔑 ต้องใส่ OTA keys
- [x] push rates ✅ — 🔑
- [x] push restrictions ✅ — 🔑
- [x] pull bookings ✅ — 🔑
- [ ] pull cancellations 🔄 — logic บางส่วน ต้องทำ webhook handler ครบ
- [ ] pull modifications 🔄
- [x] prevent duplicate bookings ✅ — idempotency key
- [x] conflict resolver ✅
- [x] manual sync ✅
- [ ] scheduled sync cron 🔄 — ต้องตั้ง cron job (`CRON_SECRET`)
- [x] sync log page ✅
- [x] retry failed sync ✅ — DLQ

#### OTA reconciliation
- [x] expected amount ✅
- [x] commission ✅
- [x] OTA paid amount ✅
- [x] variance detection ✅
- [x] matched/discrepancy/unpaid ✅
- [x] export CSV ✅

---

### 4. Automation Builder

#### Rules
- [x] when booking created ✅
- [x] when check-in tomorrow ✅
- [x] when payment pending ✅
- [x] when checkout completed ✅
- [x] when negative sentiment ✅
- [x] when room dirty ✅
- [x] when OTA sync failed ✅

#### Actions
- [x] send LINE 🔑 — ต้องใส่ LINE token
- [x] send email 🔑 — ต้องใส่ SendGrid key
- [x] create housekeeping task ✅
- [x] create payment reminder ✅
- [x] notify staff ✅
- [x] create invoice ✅
- [ ] ask for review 🔄
- [x] create upsell offer ✅

#### UI
- [x] simple rule builder ✅
- [x] enable/disable automation ✅
- [x] automation logs ✅
- [ ] test automation button 🔄

---

### 5. Marketing / Loyalty / Review

#### Loyalty
- [x] tiers ✅
- [x] earn points ✅
- [x] redeem points ✅
- [x] referral code ✅
- [x] birthday benefit ✅
- [x] VIP benefit ✅

#### Campaign
- [x] guest segmentation ✅
- [x] email campaign 🔑 — ต้องใส่ SendGrid key
- [x] LINE broadcast 🔑 — ต้องใส่ LINE token
- [ ] WhatsApp campaign 🔑 — ต้องใส่ WhatsApp token
- [x] abandoned booking recovery ✅ — cron job มีแล้ว 🔑 ต้องใส่ `CRON_SECRET`
- [x] repeat guest offer ✅

#### Review
- [ ] post-stay review request 🔄
- [ ] collect review 🔄
- [ ] AI response draft 🔑 — ต้องใส่ Anthropic key
- [ ] sentiment dashboard 🔄
- [ ] Google/Tripadvisor/OTA review tracking 🔄

---

### ✅ P2 Done Checklist

- [ ] ลูกค้าเข้าเว็บ → ค้นหาห้อง → จอง → จ่ายเงิน
- [ ] ได้ confirmation email/LINE
- [ ] โรงแรมเห็น booking ใน dashboard
- [ ] AI inbox ตอบลูกค้าได้
- [ ] OTA sync ไม่ชน

---

---

## P3 — Scale / SaaS Admin / Advanced Platform

---

### 1. SaaS Owner Panel

- [x] `/owner` (admin panel) ✅ — `/admin/`
- [x] list organizations ✅
- [x] list hotels ✅
- [x] tenant status ✅
- [x] trial status ✅
- [x] subscription plan ✅
- [x] active users ✅
- [x] monthly bookings ✅
- [x] monthly messages ✅
- [x] AI usage ✅
- [x] storage usage ✅

#### Admin actions
- [x] impersonate tenant ✅
- [x] suspend tenant ✅
- [x] reactivate tenant ✅
- [x] change plan ✅
- [x] extend trial ✅
- [x] view tenant errors ✅
- [x] view tenant audit logs ✅
- [x] feature flags per tenant ✅

#### SaaS analytics
- [x] MRR ✅
- [x] ARR ✅
- [x] churn ✅
- [x] trial conversion ✅
- [x] usage by plan ✅
- [x] AI cost by tenant ✅
- [x] top active hotels ✅
- [x] inactive trial warning ✅

---

### 2. Subscription / Plan Gating

#### Billing
- [x] subscription checkout ✅ — Stripe 🔑 ต้องใส่ `STRIPE_SECRET_KEY`
- [x] monthly/yearly billing ✅ — 🔑
- [x] invoices for SaaS customer ✅
- [x] failed payment handling ✅
- [x] upgrade/downgrade plan ✅
- [x] cancel subscription ✅
- [x] trial expire lock ✅ — cron job

#### Plan feature gating
- [x] Starter ✅
  - [x] rooms ✅
  - [x] reservations ✅
  - [x] basic invoice ✅
  - [x] LINE inbox 🔑
- [x] Standard ✅
  - [x] booking engine ✅
  - [x] AI inbox 🔑
  - [x] PromptPay 🔑
  - [x] housekeeping ✅
- [x] Pro ✅
  - [x] OTA sync 🔑
  - [x] automation ✅
  - [x] loyalty ✅
  - [x] advanced reports ✅
- [x] Enterprise ✅
  - [x] multi-property ✅
  - [x] custom domain 🔄
  - [x] white-label ✅
  - [x] API access ✅

---

### 3. Reports / Analytics / BI

#### Hotel reports
- [x] occupancy report ✅
- [x] ADR ✅
- [x] RevPAR ✅
- [x] revenue by source ✅
- [x] booking pace ✅
- [x] cancellation report ✅
- [x] no-show report ✅
- [x] payment report ✅
- [x] tax report ✅
- [x] housekeeping productivity ✅
- [x] staff performance ✅
- [x] guest nationality report ✅

#### AI insights — 🔑 ต้องใส่ `ANTHROPIC_API_KEY`
- [x] pricing recommendation ✅
- [x] demand forecast ✅
- [x] guest sentiment trend ✅
- [x] complaint summary ✅
- [x] upsell opportunity ✅
- [x] weekly owner summary ✅
- [x] night audit summary ✅

#### Export
- [x] CSV export ✅
- [x] PDF export ✅
- [ ] scheduled email report 🔄

---

### 4. Thai Compliance Advanced

#### TM30
- [x] auto detect foreign guests ✅
- [x] generate TM30 report ✅
- [x] submit status ✅
- [x] failed retry ✅
- [x] reminder ✅
- [x] export ✅

#### e-Tax
- [x] UBL XML ✅
- [ ] digital signature 🔑 — ต้องใส่ `ETAX_PROVIDER` credentials
- [ ] provider integration 🔑 — ต้องใส่ `ETAX_USERNAME` + `ETAX_PASSWORD`
- [ ] submit e-tax 🔑
- [x] response tracking ✅
- [x] resend/retry ✅
- [x] download XML/PDF ✅

#### Accounting
- [ ] FlowAccount integration 🔑 — ต้องใส่ `FLOWACCOUNT_API_KEY`
- [ ] PEAK integration 🔑 — ต้องใส่ `PEAK_API_KEY`
- [x] revenue journal ✅
- [x] payment journal ✅
- [x] tax filing summary ✅

---

### 5. F&B / Spa / Add-ons

#### F&B POS
- [x] outlets ✅
- [x] menu categories ✅
- [x] menu items ✅
- [x] table order ✅
- [x] room service ✅
- [x] kitchen status ✅ — basic KDS
- [x] room charge to folio ✅
- [x] split bill ✅
- [x] payment ✅

#### Spa
- [x] services ✅
- [x] therapists ✅
- [ ] therapist calendar 🔄 — ต้องทำ UI calendar
- [x] spa booking ✅
- [x] room charge ✅
- [x] guest preference ✅
- [x] package deal ✅

#### Add-ons
- [x] airport pickup ✅
- [x] breakfast ✅
- [x] late checkout ✅
- [x] extra bed ✅
- [x] tour package ✅
- [x] upsell in booking engine ✅
- [x] upsell in AI inbox ✅

---

### 6. Reliability / Security / DevOps

#### CI/CD
- [ ] GitHub Actions workflow 🔄 — ต้องสร้าง `.github/workflows/`
  - [ ] type-check 🔄
  - [ ] lint 🔄
  - [ ] build 🔄
  - [ ] migration check 🔄
  - [ ] smoke test 🔄
  - [ ] Playwright E2E 🔄

#### Monitoring
- [ ] Sentry 🔑 — ต้องใส่ `SENTRY_DSN` + `NEXT_PUBLIC_SENTRY_DSN` (SDK ติดตั้งแล้ว)
- [ ] uptime monitor 🔄 — ต้องตั้ง external monitor (Checkly / Better Uptime)
- [x] API latency tracking ✅ — `/api/health/`
- [x] webhook failure dashboard ✅
- [ ] cron failure alert 🔄 — ต้องใส่ `OPS_ALERT_WEBHOOK_URL`
- [ ] OTA sync alert 🔄
- [ ] AI cost alert 🔄

#### Queue / Worker
- [x] webhook queue ✅
- [x] AI queue ✅
- [x] OTA queue ✅
- [x] email queue ✅
- [x] retry queue ✅
- [x] dead-letter queue ✅

#### Security
- [x] env validation ✅
- [x] RLS audit ✅
- [x] webhook signature verification ✅ — HMAC-SHA256
- [x] rate limit all APIs ✅
- [x] CSRF-sensitive action review ✅
- [x] audit logs ✅
- [x] staff permission audit ✅
- [x] data export/delete ✅
- [ ] backup policy 🔄 — ต้องตั้ง Supabase backup schedule

---

### 7. Mobile / PWA / White-label

#### Mobile/PWA
- [x] PWA manifest ✅ — `public/manifest.json`
- [x] installable app ✅
- [x] offline fallback ✅ — service worker
- [ ] push notifications 🔑 — ต้องใส่ VAPID keys
- [x] mobile housekeeping ✅
- [ ] mobile check-in 🔄 — ต้องตรวจ mobile UI
- [x] mobile owner dashboard ✅ — basic

#### White-label
- [ ] custom domain per hotel 🔄 — ต้องตั้ง Vercel/Cloudflare wildcard DNS
- [x] hotel logo/theme ✅ — `/dashboard/branding/`
- [x] brand color ✅
- [x] email template branding ✅
- [x] booking engine branding ✅
- [x] invoice branding ✅

---

### ✅ P3 Done Checklist

- [ ] หลายโรงแรมใช้งานพร้อมกัน
- [ ] ระบบ subscription คิดเงินได้
- [ ] admin ดู tenant ได้
- [ ] monitoring แจ้งเตือนอัตโนมัติ
- [ ] OTA/AI/payment มี queue
- [ ] report ออกได้ครบ

---

---

## 🔑 Keys / API ที่ต้องใส่ (สรุปรวม)

> ไฟล์ที่ต้องแก้: `.env.local` (หรือ production env)

| Variable | ใช้ทำอะไร | Priority |
|----------|-----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Database | 🔴 P1 Critical |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Database auth | 🔴 P1 Critical |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side DB ops | 🔴 P1 Critical |
| `ANTHROPIC_API_KEY` | AI inbox, translation, insights | 🔴 P1 Critical |
| `NEXT_PUBLIC_APP_URL` | Absolute URLs | 🔴 P1 Critical |
| `OMISE_PUBLIC_KEY` | Payment (card, PromptPay) | 🟠 P1 Required |
| `OMISE_SECRET_KEY` | Payment server-side | 🟠 P1 Required |
| `SENDGRID_API_KEY` | Email confirmation, invoice | 🟠 P1 Required |
| `SENDGRID_FROM_EMAIL` | Email sender | 🟠 P1 Required |
| `CRON_SECRET` | Cron jobs (night audit, trial, abandoned) | 🟠 P1 Required |
| `STRIPE_SECRET_KEY` | SaaS subscription billing | 🟡 P2 |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook verify | 🟡 P2 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE messaging | 🟡 P2 |
| `LINE_CHANNEL_SECRET` | LINE webhook verify | 🟡 P2 |
| `WHATSAPP_ACCESS_TOKEN` | WhatsApp messaging | 🟡 P2 |
| `WHATSAPP_VERIFY_TOKEN` | WhatsApp webhook verify | 🟡 P2 |
| `BOOKING_COM_API_TOKEN` | Booking.com OTA sync | 🟡 P2 |
| `AGODA_API_TOKEN` | Agoda OTA sync | 🟡 P2 |
| `AIRBNB_API_TOKEN` | Airbnb OTA sync | 🟡 P2 |
| `EXPEDIA_API_TOKEN` | Expedia OTA sync | 🟡 P2 |
| `SENTRY_DSN` | Error tracking (SDK installed) | 🟡 P2 |
| `NEXT_PUBLIC_SENTRY_DSN` | Frontend error tracking | 🟡 P2 |
| `OPS_ALERT_WEBHOOK_URL` | Slack/Discord alerts | 🟡 P2 |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | FB Messenger / Instagram DM | 🔵 P3 |
| `WECHAT_APP_ID` | WeChat messaging | 🔵 P3 |
| `WECHAT_APP_SECRET` | WeChat auth | 🔵 P3 |
| `ETAX_PROVIDER` | e-Tax ไทย | 🔵 P3 |
| `ETAX_USERNAME` | e-Tax credentials | 🔵 P3 |
| `ETAX_PASSWORD` | e-Tax credentials | 🔵 P3 |
| `FLOWACCOUNT_API_KEY` | FlowAccount accounting | 🔵 P3 |
| `PEAK_API_KEY` | PEAK accounting | 🔵 P3 |

---

## 🔁 Items ที่ซ้ำกันในลิสต์ (Duplicates)

| Item | ซ้ำกับ | หมายเหตุ |
|------|--------|----------|
| "room images" (Room Types §3) | "photo before/after" (Housekeeping §7) | คนละ context ไม่ซ้ำจริง — room images = marketing photo, before/after = cleaning record |
| "send LINE" (Automation §4) | "LINE confirmation" (Booking Engine §2) | คนละ trigger ไม่ซ้ำ |
| "assign staff" (Inbox §2) | "assign housekeeper" (Housekeeping §7) | คนละ module |
| "notes" (Housekeeping) | "internal notes" (Reservations) | คนละ entity |
| "priority" (Maintenance §7) | "priority" (Inbox §2) | คนละ module |
| "status" (Maintenance) | "payment status" (Folio §6) | คนละ entity |
| "export CSV" (OTA §3) | "CSV export" (Reports §3) | 🔁 **ซ้ำจริง** — OTA export ควรใช้ component เดียวกับ Reports export |
| "guest segmentation" (Marketing §5) | "CRM" (Dashboard §2) | คนละ level — segmentation = filter, CRM = full profile |
| "AI upsell suggestion" (Inbox §2) | "upsell in AI inbox" (Add-ons §5) | 🔁 **ซ้ำจริง** — feature เดียวกัน reference 2 จาก 2 section |
| "Notification center" (Dashboard §2) | push notifications (Mobile §7) | คนละ channel — in-app vs push |

---

## 📊 สรุปสถานะ

| Phase | ✅ Done | 🔑 รอ Key | 🔄 ต้องโค้ด | รวม |
|-------|---------|-----------|------------|------|
| P1 Core | ~75% | ~10% | ~15% | ~100 items |
| P2 Booking+AI+OTA | ~60% | ~25% | ~15% | ~120 items |
| P3 Scale | ~70% | ~15% | ~15% | ~80 items |

**ถ้าใส่ Keys ครบ P1 Critical + Required → P1 flow ใช้งานได้จริงเลย**  
**ถ้าใส่ Keys P2 เพิ่ม → booking engine + LINE + OTA พร้อม pilot**
