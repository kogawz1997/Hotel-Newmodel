# Maitri PMS — Todo List (100 items)

**อัปเดต**: 2026-05-16  
**สถานะ**: Critical ครบ 8/8 ✅  

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
- [ ] **#9** Availability calendar — แสดง blocked/booked dates ก่อนกดค้นหา
- [ ] **#10** Suggest วันอื่น / ห้องอื่น เมื่อห้องเต็ม
- [ ] **#11** Multi-language booking engine (EN อย่างน้อย)
- [ ] **#12** แสดง cancellation policy + refund amount ก่อน confirm booking
- [ ] **#13** Waitlist — แขกฝาก email ไว้เมื่อเต็ม โรงแรมแจ้งเมื่อห้องว่าง

### Guest Portal
- [ ] **#14** Room service ordering จาก portal (menu + cart + ส่ง order ไปครัว)
- [ ] **#15** Loyalty points redemption UI (แลกส่วนลด / ของรางวัล)
- [ ] **#16** Chat กับโรงแรมใน portal ระหว่างเข้าพัก
- [ ] **#17** Housekeeping request จาก portal (ขอผ้าเพิ่ม, ทำความสะอาด)
- [ ] **#18** Spa booking จาก guest portal

### Staff Dashboard
- [ ] **#19** Pre-arrival email sent tracker — front desk เห็นว่าส่งแล้วหรือยัง
- [ ] **#20** Guest preference profile — bed type, floor, dietary, allergy บันทึกและแสดงทุก touchpoint
- [ ] **#21** Overbooking prevention warning — แจ้ง front desk เมื่อจองเกิน inventory
- [ ] **#22** Unified communication history per guest — email/LINE/WhatsApp รวมที่เดียว
- [ ] **#23** Revenue vs budget actual — (ตอนนี้มี "coming soon")
- [ ] **#24** Yield / dynamic pricing rules — ราคาขึ้น auto เมื่อ occupancy > threshold

### Email Templates ที่ขาด
- [ ] **#25** Pre-arrival email (3–7 วันก่อน check-in)
- [ ] **#26** Post-stay + cross-sell ("กลับมาเที่ยวอีกนะ")
- [ ] **#27** Invoice / tax receipt พร้อม PDF แนบ
- [ ] **#28** Payment failed — บัตรถูกปฏิเสธ ขอลองใหม่
- [ ] **#29** No-show notice
- [ ] **#30** Refund confirmation — คืนเงินสำเร็จ
- [ ] **#31** Daily / weekly summary report email ถึง owner

---

## 🟡 Medium — Polish & Completeness (43 items)

### UI Components (shared)
- [ ] **#32** DatePicker calendar widget — แทน native `<input type="date">`
- [ ] **#33** Reusable Table component — sort, filter, pagination สม่ำเสมอทุกหน้า
- [ ] **#34** Reusable Tabs component — ตอนนี้แต่ละหน้าทำเอง
- [ ] **#35** Pagination component — standard ทุก list page
- [ ] **#36** Copy button บน booking code / ข้อมูลสำคัญ
- [ ] **#37** Loading skeleton ให้ consistent ทุกหน้า
- [ ] **#38** Error messages เป็นภาษาไทยทุก page
- [ ] **#39** ARIA labels / accessibility บน interactive elements สำคัญ
- [ ] **#40** Dark mode toggle ใน settings

### Booking Engine
- [ ] **#41** Room video embed หรือ virtual tour
- [ ] **#42** Gallery lightbox fullscreen บนหน้า booking
- [ ] **#43** Google Maps บน checkout page
- [ ] **#44** Promo code UX ดีขึ้น — บอกชัดว่า invalid เพราะอะไร

### Guest Portal
- [ ] **#45** Download receipt PDF จาก booking history
- [ ] **#46** Hotel compendium / house rules page (content จริง)
- [ ] **#47** Pre-checkout briefing — แจ้งขั้นตอน check-out วันก่อนออก
- [ ] **#48** Lost & found report จากฝั่งแขก
- [ ] **#49** QR code fullscreen / print-friendly บนมือถือ
- [ ] **#50** Booking modification UI — เปลี่ยนวันเองได้โดยไม่ต้องโทร

### Housekeeping
- [ ] **#51** Before/after photo comparison UI
- [ ] **#52** Real-time push notification งานใหม่ (VAPID)
- [ ] **#53** Cleaning time tracking per room
- [ ] **#54** Auto-assign task — smart routing ตาม floor/zone
- [ ] **#55** Room amenity inventory — สบู่/ผ้า track ต่อห้อง

### Maintenance
- [ ] **#56** Vendor management — supplier contacts, ราคา
- [ ] **#57** Auto-reorder alert เมื่อ parts stock ต่ำ
- [ ] **#58** Equipment history per unit
- [ ] **#59** SLA tracking + escalation alert เมื่องานค้างนาน

### F&B / Spa / Concierge
- [ ] **#60** Dietary / allergy auto-alert ไปครัวเมื่อแขก order
- [ ] **#61** Table reservation สำหรับร้านอาหารในโรงแรม
- [ ] **#62** Inventory/recipe costing + stock alert
- [ ] **#63** Therapist performance dashboard (bookings, rating)
- [ ] **#64** Spa + room package bundling UI
- [ ] **#65** Activity/tour booking สำหรับ concierge จัดให้แขก
- [ ] **#66** Restaurant recommendation + จองให้แขกได้

### Owner / Manager / Accounting
- [ ] **#67** P&L statement — income vs expense monthly/annual
- [ ] **#68** Staff performance KPI — tasks done, attendance, rating
- [ ] **#69** Guest satisfaction trend chart ตามเวลา
- [ ] **#70** Channel performance comparison — Booking.com vs Agoda vs direct revenue
- [ ] **#71** Rate parity checker — ราคาเราใน OTA เท่ากันไหม
- [ ] **#72** Blackout date management — ปิดทุก channel พร้อมกัน 1 คลิก
- [ ] **#73** Accounting cash drawer close of day report
- [ ] **#74** Multi-currency reconciliation

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
| 🟠 High | 23 | 0 | 23 |
| 🟡 Medium | 43 | 0 | 43 |
| 🔵 SaaS Infra | 14 | 0 | 14 |
| 🟣 Nice-to-have | 12 | 0 | 12 |
| **รวม** | **100** | **8** | **92** |
