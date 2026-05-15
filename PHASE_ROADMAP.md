# Hotel System — Complete Implementation Roadmap v2
> เปรียบเทียบกับ target spec เต็มรูปแบบ: Hotel OS + SaaS Platform  
> Branch: `claude/audit-consolidate-docs-mj9Dt`  
> อัพเดต: 2026-05-15

---

## GAP ANALYSIS — สถานะปัจจุบัน (อัพเดต 2026-05-15)

### ✅ เสร็จสมบูรณ์ — Hotel OS Core

| ระบบ | ไฟล์หลัก | สถานะ |
|---|---|---|
| Auth / Login | `src/app/auth/` | ✅ เต็ม |
| Role-Adaptive Dashboard (35 roles) | `src/app/dashboard/page.tsx` | ✅ เต็ม |
| Staff Profile (5 tabs) | `src/app/dashboard/profile/` | ✅ เต็ม |
| Reservations + Group Booking | `src/app/dashboard/reservations/` + `group-bookings/` | ✅ มีทั้ง basic + group |
| Rooms | `src/app/dashboard/rooms/` | ✅ มี |
| Guests + Blacklist | `src/app/dashboard/guests/` + `guests/blacklist/` | ✅ มี |
| Front Desk | `src/app/dashboard/front-desk/` | ✅ มี (ขาด full cashier) |
| Housekeeping | `src/app/dashboard/housekeeping/` | ✅ มี (ขาด inspector/minibar) |
| Maintenance | `src/app/dashboard/maintenance/` | ✅ มี (ขาด parts/photos) |
| Concierge | `src/app/dashboard/concierge/` | ✅ มี |
| Security | `src/app/dashboard/security/` | ✅ มี (ขาด patrol UI) |
| Live Board (GM Command Center) | `src/app/dashboard/live-board/` | ✅ เต็ม + Realtime |
| Work Orders + Task Auto-Router | `src/app/dashboard/work-orders/` + `my-tasks/` | ✅ เต็ม |
| Attendance + Geofence Clock | `src/app/dashboard/attendance/` | ✅ เต็ม |
| Shift Management | `src/app/dashboard/shift-management/` | ✅ เต็ม |
| Leave Management | `src/app/dashboard/leave/` | ✅ เต็ม |
| Document Library | `src/app/dashboard/documents/` | ✅ เต็ม |
| Internal Requests | `src/app/dashboard/internal-requests/` | ✅ เต็ม |
| Announcements | `src/app/dashboard/announcements/` | ✅ เต็ม |
| Inbox (Omnichannel) | `src/app/dashboard/inbox/` | ✅ มี (ขาด SLA timer / webhook integrations) |
| Guest Recovery | `src/app/dashboard/guest-recovery/` | ✅ เต็ม |
| Duty Log | `src/app/dashboard/duty-log/` | ✅ เต็ม |
| Compliance (TM30 + PDPA) | `src/app/dashboard/compliance/` | ✅ เต็ม |
| F&B Menu | `src/app/dashboard/fb/` | ✅ มี menu |
| Spa (basic) | `src/app/dashboard/spa/` | ✅ มี bookings + services |
| Revenue (basic) | `src/app/dashboard/revenue/` | ✅ มี |
| Marketing (basic) | `src/app/dashboard/marketing/` | ✅ มี |
| Reports | `src/app/dashboard/reports/` | ✅ มี |
| Loyalty | `src/app/dashboard/loyalty/` | ✅ มี |
| Analytics | `src/app/dashboard/analytics/` | ✅ มี |
| Branding | `src/app/dashboard/branding/` | ✅ มี |
| Settings + Localization | `src/app/dashboard/settings/` + `localization/` | ✅ มี |
| RBAC + Permission Simulator | `src/app/dashboard/rbac/` + `permission-simulator/` | ✅ มี |
| Audit Trail | `src/app/dashboard/audit-trail/` | ✅ มี |
| Billing (subscription) | `src/app/dashboard/billing/` | ✅ มี |
| IoT | `src/app/dashboard/iot/` | ✅ มี |
| OTA (Booking.com / Agoda / Airbnb) | `src/app/api/ota/` | ✅ เต็ม |
| Payments (Stripe / Omise / PromptPay) | `src/app/api/payments/` | ✅ เต็ม |
| Webhooks (LINE / WhatsApp / OTA) | `src/app/api/webhooks/` | ✅ มี (receive only) |
| Night Audit (cron) | `src/app/api/cron/night-audit/` | ✅ มี cron |
| Portal (folio / requests / compendium / AI chat) | `src/app/portal/` | ✅ เต็ม |
| AI (review reply / sentiment / concierge / suggest) | `src/app/api/ai/` | ✅ Claude Haiku |
| Team Management + Invite | `src/app/api/team/` | ✅ เต็ม |
| DB Migrations (Phase 1) | `supabase/migrations/2026060*` | ✅ ครบ 5 migrations |

---

### ⚠️ มีแต่ยังไม่ครบ — ต้องทำใน Phase 2

| ระบบ | ไฟล์ | สิ่งที่ขาด |
|---|---|---|
| Front Desk (full) | `front-desk/` | Keycard modal, full cashier close, room upgrade UI |
| Housekeeping (full) | `housekeeping/` | Inspector app, minibar charge to folio, laundry batches, photo workflow |
| Maintenance (full) | `maintenance/` | Parts inventory, before/after photo upload, PM schedule, technician claim view |
| Inbox (full) | `inbox/` | SLA countdown timer, AI reply button, translation toggle, guest timeline sidebar |
| Security (full) | `security/` | Patrol checklist UI, Emergency broadcast button |
| Spa (full) | `spa/` | Treatment room grid, therapist schedule, guest preference notes |
| Revenue (full) | `revenue/` | Competitor pricing table, dynamic pricing rules builder |
| HR (full) | `team/` | Payroll, performance reviews, onboarding checklist, training records |
| F&B (full) | `fb/` | KDS (kitchen display), room service delivery queue, restaurant POS |

---

### ❌ ยังไม่มีเลย — ต้องสร้างใน Phase 2

| ระบบ | ไฟล์ที่ต้องสร้าง | Phase |
|---|---|---|
| Bellboy / Porter Dashboard | `src/app/dashboard/bellboy/` + `src/app/api/bellboy/` | 2.5 |
| Transport Staff Dashboard | `src/app/dashboard/transport/` + `src/app/api/transport/` | 2.6 |
| Kitchen / KDS | `src/app/dashboard/kitchen/` + `src/app/api/fnb/orders/[id]/status/` | 2.4 |
| Room Service Staff | `src/app/dashboard/room-service/` + `src/app/api/fnb/delivery/` | 2.4 |
| Restaurant POS | `src/app/dashboard/restaurant/` + `src/app/api/fnb/restaurant/` | 2.4 |
| IT Support (tickets + devices) | `src/app/dashboard/it/` + `src/app/api/it/` | 2.11 |
| HR Full Module | `src/app/dashboard/hr/` + `src/app/api/hr/` | 2.10 |
| Purchasing | `src/app/dashboard/purchasing/` + `src/app/api/purchasing/` | 2.15 |
| Advanced CRM | `src/app/dashboard/crm/` | 3.11 |

---

### ❌ ยังไม่มีเลย — ต้องสร้างใน Phase 3 (SaaS Platform)

| ระบบ | Route | Phase |
|---|---|---|
| Platform Owner Control Center | `src/app/(platform)/dashboard/` | 3.2 |
| Billing Admin | `src/app/(platform)/billing/` | 3.3 |
| Support Admin + Impersonation | `src/app/(platform)/support/` | 3.4 |
| Platform Ops Admin | `src/app/(platform)/operations/` | 3.5 |
| Security Admin | `src/app/(platform)/security/` | 3.6 |
| Sales Admin CRM | `src/app/(platform)/sales/` | 3.7 |
| Product Admin (feature flags / A/B) | `src/app/(platform)/product/` | 3.8 |
| Developer / Engineering Admin | `src/app/(platform)/engineering/` | 3.9 |
| Night Audit (full UI) | `src/app/dashboard/night-audit/` | 3.10 |
| Advanced CRM + Loyalty Full | `src/app/dashboard/crm/` | 3.11 |

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

## PHASE 1 — Core Daily Operations ✅ เสร็จแล้ว
**ระยะเวลา:** 4–6 สัปดาห์  
**เป้าหมาย:** ทุก role เข้าระบบได้และทำงานพื้นฐานได้  
**สถานะ:** ✅ 1.1–1.3, 1.5–1.8 เสร็จ | ⚠️ 1.4 Inbox (ยังไม่ครบ webhooks/AI)

### Phase 1 Additions — ✅ ทำเพิ่มเติม

| ฟีเจอร์ | ไฟล์ | สถานะ |
|---|---|---|
| Guest Recovery | `src/app/dashboard/guest-recovery/` | ✅ เสร็จแล้ว |
| Guest Blacklist | `src/app/dashboard/guests/blacklist/` + `src/app/api/guests/[id]/blacklist/` | ✅ เสร็จแล้ว |
| Compliance TM30 | `src/app/dashboard/compliance/tm30/` | ✅ เสร็จแล้ว |
| Compliance PDPA | `src/app/dashboard/compliance/pdpa/` + `src/app/api/compliance/pdpa/consent/` | ✅ เสร็จแล้ว |
| Duty Log | `src/app/dashboard/duty-log/` | ✅ เสร็จแล้ว |
| AI Review Reply | `src/app/api/ai/review-reply/` | ✅ Claude Haiku |
| AI Sentiment | `src/app/api/ai/sentiment/` | ✅ Claude Haiku |
| Portal Folio | `src/app/portal/folio/` + `express-checkout/` | ✅ เสร็จแล้ว |
| Portal Request Tracker | `src/app/portal/requests/[id]/` + `src/components/portal/request-tracker.tsx` | ✅ Realtime |
| Portal Compendium | `src/app/portal/compendium/` | ✅ เสร็จแล้ว |
| Portal AI Chat | `src/components/portal/ai-chat-widget.tsx` + `src/app/api/portal/chat/` | ✅ Claude Haiku |
| VIP Alert Banner | `src/components/dashboard/vip-alert-banner.tsx` | ✅ เสร็จแล้ว |
| Geofence Clock | `src/components/attendance/geofence-clock.tsx` + `src/lib/geofence.ts` | ✅ GPS |
| Checklist Templates | `src/lib/checklist-templates.ts` | ✅ เสร็จแล้ว |
| SLA Widget | `src/app/dashboard/live-board/sla-widget.tsx` | ✅ เสร็จแล้ว |
| 35-Role Migration | `supabase/migrations/20260601400000_roles_expanded.sql` | ✅ เสร็จแล้ว |
| Leave/Docs Migration | `supabase/migrations/20260601300000_leave_documents.sql` | ✅ เสร็จแล้ว |

---

### ✅ 1.1 Role-Adaptive Dashboard (ขยายจากที่มี)

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

### ✅ 1.2 Attendance & Shift System
*(รายละเอียดเหมือนเดิม — ครบอยู่แล้ว)*

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/attendance/` | ✅ เสร็จแล้ว |
| `src/app/dashboard/shift-management/` | ✅ เสร็จแล้ว |
| `src/app/api/attendance/clock/route.ts` | ✅ เสร็จแล้ว |
| `src/app/api/shifts/` | ✅ เสร็จแล้ว |

---

### ✅ 1.3 Task Auto-Router + Work Order System

| ไฟล์ | สถานะ |
|---|---|
| `src/lib/task-router.ts` | ✅ เสร็จแล้ว |
| `src/app/api/work-orders/route.ts` | ✅ เสร็จแล้ว |
| `src/app/api/work-orders/[id]/route.ts` | ✅ เสร็จแล้ว |
| `src/app/dashboard/work-orders/page.tsx` | ✅ เสร็จแล้ว |
| `src/app/dashboard/my-tasks/page.tsx` | ✅ เสร็จแล้ว (housekeeper/technician/bellboy view) |
| `src/components/tasks/task-card.tsx` | ✅ เสร็จแล้ว |
| `src/components/tasks/photo-upload.tsx` | ✅ เสร็จแล้ว (before/after photos) |

**Photo Upload Flow:** พนักงานอัพโหลดรูป → Supabase Storage → URL บันทึกใน `task_photos`

---

### ⚠️ 1.4 Omnichannel Inbox — Chat Admin
*(โครงสร้างหลักมีอยู่แล้ว — webhook integrations / AI reply / SLA timer ยังไม่ครบ)*

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

### ✅ 1.5 Leave Management

| ไฟล์ | สถานะ |
|---|---|
| `src/app/api/leave/route.ts` | ✅ เสร็จแล้ว |
| `src/app/api/leave/[id]/route.ts` | ✅ เสร็จแล้ว |
| `src/app/dashboard/leave/page.tsx` | ✅ เสร็จแล้ว |
| `src/app/dashboard/leave/leave-client.tsx` | ✅ เสร็จแล้ว |

---

### ✅ 1.6 Document & Request Workflow

| ไฟล์ | สถานะ |
|---|---|
| `src/app/api/documents/route.ts` | ✅ เสร็จแล้ว |
| `src/app/api/documents/[id]/route.ts` | ✅ เสร็จแล้ว |
| `src/app/api/internal-requests/route.ts` | ✅ เสร็จแล้ว |
| `src/app/api/internal-requests/[id]/route.ts` | ✅ เสร็จแล้ว |
| `src/app/dashboard/documents/page.tsx` | ✅ เสร็จแล้ว |
| `src/app/dashboard/documents/documents-client.tsx` | ✅ เสร็จแล้ว |
| `src/app/dashboard/internal-requests/page.tsx` | ✅ เสร็จแล้ว |
| `src/app/dashboard/internal-requests/internal-requests-client.tsx` | ✅ เสร็จแล้ว |

---

### ✅ 1.7 Announcements

| ไฟล์ | สถานะ |
|---|---|
| `src/app/api/announcements/route.ts` | ✅ เสร็จแล้ว |
| `src/app/api/announcements/[id]/route.ts` | ✅ เสร็จแล้ว |
| `src/app/dashboard/announcements/page.tsx` | ✅ เสร็จแล้ว |
| `src/app/dashboard/announcements/announcements-client.tsx` | ✅ เสร็จแล้ว |

---

### ✅ 1.8 Manager Live Board (GM Command Center)

**สำหรับ:** `general_manager`, `operations_manager`, `hotel_owner`

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/live-board/page.tsx` | ✅ เสร็จแล้ว |
| `src/app/dashboard/live-board/live-board-client.tsx` | ✅ เสร็จแล้ว — Supabase Realtime |
| `src/components/live/occupancy-map.tsx` | ✅ เสร็จแล้ว |
| `src/components/live/staff-status-grid.tsx` | ✅ เสร็จแล้ว |
| `src/components/live/task-queue-widget.tsx` | ✅ เสร็จแล้ว |
| `src/components/live/alerts-feed.tsx` | ✅ เสร็จแล้ว |
| `src/components/live/vip-arrivals-widget.tsx` | ✅ เสร็จแล้ว |
| `src/components/live/emergency-alert-bar.tsx` | ✅ เสร็จแล้ว |

**GM Controls (เพิ่มใน live-board-client.tsx):**
- Reassign task (drag & drop หรือ modal)
- Override SLA (เพิ่มเวลา + หมายเหตุ)
- Approve room block / upgrade / late checkout / discount
- Broadcast internal announcement

---

## PHASE 2 — Department Modules (Full) ✅ เสร็จแล้ว
**ระยะเวลา:** 8–10 สัปดาห์  
**เป้าหมาย:** ทุกแผนกมีหน้าทำงานครบ + mobile-friendly  
**สถานะ:** ✅ ทุก section เสร็จ (2.1–2.15)

### Phase 2 DB Migrations — ✅ ครบ
| Migration | ตาราง |
|---|---|
| `20260701000000_hr_module.sql` | ✅ payroll_periods, payroll_items, performance_reviews, training_records, onboarding_tasks |
| `20260701100000_accounting_full.sql` | ✅ cashier_sessions, tax_invoices, expense_categories, expense_items, journal_entries |
| `20260701200000_housekeeping_full.sql` | ✅ linen_inventory, lost_found, minibar_templates, laundry_batches |
| `20260701300000_engineering_full.sql` | ✅ parts_inventory, parts_usage_log, preventive_maintenance, equipment_inventory |
| `20260701400000_fnb_full.sql` | ✅ kitchen_queue, restaurant_tables, restaurant_orders |
| `20260701500000_purchasing.sql` | ✅ suppliers, purchase_orders, inventory_items, stock_transactions |
| `20260701600000_transport_bellboy.sql` | ✅ transport_tasks, luggage_tasks |
| `20260701700000_revenue_marketing.sql` | ✅ occupancy_forecast, channel_rates, abandoned_bookings, competitor_rates, dynamic_pricing_rules |
| `20260701800000_it_support.sql` | ✅ support_tickets_internal, device_registry |

---

### ✅ 2.1 Front Desk / Reservation (Full)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/front-desk/front-desk-enhanced-client.tsx` | ✅ Keycard, Room Upgrade, Cashier tabs |
| `src/app/api/front-desk/keycard/route.ts` | ✅ เสร็จแล้ว |
| `src/app/api/front-desk/room-upgrade/route.ts` | ✅ เสร็จแล้ว |
| `src/app/api/front-desk/cashier/route.ts` | ✅ เสร็จแล้ว |
| `src/components/front-desk/cashier-session.tsx` | เปิด/ปิดกะ cashier |

---

### ✅ 2.2 Housekeeping (Full)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/housekeeping/inspect/page.tsx` + `inspect-client.tsx` | ✅ Room Inspector — 5-star score, approve/reject |
| `src/app/dashboard/housekeeping/lost-found/page.tsx` + `lost-found-client.tsx` | ✅ Lost & Found — claim/donate/dispose |
| `src/app/dashboard/housekeeping/laundry/page.tsx` + `laundry-client.tsx` | ✅ Laundry batches — collect/send/return |
| `src/app/api/housekeeping/inspect/route.ts` | ✅ GET awaiting + POST inspection result |
| `src/app/api/housekeeping/minibar/route.ts` | ✅ GET templates + POST charge to folio |
| `src/app/api/housekeeping/lost-found/route.ts` | ✅ GET/POST/PATCH status |
| `src/app/api/housekeeping/laundry/route.ts` | ✅ GET/POST/PATCH status |
| `src/app/api/housekeeping/tasks/[id]/photos/route.ts` | ✅ Append photo_urls array |

---

### ✅ 2.3 Engineering / Maintenance (Full)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/maintenance/my-repairs/page.tsx` + `repairs-client.tsx` | ✅ Technician view — claim, photos, parts |
| `src/app/dashboard/maintenance/parts/page.tsx` + `parts-client.tsx` | ✅ Parts inventory + low-stock alert |
| `src/app/dashboard/maintenance/pm/page.tsx` + `pm-client.tsx` | ✅ PM Schedule — overdue/upcoming color coding |
| `src/app/api/maintenance/parts/route.ts` | ✅ GET/POST + low stock filter |
| `src/app/api/maintenance/parts/use/route.ts` | ✅ POST: deduct qty + log usage |
| `src/app/api/maintenance/pm/route.ts` | ✅ GET/POST/PATCH (mark done, compute next_due) |
| `src/app/api/maintenance/requests/[id]/route.ts` | ✅ PATCH: claim/start/complete + photos |

---

### ✅ 2.4 F&B — Kitchen, Room Service, Restaurant (Full)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/kitchen/page.tsx` + `kitchen-client.tsx` | ✅ KDS — Kanban new/preparing/ready, allergy tags, live timer |
| `src/app/dashboard/room-service/page.tsx` + `room-service-client.tsx` | ✅ Delivery queue — claim/transit/delivered |
| `src/app/dashboard/restaurant/page.tsx` + `restaurant-client.tsx` | ✅ Restaurant POS — table grid, orders, bill/pay |
| `src/app/api/kitchen/route.ts` + `[id]/route.ts` | ✅ GET/POST queue + PATCH status |
| `src/app/api/room-service/route.ts` | ✅ GET/PATCH delivery status |
| `src/app/api/restaurant/tables/route.ts` | ✅ GET/PATCH table status |
| `src/app/api/restaurant/orders/route.ts` + `[id]/route.ts` | ✅ Full order lifecycle |

---

### ✅ 2.5 Bellboy / Porter

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/bellboy/page.tsx` + `bellboy-client.tsx` | ✅ Tabs: รอรับ/กำลังทำ/เสร็จ — claim/deliver |
| `src/app/api/bellboy/route.ts` + `[id]/route.ts` | ✅ GET/POST + PATCH claim/status |

---

### ✅ 2.6 Transport Staff

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/transport/page.tsx` + `transport-client.tsx` | ✅ วันนี้/กำลังทำ/เสร็จ — driver view + manager create |
| `src/app/api/transport/route.ts` + `[id]/route.ts` | ✅ GET (filter date/driver) + POST + PATCH status |

---

### ✅ 2.7 Concierge (Enhanced)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/concierge/concierge-enhanced-client.tsx` | ✅ Tabs: คำร้อง/Transport/กระเป๋า/VIP Tasks |
| `src/app/api/concierge/requests/route.ts` | ✅ GET/POST concierge_requests |

---

### ✅ 2.8 Security (Enhanced)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/security/security-enhanced-client.tsx` | ✅ Patrol timeline, Incident report, Emergency SOS button |
| `src/app/api/security/patrol/route.ts` | ✅ GET today / POST checkpoint |
| `src/app/api/security/emergency/route.ts` | ✅ POST → urgent work_order |

---

### ✅ 2.9 Accounting OS (Full)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/accounting-ops/page.tsx` + `accounting-ops-client.tsx` | ✅ Cashier sessions, Expenses, Tax Invoices |
| `src/app/api/accounting/cashier/route.ts` + `[id]/route.ts` | ✅ Open/close session |
| `src/app/api/accounting/expenses/route.ts` + `[id]/route.ts` | ✅ Submit + approve/reject |
| `src/app/api/accounting/tax-invoices/route.ts` | ✅ Generate with VAT compute |

---

### ✅ 2.10 HR Module (Full)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/hr/page.tsx` + `hr-client.tsx` | ✅ Tabs: พนักงาน/เงินเดือน/ประเมินผล/อบรม/Onboarding/ลางาน |
| `src/app/api/hr/payroll/route.ts` + `[id]/route.ts` | ✅ Period CRUD + items |
| `src/app/api/hr/performance/route.ts` | ✅ Reviews CRUD |
| `src/app/api/hr/training/route.ts` | ✅ Records CRUD |
| `src/app/api/hr/onboarding/route.ts` | ✅ Tasks CRUD + complete |

---

### ✅ 2.11 IT Support

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/it/page.tsx` + `it-client.tsx` | ✅ Tabs: ตั๋ว/อุปกรณ์/สุขภาพระบบ |
| `src/app/api/it/tickets/route.ts` + `[id]/route.ts` | ✅ GET/POST + assign/resolve |
| `src/app/api/it/devices/route.ts` | ✅ GET/POST/PATCH status |

---

### ✅ 2.12 Spa (Full)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/spa/spa-full-client.tsx` | ✅ Tabs: การจอง/บริการ/ห้องบำบัด/นักบำบัด |
| `src/app/api/spa/treatment-rooms/route.ts` | ✅ Derive from bookings |

---

### ✅ 2.13 Revenue Management (Full)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/revenue/revenue-full-client.tsx` | ✅ Tabs: ราคาคู่แข่ง/Dynamic Pricing/Forecasting/Abandoned |
| `src/app/api/revenue/competitor/route.ts` | ✅ GET/POST |
| `src/app/api/revenue/dynamic-pricing/route.ts` | ✅ GET/POST/PATCH toggle |
| `src/app/api/revenue/abandoned/route.ts` | ✅ GET/POST recovery |

---

### ✅ 2.14 Marketing (Full)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/marketing/marketing-client.tsx` | ✅ Tabs: แคมเปญ/Promo Codes/Abandoned/Loyalty placeholder |
| `src/app/api/marketing/campaigns/route.ts` | ✅ GET/POST |
| `src/app/api/marketing/promo/route.ts` | ✅ GET/POST/PATCH toggle |

---

### ✅ 2.15 Purchasing (Full)

| ไฟล์ | สถานะ |
|---|---|
| `src/app/dashboard/purchasing/page.tsx` + `purchasing-client.tsx` | ✅ Tabs: ใบสั่งซื้อ/ผู้ขาย/สต็อก |
| `src/app/api/purchasing/suppliers/route.ts` | ✅ GET/POST |
| `src/app/api/purchasing/orders/route.ts` + `[id]/route.ts` | ✅ Full PO lifecycle |
| `src/app/api/purchasing/inventory/route.ts` | ✅ GET/POST/PATCH + low stock |

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
- Blackout dates (ปิดห้องบางวัน)
- Minimum stay rules
- Member pricing (ราคาพิเศษสำหรับ loyalty tier)

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
