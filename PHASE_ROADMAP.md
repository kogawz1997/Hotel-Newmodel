# FULL PHASE ROADMAP WITH TASK TRACKING

## TASK STATUS RULES
- [ ] ยังไม่เริ่ม
- [-] กำลังทำ
- [x] เสร็จแล้ว

## IMPORTANT
- ทุก task ต้องอัปเดตสถานะทันทีเมื่อทำเสร็จ
- ทุก PR/commit ควรอัปเดต checklist
- ถ้ามี blocker ให้ระบุ note ใต้ task
- ห้าม mark done ถ้ายังไม่ผ่าน production verification

---

# Hotel System — Complete Implementation Roadmap v2
> เปรียบเทียบกับ target spec เต็มรูปแบบ: Hotel OS + SaaS Platform  
> Branch: `claude/audit-consolidate-docs-mj9Dt`  
> อัพเดต: 2026-05-14

---

## GAP ANALYSIS — สิ่งที่มีอยู่แล้ว vs ที่ยังขาด

### ✅ มีอยู่แล้ว
| ระบบ | ไฟล์ | ระดับความสมบูรณ์ |
|---|---|---|
| Auth / Login | `src/app/auth/` | ✅ เต็ม |
| Reservations (basic) | `src/app/dashboard/reservations/` | ⚠️ ขาด: group booking, OTA queue, waitlist |
| Rooms | `src/app/dashboard/rooms/` | ⚠️ ขาด: room move, block, upgrade flow |
| Guests | `src/app/dashboard/guests/` | ⚠️ ขาด: 360 profile, folio, loyalty |
| Front Desk (basic) | `src/app/dashboard/front-desk/` | ⚠️ ขาด: keycard, deposit, cashier |
| Housekeeping (basic) | `src/app/dashboard/housekeeping/` | ⚠️ ขาด: inspector, minibar, photo, laundry |
| Maintenance (basic) | `src/app/dashboard/maintenance/` | ⚠️ ขาด: parts, before/after photo, technician view |
| Concierge (full) | `src/app/dashboard/concierge/` | ⚠️ ขาด: bellboy tasks, transport, luggage |
| Security (full) | `src/app/dashboard/security/` | ⚠️ ขาด: patrol checklist, emergency alerts |
| Staff Profile (5 tabs) | `src/app/dashboard/profile/` | ✅ เต็ม |
| Role-adaptive Dashboard | `src/app/dashboard/page.tsx` | ⚠️ ขาด: GM/OpsManager/Owner views |
| DB: staff_profile_extended | `supabase/migrations/20260514000000` | ✅ เต็ม |
| DB: department_work_tables | `supabase/migrations/20260514100000` | ✅ เต็ม |

### ❌ ยังขาดทั้งหมด (Hotel OS)
- [ ] GM Command Center, Operations Manager view, Owner Dashboard with AI summaries
- [ ] Reservation Agent role + full booking module
- [ ] Chat Admin / Omnichannel Inbox with AI replies, SLA timer, translations
- [ ] Room Inspector app, Housekeeper mobile view
- [ ] Technician mobile view, parts tracking
- [ ] Kitchen Queue / KDS
- [ ] Room Service Delivery app
- [ ] Restaurant POS (table orders, room charge, split bill)
- [ ] Bellboy / Porter tasks
- [ ] Transport Staff app
- [ ] Revenue Manager tools (competitor pricing, dynamic pricing, OTA performance)
- [ ] Marketing tools (campaigns, abandoned bookings, LINE campaigns)
- [ ] Accounting OS (folio, cashier close, tax invoices, reconciliation)
- [ ] Night Audit full flow
- [ ] Spa full (treatment rooms, therapist assignment)
- [ ] HR full (onboarding, training mode, payroll)
- [ ] IT Support tickets

### ❌ ยังขาดทั้งหมด (SaaS Platform — app.maitriapp.com/owner)
- [ ] Platform Owner Control Center (MRR, churn, AI usage, webhook failures)
- [ ] Billing Admin (failed payments, subscription lifecycle, refunds, credits)
- [ ] Support Admin (impersonation, diagnostics, onboarding)
- [ ] Platform Ops Admin (uptime, queue, WebSocket health, OTA health)
- [ ] Security Admin (access logs, session revocation, API abuse)
- [ ] Sales Admin CRM (hotel leads, demos, trial tracking, onboarding pipeline)
- [ ] Product Admin (feature flags, A/B testing, module toggles)
- [ ] Developer / Engineering Admin (logs, deployments, webhook replay)

---

## DATABASE MIGRATIONS — COMPLETE

### ✅ Already Done
```
20260514000000_staff_profile_extended.sql
20260514100000_department_work_tables.sql
```

### Phase 1 Migrations
```
20260601000000_attendance_shifts.sql
  → attendance_records, shifts, shift_assignments, staff_availability

20260601100000_work_orders.sql
  → work_orders (type, priority, status, room_no, assigned_to, queue_pos, auto_routed)
  → task_assignments (work_order_id, staff_id, assigned_at, completed_at)
  → task_photos (task_id, photo_url, type: before/after/proof)

20260601200000_messaging.sql
  → conversations (update: platform_thread_id, assigned_to, sla_deadline, ai_suggested_reply)
  → messages (conversation_id, sender_type, content, platform_msg_id, translated_content, read_at)
  → channel_integrations (hotel_id, platform, credentials JSONB, enabled, webhook_url)
  → canned_responses (hotel_id, title, body, category, lang)

20260601300000_leave_documents.sql
  → leave_requests, documents, internal_requests, announcements

20260601400000_roles_expanded.sql
  → 35 roles (see full list below)
```

### Phase 2 Migrations
```
20260701000000_hr_module.sql
  → employees (extended profile), payroll_periods, payroll_items
  → performance_reviews, training_records, onboarding_tasks

20260701100000_accounting_full.sql
  → accounts (chart of accounts), journal_entries, expense_categories
  → expense_items (receipt_url, approved_by), revenue_summary
  → folios (reservation_id, items JSONB, total, status)
  → cashier_sessions (staff_id, opened_at, closed_at, opening_balance, closing_balance)
  → tax_invoices (folio_id, tax_id, issued_at, amount, tax_amount)

20260701200000_housekeeping_full.sql
  → room_cleaning_tasks (update: photo_urls[], minibar_items JSONB, inspector_id, inspection_score)
  → linen_inventory, lost_found
  → minibar_templates (room_type_id, items JSONB)
  → laundry_batches (collected_at, returned_at, items_count, assigned_to)

20260701300000_engineering_full.sql
  → maintenance_requests (update: before_photos[], after_photos[], parts_used JSONB)
  → preventive_maintenance, equipment_log, equipment_inventory
  → parts_inventory (name, quantity, unit, cost, min_stock)

20260701400000_fnb_full.sql
  → menu_items, food_orders (update: room_service / dine_in), kitchen_queue
  → spa_services, spa_bookings (update: treatment_room_id, notes)
  → restaurant_tables (outlet_id, table_no, capacity, status)
  → restaurant_orders (table_id, items JSONB, total, status, server_id)

20260701500000_purchasing.sql
  → suppliers, purchase_orders, inventory_items, stock_transactions

20260701600000_transport_bellboy.sql
  → transport_tasks (type: airport_pickup/dropoff/tour, guest_id, vehicle, driver_id, pickup_time, status)
  → luggage_tasks (type: pickup/delivery/storage, room_no, count, notes, assigned_to, completed_at)

20260701700000_revenue_marketing.sql
  → rate_plans, price_overrides, occupancy_forecast, channel_rates
  → leads (hotel-level, not platform), promo_codes
  → marketing_campaigns (hotel_id, type, channel, audience_segment, stats JSONB)
  → abandoned_bookings (guest_email, room_type, dates, last_step, recovery_sent_at)

20260701800000_it_support.sql
  → support_tickets_internal (hotel_id, requester_id, category, description, status, resolved_by)
  → device_registry (hotel_id, name, type, location, status, last_ping)
```

### Phase 3 Migrations (Platform / SaaS)
```
20260801000000_platform_core.sql
  → organizations (expand: subscription_plan, seats, features JSONB, trial_ends_at, suspended_at)
  → billing_subscriptions (org_id, plan, status, current_period_start/end, stripe_id)
  → billing_invoices (org_id, amount, status, due_date, paid_at, pdf_url)
  → billing_credits (org_id, amount, reason, expires_at)
  → platform_addons (org_id, addon_type, quantity, price)

20260801100000_platform_ops.sql
  → audit_logs (global: org_id, hotel_id, user_id, action, resource, ip, details JSONB)
  → system_health_log (service, status, latency_ms, checked_at)
  → webhook_events (hotel_id, platform, event_type, payload JSONB, status, retry_count)
  → feature_flags (key, enabled, rollout_pct, target_orgs[], created_by)
  → ab_tests (name, variants JSONB, start_date, end_date, results JSONB)

20260801200000_platform_sales.sql
  → platform_leads (company, contact_name, email, phone, source, stage, value, notes, owner_id)
  → demo_sessions (lead_id, scheduled_at, demo_url, status, notes)
  → platform_contracts (org_id, plan, start_date, end_date, committed_seats, price)

20260801300000_night_audit.sql
  → night_audit_runs, night_audit_items, no_show_log

20260801400000_crm_loyalty.sql
  → loyalty_members, loyalty_transactions, crm_segments, email_campaigns
```

---

## COMPLETE ROLE LIST (35 Roles)

### Hotel OS Roles
```typescript
// OWNERSHIP / MANAGEMENT
'hotel_owner'       // เจ้าของโรงแรม — full access + financials
'general_manager'   // GM — command center, escalations, override
'operations_manager' // Ops — workload, dispatch, dept reports

// FRONT OF HOUSE
'front_office_manager' // Front Office Mgr — cashier overview, upgrades
'front_desk'        // Receptionist — check-in/out, payment, keycard
'reservation_agent' // Booking agent — OTA queue, rate management
'night_auditor'     // Night shift — audit, close day, no-shows

// COMMUNICATIONS
'chat_admin'        // Omnichannel inbox — AI replies, SLA, routing
'guest_relations'   // Guest experience — complaints, VIP care

// HOUSEKEEPING
'housekeeping_manager' // HK Manager — floor assignment, SLA, inspection queue
'housekeeper'       // Cleaner — my tasks, photos, minibar, lost & found
'room_inspector'    // Inspector — approve/reject rooms, quality score

// ENGINEERING
'maintenance_manager' // Maint Mgr — repair board, PM schedule, parts
'technician'        // Tech staff — claim repair, photos, parts log

// F&B
'fnb_manager'       // F&B Manager — menu, staff, revenue
'kitchen_staff'     // Cook — KDS queue, allergy notes, stock alerts
'room_service_staff' // Delivery — delivery queue, collect payment
'restaurant_staff'  // Server — POS, table orders, room charge

// GUEST SERVICES
'concierge'         // Concierge — transport, tours, VIP tasks
'bellboy'           // Porter — luggage, escort, airport pickup
'transport_driver'  // Driver — pickup queue, route, confirm

// REVENUE & MARKETING
'revenue_manager'   // Revenue — rate plans, OTA, dynamic pricing
'marketing_staff'   // Marketing — campaigns, coupons, LINE

// BACK OF HOUSE
'accounting_manager' // Accounting Mgr — full accounting OS
'accounting_staff'  // Cashier — folio, collect, cashier close
'purchasing_manager' // Purchasing — PO approve, supplier mgmt
'purchasing_staff'  // Buyer — create PO, receive goods, stock

// HR
'hr_manager'        // HR Mgr — payroll, performance, onboarding
'hr_staff'          // HR Staff — attendance, leave approve, records

// SPA
'spa_manager'       // Spa Mgr — bookings, services, revenue
'spa_staff'         // Therapist — my bookings, treatment rooms

// SECURITY
'security_manager'  // Security Mgr — incident reports, staff
'security_staff'    // Guard — patrol log, visitor, incident

// IT
'it_admin'          // IT Admin — integrations, system settings
'it_support'        // IT Support — device tickets, printer, Wi-Fi
```

### SaaS Platform Roles (app.maitriapp.com/owner)
```typescript
'platform_owner'    // คุณ — all tenants, MRR, feature flags, impersonation
'billing_admin'     // Billing — invoices, failed payments, refunds
'support_admin'     // Support — tickets, impersonation, diagnostics
'platform_ops'      // Ops — uptime, queue, WebSocket, OTA health
'security_admin'    // Security — audit logs, session revoke, abuse
'sales_admin'       // Sales — leads, demos, trials, onboarding
'product_admin'     // Product — feature flags, A/B tests, rollout
'dev_admin'         // Engineering — logs, deployments, webhook replay
```

---

## PHASE 1 — Core Daily Operations
**ระยะเวลา:** 4–6 สัปดาห์  
**เป้าหมาย:** ทุก role เข้าระบบได้และทำงานพื้นฐานได้

---

### 1.1 Role-Adaptive Dashboard (ขยายจากที่มี)

**ไฟล์ที่ต้องแก้:** `src/app/dashboard/page.tsx`

| Role Group | สิ่งที่แสดง |
|---|---|
| `hotel_owner` | Revenue summary, Occupancy, ADR/RevPAR, Staff performance, AI summaries widget |
| `general_manager` | Live ops, Unresolved requests, VIP arrivals, Incidents, Staff online count |
| `operations_manager` | All active tasks, Dept workload bars, Shift coverage, Bottleneck alerts |
| `front_office_manager` | Arrivals/departures, Check-in queue, VIP list, Cashier overview |
| `front_desk` | Check-in/out queue, Room assignment, Today's requests |
| `reservation_agent` | Booking calendar, OTA queue, Availability grid |
| `chat_admin` | Unread by platform, SLA breaches, Unassigned conversations |
| `housekeeping_manager` | Room board by floor, Staff assignment, Inspection queue |
| `housekeeper` | My tasks (nearby rooms), Next room, Supply requests |
| `room_inspector` | Rooms awaiting inspection, Rejected count |
| `maintenance_manager` | Repair board, Emergency issues, Blocked rooms |
| `technician` | My repairs, Claim task, Parts needed |
| `kitchen_staff` | KDS queue, Preparing, Ready to serve |
| `room_service_staff` | Delivery queue, In transit |
| `restaurant_staff` | My tables, Open orders |
| `concierge` | Active requests, Today's VIP arrivals |
| `bellboy` | Luggage pickup queue, Delivery queue |
| `transport_driver` | Today's pickups, Route status |
| `revenue_manager` | ADR, RevPAR, Occupancy, Rate recommendations |
| `marketing_staff` | Campaign stats, Active promos |
| `accounting_manager` | Daily P&L, Outstanding folios, Cashier status |
| `accounting_staff` | Open folios, Pending payments |
| `security_manager` | Incidents today, Patrol status |
| `security_staff` | Patrol checklist, Visitor log |
| `spa_manager` | Today's bookings, Therapist schedule |
| `spa_staff` | My bookings, Treatment rooms |
| `hr_manager` | Staff online, Leave pending, Payroll status |
| `it_admin` | System health, Integration status |
| `it_support` | Open tickets, Device alerts |

---

### 1.2 Attendance & Shift System
*(รายละเอียดเหมือนเดิม — ครบอยู่แล้ว)*

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/attendance/` | ❌ สร้างใหม่ |
| `src/app/dashboard/shift-management/` | ❌ สร้างใหม่ |
| `src/app/api/attendance/clock/route.ts` | ❌ สร้างใหม่ |
| `src/app/api/shifts/` | ❌ สร้างใหม่ |

---

### 1.3 Task Auto-Router + Work Order System

| ไฟล์ | สถานะ |
|---|---|
| `src/lib/task-router.ts` | ❌ สร้างใหม่ |
| `src/app/api/work-orders/route.ts` | ❌ สร้างใหม่ |
| `src/app/api/work-orders/[id]/route.ts` | ❌ สร้างใหม่ |
| `src/app/dashboard/work-orders/page.tsx` | ❌ สร้างใหม่ |
| `src/app/dashboard/my-tasks/page.tsx` | ❌ สร้างใหม่ (housekeeper/technician/bellboy view) |
| `src/components/tasks/task-card.tsx` | ❌ สร้างใหม่ |
| `src/components/tasks/photo-upload.tsx` | ❌ สร้างใหม่ (before/after photos) |

**Photo Upload Flow:** พนักงานอัพโหลดรูป → Supabase Storage → URL บันทึกใน `task_photos`

---

### 1.4 Omnichannel Inbox — Chat Admin

**หน้าหลัก:** `src/app/dashboard/inbox/`

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/inbox/page.tsx` | Server: ดึง conversations ทุก platform |
| `src/app/dashboard/inbox/inbox-client.tsx` | Unified inbox UI |
| `src/app/dashboard/inbox/[id]/page.tsx` | Single conversation + guest profile |
| `src/app/api/inbox/messages/route.ts` | GET/POST messages |
| `src/app/api/inbox/assign/route.ts` | Assign to dept/staff |
| `src/app/api/inbox/webhooks/line/route.ts` | LINE webhook |
| `src/app/api/inbox/webhooks/whatsapp/route.ts` | WhatsApp Business webhook |
| `src/app/api/inbox/webhooks/facebook/route.ts` | Facebook Messenger webhook |
| `src/app/api/inbox/ai-reply/route.ts` | **POST: AI suggested reply** |

**Inbox Client Features:**
- [ ] Platform filter: All / LINE / WhatsApp / Facebook / Website Chat / Room QR / OTA / Email
- [ ] SLA response timer (ไฟเขียว/เหลือง/แดง ตามเวลาที่เหลือ)
- [ ] AI reply suggestion button (เรียก Claude API → แนะนำข้อความตอบ)
- [ ] Auto-translation toggle (แปลเป็นภาษาที่พนักงานเข้าใจ)
- [ ] Guest timeline sidebar: ประวัติการเข้าพัก, requests, เรื่องร้องเรียน
- [ ] Booking context: หากแชทจาก OTA → แสดง reservation ที่เชื่อมโยง
- [ ] Convert to request: ส่งงานไปยังแผนกที่รับผิดชอบ
- [ ] Follow-up reminder: ตั้งเวลาเตือนติดตาม
- [ ] Canned responses: ข้อความสำเร็จรูปแยกตาม category

---

### 1.5 Leave Management
*(รายละเอียดเหมือน roadmap เดิม)*

---

### 1.6 Document & Request Workflow
*(รายละเอียดเหมือน roadmap เดิม)*

---

### 1.7 Announcements
*(รายละเอียดเหมือน roadmap เดิม)*

---

### 1.8 Manager Live Board (GM Command Center)

**สำหรับ:** `general_manager`, `operations_manager`, `hotel_owner`

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/live-board/page.tsx` | Server component |
| `src/app/dashboard/live-board/live-board-client.tsx` | Real-time via Supabase Realtime |
| `src/components/live/occupancy-map.tsx` | แผนผังห้อง real-time (by floor) |
| `src/components/live/staff-status-grid.tsx` | Grid: ออนไลน์/ติดงาน/ออฟไลน์ |
| `src/components/live/task-queue-widget.tsx` | คิวงานแต่ละแผนก |
| `src/components/live/alerts-feed.tsx` | Feed: incidents + SLA breaches + urgent requests |
| `src/components/live/vip-arrivals-widget.tsx` | VIP ที่จะมาถึงวันนี้ |
| `src/components/live/emergency-alert-bar.tsx` | Emergency alerts (แสดงด้านบนสุด) |

**GM Controls (เพิ่มใน live-board-client.tsx):**
- [ ] Reassign task (drag & drop หรือ modal)
- [ ] Override SLA (เพิ่มเวลา + หมายเหตุ)
- [ ] Approve room block / upgrade / late checkout / discount
- [ ] Broadcast internal announcement

---

## PHASE 2 — Department Modules (Full)
**ระยะเวลา:** 8–10 สัปดาห์  
**เป้าหมาย:** ทุกแผนกมีหน้าทำงานครบ + mobile-friendly

---

### 2.1 Front Desk / Reservation (Full)

#### Reservation Agent Module
| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/reservations/reservations-client.tsx` | **ปรับปรุง:** เพิ่ม tabs |
| Tab: Booking Calendar | ปฏิทิน availability (color by room type) |
| Tab: OTA Queue | incoming bookings จาก Booking.com/Agoda รอ confirm |
| Tab: Group Booking | สร้าง group block + allotment |
| Tab: Rate Management | rate plans, promo codes, restrictions |
| Tab: Waitlist | รายชื่อรอห้องว่าง + notify |
| `src/app/api/reservations/group/route.ts` | POST: group booking |
| `src/app/api/reservations/ota-queue/route.ts` | GET: pending OTA bookings, POST: confirm/reject |
| `src/app/api/reservations/send-confirmation/route.ts` | POST: email/LINE confirmation |
| `src/components/reservations/booking-calendar.tsx` | Calendar grid with availability |
| `src/components/reservations/ota-booking-card.tsx` | Card: OTA booking details + confirm/reject |

#### Front Desk Enhanced
| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/front-desk/front-desk-client.tsx` | **ปรับปรุง:** เพิ่มฟีเจอร์ |
| Tab: Check-in | Walk-in + reservation lookup, room assign, keycard issue |
| Tab: Check-out | Folio review, collect payment, invoice print |
| Tab: In-house Guests | ทุก guest ที่ check-in อยู่, room move, upgrade, notes |
| Tab: Cashier | รายการรับเงิน, deposits, outstanding |
| `src/app/api/front-desk/folio/route.ts` | GET folio, POST add charge |
| `src/app/api/front-desk/keycard/route.ts` | POST: issue/reissue keycard log |
| `src/app/api/front-desk/room-move/route.ts` | POST: move guest to new room |
| `src/app/api/front-desk/invoice/route.ts` | GET: generate invoice PDF |
| `src/components/front-desk/folio-panel.tsx` | รายการค่าใช้จ่าย guest |
| `src/components/front-desk/cashier-session.tsx` | เปิด/ปิดกะ cashier |

---

### 2.2 Housekeeping (Full)

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/housekeeping/page.tsx` | **ปรับปรุง** |
| `src/app/dashboard/housekeeping/housekeeping-client.tsx` | **ปรับปรุง:** HK Manager view |
| Tab: Room Board | All rooms by floor, status color, assign staff |
| Tab: Floor Assignment | มอบหมาย floor ให้ housekeeper |
| Tab: Inspection Queue | ห้องรอ inspect |
| Tab: Laundry | รอส่งซัก / รับคืน |
| Tab: Minibar | minibar checklist per room type |
| Tab: Supply Tracking | สต็อกอุปกรณ์ทำความสะอาด |
| `src/app/dashboard/housekeeping/my-tasks/page.tsx` | **Housekeeper View** |
| — | ห้องที่รับผิดชอบ, สถานะ, ใกล้สุด, claim task |
| — | Upload photos (before/after), minibar checklist |
| — | แจ้ง DND, Lost & Found form |
| — | Request supplies |
| `src/app/dashboard/housekeeping/inspect/page.tsx` | **Room Inspector View** |
| — | ห้องรอตรวจ, checklist, score, approve/reject |
| — | Photo proof, หมายเหตุสำหรับ housekeeper |
| `src/app/api/housekeeping/tasks/[id]/photos/route.ts` | POST: upload task photos |
| `src/app/api/housekeeping/inspect/route.ts` | POST: inspection result |
| `src/app/api/housekeeping/minibar/route.ts` | POST: minibar consumption → charge to folio |
| `src/components/housekeeping/room-board.tsx` | Visual floor map |
| `src/components/housekeeping/photo-checklist.tsx` | Photo upload widget |
| `src/components/housekeeping/inspection-form.tsx` | Checklist form for inspector |

---

### 2.3 Engineering / Maintenance (Full)

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/maintenance/maintenance-client.tsx` | **ปรับปรุง:** Manager view |
| Tab: Repair Board | Kanban: new/assigned/in_progress/done |
| Tab: Emergency | ด่วนสูงสุด: SLA breach alerts, blocked rooms |
| Tab: PM Schedule | Preventive maintenance calendar |
| Tab: Equipment | ทะเบียนอุปกรณ์ + ประวัติ |
| Tab: Parts Inventory | สต็อกอะไหล่, reorder alerts |
| `src/app/dashboard/maintenance/my-repairs/page.tsx` | **Technician View** |
| — | claim repair, start, complete, before/after photos |
| — | parts used form, escalation button |
| — | recurring issue notes |
| `src/app/api/maintenance/requests/[id]/photos/route.ts` | POST: before/after photos |
| `src/app/api/maintenance/parts/route.ts` | GET/POST parts usage |
| `src/components/maintenance/repair-kanban.tsx` | Kanban board |
| `src/components/maintenance/parts-picker.tsx` | เลือก parts ที่ใช้ |

---

### 2.4 F&B — Kitchen, Room Service, Restaurant (Full)

#### Kitchen (KDS)
| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/kitchen/page.tsx` | Kitchen Display System |
| `src/app/dashboard/kitchen/kitchen-client.tsx` | Queue: new → preparing → ready |
| — | Allergy notes highlight, Timing per ticket |
| — | Stock alerts (เมื่อวัตถุดิบใกล้หมด) |
| — | Kitchen SLA timer |
| `src/app/api/fnb/orders/[id]/status/route.ts` | PATCH: new→preparing→ready |
| `src/components/fnb/kds-ticket.tsx` | Kitchen ticket (order items + allergy) |

#### Room Service Delivery
| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/room-service/page.tsx` | Room Service Staff view |
| `src/app/dashboard/room-service/room-service-client.tsx` | Delivery queue |
| — | Claim delivery, mark in transit, mark delivered |
| — | Collect payment / charge to room |
| — | Photo confirmation + signature |
| — | Tray return tracking |
| `src/app/api/fnb/delivery/route.ts` | POST: delivery events |

#### Restaurant POS
| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/restaurant/page.tsx` | Restaurant floor view |
| `src/app/dashboard/restaurant/restaurant-client.tsx` | POS features |
| Tab: Tables | Table grid, status (free/occupied), seat count |
| Tab: Orders | Take order, modify, split bill |
| Tab: Payment | Cash/card/room charge, discount apply |
| Tab: Closing | Shift closing summary, cash count |
| `src/app/api/fnb/restaurant/tables/route.ts` | GET/PATCH table status |
| `src/app/api/fnb/restaurant/orders/route.ts` | POST/GET orders |
| `src/app/api/fnb/restaurant/payment/route.ts` | POST: process payment |
| `src/components/fnb/table-grid.tsx` | Visual table layout |
| `src/components/fnb/pos-numpad.tsx` | Payment input |

**Sidebar nav เพิ่ม:**
```typescript
{ href: '/dashboard/kitchen', label: 'ครัว', icon: ChefHat, roles: KITCHEN_ROLES }
{ href: '/dashboard/room-service', label: 'Room Service', icon: Bike, roles: ROOM_SERVICE_ROLES }
{ href: '/dashboard/restaurant', label: 'Restaurant', icon: UtensilsCrossed, roles: RESTAURANT_ROLES }
```

---

### 2.5 Bellboy / Porter

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/bellboy/page.tsx` | Porter task board |
| `src/app/dashboard/bellboy/bellboy-client.tsx` | Queue: luggage pickup / delivery / escort |
| — | Claim task, start, complete |
| — | Airport pickup tasks |
| — | Guest escort notes |
| `src/app/api/bellboy/tasks/route.ts` | GET/POST luggage tasks |

**Sidebar nav เพิ่ม:**
```typescript
{ href: '/dashboard/bellboy', label: 'Porter', icon: BriefcaseBusiness, roles: ['bellboy'] }
```

---

### 2.6 Transport Staff

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/transport/page.tsx` | Driver task board |
| `src/app/dashboard/transport/transport-client.tsx` | Pickup queue |
| — | Driver assignment, vehicle selection |
| — | Route status, ETA |
| — | Guest contact (phone reveal) |
| — | Pickup confirmation + photo |
| `src/app/api/transport/tasks/route.ts` | GET/POST/PATCH transport tasks |

**Sidebar nav เพิ่ม:**
```typescript
{ href: '/dashboard/transport', label: 'Transport', icon: Car, roles: ['transport_driver', 'concierge'] }
```

---

### 2.7 Concierge (Enhanced)

**ปรับปรุง `concierge-client.tsx`:**
- [ ] Tab: Transportation — จองรถ, airport transfer, tour
- [ ] Tab: Luggage — สั่ง bellboy ไปรับ/ส่งกระเป๋า
- [ ] Tab: Restaurant Reservations — จองร้านอาหารนอก
- [ ] Tab: Local Recommendations — ข้อมูล curated ตาม preference
- [ ] Tab: VIP Tasks — checklist สำหรับ VIP guest
- [ ] Integration กับ transport tasks + bellboy tasks (auto-create)

---

### 2.8 Security (Enhanced)

**ปรับปรุง `security-client.tsx`:**
- [ ] Tab: Incidents — report, update, escalate
- [ ] Tab: Visitors — register, checkout
- [ ] Tab: Patrol Log — checkpoint list, timer, notes per point
- [ ] Tab: Emergency — ปุ่ม Emergency Alert (broadcast ไปยัง GM + security team)
- [ ] Tab: Lost & Found — ประสานกับ Housekeeping

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/api/security/emergency/route.ts` | POST: trigger emergency alert (Supabase broadcast) |
| `src/app/api/security/patrol/route.ts` | POST: checkpoint, GET: today's patrol log |
| `src/components/security/patrol-timeline.tsx` | Timeline ของ patrol วันนี้ |
| `src/components/security/emergency-button.tsx` | Big red button + confirmation |

---

### 2.9 Accounting OS (Full)

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/accounting/accounting-client.tsx` | **ปรับปรุง** |
| Tab: Folio | ดู/แก้ไข folio ต่อ guest, add charges |
| Tab: Cashier | เปิด/ปิดกะ, รับเงิน, reconcile |
| Tab: Refunds | รายการ refund รอ approve + process |
| Tab: Revenue | Revenue by source/date/room type |
| Tab: Expenses | ค่าใช้จ่ายแต่ละหมวด + receipts |
| Tab: Tax Invoices | สร้าง, ส่ง, ติดตาม tax invoices |
| Tab: Reports | P&L, Balance Sheet (export Excel/PDF) |
| Tab: Journal | Journal entries, close month |
| `src/app/api/accounting/folio/route.ts` | GET/POST folio items |
| `src/app/api/accounting/folio/[id]/charge/route.ts` | POST: add charge to folio |
| `src/app/api/accounting/cashier/session/route.ts` | POST: open/close session |
| `src/app/api/accounting/refunds/route.ts` | POST/GET refunds |
| `src/app/api/accounting/tax-invoices/route.ts` | POST: generate tax invoice |
| `src/app/api/accounting/reports/export/route.ts` | GET: export to Excel |
| `src/components/accounting/folio-table.tsx` | ตารางรายการใน folio |
| `src/components/accounting/cashier-balance.tsx` | เปิด/ปิดกะ + cash count |

---

### 2.10 HR Module (Full)

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/hr/hr-client.tsx` | **ปรับปรุง** |
| Tab: Staff | ทะเบียนพนักงาน, search, filter by dept/role |
| Tab: Onboarding | checklist สำหรับพนักงานใหม่ (tasks, documents, IT setup) |
| Tab: Attendance | ประวัติ attendance ทั้งทีม, export |
| Tab: Leave Approval | อนุมัติ/ปฏิเสธ leave requests |
| Tab: Payroll | คำนวณ, review, approve, export slip |
| Tab: Performance | รอบประเมิน, กรอก, ดูประวัติ |
| Tab: Training | หลักสูตร, สมัคร, บันทึก, certificate |
| Tab: Access Control | assign/revoke roles |
| `src/app/api/hr/onboarding/route.ts` | POST/GET onboarding tasks |
| `src/app/api/hr/access/route.ts` | POST: assign role, DELETE: revoke access |
| `src/components/hr/onboarding-checklist.tsx` | Step-by-step onboarding |
| `src/components/hr/payroll-slip.tsx` | PDF pay slip template |

---

### 2.11 IT Support

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/it/page.tsx` | IT Support dashboard |
| `src/app/dashboard/it/it-client.tsx` | Tabs: Tickets / Devices / Integrations |
| Tab: Tickets | รับ support ticket, assign, resolve |
| Tab: Devices | ทะเบียนอุปกรณ์ (POS, printer, Wi-Fi AP, TV), status |
| Tab: Wi-Fi Issues | รายงาน Wi-Fi complaints per room/floor |
| Tab: Integrations | health status: LINE/WhatsApp/OTA/PMS |
| Tab: Printer Status | printer queue, jammed alerts |
| `src/app/api/it/tickets/route.ts` | POST/GET support tickets |
| `src/app/api/it/devices/route.ts` | GET devices, PATCH status |
| `src/components/it/device-health-grid.tsx` | Grid status ทุก device |
| `src/components/it/integration-health.tsx` | Status badges per integration |

**Sidebar nav เพิ่ม:**
```typescript
{ href: '/dashboard/it', label: 'IT Support', icon: Cpu, roles: IT_ROLES }
```

---

### 2.12 Spa (Full)

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/spa/spa-client.tsx` | **ปรับปรุง** |
| Tab: Bookings | ปฏิทิน, slot, assign therapist |
| Tab: Treatment Rooms | ห้องสปา: สถานะ, ทำความสะอาด, occupied |
| Tab: Therapist Schedule | ตารางงาน, คนว่าง, overtime |
| Tab: Services | เพิ่ม/แก้ไขบริการ, ราคา, ระยะเวลา |
| Tab: Guest Preferences | guest preference notes (pressure, allergies) |
| Tab: Revenue | รายได้ต่อวัน/เดือน, top services |
| `src/app/api/spa/treatment-rooms/route.ts` | GET/PATCH treatment room status |
| `src/components/spa/room-status-grid.tsx` | Treatment room grid |
| `src/components/spa/guest-preference-card.tsx` | Guest spa preferences |

---

### 2.13 Revenue Management (Full)

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/revenue/revenue-client.tsx` | **ปรับปรุง** |
| Tab: Overview | ADR, RevPAR, Occupancy (30/60/90 days) |
| Tab: Rate Plans | สร้าง/แก้ไข rate plans, restrictions |
| Tab: Pricing Calendar | Override ราคาแต่ละวัน, heat map |
| Tab: Forecast | Occupancy forecast + recommended rates |
| Tab: OTA Performance | Revenue per channel (Booking.com/Agoda/Direct) |
| Tab: Competitor Pricing | เปรียบเทียบราคาคู่แข่ง (manual input หรือ scraper) |
| Tab: Dynamic Pricing | rules-based auto pricing (demand threshold) |
| `src/app/api/revenue/dynamic-pricing/route.ts` | POST: set rules, GET: apply |
| `src/app/api/revenue/ota-performance/route.ts` | GET: revenue breakdown by channel |
| `src/components/revenue/competitor-table.tsx` | ตารางราคาคู่แข่ง |
| `src/components/revenue/dynamic-pricing-rules.tsx` | Rule builder (if occ > X → price +Y%) |

---

### 2.14 Marketing (Full)

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/marketing/page.tsx` | Marketing dashboard |
| `src/app/dashboard/marketing/marketing-client.tsx` | Tabs |
| Tab: Campaigns | Email + LINE campaigns, สถิติ |
| Tab: Promo Codes | สร้าง, จำกัดการใช้, track redemption |
| Tab: Abandoned Bookings | รายชื่อที่ค้างบน booking widget → send recovery |
| Tab: Loyalty Campaigns | Points x2, tier benefits, birthday |
| Tab: Analytics | Conversion rate, source attribution |
| `src/app/api/marketing/abandoned/route.ts` | GET: abandoned bookings, POST: send recovery |
| `src/app/api/marketing/loyalty-campaigns/route.ts` | POST/GET loyalty campaigns |
| `src/components/marketing/campaign-builder.tsx` | สร้าง campaign (audience, message, schedule) |
| `src/components/marketing/abandoned-table.tsx` | ตาราง abandoned bookings + recovery status |

**Sidebar nav เพิ่ม:**
```typescript
{ href: '/dashboard/marketing', label: 'Marketing', icon: Megaphone, roles: MARKETING_ROLES }
```

---

### 2.15 Purchasing (Full)
*(รายละเอียดเหมือน roadmap เดิม — เพิ่ม supplier rating, receiving)*

---

## PHASE 3 — SaaS Platform + Advanced Systems
**ระยะเวลา:** 10–14 สัปดาห์  
**เป้าหมาย:** app.maitriapp.com/owner ครบวงจร + Revenue/CRM/Night Audit

---

### 3.1 SaaS Platform — Route Structure

```
src/app/(platform)/                  ← Route group สำหรับ Platform admin
  layout.tsx                         ← Platform layout (platform nav, auth check)
  dashboard/page.tsx                 ← Platform Owner overview
  tenants/
    page.tsx                         ← All organizations
    [orgId]/page.tsx                 ← Single org detail + impersonate
  hotels/page.tsx                    ← All hotels
  billing/
    page.tsx                         ← Billing overview
    invoices/page.tsx
    failed-payments/page.tsx
    credits/page.tsx
  support/
    page.tsx                         ← Support tickets
    [ticketId]/page.tsx              ← Ticket + diagnostics
  operations/page.tsx                ← Platform health
  security/page.tsx                  ← Access logs, sessions
  sales/
    page.tsx                         ← Sales CRM (leads, demos, trials)
    leads/page.tsx
    pipeline/page.tsx
  product/
    page.tsx                         ← Feature flags, A/B tests
    flags/page.tsx
    ab-tests/page.tsx
  engineering/
    page.tsx                         ← Logs, deployments
    webhooks/page.tsx                ← Webhook events + replay
    migrations/page.tsx
```

---

### 3.2 Platform Owner Control Center

**`src/app/(platform)/dashboard/page.tsx`**

| Widget | ข้อมูล |
|---|---|
| MRR / ARR | รายได้รายเดือน/ปี |
| Active Hotels | จำนวนโรงแรมที่ใช้งาน |
| Active Users | DAU/MAU |
| Churn | ออกจากระบบช่วง 30 วัน |
| AI Usage | จำนวน API calls, cost estimate |
| QR Scans | จำนวน QR room chat scans |
| Support Queue | tickets ที่ยังไม่ resolve |
| Platform Health | status สีต่างๆ (green/yellow/red) |
| Webhook Failures | events ล้มเหลว 24h |
| OTA Sync Failures | ล้มเหลวส่ง/รับ OTA |

**Platform Owner Controls:**
- [ ] Suspend/unsuspend hotel
- [ ] Feature flags (per org หรือ global rollout%)
- [ ] Plan management (upgrade/downgrade)
- [ ] Impersonation (login as hotel_owner)
- [ ] Billing override (add credits, extend trial)
- [ ] Quota management (max seats, AI calls, QR scans)
- [ ] AI limits per plan
- [ ] Maintenance mode (hotel-level หรือ global)

---

### 3.3 Billing Admin

**`src/app/(platform)/billing/`**

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `billing/page.tsx` | MRR chart, failed payments list, upcoming renewals |
| `billing/invoices/page.tsx` | ทุก invoice: search, filter, download |
| `billing/failed-payments/page.tsx` | Failed → retry / contact / write-off |
| `billing/credits/page.tsx` | Issue credits, view history |
| `billing/addons/page.tsx` | Add-on subscriptions per org |
| `src/app/api/platform/billing/retry/route.ts` | POST: retry failed payment |
| `src/app/api/platform/billing/credits/route.ts` | POST: issue credit |
| `src/components/platform/invoice-table.tsx` | ตาราง invoices |
| `src/components/platform/payment-alert-card.tsx` | การ์ด failed payment + actions |

---

### 3.4 Support Admin

**`src/app/(platform)/support/`**

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `support/page.tsx` | Ticket queue: open, in_progress, resolved |
| `support/[ticketId]/page.tsx` | Ticket detail + hotel diagnostics panel |
| — | Live hotel state (room counts, active tasks, errors) |
| — | Impersonate button (login as any user in that hotel) |
| — | SLA timer, escalate to engineering |
| `src/app/api/platform/support/impersonate/route.ts` | POST: generate impersonation token |
| `src/app/api/platform/support/diagnostics/route.ts` | GET: live hotel state snapshot |
| `src/components/platform/hotel-diagnostics.tsx` | Panel: hotel health + active state |
| `src/components/platform/impersonate-button.tsx` | Confirm + open new tab as that user |

---

### 3.5 Platform Operations Admin

**`src/app/(platform)/operations/`**

| Widget | ข้อมูล |
|---|---|
| API Health | p50/p95 latency, error rate |
| WebSocket Health | active connections, message rate |
| Queue Health | pending jobs, failed jobs, processing rate |
| OTA Sync Health | last sync per platform, error counts |
| Payment Provider | Stripe/Omise status |
| Notification Health | LINE/WhatsApp/Email delivery rate |
| Database | connection pool, slow queries |

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/api/platform/ops/health/route.ts` | GET: aggregated health snapshot |
| `src/components/platform/health-dashboard.tsx` | Traffic light grid |

---

### 3.6 Security Admin

**`src/app/(platform)/security/`**

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `security/page.tsx` | Access logs, suspicious logins, active sessions |
| `security/sessions/page.tsx` | Active sessions: device, location, last activity |
| — | Revoke session (logout specific device) |
| `security/abuse/page.tsx` | API abuse detection: high request rate, unusual patterns |
| — | Auto-block IP + manual block |
| `src/app/api/platform/security/sessions/route.ts` | GET: active sessions, DELETE: revoke |
| `src/app/api/platform/security/block-ip/route.ts` | POST: block IP |
| `src/components/platform/session-table.tsx` | ตาราง active sessions + revoke |

---

### 3.7 Sales Admin CRM

**`src/app/(platform)/sales/`**

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `sales/page.tsx` | Pipeline overview, targets, conversion |
| `sales/leads/page.tsx` | Leads kanban: prospecting/demo/trial/negotiation/closed |
| `sales/pipeline/page.tsx` | Pipeline funnel chart |
| `sales/demos/page.tsx` | scheduled demos, notes, follow-up |
| `sales/onboarding/page.tsx` | trial → paid onboarding pipeline |
| `src/app/api/platform/sales/leads/route.ts` | POST/GET/PATCH platform leads |
| `src/components/platform/sales-kanban.tsx` | Kanban board |
| `src/components/platform/onboarding-pipeline.tsx` | Progress tracker per new hotel |

---

### 3.8 Product Admin

**`src/app/(platform)/product/`**

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `product/flags/page.tsx` | Feature flags: key, enabled, rollout %, target orgs |
| `product/ab-tests/page.tsx` | A/B tests: variants, traffic split, results |
| `product/modules/page.tsx` | Module toggles per plan (enable/disable features) |
| `product/analytics/page.tsx` | Usage analytics: feature adoption, DAU by feature |
| `src/app/api/platform/flags/route.ts` | POST/GET/PATCH feature flags |
| `src/app/api/platform/ab-tests/route.ts` | POST/GET/PATCH A/B tests |
| `src/lib/feature-flags.ts` | `isEnabled(flag, orgId)` — check flag for org |
| `src/components/platform/flag-toggle.tsx` | Toggle + rollout slider |

---

### 3.9 Developer / Engineering Admin

**`src/app/(platform)/engineering/`**

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `engineering/page.tsx` | Deployment history, recent incidents |
| `engineering/webhooks/page.tsx` | Webhook events: filter by hotel/platform/status |
| — | Replay failed webhook |
| `engineering/logs/page.tsx` | Application logs (tail, filter by level/service) |
| `engineering/migrations/page.tsx` | DB migration history + pending |
| `src/app/api/platform/webhooks/replay/route.ts` | POST: replay webhook event |
| `src/app/api/platform/logs/route.ts` | GET: log stream |
| `src/components/platform/webhook-event-table.tsx` | ตาราง webhook events + replay button |
| `src/components/platform/log-viewer.tsx` | Log tail component |

---

### 3.10 Night Audit
*(รายละเอียดเหมือน roadmap เดิม)*

---

### 3.11 Advanced CRM & Loyalty

| ไฟล์ | ฟีเจอร์ |
|---|---|
| `src/app/dashboard/crm/` | Guest 360, segments, loyalty tiers |
| `src/app/dashboard/crm/guests/[id]/page.tsx` | Full guest profile: all stays, spend, preferences |
| `src/app/dashboard/crm/loyalty/page.tsx` | Points balance, tier, redemptions |
| `src/components/crm/guest-timeline.tsx` | Timeline: check-ins, requests, feedback, complaints |
| `src/components/crm/loyalty-tier-badge.tsx` | Bronze/Silver/Gold/Platinum badge |

---

## Complete Summary

### Total New Items (vs current state)

| Category | Phase 1 | Phase 2 | Phase 3 | Total |
|---|---|---|---|---|
| DB Tables | 9 | 18 | 15 | **42** |
| API Routes | 20 | 38 | 24 | **82** |
| Pages / Clients | 18 | 44 | 28 | **90** |
| Components | 12 | 32 | 20 | **64** |
| **Roles** | 10 new | 8 new | 8 platform | **26 new** |

### New Roles Added vs Previous Roadmap

**Hotel OS (เพิ่มจาก roadmap เก่า):**
`general_manager`, `operations_manager`, `front_office_manager`, `reservation_agent`, `chat_admin`, `housekeeping_manager`, `room_inspector`, `maintenance_manager`, `technician`, `kitchen_staff`, `room_service_staff`, `restaurant_staff`, `bellboy`, `transport_driver`, `revenue_manager`, `marketing_staff`, `night_auditor`, `accounting_manager`, `accounting_staff`, `purchasing_manager`, `purchasing_staff`, `security_manager`, `security_staff`, `spa_manager`

**SaaS Platform (ใหม่ทั้งหมด — ไม่มีใน roadmap เก่า):**
`platform_owner`, `billing_admin`, `support_admin`, `platform_ops`, `security_admin`, `sales_admin`, `product_admin`, `dev_admin`

---

---

## PHASE 1 ADDITIONS — ทำได้ทันทีด้วย Stack ที่มี (Next.js + Supabase + Claude API)

### Guest Portal — เพิ่ม

| ไฟล์ | Feature | ใช้อะไร |
|---|---|---|
| `src/app/portal/check-in/page.tsx` | Online Check-in — อัพโหลด ID, เลือกห้อง 3 วันก่อนถึง | Supabase Storage + DB |
| `src/app/portal/check-in/check-in-client.tsx` | Form: เวลาถึง, ความต้องการพิเศษ, upload passport | file input + Storage |
| `src/app/portal/folio/page.tsx` | Guest Folio View — ดูยอดค่าใช้จ่าย real-time | Supabase query |
| `src/app/portal/folio/express-checkout/page.tsx` | Express Check-out — อนุมัติ folio จากโทรศัพท์ | API route + Realtime |
| `src/app/portal/requests/[id]/page.tsx` | Request Tracker — status + ETA แบบ real-time | Supabase Realtime |
| `src/app/portal/compendium/page.tsx` | Digital Compendium — เมนู, คู่มือ, สถานที่ใกล้เคียง | CMS-like pages |
| `src/app/api/portal/checkin/route.ts` | POST: บันทึก check-in preferences | Supabase |
| `src/app/api/portal/review-prompt/route.ts` | POST: send review prompt หลัง checkout 2h | Edge Function cron |
| `src/app/api/portal/chat/route.ts` | POST: AI chatbot สำหรับ guest ตอบคำถาม 24/7 | **Claude API** |
| `src/components/portal/request-tracker.tsx` | Real-time ETA component (Realtime subscribe) | Supabase Realtime |
| `src/components/portal/ai-chat-widget.tsx` | Floating chat widget (ทุกหน้า portal) | Claude API |
| `public/manifest.json` | PWA manifest — installable บนโทรศัพท์ | Web standard |
| `public/sw.js` | Service Worker — offline mode สำหรับ booking info | next-pwa |

### Hotel OS — เพิ่ม Phase 1

| ไฟล์ | Feature | ใช้อะไร |
|---|---|---|
| `src/app/dashboard/live-board/sla-widget.tsx` | SLA Traffic Light — เขียว/เหลือง/แดง real-time | Supabase Realtime + `work_orders.sla_deadline` |
| `src/app/dashboard/handover/page.tsx` | Digital Shift Handover Log | DB table + page |
| `src/app/dashboard/handover/handover-client.tsx` | บันทึก handover: งานค้าง, incidents, VIP notes | JSONB + timestamp |
| `src/app/dashboard/duty-log/page.tsx` | Duty Manager Log — GM บันทึก decisions รายวัน | DB table + page |
| `src/app/dashboard/guest-recovery/page.tsx` | Guest Recovery Workflow — complaint → resolve → compensate | DB + state machine |
| `src/app/dashboard/guests/blacklist/page.tsx` | Blacklist Management — flag + note เหตุผล | column ใน guests |
| `src/app/api/guests/[id]/blacklist/route.ts` | POST: flag/unflag guest | Supabase update |
| `src/app/api/reports/daily-report/route.ts` | GET: generate daily management report | aggregate query |
| `src/app/api/reports/daily-report/pdf/route.ts` | GET: PDF daily report | `@react-pdf/renderer` |
| `src/app/api/compliance/tm30/route.ts` | POST: generate TM30 form สำหรับ foreign guest | form + PDF |
| `src/app/dashboard/compliance/tm30/page.tsx` | TM30 Management — list, generate, track | DB + PDF export |
| `src/app/dashboard/compliance/pdpa/page.tsx` | PDPA Consent Management — consent log, withdrawal | consent table |
| `src/app/api/compliance/pdpa/consent/route.ts` | POST: record consent, DELETE: withdraw | Supabase |
| `src/lib/checklist-templates.ts` | Dynamic checklist templates (VIP/checkout/deep/inspection) | JSONB definitions |
| `src/components/dashboard/vip-alert-banner.tsx` | VIP Alert บน check-in screen — tier, preferences, past issues | query loyalty |
| `src/app/api/ai/review-reply/route.ts` | POST: AI draft ตอบ Google/Booking review | **Claude API** |
| `src/app/api/ai/sentiment/route.ts` | POST: วิเคราะห์ sentiment จาก feedback text | **Claude API** |
| `src/app/api/ai/inbox-reply/route.ts` | POST: AI แนะนำ reply สำหรับ guest message | **Claude API** (stub มีอยู่แล้ว) |
| `src/lib/geofence.ts` | Geofence helper — ตรวจสอบ lat/lng อยู่ในรัศมีโรงแรม | Web Geolocation API |
| `src/components/attendance/geofence-clock.tsx` | Clock-in button ที่ตรวจ location ก่อน | Geolocation API |

**Library เพิ่ม:**
```bash
npm install @react-pdf/renderer html5-qrcode qrcode next-pwa web-push xlsx
```

---

## PHASE 2 ADDITIONS — ทำได้ด้วย Stack ที่มี

| ไฟล์ | Feature | ใช้อะไร |
|---|---|---|
| `src/app/dashboard/packages/page.tsx` | Package Builder — ห้อง + สปา + อาหาร + transfer | DB + booking flow |
| `src/app/dashboard/packages/package-client.tsx` | Drag-and-drop package composer | component |
| `src/app/api/packages/route.ts` | POST: สร้าง package, GET: list | Supabase |
| `src/app/dashboard/revenue/yield-rules/page.tsx` | Yield Management Rules — occ > X% → ราคา +Y% | rules table + Edge Function |
| `src/app/api/revenue/yield/apply/route.ts` | POST: apply yield rules (cron ทุก 1h) | Edge Function |
| `src/app/api/marketing/last-minute/route.ts` | POST: auto-push last-minute deals ถ้าห้องว่าง 18:00 | Edge Function cron |
| `src/app/dashboard/accounting/budget/page.tsx` | Budget vs Actuals — ตั้ง budget + เห็น variance real-time | DB table + chart |
| `src/app/dashboard/accounting/dept-pl/page.tsx` | Department P&L — แต่ละแผนกมี P&L แยก | aggregate query |
| `src/app/api/accounting/export/route.ts` | GET: export Excel รายงาน | `xlsx` library |
| `src/app/dashboard/reservations/corporate/page.tsx` | Corporate Account Management — rate พิเศษ, billing แยก | DB + rate plan |
| `src/app/dashboard/reservations/groups/page.tsx` | Group Booking — block rooms, allotment, BEO | DB extension |
| `src/app/api/reservations/groups/route.ts` | POST: group block + allotment | Supabase |

### SaaS Platform — เพิ่ม Phase 2

| ไฟล์ | Feature | ใช้อะไร |
|---|---|---|
| `src/app/(platform)/onboarding/page.tsx` | Self-Service Onboarding wizard (สมัครเอง 5 steps) | Auth + DB |
| `src/app/(platform)/status/page.tsx` | Public Status Page (`status.maitriapp.com`) | health check APIs |
| `src/app/api/platform/health/route.ts` | GET: aggregate health ทุก service | ping + DB check |
| `src/app/(platform)/export/[orgId]/route.ts` | Data Export — hotel export ข้อมูลตัวเองเป็น JSON/CSV | stream query |
| `src/lib/platform/health-score.ts` | Customer Health Score — คำนวณจาก usage, login, features used | aggregate |
| `src/app/(platform)/trial/route.ts` | Trial Automation — email drip 14 วัน + upgrade prompt day 12 | Edge Function cron |
| `src/app/api/platform/referrals/route.ts` | Referral Program — hotel แนะนำ hotel อื่น → discount | referral_codes table |

---

## 🔌 INTEGRATION STUBS — เตรียม Architecture ไว้พร้อม ใส่ Key ทีหลัง

> **หลักการ:** Adapter Pattern — ทุก integration มี interface + mock adapter พร้อม  
> เมื่อได้ API key จริง: สร้าง concrete adapter → swap ใน config บรรทัดเดียว

### Architecture

```
src/lib/integrations/
  index.ts                    ← registry: export adapter ที่ใช้งาน
  types.ts                    ← interfaces ทุก integration
  mock/                       ← Mock adapters (ใช้ระหว่าง dev)
    channel-manager.mock.ts
    payment.mock.ts
    sms.mock.ts
    ota.mock.ts
    keycard.mock.ts
    pos.mock.ts
    bank.mock.ts
    review-platform.mock.ts
  providers/                  ← Real adapters (ใส่ key แล้ว uncomment)
    siteminder.ts             ← Channel Manager
    omise.ts                  ← Payment (ไทย)
    twilio.ts                 ← SMS
    booking-com.ts            ← OTA
    assa-abloy.ts             ← Key Card (NFC)
    oracle-micros.ts          ← POS
    scb-open-banking.ts       ← Bank Reconciliation
    google-business.ts        ← Review response
    xero.ts                   ← Accounting export
    str.ts                    ← Market benchmarking
```

---

### DB Schema (เตรียมไว้ทันที)

**Migration:** `20260601500000_integration_stubs.sql`

```sql
-- Integration config per hotel (credentials encrypted)
CREATE TABLE channel_integrations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  provider     TEXT NOT NULL,   -- 'siteminder'|'omise'|'twilio'|'booking_com'|...
  enabled      BOOLEAN DEFAULT false,
  config       JSONB DEFAULT '{}',  -- { api_key, endpoint, webhook_secret, ... }
  last_sync_at TIMESTAMPTZ,
  sync_status  TEXT DEFAULT 'idle',
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- OTA reservations queue (รับจาก OTA webhook, รอ confirm)
CREATE TABLE ota_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id        UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  ota_platform    TEXT NOT NULL,  -- 'booking_com'|'agoda'|'expedia'|'airbnb'
  ota_booking_id  TEXT NOT NULL UNIQUE,
  raw_payload     JSONB NOT NULL,
  mapped_data     JSONB,          -- normalized to our format
  status          TEXT DEFAULT 'pending',  -- pending|confirmed|rejected|cancelled
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Rate push queue → ส่งราคาไปยัง channel manager
CREATE TABLE rate_push_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_id UUID,
  date_from    DATE NOT NULL,
  date_to      DATE NOT NULL,
  rate         NUMERIC(10,2),
  availability INT,
  provider     TEXT,  -- 'siteminder'|'rategain'
  status       TEXT DEFAULT 'pending',  -- pending|sent|failed
  attempts     INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- SMS/notification queue
CREATE TABLE notification_queue (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  channel      TEXT NOT NULL,  -- 'sms'|'email'|'line'|'whatsapp'|'push'
  recipient    TEXT NOT NULL,  -- phone / email / line_uid
  message      TEXT NOT NULL,
  template_id  TEXT,
  status       TEXT DEFAULT 'pending',
  provider     TEXT,
  sent_at      TIMESTAMPTZ,
  error        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Keycard issuance log
CREATE TABLE keycard_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES reservations(id),
  room_no      TEXT NOT NULL,
  guest_name   TEXT,
  card_uid     TEXT,           -- physical card UID (ถ้ามี hardware)
  digital_key  TEXT,           -- token for digital key (QR/NFC)
  valid_from   TIMESTAMPTZ,
  valid_until  TIMESTAMPTZ,
  issued_by    UUID REFERENCES user_profiles(id),
  revoked_at   TIMESTAMPTZ,
  provider     TEXT DEFAULT 'digital_qr',  -- 'assa_abloy'|'dormakaba'|'digital_qr'
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- POS sync log
CREATE TABLE pos_sync_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  pos_order_id TEXT,
  amount       NUMERIC(10,2),
  outlet       TEXT,
  synced_to    TEXT,           -- 'folio'|'accounting'
  status       TEXT DEFAULT 'pending',
  raw_data     JSONB,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Bank transaction (for reconciliation)
CREATE TABLE bank_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id       UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  txn_date       DATE NOT NULL,
  description    TEXT,
  amount         NUMERIC(10,2),
  type           TEXT,         -- 'credit'|'debit'
  matched_folio  UUID,         -- matched folio_id หลัง reconcile
  status         TEXT DEFAULT 'unmatched',
  source         TEXT DEFAULT 'manual',  -- 'manual'|'scb_api'|'kbank_api'
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- Market benchmarking data
CREATE TABLE market_rates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  competitor   TEXT,
  room_type    TEXT,
  rate         NUMERIC(10,2),
  occ_pct      NUMERIC(5,2),
  source       TEXT DEFAULT 'manual',  -- 'str'|'airdna'|'manual'
  fetched_at   TIMESTAMPTZ DEFAULT now()
);
```

---

### Interface Definitions (`src/lib/integrations/types.ts`)

```typescript
// Channel Manager
export interface ChannelManagerAdapter {
  pushRates(hotelId: string, rates: RatePush[]): Promise<void>;
  pushAvailability(hotelId: string, avail: AvailabilityPush[]): Promise<void>;
  fetchReservations(hotelId: string, since: Date): Promise<OTAReservation[]>;
}

// Payment Gateway
export interface PaymentAdapter {
  charge(amount: number, currency: string, source: string): Promise<PaymentResult>;
  refund(chargeId: string, amount?: number): Promise<RefundResult>;
  getTransaction(id: string): Promise<Transaction>;
}

// SMS Provider
export interface SMSAdapter {
  send(to: string, message: string): Promise<{ messageId: string }>;
}

// Key Card / Digital Key
export interface KeyCardAdapter {
  issueKey(params: KeyIssueParams): Promise<{ keyToken: string; cardUid?: string }>;
  revokeKey(keyToken: string): Promise<void>;
  extendKey(keyToken: string, until: Date): Promise<void>;
}

// POS System
export interface POSAdapter {
  fetchOrders(since: Date): Promise<POSOrder[]>;
  postRoomCharge(roomNo: string, amount: number, description: string): Promise<void>;
}

// Accounting Export
export interface AccountingAdapter {
  exportJournalEntries(from: Date, to: Date): Promise<void>;
  syncInvoice(invoiceId: string): Promise<void>;
}

// Review Platform
export interface ReviewPlatformAdapter {
  fetchNewReviews(): Promise<Review[]>;
  postReply(reviewId: string, reply: string): Promise<void>;
}

// Market Data
export interface MarketDataAdapter {
  fetchCompetitorRates(hotelId: string, dates: Date[]): Promise<MarketRate[]>;
}
```

---

### Integration Registry (`src/lib/integrations/index.ts`)

```typescript
// ← เปลี่ยน import บรรทัดเดียวเมื่อพร้อม
import { MockChannelManager } from './mock/channel-manager.mock';
// import { SiteMinderAdapter } from './providers/siteminder'; // uncomment เมื่อมี key

import { MockPayment } from './mock/payment.mock';
// import { OmiseAdapter } from './providers/omise'; // uncomment เมื่อมี key

import { MockSMS } from './mock/sms.mock';
// import { TwilioAdapter } from './providers/twilio'; // uncomment เมื่อมี key

import { MockKeyCard } from './mock/keycard.mock';
// import { AssaAbloyAdapter } from './providers/assa-abloy'; // uncomment เมื่อมี key

export const channelManager: ChannelManagerAdapter = new MockChannelManager();
export const payment: PaymentAdapter = new MockPayment();
export const sms: SMSAdapter = new MockSMS();
export const keyCard: KeyCardAdapter = new MockKeyCard();
```

---

### Integration Status UI (`src/app/dashboard/it/integrations/page.tsx`)

แสดงสถานะ integration ทุกตัว พร้อมปุ่ม Configure:

| Integration | สถานะ | Action |
|---|---|---|
| Channel Manager (SiteMinder) | 🔴 ไม่ได้เชื่อม | Configure → ใส่ API key |
| Payment Gateway (Omise) | 🔴 ไม่ได้เชื่อม | Configure → ใส่ public/secret key |
| SMS (Twilio) | 🔴 ไม่ได้เชื่อม | Configure → ใส่ SID + token |
| Key Card (ASSA ABLOY) | 🔴 ไม่ได้เชื่อม | Configure → ใส่ endpoint + key |
| POS (Oracle MICROS) | 🔴 ไม่ได้เชื่อม | Configure → ใส่ credentials |
| Bank (SCB/KBank) | 🔴 ไม่ได้เชื่อม | Configure → ใส่ client ID |
| Google Business | 🔴 ไม่ได้เชื่อม | Configure → OAuth |
| Xero Accounting | 🔴 ไม่ได้เชื่อม | Configure → OAuth |
| STR Benchmarking | 🔴 ไม่ได้เชื่อม | Configure → ใส่ API key |
| OTA (Booking.com) | 🟡 webhook รับได้แล้ว | Configure → ใส่ EAN credentials |
| LINE OA | 🟢 เชื่อมแล้ว | — |
| WhatsApp Business | 🟡 webhook รับได้แล้ว | Configure → ใส่ token |

เมื่อโรงแรมกรอก API key ใน UI → บันทึกใน `channel_integrations.config` (encrypted) → ระบบ swap mock → real adapter อัตโนมัติ

---

## Updated Summary Table

| Category | Phase 1 | Phase 1 Add | Phase 2 | Phase 2 Add | Phase 3 | Total |
|---|---|---|---|---|---|---|
| DB Tables | 9 | 7 (stubs) | 18 | 5 | 15 | **54** |
| API Routes | 20 | 12 | 38 | 8 | 24 | **102** |
| Pages / Clients | 18 | 14 | 44 | 10 | 28 | **114** |
| Integration Stubs | — | 9 adapters | — | — | — | **9** |

---

---

## MASTER SPEC GAPS — สิ่งที่ยังขาดจาก Master System List

> เปรียบเทียบ Master List กับ roadmap ทั้งหมดข้างบน เพิ่มเฉพาะ item ที่ยังไม่มี

---

### 🌐 A. PUBLIC HOTEL WEBSITE (ยังขาดทั้งหมด)
> ปัจจุบันมีแค่ `/portal` (guest login area) — ยังไม่มีหน้า public website ของโรงแรม

**DB:**
```sql
-- hotel_content: CMS content per hotel
CREATE TABLE hotel_content (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  section      TEXT NOT NULL,  -- 'home'|'about'|'facilities'|'faq'|'policy'|'blog'
  slug         TEXT,
  title        JSONB DEFAULT '{}',        -- { th, en, zh, ja }
  body         JSONB DEFAULT '{}',        -- multilingual content
  media        JSONB DEFAULT '[]',        -- [{ url, type, alt }]
  seo          JSONB DEFAULT '{}',        -- { title, description, keywords, schema }
  published    BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- nearby_experiences: attractions, tours, restaurants
CREATE TABLE nearby_experiences (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,  -- 'attraction'|'tour'|'restaurant'|'nightlife'|'family'
  name         JSONB DEFAULT '{}',
  description  JSONB DEFAULT '{}',
  photo_url    TEXT,
  distance_km  NUMERIC(5,2),
  price_range  TEXT,
  maps_url     TEXT,
  sort_order   INT DEFAULT 0,
  active       BOOLEAN DEFAULT true
);
```

**Pages:**

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/[hotelSlug]/page.tsx` | Homepage: hero video/banner, booking widget, review score, featured rooms, facilities, social proof, sticky CTA |
| `src/app/[hotelSlug]/rooms/page.tsx` | Rooms listing: comparison, urgency labels, recommended, upgrade suggestions |
| `src/app/[hotelSlug]/rooms/[roomSlug]/page.tsx` | Room detail: fullscreen gallery, 360 tour (embed), amenities, occupancy, cancellation policy |
| `src/app/[hotelSlug]/promotions/page.tsx` | Promotions: early bird, long stay, staycation, packages (room+breakfast, room+spa, transfer) |
| `src/app/[hotelSlug]/experiences/page.tsx` | Experiences: local attractions, tours, nightlife, restaurants, family activities |
| `src/app/[hotelSlug]/about/page.tsx` | About, facilities, map/location, FAQ, trust badges |
| `src/app/[hotelSlug]/blog/[slug]/page.tsx` | Blog / articles (hotel news, travel guides) |
| `src/components/hotel-site/booking-widget.tsx` | Realtime pricing widget: fast calendar, room recommendations, promo apply, guest selector |
| `src/components/hotel-site/room-comparison.tsx` | Side-by-side room comparison |
| `src/components/hotel-site/urgency-badge.tsx` | "เหลือ 2 ห้อง" urgency label |
| `src/components/hotel-site/review-score.tsx` | Review score aggregate (Google/Booking/TripAdvisor) |
| `src/components/hotel-site/personalized-recs.tsx` | AI-personalized room/package recommendations |

**Checkout Enhancements:**

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/[hotelSlug]/book/page.tsx` | One-page checkout: social login, autofill, guest memory |
| `src/app/[hotelSlug]/book/addons/page.tsx` | Add-ons: airport transfer, breakfast, spa, early check-in |
| `src/components/hotel-site/payment-selector.tsx` | PromptPay, card, bank transfer, TrueMoney, pay at hotel |
| `src/components/hotel-site/addon-picker.tsx` | Add-on selector during checkout |

**Guest Portal Enhancements:**

| ไฟล์ | Feature ที่ขาด |
|---|---|
| `src/app/portal/bookings/[id]/modify/page.tsx` | Modify booking (date, room type, add-ons) |
| `src/app/portal/bookings/[id]/cancel/page.tsx` | Cancel booking + refund policy display |
| `src/app/portal/check-in/signature/page.tsx` | Digital signature บน check-in form |
| `src/app/portal/invoices/page.tsx` | Download invoices / receipts |
| `src/app/portal/saved-cards/page.tsx` | Saved payment methods |
| `src/app/portal/requests/page.tsx` | Full request history (all stays) |
| `src/components/portal/request-tracker.tsx` | ETA + assigned staff status + completion confirmation |

**SEO:**

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/[hotelSlug]/sitemap.xml/route.ts` | Dynamic sitemap per hotel |
| `src/app/[hotelSlug]/rooms/[slug]/opengraph-image/route.ts` | OG image per room |
| `src/lib/seo/schema.ts` | JSON-LD schema: Hotel, Room, Offer, Review markup |
| `src/lib/seo/multilingual-meta.ts` | hreflang tags + multilingual meta per page |

---

### 🏗️ B. WEBSITE MANAGEMENT CMS (ยังขาดทั้งหมด)
> Hotel staff จัดการ content เว็บโรงแรมเองได้ — ไม่ต้องขอ dev

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/website/page.tsx` | Website Manager Dashboard: preview + publish status |
| `src/app/dashboard/website/website-client.tsx` | Tabs: หน้าหลัก / ห้องพัก / แกลเลอรี / SEO / สถานที่ / FAQ / นโยบาย |
| `src/app/dashboard/website/homepage/page.tsx` | Homepage editor: hero media, tagline, featured rooms selector |
| `src/app/dashboard/website/rooms/[id]/page.tsx` | Room content editor: description, gallery, amenities, 360 tour URL |
| `src/app/dashboard/website/gallery/page.tsx` | Gallery manager: upload, sort, tag (room/facility/dining/spa) |
| `src/app/dashboard/website/seo/page.tsx` | SEO editor: meta title/desc per page, keywords, schema toggle |
| `src/app/dashboard/website/experiences/page.tsx` | Nearby attractions editor: add/edit/sort |
| `src/app/dashboard/website/faq/page.tsx` | FAQ editor: Q&A drag-and-drop sort |
| `src/app/dashboard/website/policies/page.tsx` | Policies editor: check-in time, cancellation, pet, smoking |
| `src/app/dashboard/website/blog/page.tsx` | Blog editor: WYSIWYG, publish/draft |
| `src/app/dashboard/website/preview/page.tsx` | Live preview: เห็น draft ก่อน publish |
| `src/app/api/website/content/route.ts` | GET/POST/PATCH hotel_content |
| `src/app/api/website/publish/route.ts` | POST: publish draft (requires manager approval) |
| `src/components/website-editor/rich-text.tsx` | WYSIWYG editor (Tiptap) |
| `src/components/website-editor/media-picker.tsx` | เลือก/อัพโหลดรูป + วิดีโอ |
| `src/components/website-editor/seo-preview.tsx` | Preview ว่า Google จะแสดงอย่างไร |

**Revenue Controls (เพิ่มในหน้า website management):**
- [ ] Blackout dates (ปิดห้องบางวัน)
- [ ] Minimum stay rules
- [ ] Member pricing (ราคาพิเศษสำหรับ loyalty tier)

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/website/availability/page.tsx` | Booking rules: min stay, blackout dates, room availability toggle |
| `src/app/dashboard/website/member-pricing/page.tsx` | Member-only rates per tier (Bronze/Silver/Gold/Platinum) |
| `src/app/api/website/booking-rules/route.ts` | GET/POST booking rules |

---

### ⚙️ C. AUTOMATION ENGINE (ยังขาดทั้งหมด)
> Visual rule builder: IF trigger → condition → action

**DB:**
```sql
CREATE TABLE automation_rules (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  enabled      BOOLEAN DEFAULT true,
  trigger_type TEXT NOT NULL,
  -- 'guest_checkout'|'guest_checkin'|'request_created'|'task_completed'
  -- 'time_of_day'|'room_status_change'|'sla_breach'|'new_review'
  trigger_config JSONB DEFAULT '{}',
  conditions   JSONB DEFAULT '[]',  -- [{ field, operator, value }]
  actions      JSONB DEFAULT '[]',  -- [{ type, params }]
  -- action types: 'create_task'|'send_notification'|'assign_staff'|
  --               'send_line'|'escalate'|'update_room_status'|'post_charge'
  retry_count  INT DEFAULT 0,
  last_run_at  TIMESTAMPTZ,
  run_count    INT DEFAULT 0,
  created_by   UUID REFERENCES user_profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE automation_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id      UUID NOT NULL REFERENCES automation_rules(id),
  trigger_data JSONB,
  status       TEXT DEFAULT 'success',  -- 'success'|'failed'|'skipped'
  error        TEXT,
  ran_at       TIMESTAMPTZ DEFAULT now()
);
```

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/automation/page.tsx` | Automation Dashboard: active rules, run history, failure alerts |
| `src/app/dashboard/automation/automation-client.tsx` | List of rules + enable/disable toggle |
| `src/app/dashboard/automation/rules/[id]/page.tsx` | Rule editor: trigger picker, condition builder, action chain |
| `src/app/dashboard/automation/rules/new/page.tsx` | Create new rule (templates: checkout→clean, SLA breach→escalate) |
| `src/app/dashboard/automation/logs/page.tsx` | Run logs: filter by rule, status, date |
| `src/app/api/automation/rules/route.ts` | POST/GET rules |
| `src/app/api/automation/rules/[id]/run/route.ts` | POST: manual trigger for testing |
| `src/lib/automation/runner.ts` | Core engine: evaluate trigger → check conditions → execute actions |
| `src/lib/automation/actions.ts` | Action handlers: createTask, sendNotification, assignStaff, sendLine... |
| `src/lib/automation/triggers.ts` | Trigger listeners: hook into Supabase Realtime + cron events |
| `src/components/automation/rule-builder.tsx` | Visual IF/THEN builder |
| `src/components/automation/trigger-picker.tsx` | Dropdown: เลือก trigger event |
| `src/components/automation/action-chain.tsx` | Chain หลาย actions + retry config |

**Preset Templates:**
```
IF guest_checkout → create housekeeping task (priority: high)
IF sla_breach → notify GM + escalate to next staff
IF new_review (score < 3) → alert guest_relations + create recovery task
IF 08:00 daily → send daily report to owner LINE
IF room_service_ordered → create kitchen + delivery task chain
IF checkin_today → send welcome LINE message
```

---

### 🤖 D. AI OPERATIONAL COPILOT (ขยายจากที่มี)
> ปัจจุบันมีแค่ AI reply stub และ sentiment — ต้องเพิ่ม operational AI ครบ

| ไฟล์ | Feature | Input → Output |
|---|---|---|
| `src/app/api/ai/guest-summary/route.ts` | Guest AI Summary | profile + history → "Mr. Smith พัก 3 ครั้ง ชอบห้องชั้น 5+ แพ้น้ำหอม มีเรื่องร้องเรียนครั้งก่อน" |
| `src/app/api/ai/dispatch-suggest/route.ts` | Dispatch Suggestion | task type + staff availability → แนะนำว่าควรส่งใคร |
| `src/app/api/ai/sla-warning/route.ts` | SLA Risk Prediction | task age + type + staff load → "งาน #123 มีความเสี่ยงสูงที่จะเกิน SLA" |
| `src/app/api/ai/complaint-risk/route.ts` | Complaint Risk Score | chat history + sentiment → คะแนนความเสี่ยง + แนะนำวิธีรับมือ |
| `src/app/api/ai/workload-balance/route.ts` | Workload Balance | staff tasks + availability → แนะนำ rebalance |
| `src/app/api/ai/ops-summary/route.ts` | Operations Summary | daily data → paragraph สรุปวันนี้สำหรับ GM (กี่ request, SLA rate, ปัญหาหลัก) |
| `src/components/ai/copilot-panel.tsx` | Floating copilot panel สำหรับ manager | query + stream response |
| `src/components/ai/guest-summary-card.tsx` | Guest AI summary ที่แสดงตอน check-in | |
| `src/components/ai/ops-briefing.tsx` | Morning briefing widget บน GM dashboard | |

---

### 👤 E. MULTI-ROLE ACCOUNTS + WORKSPACE ARCHITECTURE (ยังขาดทั้งหมด)
> ปัจจุบัน: 1 account = 1 role fixed  
> ที่ต้องการ: 1 account มี role หลายตัว + switch workspace ได้

**DB:**
```sql
-- User สามารถมีหลาย role ในโรงแรมเดียว
CREATE TABLE user_roles (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,
  is_primary   BOOLEAN DEFAULT false,
  granted_by   UUID REFERENCES user_profiles(id),
  created_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, hotel_id, role)
);

-- Active workspace ที่ user เลือกอยู่ตอนนี้
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS active_workspace TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS active_hotel_id UUID REFERENCES hotels(id);
```

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/workspace-switcher.tsx` | Dropdown: เปลี่ยน workspace/role ได้ทันที ไม่ต้อง logout |
| `src/app/api/auth/switch-workspace/route.ts` | POST: เปลี่ยน active_workspace + active_hotel_id |
| `src/lib/workspace.ts` | `getWorkspaceConfig(role)` → sidebar items, dashboard view, permissions |
| `src/middleware.ts` | อัพเดต: ตรวจสอบ active_workspace แทน single role |

**Workspace Definitions:**
```typescript
const WORKSPACES = {
  front_office:   { label: 'Front Office',   roles: ['front_desk','receptionist','reservation_agent'] },
  operations:     { label: 'Operations',     roles: ['housekeeping_manager','housekeeper','room_inspector','maintenance_manager','technician'] },
  management:     { label: 'Management',     roles: ['hotel_owner','general_manager','operations_manager'] },
  marketing_web:  { label: 'Marketing & Web', roles: ['marketing_staff','revenue_manager'] },
  communications: { label: 'Communications', roles: ['chat_admin','guest_relations'] },
  kitchen:        { label: 'Kitchen',        roles: ['fnb_manager','kitchen_staff','room_service_staff'] },
  accounting:     { label: 'Accounting',     roles: ['accounting_manager','accounting_staff','night_auditor'] },
  hr:             { label: 'HR',             roles: ['hr_manager','hr_staff'] },
  it:             { label: 'IT',             roles: ['it_admin','it_support'] },
}
```

---

### 🔔 F. STAFF PRESENCE + CLAIM LOCK + SOUND ALERTS (ยังขาดทั้งหมด)

**DB:**
```sql
CREATE TABLE staff_presence (
  user_id      UUID PRIMARY KEY REFERENCES user_profiles(id) ON DELETE CASCADE,
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  status       TEXT DEFAULT 'offline',  -- 'online'|'busy'|'break'|'offline'
  floor        TEXT,    -- zone/floor ที่ assigned
  zone         TEXT,
  last_seen_at TIMESTAMPTZ DEFAULT now(),
  socket_id    TEXT      -- สำหรับ WebSocket tracking
);

-- Atomic claim lock สำหรับ task
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS claim_expires_at TIMESTAMPTZ;
-- claim lock: expire หลัง 30 วินาทีถ้าไม่มีการยืนยัน
```

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/api/presence/heartbeat/route.ts` | POST: อัพเดต last_seen_at ทุก 30 วินาที |
| `src/app/api/presence/floor/route.ts` | POST: อัพเดต floor/zone assignment |
| `src/app/api/work-orders/[id]/claim/route.ts` | POST: atomic claim lock (race condition safe) |
| `src/app/api/work-orders/[id]/acknowledge/route.ts` | POST: staff กด acknowledge รับทราบ task |
| `src/lib/presence.ts` | Presence helper: heartbeat timer, status management |
| `src/components/live/staff-presence-grid.tsx` | Grid: สีตามสถานะ online/busy/break/offline + floor |
| `src/components/tasks/claim-button.tsx` | Atomic claim: lock → confirm ภายใน 30s → release ถ้าไม่ confirm |
| `src/components/notifications/sound-alert.tsx` | เล่นเสียงแจ้งเตือนเมื่อมี task ใหม่ (Web Audio API) |
| `src/components/notifications/acknowledge-toast.tsx` | Toast ที่ต้องกด "รับทราบ" ก่อนถึงจะหาย |

---

### 🌍 G. PUBLIC SAAS WEBSITE (ยังขาดทั้งหมด)
> maitriapp.com — หน้าขายระบบ ทำให้ hotel สมัครได้เองโดยไม่ต้องติดต่อ sales

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/(marketing)/page.tsx` | Landing page: hero, value prop, social proof, CTA |
| `src/app/(marketing)/pricing/page.tsx` | Pricing: plan comparison table + ROI calculator |
| `src/app/(marketing)/features/hotel-os/page.tsx` | Hotel OS feature showcase |
| `src/app/(marketing)/features/room-qr/page.tsx` | Room QR feature showcase |
| `src/app/(marketing)/features/ai/page.tsx` | AI features showcase |
| `src/app/(marketing)/demo/page.tsx` | Interactive demo: sandboxed hotel data ลองใช้ได้เลยไม่ต้องสมัคร |
| `src/app/(marketing)/demo/dispatch/page.tsx` | Live dispatch demo: แสดง real-time task routing |
| `src/app/(marketing)/case-studies/page.tsx` | Case studies: ตัวอย่างโรงแรมที่ใช้ + ผลลัพธ์ |
| `src/app/(marketing)/blog/page.tsx` | SaaS blog: hotel industry tips, product updates |
| `src/app/(marketing)/trial/page.tsx` | Free trial signup: กรอกข้อมูลโรงแรม → เปิดใช้ทันที |
| `src/components/marketing-site/pricing-table.tsx` | Plan comparison: features per plan |
| `src/components/marketing-site/roi-calculator.tsx` | "โรงแรม X ห้อง ประหยัด Y บาท/เดือน" |
| `src/components/marketing-site/live-demo-widget.tsx` | Embedded live demo |

---

### 🔧 H. GLOBAL-READY ADDITIONS (ที่ยังขาด)

**Custom Domains:**
```sql
CREATE TABLE custom_domains (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id     UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  domain       TEXT NOT NULL UNIQUE,  -- 'www.myhotel.com'
  verified     BOOLEAN DEFAULT false,
  ssl_active   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);
```

| ไฟล์ | รายละเอียด |
|---|---|
| `src/middleware.ts` | อัพเดต: route by custom domain → hotel slug mapping |
| `src/app/api/platform/domains/route.ts` | POST: register domain, GET: verify DNS |
| `src/app/(platform)/domains/page.tsx` | Domain management (platform admin) |
| `src/lib/timezone.ts` | Timezone-aware datetime helpers (แสดงเวลาตาม timezone โรงแรม) |
| `src/lib/currency.ts` | Multi-currency formatter: amount + currency code → localized string |
| `src/app/api/auth/sso/route.ts` | SSO endpoint (SAML/OAuth สำหรับ hotel chains) |
| `src/app/dashboard/security/2fa/page.tsx` | 2FA setup: TOTP (Google Authenticator) |
| `src/app/api/auth/2fa/route.ts` | POST: enable/verify/disable TOTP |
| `src/app/(platform)/marketplace/page.tsx` | Integration marketplace: browse + install add-ons |

---

### 📊 UPDATED GRAND TOTAL

| Category | มีอยู่แล้ว | Phase 1 | Phase 1 Add | Integration Stubs | Phase 2 | Phase 3 | Master Gaps | **Grand Total** |
|---|---|---|---|---|---|---|---|---|
| DB Tables | 30+ | 9 | — | 7 | 18 | 15 | 8 | **87+** |
| API Routes | 20+ | 20 | 12 | — | 38 | 24 | 15 | **129+** |
| Pages/Clients | 30+ | 18 | 14 | — | 44 | 28 | 32 | **166+** |
| Components | 40+ | 12 | 8 | — | 32 | 20 | 20 | **132+** |

---

*อัพเดตล่าสุด: 2026-05-14 | Branch: `claude/audit-consolidate-docs-mj9Dt`*


---

# P1 — Critical Production Core

## Multi-Property Foundation
- [ ] Hotel Group Management
- [ ] Multi-property dashboard
- [ ] Cross-property analytics
- [ ] Shared guest profiles
- [ ] Centralized staff management

## Reliability / Disaster Recovery
- [ ] Automated backup system
- [ ] Point-in-time restore
- [ ] Queue retry system
- [ ] Failed webhook recovery
- [ ] OTA retry queue
- [ ] Cron health monitoring
- [ ] Service status dashboard
- [ ] Emergency maintenance mode

## Enterprise Security
- [ ] MFA enforcement
- [ ] Device/session management
- [ ] IP allowlist
- [ ] Brute-force protection
- [ ] Security alerts
- [ ] Guest data export/delete
- [ ] PDPA consent center

## Core Product Rules
- [ ] Mobile-first ทุกหน้า
- [ ] ทุก action ต้องมี audit log
- [ ] ทุก API ต้อง rate-limited
- [ ] ทุก cron ต้อง monitor ได้
- [ ] ทุก integration ต้อง retry ได้

---

# P2 — Market Competitive Features

## Advanced Booking Experience
- [ ] Room comparison UI
- [ ] Rich room gallery
- [ ] Video room preview
- [ ] Smart room recommendation
- [ ] Upsell engine
- [ ] Add-on packages
- [ ] Dynamic checkout UI
- [ ] Guest wishlist/favorites
- [ ] Real-time availability calendar
- [ ] Agoda/Trip-style checkout UX

## Analytics / BI
- [ ] Custom dashboard builder
- [ ] Occupancy heatmaps
- [ ] Revenue forecasting AI
- [ ] Labor cost analytics
- [ ] OTA profitability reports
- [ ] KPI benchmarking
- [ ] Revenue anomaly detection

## Workflow Automation
- [ ] Visual automation builder
- [ ] Auto task assignment
- [ ] Smart housekeeping dispatch
- [ ] Auto guest reminders
- [ ] Auto room upgrade
- [ ] Scheduled workflows
- [ ] SLA escalation automation

## Customer Experience / Loyalty
- [ ] Loyalty tiers
- [ ] Rewards points
- [ ] Personalized offers
- [ ] VIP recognition
- [ ] Referral system
- [ ] Guest preference memory

---

# P3 — Platform Expansion & Ecosystem

## Public API & Integration Platform
- [ ] Public REST API
- [ ] API Keys management
- [ ] OAuth integrations
- [ ] Webhook subscriptions
- [ ] API usage analytics
- [ ] Zapier integration
- [ ] n8n integration
- [ ] Integration sandbox
- [ ] Developer portal

## AI Hotel Copilot
- [ ] AI occupancy analysis
- [ ] AI pricing suggestions
- [ ] AI staffing suggestions
- [ ] AI operational summaries
- [ ] AI revenue recommendations
- [ ] AI anomaly detection
- [ ] AI smart search across PMS

## Marketplace / Add-ons
- [ ] Plugin marketplace
- [ ] Theme marketplace
- [ ] Paid add-ons
- [ ] White-label modules
- [ ] Hotel app store

## Offline & Low Connectivity Support
- [ ] Offline reservation cache
- [ ] Offline housekeeping mode
- [ ] Sync when reconnect
- [ ] Local queue persistence
- [ ] Low-bandwidth mode


---

# FEATURE MASTER TRACKING

## STATUS LEGEND
- [ ] ยังไม่เริ่ม
- [-] กำลังทำ
- [x] เสร็จแล้ว

---

# CORE HOTEL OPERATIONS

## Reservations
- [ ] Reservation lifecycle
- [ ] Walk-in booking
- [ ] Group booking
- [ ] Reservation modification
- [ ] Cancellation workflow
- [ ] No-show workflow

## Front Desk
- [ ] Check-in workflow
- [ ] Check-out workflow
- [ ] Room move
- [ ] Deposit handling
- [ ] Shift handover

## Housekeeping
- [ ] Housekeeping board
- [ ] Mobile housekeeping mode
- [ ] Room inspection
- [ ] Lost & found

---

# GUEST EXPERIENCE

## Booking Engine
- [ ] Mobile-first booking UI
- [ ] Room comparison UI
- [ ] Rich room gallery
- [ ] Promo codes
- [ ] Add-on packages
- [ ] Upsell engine
- [ ] Agoda/Trip-style checkout

## Guest Portal
- [ ] Guest login/register
- [ ] Booking history
- [ ] Modify booking
- [ ] Cancel booking
- [ ] Digital invoices
- [ ] Guest messaging

## Loyalty
- [ ] Loyalty tiers
- [ ] Reward points
- [ ] VIP guest recognition

---

# PAYMENTS & ACCOUNTING

## Payments
- [ ] Omise integration
- [ ] Stripe integration
- [ ] PromptPay QR
- [ ] Refund workflow

## Accounting
- [ ] Folio system
- [ ] Cashier session
- [ ] Night audit
- [ ] Revenue reports

---

# OTA & CHANNEL MANAGER

## OTA Integrations
- [ ] Booking.com
- [ ] Agoda
- [ ] Airbnb
- [ ] Expedia

## OTA Features
- [ ] Room mapping
- [ ] Rate mapping
- [ ] Inventory sync
- [ ] Duplicate booking detection

---

# AI & COMMUNICATIONS

## Omnichannel Inbox
- [ ] LINE integration
- [ ] WhatsApp integration
- [ ] Unified inbox
- [ ] AI suggested reply

## AI Hotel Copilot
- [ ] AI occupancy analysis
- [ ] AI pricing suggestions
- [ ] AI operational summaries

---

# SAAS PLATFORM

## Tenant Management
- [ ] Multi-tenant support
- [ ] Hotel groups
- [ ] Tenant billing
- [ ] Feature flags

## Owner Dashboard
- [ ] MRR dashboard
- [ ] Churn analytics
- [ ] SaaS admin panel

---

# SECURITY & RELIABILITY

## Security
- [ ] RBAC permissions
- [ ] MFA enforcement
- [ ] Audit logging

## Reliability
- [ ] Automated backups
- [ ] Queue retry system
- [ ] Cron monitoring

---

# API & ECOSYSTEM

## Developer Platform
- [ ] Public REST API
- [ ] API keys
- [ ] Webhook subscriptions

## Marketplace
- [ ] Plugin marketplace
- [ ] Theme marketplace



---

# IMPLEMENTATION FILE TRACKING — NEW FEATURES

## วิธีใช้ส่วนนี้
- `[x]` = มีไฟล์/โค้ดในโปรเจคแล้ว แต่ยังควรตรวจ business logic อีกครั้ง
- `[ ]` = ยังไม่พบไฟล์ตาม path ที่กำหนด หรือยังต้องสร้างเพิ่ม
- `[-]` = กำลังทำ / partial
- ทุกครั้งที่ implement เสร็จ ให้เปลี่ยน checkbox หน้าไฟล์นั้นทันที
- ถ้าไฟล์อยู่คนละ path ให้ใส่ `Actual Path` เพิ่มไว้ด้านหลัง
- ห้ามติ๊ก `[x]` แค่เพราะสร้างไฟล์เปล่า ต้องมี logic ใช้งานจริงด้วย

---

## AI & COMMUNICATIONS — Unified Inbox File Checklist

**หน้าหลัก:** `src/app/dashboard/inbox/`

| สถานะ | ไฟล์ | ฟีเจอร์ | หมายเหตุ |
|---|---|---|---|
| [x] | `src/app/dashboard/inbox/page.tsx` | Server: ดึง conversations ทุก platform | พบไฟล์แล้ว แต่ใช้ `@/components/inbox/inbox-client` |
| [x] | `src/components/inbox/inbox-client.tsx` | Unified inbox UI | พบไฟล์จริงใน path นี้ |
| [ ] | `src/app/dashboard/inbox/inbox-client.tsx` | Unified inbox UI | path ที่ลิสไว้ยังไม่มี ถ้าจะใช้ path นี้ต้องย้าย/สร้าง |
| [ ] | `src/app/dashboard/inbox/[id]/page.tsx` | Single conversation + guest profile | ยังไม่พบไฟล์ |
| [ ] | `src/app/api/inbox/messages/route.ts` | GET/POST messages | ยังไม่พบไฟล์ |
| [ ] | `src/app/api/inbox/assign/route.ts` | Assign to dept/staff | ยังไม่พบไฟล์ |
| [ ] | `src/app/api/inbox/webhooks/line/route.ts` | LINE webhook | ยังไม่พบไฟล์ |
| [ ] | `src/app/api/inbox/webhooks/whatsapp/route.ts` | WhatsApp Business webhook | ยังไม่พบไฟล์ |
| [ ] | `src/app/api/inbox/webhooks/facebook/route.ts` | Facebook Messenger webhook | ยังไม่พบไฟล์ |
| [ ] | `src/app/api/inbox/ai-reply/route.ts` | POST: AI suggested reply | ยังไม่พบไฟล์ |

### Required Completion Rules
- [ ] Single conversation page ต้องเปิด conversation ตาม `id` ได้จริง
- [ ] ต้องแสดง guest profile ข้าง conversation
- [ ] GET `/api/inbox/messages` ต้องดึง message ตาม conversation/hotel/tenant ได้
- [ ] POST `/api/inbox/messages` ต้องส่ง message และบันทึก audit log
- [ ] Assign API ต้องเช็ค RBAC ก่อน assign
- [ ] Webhook ทุกช่องต้อง verify signature/token
- [ ] Webhook ทุกช่องต้องกัน duplicate event
- [ ] AI suggested reply ต้องไม่ auto-send ทันที ต้องให้ staff กดยืนยันก่อน
- [ ] ทุก API ต้องมี tenant isolation
- [ ] ทุก action สำคัญต้องเขียน audit log

---

## AI & COMMUNICATIONS — Suggested Implementation Paths

| สถานะ | ไฟล์ | หน้าที่ |
|---|---|---|
| [ ] | `src/lib/inbox/normalize-message.ts` | normalize ข้อความจาก LINE/WhatsApp/Facebook ให้เป็น format กลาง |
| [ ] | `src/lib/inbox/webhook-verify.ts` | verify signature/token ของ webhook |
| [ ] | `src/lib/inbox/inbox-service.ts` | service กลางสำหรับ conversations/messages |
| [ ] | `src/lib/inbox/ai-reply-service.ts` | logic เรียก AI เพื่อสร้าง suggested reply |
| [ ] | `src/lib/inbox/assignment-service.ts` | logic assign conversation ให้ staff/department |
| [ ] | `src/lib/inbox/tenant-guard.ts` | ตรวจ hotel/organization ก่อน query ข้อมูล |
| [ ] | `src/lib/inbox/dedupe.ts` | กัน webhook event ซ้ำ |
| [ ] | `src/lib/inbox/audit.ts` | helper สำหรับเขียน audit log |

---

## AI & COMMUNICATIONS — Database Tracking

| สถานะ | Table / Migration | ใช้ทำอะไร |
|---|---|---|
| [ ] | `conversations` | เก็บ thread/conversation ทุก platform |
| [ ] | `conversation_messages` | เก็บ message รายข้อความ |
| [ ] | `conversation_assignments` | เก็บ assign staff/department |
| [ ] | `conversation_participants` | map guest/staff/channel |
| [ ] | `channel_connections` | เก็บ config LINE/WhatsApp/Facebook |
| [ ] | `webhook_events` | เก็บ webhook raw event + dedupe key |
| [ ] | `ai_reply_suggestions` | เก็บ suggested reply ก่อน staff ส่งจริง |
| [ ] | `audit_logs` | บันทึก action สำคัญ |

---

## AI & COMMUNICATIONS — Test Checklist

| สถานะ | Test | ต้องตรวจอะไร |
|---|---|---|
| [ ] | Inbox page render test | หน้า inbox โหลดได้เมื่อ login แล้ว |
| [ ] | Tenant isolation test | staff โรงแรม A เห็นเฉพาะ conversation ของตัวเอง |
| [ ] | Message GET test | ดึง messages ได้ถูก conversation |
| [ ] | Message POST test | ส่ง message แล้วบันทึก DB |
| [ ] | Assign API test | assign staff/dept ได้ และกัน permission ผิด |
| [ ] | LINE webhook test | รับ event แล้วสร้าง conversation/message |
| [ ] | WhatsApp webhook test | รับ event แล้วสร้าง conversation/message |
| [ ] | Facebook webhook test | รับ event แล้วสร้าง conversation/message |
| [ ] | AI reply test | สร้าง suggested reply ได้ แต่ไม่ auto-send |
| [ ] | Duplicate webhook test | event ซ้ำไม่สร้าง message ซ้ำ |
| [ ] | Audit log test | action สำคัญถูกบันทึกครบ |

---

