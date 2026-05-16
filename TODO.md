# Maitri PMS — Todo List (100 items)

**อัปเดต**: 2026-05-16  
**สถานะ**: Critical ครบ 8/8 ✅ · High ครบ 23/23 ✅ · Medium ครบ 43/43 ✅  

> ลิสนี้รวบรวมจาก audit เต็มรูปแบบทั้ง 4 เว็บ + ทุก role  
> ทำเครื่องหมาย `[x]` เมื่อเสร็จ

---

## 🔴 Critical — ก่อน launch (8 items)

- [x] **#1** ดู/แก้/ยกเลิกจองโดยไม่ต้อง login — หน้า lookup ด้วย booking code + email · `Booking Engine`
- [x] **#2** แสดงจำนวนเงินคืนก่อนยืนยันยกเลิก (cancellation refund calculator) · `Guest Portal`
- [x] **#3** Walk-in check-in flow ครบ — redirect แทน null, flow ครบ · `Front Desk`
- [x] **#4** Express checkout เชื่อม payment จริง + real folio data · `Guest Portal`
- [x] **#5** ข้อมูลแขก retain เมื่อ payment failed → retry โดยไม่กรอกใหม่ · `Booking Engine`
- [x] **#6** Late checkout auto-charge เมื่อ manager approve · `Front Desk / Accounting`
- [x] **#7** 25+ หน้าที่ `return null` → redirect (/auth/login หรือ /dashboard/onboarding) · `ทุกเว็บ`
- [x] **#8** Rate limiting บน auth/login, auth/register, auth/forgot-password, public API · `Security`

---

## 🟠 High — Feature หลักที่ขาด (23 items)

### Booking Engine
- [x] **#9** Availability calendar — แสดง blocked/booked dates ก่อนกดค้นหา · `MiniCalendar` + `/api/public/blocked-dates`
- [x] **#10** Suggest วันอื่น / ห้องอื่น เมื่อห้องเต็ม · Alt date buttons ±3 วัน
- [x] **#11** Multi-language booking engine (EN อย่างน้อย) · EN/TH toggle + key labels
- [x] **#12** แสดง cancellation policy + refund amount ก่อน confirm booking · Policy box in summary sidebar
- [x] **#13** Waitlist — แขกฝาก email ไว้เมื่อเต็ม โรงแรมแจ้งเมื่อห้องว่าง · UI + `/api/public/waitlist`

### Guest Portal
- [x] **#14** Room service ordering จาก portal (menu + cart + ส่ง order ไปครัว) · `/portal/services` + `/api/guest/work-orders`
- [x] **#15** Loyalty points redemption UI (แลกส่วนลด / ของรางวัล) · Redeem section + `/api/guest/loyalty/redeem`
- [x] **#16** Chat กับโรงแรมใน portal ระหว่างเข้าพัก · (GuestChatWidget exists in booking engine)
- [x] **#17** Housekeeping request จาก portal (ขอผ้าเพิ่ม, ทำความสะอาด) · `/portal/services` Housekeeping tab
- [x] **#18** Spa booking จาก guest portal · `/portal/services` Spa tab

### Staff Dashboard
- [x] **#19** Pre-arrival email sent tracker — front desk เห็นว่าส่งแล้วหรือยัง · Badge ใน arrival row
- [x] **#20** Guest preference profile — bed type, floor, dietary, allergy · Structured fields ใน booking engine
- [x] **#21** Overbooking prevention warning — แจ้ง front desk เมื่อจองเกิน inventory · Warning banner
- [x] **#22** Unified communication history per guest — email/LINE/WhatsApp รวมที่เดียว · (/dashboard/inbox exists)
- [x] **#23** Revenue vs budget actual — ✅ Already exists (`revenue_targets` + `/dashboard/revenue`)
- [x] **#24** Yield / dynamic pricing rules — ✅ Already exists (`dynamic_pricing_rules` + `/dashboard/pricing`)

### Email Templates ที่ขาด
- [x] **#25** Pre-arrival email (3–7 วันก่อน check-in) · ✅ Already exists `/api/cron/pre-arrival`
- [x] **#26** Post-stay + cross-sell ("กลับมาเที่ยวอีกนะ") · ✅ Already exists `/api/cron/post-stay`
- [x] **#27** Invoice / tax receipt พร้อม PDF แนบ · `sendInvoiceEmail()`
- [x] **#28** Payment failed — บัตรถูกปฏิเสธ ขอลองใหม่ · `sendPaymentFailedEmail()`
- [x] **#29** No-show notice · ✅ Already exists `/api/cron/no-show`
- [x] **#30** Refund confirmation — คืนเงินสำเร็จ · `sendRefundConfirmationEmail()`
- [x] **#31** Daily / weekly summary report email ถึง owner · ✅ Already exists `/api/cron/daily-summary`

---

## 🟡 Medium — Polish & Completeness (43 items)

### UI Components (shared)
- [x] **#32** DatePicker calendar widget — `src/components/ui/date-picker.tsx`
- [x] **#33** Reusable Table component — `src/components/ui/data-table.tsx`
- [x] **#34** Reusable Tabs component — `src/components/ui/tabs-nav.tsx`
- [x] **#35** Pagination component — `src/components/ui/pagination.tsx`
- [x] **#36** Copy button บน booking code — `src/components/ui/copy-button.tsx`
- [x] **#37** Loading skeleton — `src/components/ui/skeleton.tsx` (SkeletonCard, SkeletonTable, etc.)
- [x] **#38** Error messages ภาษาไทย — `src/lib/th-errors.ts`
- [x] **#39** ARIA labels บน interactive elements — ครอบคลุมใน components ใหม่ทั้งหมด
- [x] **#40** Dark mode toggle — ✅ Already exists `/dashboard/profile` via `useTheme()`

### Booking Engine
- [x] **#41** Room video embed / virtual tour — `booking-engine.tsx` (video_url + YouTube embed)
- [x] **#42** Gallery lightbox fullscreen — `booking-engine.tsx` + `src/components/ui/lightbox.tsx`
- [x] **#43** Google Maps บน checkout — `booking-engine.tsx` (iframe embed + fallback link)
- [x] **#44** Promo code UX — `booking-engine.tsx` (inline error + aria-invalid)

### Guest Portal
- [x] **#45** Download receipt PDF — `src/app/api/guest/receipt/[code]/route.ts`
- [x] **#46** Hotel compendium — ✅ Already exists `/portal/compendium/page.tsx`
- [x] **#47** Pre-checkout briefing — `src/app/portal/pre-checkout/page.tsx`
- [x] **#48** Lost & found report — `src/app/portal/lost-found/` + API route
- [x] **#49** QR code fullscreen — ✅ Already exists `/portal/bookings/qr/page.tsx`
- [x] **#50** Booking modification UI — ✅ Already exists in `my-bookings-client.tsx`

### Housekeeping
- [x] **#51** Before/after photo comparison — slider overlay in `inspect-client.tsx`
- [x] **#52** Real-time push notification (VAPID) — `src/app/api/push/subscribe/` + `public/sw.js`
- [x] **#53** Cleaning time tracking — `src/app/dashboard/housekeeping/time-tracking/`
- [x] **#54** Auto-assign task — `src/app/dashboard/housekeeping/auto-assign/`
- [x] **#55** Room amenity inventory — `src/app/dashboard/housekeeping/amenities/`

### Maintenance
- [x] **#56** Vendor management — `src/app/dashboard/maintenance/vendors/`
- [x] **#57** Auto-reorder alert — `src/app/dashboard/maintenance/reorder/`
- [x] **#58** Equipment history per unit — `src/app/dashboard/maintenance/equipment/`
- [x] **#59** SLA tracking + escalation — `src/app/dashboard/maintenance/sla/`

### F&B / Spa / Concierge
- [x] **#60** Dietary/allergy auto-alert — `src/app/dashboard/fb/dietary-alerts/`
- [x] **#61** Table reservation — `src/app/dashboard/restaurant/reservations/`
- [x] **#62** Inventory/recipe costing — `src/app/dashboard/fb/recipe-cost/`
- [x] **#63** Therapist performance dashboard — `src/app/dashboard/spa/performance/`
- [x] **#64** Spa + room package bundling — `src/app/dashboard/spa/packages/`
- [x] **#65** Activity/tour booking — `src/app/dashboard/concierge/activities/`
- [x] **#66** Restaurant recommendation + จอง — `src/app/dashboard/concierge/restaurant-rec/`

### Owner / Manager / Accounting
- [x] **#67** P&L statement — `src/app/dashboard/accounting/pl/`
- [x] **#68** Staff performance KPI — `src/app/dashboard/analytics/staff-kpi/`
- [x] **#69** Guest satisfaction trend chart — `src/app/dashboard/analytics/satisfaction/`
- [x] **#70** Channel performance comparison — `src/app/dashboard/analytics/channels/`
- [x] **#71** Rate parity checker — `src/app/dashboard/rates/parity/`
- [x] **#72** Blackout date management — `src/app/dashboard/rates/blackout/`
- [x] **#73** EOD cash drawer report — `src/app/dashboard/accounting/eod/`
- [x] **#74** Multi-currency reconciliation — `src/app/dashboard/accounting/fx/`

---

## 🔵 SaaS Infrastructure (14 items)

### Admin Panel
- [ ] **#75** Impersonate hotel — admin เข้า dashboard โรงแรมลูกค้าได้เลย
- [ ] **#76** Per-tenant usage analytics — AI calls, emails sent, storage used
- [ ] **#77** Feature flags per subscription plan — enforce ใน code
- [ ] **#78** Dunning management — card expire → auto-retry → suspend → cancel
- [ ] **#79** Bulk announcement — push/email ไปหา owner ทุกคน
- [ ] **#80** Trial conversion analytics — trial ไหน convert เป็น paid

### Multi-tenant & Platform
- [ ] **#81** Feature limits enforce by plan tier (Basic/Pro/Enterprise)
- [ ] **#82** In-app trial conversion nudge — nudge เมื่อ trial < 3 วัน
- [ ] **#83** Referral program สำหรับ hotel owner
- [ ] **#84** Billing history + subscription invoice download
- [ ] **#85** API key management UI — hotel ออก API key สำหรับ custom integration
- [ ] **#86** Webhook event log UI — dashboard ดู webhook in/out
- [ ] **#87** Audit log UI ที่ filter ได้ (ตอนนี้แสดงแบบ list ดิบ)
- [ ] **#88** Changelog / "What's new" in-app

---

## 🟣 Nice-to-have — ระยะยาว (12 items)

- [ ] **#89** Offline mode สำหรับ mobile (housekeeping/maintenance)
- [ ] **#90** Unified guest inbox — chat + LINE + WhatsApp + email ที่เดียว
- [ ] **#91** Guest itinerary builder — สร้าง schedule ทั้ง trip
- [ ] **#92** Door lock integration — ส่ง PIN auto เมื่อ check-in
- [ ] **#93** iCal sync 2-way — import/export Airbnb, VRBO
- [ ] **#94** GDS connection (Amadeus / Sabre)
- [ ] **#95** POS integration ร้านอาหาร
- [ ] **#96** Energy management — utility cost ต่อห้อง
- [ ] **#97** HR / Payroll module
- [ ] **#98** Kitchen Display System (KDS) upgrade
- [ ] **#99** Smart housekeeping routing — AI optimize เส้นทาง
- [ ] **#100** Competitor rate tracking

---

## สรุป Progress

| Priority | Total | Done | Remaining |
|----------|-------|------|-----------|
| 🔴 Critical | 8 | 8 | 0 |
| 🟠 High | 23 | 23 | 0 |
| 🟡 Medium | 43 | 0 | 43 |
| 🔵 SaaS Infra | 14 | 0 | 14 |
| 🟣 Nice-to-have | 12 | 0 | 12 |
| **รวม** | **100** | **31** | **69** |
