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
- GM Command Center, Operations Manager view, Owner Dashboard with AI summaries
- Reservation Agent role + full booking module
- Chat Admin / Omnichannel Inbox with AI replies, SLA timer, translations
- Room Inspector app, Housekeeper mobile view
- Technician mobile view, parts tracking
- Kitchen Queue / KDS
- Room Service Delivery app
- Restaurant POS (table orders, room charge, split bill)
- Bellboy / Porter tasks
- Transport Staff app
- Revenue Manager tools (competitor pricing, dynamic pricing, OTA performance)
- Marketing tools (campaigns, abandoned bookings, LINE campaigns)
- Accounting OS (folio, cashier close, tax invoices, reconciliation)
- Night Audit full flow
- Spa full (treatment rooms, therapist assignment)
- HR full (onboarding, training mode, payroll)
- IT Support tickets

### ❌ ยังขาดทั้งหมด (SaaS Platform — app.maitriapp.com/owner)
- Platform Owner Control Center (MRR, churn, AI usage, webhook failures)
- Billing Admin (failed payments, subscription lifecycle, refunds, credits)
- Support Admin (impersonation, diagnostics, onboarding)
- Platform Ops Admin (uptime, queue, WebSocket health, OTA health)
- Security Admin (access logs, session revocation, API abuse)
- Sales Admin CRM (hotel leads, demos, trial tracking, onboarding pipeline)
- Product Admin (feature flags, A/B testing, module toggles)
- Developer / Engineering Admin (logs, deployments, webhook replay)

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
- Platform filter: All / LINE / WhatsApp / Facebook / Website Chat / Room QR / OTA / Email
- SLA response timer (ไฟเขียว/เหลือง/แดง ตามเวลาที่เหลือ)
- AI reply suggestion button (เรียก Claude API → แนะนำข้อความตอบ)
- Auto-translation toggle (แปลเป็นภาษาที่พนักงานเข้าใจ)
- Guest timeline sidebar: ประวัติการเข้าพัก, requests, เรื่องร้องเรียน
- Booking context: หากแชทจาก OTA → แสดง reservation ที่เชื่อมโยง
- Convert to request: ส่งงานไปยังแผนกที่รับผิดชอบ
- Follow-up reminder: ตั้งเวลาเตือนติดตาม
- Canned responses: ข้อความสำเร็จรูปแยกตาม category

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
- Reassign task (drag & drop หรือ modal)
- Override SLA (เพิ่มเวลา + หมายเหตุ)
- Approve room block / upgrade / late checkout / discount
- Broadcast internal announcement

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
- Tab: Transportation — จองรถ, airport transfer, tour
- Tab: Luggage — สั่ง bellboy ไปรับ/ส่งกระเป๋า
- Tab: Restaurant Reservations — จองร้านอาหารนอก
- Tab: Local Recommendations — ข้อมูล curated ตาม preference
- Tab: VIP Tasks — checklist สำหรับ VIP guest
- Integration กับ transport tasks + bellboy tasks (auto-create)

---

### 2.8 Security (Enhanced)

**ปรับปรุง `security-client.tsx`:**
- Tab: Incidents — report, update, escalate
- Tab: Visitors — register, checkout
- Tab: Patrol Log — checkpoint list, timer, notes per point
- Tab: Emergency — ปุ่ม Emergency Alert (broadcast ไปยัง GM + security team)
- Tab: Lost & Found — ประสานกับ Housekeeping

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
- Suspend/unsuspend hotel
- Feature flags (per org หรือ global rollout%)
- Plan management (upgrade/downgrade)
- Impersonation (login as hotel_owner)
- Billing override (add credits, extend trial)
- Quota management (max seats, AI calls, QR scans)
- AI limits per plan
- Maintenance mode (hotel-level หรือ global)

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

*อัพเดตล่าสุด: 2026-05-14 | Branch: `claude/audit-consolidate-docs-mj9Dt`*
