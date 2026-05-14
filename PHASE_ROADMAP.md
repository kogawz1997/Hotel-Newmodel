# Hotel System — Complete Implementation Roadmap

> แผนพัฒนาระบบโรงแรมครบวงจร แบ่งเป็น 3 Phase  
> Branch: `claude/audit-consolidate-docs-mj9Dt`

---

## PHASE 1 — Core Operations Foundation
**เป้าหมาย:** ระบบพื้นฐานที่ทุกแผนกต้องการในชีวิตประจำวัน  
**ระยะเวลาโดยประมาณ:** 4–6 สัปดาห์

---

### 1.1 Database Migrations

| ไฟล์ Migration | ตาราง / การเปลี่ยนแปลง |
|---|---|
| `20260514000000_staff_profile_extended.sql` | ✅ เสร็จแล้ว — first_name, last_name, avatar_url, notification_prefs, dept_prefs, appearance_prefs |
| `20260514100000_department_work_tables.sql` | ✅ เสร็จแล้ว — concierge_requests, security_incidents, visitor_log |
| `20260601000000_attendance_shifts.sql` | `attendance_records` (clock_in/out, break, status), `shifts` (name, start_time, end_time, dept), `shift_assignments` (staff_id, shift_id, date) |
| `20260601100000_task_router.sql` | `work_orders` (type, priority, status, room_no, assigned_to, queue_position, auto_routed), `task_assignments` (work_order_id, staff_id, assigned_at, completed_at), `staff_availability` (staff_id, is_available, current_task_id) |
| `20260601200000_omnichannel_inbox.sql` | `conversations` (update: add platform_id, platform_thread_id, assigned_to, last_message_at), `messages` (conversation_id, sender_type, content, platform_msg_id, read_at), `channel_integrations` (hotel_id, platform, credentials JSONB, enabled) |
| `20260601300000_leave_documents.sql` | `leave_requests` (staff_id, type, start_date, end_date, reason, status, approved_by), `documents` (hotel_id, category, title, file_url, uploaded_by, version), `internal_requests` (requester_id, dept, type, details JSONB, status, approved_by), `announcements` (hotel_id, title, body, target_roles[], expires_at) |

---

### 1.2 Roles & Permissions

**ไฟล์:** `supabase/migrations/20260601400000_expanded_roles.sql`

เพิ่ม role ใหม่ใน CHECK constraint:
```
owner | admin | manager | dept_head | shift_supervisor |
front_desk | receptionist | housekeeping | concierge |
guest_relations | accounting | maintenance | engineering |
security | purchasing | hr_manager | hr_staff |
fnb_manager | fnb_staff | spa_manager | spa_staff |
sales | night_audit | it_admin | staff | viewer
```

**ไฟล์:** `src/lib/roles.ts`
- Role hierarchy map (owner > admin > manager > dept_head > shift_supervisor > staff)
- `canManage(actorRole, targetRole)` helper
- `getDeptRoles(dept: string)` — รายการ role ในแต่ละแผนก
- `isShiftLead(role)` — ตรวจสอบว่าเป็นหัวหน้ากะหรือไม่

---

### 1.3 Attendance & Shift System

**หน้าสำหรับพนักงานทั่วไป**

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/attendance/page.tsx` | Server component — ดึงกะวันนี้ + ประวัติ 7 วัน |
| `src/app/dashboard/attendance/attendance-client.tsx` | ปุ่ม Clock In / Clock Out / Break, ประวัติการทำงาน |
| `src/app/api/attendance/clock/route.ts` | POST: บันทึก clock_in / clock_out / break_start / break_end |

**หน้าสำหรับ Shift Supervisor / Dept Head**

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/shift-management/page.tsx` | Server component — ดึง shift_assignments วันนี้ + พรุ่งนี้ |
| `src/app/dashboard/shift-management/shift-client.tsx` | ตารางกะ, มอบหมายกะ, แก้ไข, ดูสถานะ clock-in/out ของทีม |
| `src/app/api/shifts/assign/route.ts` | POST: สร้าง/แก้ไข shift_assignment |
| `src/app/api/shifts/today/route.ts` | GET: กะของวันนี้พร้อมสถานะ |

**Sidebar nav เพิ่ม:**
```typescript
{ href: '/dashboard/attendance', label: 'บันทึกเวลา', icon: Clock, roles: ALL_ROLES }
{ href: '/dashboard/shift-management', label: 'จัดการกะ', icon: CalendarClock, roles: SUPERVISOR_ROLES }
```

---

### 1.4 Task Auto-Router

**ไฟล์:** `src/lib/task-router.ts`
```typescript
// Logic:
// 1. รับ request type (housekeeping | maintenance | room_service | concierge | security)
// 2. หา staff ที่ role ตรงและ is_available = true
// 3. ถ้าไม่มี → หา staff ที่มี current_task น้อยที่สุด
// 4. ถ้าทุกคนติดงาน → ต่อคิว (queue_position = max + 1)
// 5. บันทึก work_order + task_assignment + อัพเดต staff_availability
```

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/api/work-orders/route.ts` | POST: สร้าง work order → auto-route, GET: list ตาม hotel/dept |
| `src/app/api/work-orders/[id]/route.ts` | PATCH: อัพเดต status (pending→in_progress→done), DELETE: ยกเลิก |
| `src/app/api/work-orders/assign/route.ts` | POST: manual assign override |
| `src/app/dashboard/work-orders/page.tsx` | หน้า supervisor ดู queue ทั้งหมด |
| `src/app/dashboard/my-tasks/page.tsx` | หน้าพนักงาน — งานที่ได้รับมอบหมาย + สถานะ |
| `src/app/dashboard/my-tasks/my-tasks-client.tsx` | รับ-ปฏิเสธงาน, อัพเดตสถานะ, แจ้งเสร็จ |

**Realtime:** Supabase Realtime subscription บน `work_orders` เพื่อ notify พนักงานเมื่อมีงานใหม่

---

### 1.5 Omnichannel Inbox (Guest Relations)

**หน้าใหม่ Guest Relations**

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/inbox/page.tsx` | Server component — ดึง conversations ทุก platform |
| `src/app/dashboard/inbox/inbox-client.tsx` | Inbox UI: sidebar รายการแชท, พื้นที่แชท, filter by platform |
| `src/app/dashboard/inbox/conversation/[id]/page.tsx` | หน้าแชทเดี่ยว (สำหรับ deep link) |
| `src/app/api/inbox/messages/route.ts` | GET: ดึง messages ของ conversation, POST: ส่งข้อความ |
| `src/app/api/inbox/assign/route.ts` | POST: assign conversation ให้ guest_relations staff |
| `src/app/api/inbox/webhooks/line/route.ts` | POST: รับ webhook จาก LINE |
| `src/app/api/inbox/webhooks/whatsapp/route.ts` | POST: รับ webhook จาก WhatsApp Business |
| `src/app/api/inbox/webhooks/facebook/route.ts` | POST: รับ webhook จาก Facebook Messenger |

**ฟีเจอร์ใน inbox-client.tsx:**
- Platform filter: All / LINE / WhatsApp / Facebook / Booking.com / Agoda / Direct
- Status: Open / Pending / Resolved
- Assign to self / assign to teammate
- Quick reply templates (canned responses)
- Guest profile sidebar (ชื่อ, ประวัติการเข้าพัก, requests)
- Auto-tag: ประเมินจาก keyword → routing (room issue → maintenance, clean → housekeeping)

**Sidebar nav เพิ่ม:**
```typescript
{ href: '/dashboard/inbox', label: 'Inbox', icon: MessageSquare, roles: GUEST_RELATIONS_ROLES }
```

---

### 1.6 Leave Management

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/leave/page.tsx` | Server component — ดึง leave_requests ของตัวเอง + สถิติ |
| `src/app/dashboard/leave/leave-client.tsx` | ยื่นขอลา (ประเภท/วันที่/เหตุผล), ดูสถานะ, ประวัติ |
| `src/app/dashboard/leave/approve/page.tsx` | หน้า manager/dept_head อนุมัติ/ปฏิเสธ |
| `src/app/api/leave/route.ts` | POST: ยื่นคำขอ, GET: list |
| `src/app/api/leave/[id]/approve/route.ts` | POST: อนุมัติ |
| `src/app/api/leave/[id]/reject/route.ts` | POST: ปฏิเสธ |

ประเภทการลา: ลาป่วย, ลาพักร้อน, ลากิจ, ลาคลอด, ลาบวช, ลาไม่รับค่าจ้าง

---

### 1.7 Document & Internal Request Workflow

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/documents/page.tsx` | คลัง document: แบ่งหมวด (นโยบาย/ฟอร์ม/คู่มือ/SOP) |
| `src/app/dashboard/documents/documents-client.tsx` | ค้นหา, ดาวน์โหลด, อัพโหลด (ตาม permission) |
| `src/app/dashboard/requests/page.tsx` | ส่งคำขอ (ขอซื้อของ, ขอซ่อม, ขอทรัพยากร) |
| `src/app/dashboard/requests/requests-client.tsx` | Form ส่งคำขอ, ติดตามสถานะ, ประวัติ |
| `src/app/dashboard/requests/approve/page.tsx` | หน้า manager อนุมัติ/ปฏิเสธคำขอ |
| `src/app/api/documents/route.ts` | GET: list documents, POST: upload metadata |
| `src/app/api/documents/[id]/route.ts` | GET: signed URL, DELETE |
| `src/app/api/requests/route.ts` | POST: ส่งคำขอ, GET: list |
| `src/app/api/requests/[id]/route.ts` | PATCH: อัพเดตสถานะ |

---

### 1.8 Manager Live Board

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/live-board/page.tsx` | Server component |
| `src/app/dashboard/live-board/live-board-client.tsx` | Real-time dashboard: กะวันนี้, งานค้าง, แชทรอตอบ, ห้องพักสถานะ |
| `src/components/live/occupancy-map.tsx` | แผนผังห้องพัก real-time (by floor) |
| `src/components/live/staff-status-grid.tsx` | Grid พนักงาน: ออนไลน์/ติดงาน/ออฟไลน์ |
| `src/components/live/task-queue-widget.tsx` | คิวงานแต่ละแผนก |
| `src/components/live/alerts-feed.tsx` | Feed: incidents + urgent requests |

**Sidebar nav เพิ่ม:**
```typescript
{ href: '/dashboard/live-board', label: 'Live Board', icon: Monitor, roles: MANAGEMENT_ROLES }
```

---

### 1.9 Announcements System

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/announcements/page.tsx` | แสดงประกาศ (filter ตาม role) |
| `src/app/api/announcements/route.ts` | POST: สร้างประกาศ (manager+), GET: list |
| `src/components/dashboard/announcement-banner.tsx` | Banner ด้านบน dashboard สำหรับประกาศด่วน |

---

## PHASE 2 — Department Modules
**เป้าหมาย:** หน้าทำงานเต็มรูปแบบสำหรับทุกแผนก + HR + Accounting ขยาย  
**ระยะเวลาโดยประมาณ:** 6–8 สัปดาห์

---

### 2.1 Database Migrations

| ไฟล์ Migration | ตาราง |
|---|---|
| `20260701000000_hr_module.sql` | `employees` (profile extension), `payroll_periods`, `payroll_items` (salary, deductions, bonus), `performance_reviews` (staff_id, period, score, notes, reviewed_by), `training_records` (staff_id, course, completed_at, cert_url) |
| `20260701100000_accounting_expanded.sql` | `accounts` (chart of accounts), `journal_entries`, `expense_categories`, `expense_items` (hotel_id, category_id, amount, date, receipt_url, approved_by), `revenue_summary` (hotel_id, date, room_revenue, fnb_revenue, other, total) |
| `20260701200000_housekeeping_expanded.sql` | `room_cleaning_tasks` (room_id, type: checkout/stayover/deep, assigned_to, status, started_at, completed_at, notes), `linen_inventory` (item_type, quantity, in_use, in_laundry), `lost_found` (description, location_found, status, claimed_by) |
| `20260701300000_engineering_expanded.sql` | `maintenance_requests` (requestor_id, room_id, area, equipment, issue_desc, priority, status, assigned_to), `preventive_maintenance` (equipment_id, schedule, last_done, next_due, assigned_to), `equipment_log` (equipment_id, type: repair/install/inspect, cost, done_by) |
| `20260701400000_fnb_spa.sql` | `menu_items` (outlet_id, name, category, price, available), `food_orders` (room_no, items JSONB, total, status, assigned_to), `spa_services` (name, duration_min, price), `spa_bookings` (guest_id, service_id, slot_at, staff_id, status, notes) |
| `20260701500000_purchasing.sql` | `suppliers` (name, contact, category, rating), `purchase_orders` (hotel_id, supplier_id, items JSONB, total, status, approved_by, delivery_date), `inventory_items` (name, unit, quantity, min_stock, cost), `stock_transactions` (item_id, type: in/out/adjust, qty, ref_id, done_by) |

---

### 2.2 HR Module

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/hr/page.tsx` | HR Dashboard: headcount, department breakdown, leave summary |
| `src/app/dashboard/hr/hr-client.tsx` | Tabs: พนักงาน / เงินเดือน / ประเมิน / ฝึกอบรม |
| `src/app/dashboard/hr/employees/page.tsx` | ทะเบียนพนักงาน: ค้นหา, กรอง, profile link |
| `src/app/dashboard/hr/employees/[id]/page.tsx` | หน้าโปรไฟล์พนักงาน (HR view): ประวัติ, เอกสาร, เงินเดือน |
| `src/app/dashboard/hr/payroll/page.tsx` | สร้าง payroll period, คำนวณ, approve, export |
| `src/app/dashboard/hr/performance/page.tsx` | ประเมินผลพนักงาน: สร้างรอบ, กรอกคะแนน, ดูประวัติ |
| `src/app/dashboard/hr/training/page.tsx` | หลักสูตรฝึกอบรม: สมัคร, บันทึกผล, ใบรับรอง |
| `src/app/api/hr/payroll/route.ts` | POST: สร้าง period, GET: list |
| `src/app/api/hr/payroll/calculate/route.ts` | POST: คำนวณ payroll อัตโนมัติ |
| `src/app/api/hr/performance/route.ts` | POST/GET performance reviews |
| `src/components/hr/employee-card.tsx` | การ์ดพนักงาน (ชื่อ, แผนก, สถานะ, avatar) |
| `src/components/hr/payroll-summary.tsx` | ตารางสรุป payroll |

---

### 2.3 Accounting Module (Expanded)

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/accounting/page.tsx` | Accounting Dashboard: daily P&L, cash flow, KPIs |
| `src/app/dashboard/accounting/accounting-client.tsx` | Tabs: รายวัน / รายงาน / ค่าใช้จ่าย / รายรับ / บัญชี |
| `src/app/dashboard/accounting/expenses/page.tsx` | บันทึกค่าใช้จ่าย: หมวดหมู่, ใบเสร็จ, อนุมัติ |
| `src/app/dashboard/accounting/revenue/page.tsx` | รายรับแต่ละประเภท: ห้องพัก/F&B/สปา/อื่นๆ |
| `src/app/dashboard/accounting/reports/page.tsx` | รายงาน: P&L, Balance Sheet, Cash Flow (export Excel/PDF) |
| `src/app/dashboard/accounting/journal/page.tsx` | Journal entries: ดู, สร้าง, ปิดบัญชี |
| `src/app/api/accounting/expenses/route.ts` | POST/GET expenses |
| `src/app/api/accounting/revenue/route.ts` | POST/GET revenue summary |
| `src/app/api/accounting/reports/route.ts` | GET: สร้างรายงาน |
| `src/components/accounting/daily-summary.tsx` | Widget: ยอดวันนี้ |
| `src/components/accounting/expense-chart.tsx` | กราฟค่าใช้จ่ายแต่ละหมวด |

---

### 2.4 Housekeeping (Expanded)

**ปรับปรุงหน้า `/dashboard/housekeeping`**

| ไฟล์ | ฟีเจอร์เพิ่ม |
|---|---|
| `src/app/dashboard/housekeeping/page.tsx` | เพิ่ม: room_cleaning_tasks, linen_inventory, lost_found |
| `src/app/dashboard/housekeeping/housekeeping-client.tsx` | Tabs: งานทำความสะอาด / ผ้าปูที่นอน / ของหาย |
| `src/app/dashboard/housekeeping/lost-found/page.tsx` | Lost & Found: บันทึก, ติดตาม, คืนของ |
| `src/app/dashboard/housekeeping/linen/page.tsx` | สต็อกผ้า: นับ, ส่งซัก, รับคืน |
| `src/app/api/housekeeping/tasks/route.ts` | POST: สร้างงานทำความสะอาด |
| `src/app/api/housekeeping/linen/route.ts` | POST/GET linen transactions |
| `src/components/housekeeping/room-task-card.tsx` | การ์ดห้องพัก (ประเภทงาน, สถานะ, ผู้รับผิดชอบ) |
| `src/components/housekeeping/floor-map.tsx` | แผนผังชั้นพัก (สถานะห้อง) |

---

### 2.5 Engineering / Maintenance (Expanded)

**ปรับปรุงหน้า `/dashboard/maintenance`**

| ไฟล์ | ฟีเจอร์เพิ่ม |
|---|---|
| `src/app/dashboard/maintenance/maintenance-client.tsx` | Tabs: คำร้อง / PM Schedule / อุปกรณ์ / ประวัติ |
| `src/app/dashboard/maintenance/preventive/page.tsx` | แผน PM: สร้าง schedule, บันทึกผล, แจ้งเตือน |
| `src/app/dashboard/maintenance/equipment/page.tsx` | ทะเบียนอุปกรณ์: ข้อมูล, ประวัติซ่อม, ค่าใช้จ่าย |
| `src/app/api/maintenance/requests/route.ts` | POST/GET maintenance requests |
| `src/app/api/maintenance/pm/route.ts` | POST/GET preventive maintenance |
| `src/components/maintenance/pm-calendar.tsx` | ปฏิทิน PM schedule |
| `src/components/maintenance/equipment-list.tsx` | ตารางอุปกรณ์ |

---

### 2.6 Concierge (Expanded)

**ปรับปรุงหน้า `/dashboard/concierge`**

| ไฟล์ | ฟีเจอร์เพิ่ม |
|---|---|
| `src/app/dashboard/concierge/concierge-client.tsx` | เพิ่ม tab: Transportation / Local Info / F&B Orders |
| `src/app/dashboard/concierge/local-info/page.tsx` | ข้อมูลท้องถิ่น: ร้านอาหาร, สถานที่ท่องเที่ยว, รถ |
| `src/app/api/concierge/transport/route.ts` | POST: จองรถ, GET: list |
| `src/components/concierge/arrival-checklist.tsx` | Checklist ต้อนรับ: amenities, preferences, requests |
| `src/components/concierge/local-guide.tsx` | Widget ข้อมูลสถานที่ใกล้เคียง |

---

### 2.7 Security (Expanded)

**ปรับปรุงหน้า `/dashboard/security`**

| ไฟล์ | ฟีเจอร์เพิ่ม |
|---|---|
| `src/app/dashboard/security/security-client.tsx` | เพิ่ม tab: Key Management / Patrol Log |
| `src/app/dashboard/security/patrol/page.tsx` | บันทึกการตรวจตรา (checkpoint, เวลา, หมายเหตุ) |
| `src/app/api/security/patrol/route.ts` | POST: บันทึก patrol checkpoint |
| `src/components/security/patrol-map.tsx` | แผนที่ checkpoint (กรอกหมายเหตุแต่ละจุด) |

---

### 2.8 F&B Module

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/fnb/page.tsx` | F&B Dashboard: ออเดอร์วันนี้, revenue, เมนูขายดี |
| `src/app/dashboard/fnb/fnb-client.tsx` | Tabs: ออเดอร์ / เมนู / โต๊ะ |
| `src/app/dashboard/fnb/menu/page.tsx` | จัดการเมนู: เพิ่ม/แก้/ซ่อน, หมวดหมู่, ราคา |
| `src/app/dashboard/fnb/orders/page.tsx` | ออเดอร์ใหม่: รับออเดอร์, track สถานะครัว, ส่ง |
| `src/app/api/fnb/orders/route.ts` | POST: สร้างออเดอร์, GET: list by status |
| `src/app/api/fnb/orders/[id]/route.ts` | PATCH: อัพเดตสถานะ (new→preparing→ready→delivered) |
| `src/app/api/fnb/menu/route.ts` | POST/GET/PATCH menu items |
| `src/components/fnb/order-ticket.tsx` | ตั๋ว KDS (Kitchen Display) |
| `src/components/fnb/menu-grid.tsx` | Grid เมนู + add to order |

**Sidebar nav เพิ่ม:**
```typescript
{ href: '/dashboard/fnb', label: 'F&B', icon: UtensilsCrossed, roles: FNB_ROLES }
```

---

### 2.9 Spa Module

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/spa/page.tsx` | Spa Dashboard: booking วันนี้, revenue, staff utilization |
| `src/app/dashboard/spa/spa-client.tsx` | Tabs: Booking / บริการ / Staff Schedule |
| `src/app/dashboard/spa/bookings/page.tsx` | จองสปา: ปฏิทิน, slot availability, assign therapist |
| `src/app/dashboard/spa/services/page.tsx` | จัดการบริการ: เพิ่ม/แก้ไข, ราคา, ระยะเวลา |
| `src/app/api/spa/bookings/route.ts` | POST: จองสปา, GET: list |
| `src/app/api/spa/bookings/[id]/route.ts` | PATCH: confirm/cancel/complete |
| `src/app/api/spa/services/route.ts` | POST/GET/PATCH services |
| `src/components/spa/booking-calendar.tsx` | ปฏิทิน booking (time slots) |
| `src/components/spa/therapist-schedule.tsx` | ตารางงาน therapist |

**Sidebar nav เพิ่ม:**
```typescript
{ href: '/dashboard/spa', label: 'Spa', icon: Sparkles, roles: SPA_ROLES }
```

---

### 2.10 Purchasing Module

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/purchasing/page.tsx` | Purchasing Dashboard: PO pending, stock alerts |
| `src/app/dashboard/purchasing/purchasing-client.tsx` | Tabs: Purchase Orders / สต็อก / Suppliers |
| `src/app/dashboard/purchasing/po/page.tsx` | สร้าง/ดู PO: supplier, items, วันส่ง, อนุมัติ |
| `src/app/dashboard/purchasing/inventory/page.tsx` | สต็อก: ดูระดับสต็อก, แจ้งเตือนต่ำ, ปรับ |
| `src/app/dashboard/purchasing/suppliers/page.tsx` | ทะเบียน supplier: ข้อมูล, ประวัติ, rating |
| `src/app/api/purchasing/po/route.ts` | POST: สร้าง PO, GET: list |
| `src/app/api/purchasing/po/[id]/approve/route.ts` | POST: อนุมัติ PO |
| `src/app/api/purchasing/inventory/route.ts` | GET: สต็อก, POST: ปรับสต็อก |
| `src/components/purchasing/po-form.tsx` | Form สร้าง PO (เพิ่ม line items) |
| `src/components/purchasing/stock-alert-list.tsx` | รายการสต็อกที่ต่ำกว่า min |

**Sidebar nav เพิ่ม:**
```typescript
{ href: '/dashboard/purchasing', label: 'Purchasing', icon: ShoppingCart, roles: PURCHASING_ROLES }
```

---

### 2.11 Guest Experience Basics

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/guest-experience/page.tsx` | Guest feedback dashboard: rating, complaints, compliments |
| `src/app/dashboard/guest-experience/ge-client.tsx` | Tabs: Feedback / Complaints / Guest Profiles |
| `src/app/api/guest-experience/feedback/route.ts` | POST/GET guest feedback |
| `src/components/guest/guest-profile-panel.tsx` | Panel: ประวัติการเข้าพัก, preferences, requests |
| `src/components/guest/feedback-chart.tsx` | กราฟ feedback score (NPS, คะแนนแต่ละด้าน) |

---

## PHASE 3 — Advanced & Revenue Systems
**เป้าหมาย:** ระบบขั้นสูง: Revenue Management, Sales, Night Audit, CRM, Platform Admin  
**ระยะเวลาโดยประมาณ:** 8–12 สัปดาห์

---

### 3.1 Database Migrations

| ไฟล์ Migration | ตาราง |
|---|---|
| `20260801000000_revenue_management.sql` | `rate_plans` (hotel_id, name, base_rate, restrictions JSONB), `price_overrides` (room_type_id, date, price, reason), `occupancy_forecast` (hotel_id, date, predicted_occ, recommended_rate, actual_rate), `channel_rates` (rate_plan_id, channel, markup_pct) |
| `20260801100000_sales_marketing.sql` | `leads` (hotel_id, company, contact, source, status, value), `proposals` (lead_id, details JSONB, status, sent_at), `contracts` (hotel_id, client, start_date, end_date, rate, rooms), `promo_codes` (code, discount_type, amount, valid_from, valid_to, uses_left) |
| `20260801200000_night_audit.sql` | `night_audit_runs` (hotel_id, audit_date, status, created_by, completed_at), `night_audit_items` (run_id, type, amount, notes, status), `no_show_log` (reservation_id, audit_run_id, charge_applied) |
| `20260801300000_crm_loyalty.sql` | `loyalty_members` (guest_id, tier, points, lifetime_points, joined_at), `loyalty_transactions` (member_id, type: earn/redeem, points, ref_id, note), `crm_segments` (hotel_id, name, criteria JSONB), `email_campaigns` (hotel_id, segment_id, subject, body, sent_at, open_count, click_count) |
| `20260801400000_platform_admin.sql` | `organizations` (expand: subscription_plan, seats_limit, features JSONB), `audit_logs` (org_id, user_id, action, resource, details JSONB, ip), `system_settings` (org_id, key, value JSONB), `integrations` (org_id, type, config JSONB, enabled) |

---

### 3.2 Revenue Management

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/revenue/page.tsx` | Revenue Dashboard: ADR, RevPAR, Occupancy, forecast |
| `src/app/dashboard/revenue/revenue-client.tsx` | Tabs: Rate Plans / Pricing Calendar / Forecast / Channel Parity |
| `src/app/dashboard/revenue/rate-plans/page.tsx` | จัดการ rate plans: สร้าง/แก้ไข restrictions |
| `src/app/dashboard/revenue/pricing/page.tsx` | ปฏิทินราคา: override ราคาแต่ละวัน/แต่ละ room type |
| `src/app/dashboard/revenue/forecast/page.tsx` | Forecast: กราฟ occupancy คาดการณ์, แนะนำราคา |
| `src/app/api/revenue/rate-plans/route.ts` | POST/GET rate plans |
| `src/app/api/revenue/pricing/route.ts` | POST: set price override, GET: pricing calendar |
| `src/app/api/revenue/forecast/route.ts` | GET: occupancy forecast + rate recommendations |
| `src/components/revenue/pricing-calendar.tsx` | ปฏิทิน heat map ราคา (สีตามระดับราคา) |
| `src/components/revenue/revpar-chart.tsx` | กราฟ RevPAR / ADR / Occupancy (30/60/90 วัน) |

---

### 3.3 Sales & Marketing

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/sales/page.tsx` | Sales Dashboard: pipeline, contracts, targets |
| `src/app/dashboard/sales/sales-client.tsx` | Tabs: Leads / Proposals / Contracts / Promo Codes |
| `src/app/dashboard/sales/leads/page.tsx` | CRM leads: kanban by stage (new/contacted/qualified/proposal/won/lost) |
| `src/app/dashboard/sales/proposals/page.tsx` | สร้าง/ส่ง proposal: รายละเอียด, ราคา, ห้อง |
| `src/app/dashboard/sales/contracts/page.tsx` | สัญญากลุ่ม: ดู, ต่ออายุ, ยกเลิก |
| `src/app/dashboard/marketing/page.tsx` | Marketing: email campaigns, promo codes, segments |
| `src/app/api/sales/leads/route.ts` | POST/GET/PATCH leads |
| `src/app/api/sales/proposals/route.ts` | POST/GET proposals |
| `src/app/api/marketing/campaigns/route.ts` | POST: สร้าง campaign, GET: list + stats |
| `src/app/api/marketing/promo-codes/route.ts` | POST/GET/DELETE promo codes |
| `src/components/sales/lead-kanban.tsx` | Kanban board leads |
| `src/components/marketing/campaign-stats.tsx` | สถิติ email campaign |

---

### 3.4 Night Audit

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/night-audit/page.tsx` | Night Audit Dashboard |
| `src/app/dashboard/night-audit/audit-client.tsx` | Checklist: post charges, check no-shows, close day, run reports |
| `src/app/api/night-audit/run/route.ts` | POST: เริ่ม audit run (lock date) |
| `src/app/api/night-audit/post-charges/route.ts` | POST: post room charges ทุก reservation ที่ active |
| `src/app/api/night-audit/no-shows/route.ts` | POST: ประมวลผล no-shows (charge/cancel) |
| `src/app/api/night-audit/close/route.ts` | POST: ปิดวัน + สร้าง revenue_summary |
| `src/components/night-audit/audit-checklist.tsx` | Checklist step-by-step พร้อม status แต่ละขั้น |

---

### 3.5 Advanced CRM & Loyalty

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/crm/page.tsx` | CRM Dashboard: top guests, segments, loyalty stats |
| `src/app/dashboard/crm/crm-client.tsx` | Tabs: Guest Profiles / Segments / Loyalty / Campaigns |
| `src/app/dashboard/crm/guests/[id]/page.tsx` | Guest 360 Profile: ทุก stay, preferences, spend, notes |
| `src/app/dashboard/crm/loyalty/page.tsx` | Loyalty program: tiers, points, redemptions |
| `src/app/dashboard/crm/segments/page.tsx` | สร้าง segment: criteria builder (stay count, spend, nationality) |
| `src/app/api/crm/loyalty/route.ts` | GET: member info, POST: manual adjust points |
| `src/app/api/crm/segments/route.ts` | POST: สร้าง segment, GET: list + member count |
| `src/components/crm/guest-timeline.tsx` | Timeline การเข้าพักและ interactions ของ guest |
| `src/components/crm/loyalty-tier-badge.tsx` | Badge: Bronze/Silver/Gold/Platinum |

---

### 3.6 IT / System Settings

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/system/page.tsx` | System Settings Dashboard |
| `src/app/dashboard/system/system-client.tsx` | Tabs: Integrations / Audit Logs / API Keys / Backup |
| `src/app/dashboard/system/integrations/page.tsx` | จัดการ integrations: LINE, WhatsApp, Booking.com, PMS, POS |
| `src/app/dashboard/system/audit-logs/page.tsx` | ดู audit logs: filter by user/action/date |
| `src/app/api/system/settings/route.ts` | GET/POST system settings |
| `src/app/api/system/audit-logs/route.ts` | GET: audit logs with pagination |
| `src/components/system/integration-card.tsx` | การ์ด integration: status, config, test connection |
| `src/components/system/audit-log-table.tsx` | ตาราง audit logs |

---

### 3.7 Platform Admin (Super Admin)

| ไฟล์ | รายละเอียด |
|---|---|
| `src/app/dashboard/platform-admin/page.tsx` | Platform Overview: hotels, organizations, revenue |
| `src/app/dashboard/platform-admin/organizations/page.tsx` | จัดการ organizations: plan, seats, features, suspend |
| `src/app/dashboard/platform-admin/hotels/page.tsx` | จัดการ hotels ทุกโรงแรมในระบบ |
| `src/app/dashboard/platform-admin/billing/page.tsx` | Billing: subscription, invoices, usage |
| `src/app/api/platform-admin/organizations/route.ts` | GET: all orgs, PATCH: update plan/features |
| `src/components/platform/org-overview-card.tsx` | การ์ด organization summary |

---

## Summary Table

| Phase | DB Tables | API Routes | Pages/Clients | Priority |
|---|---|---|---|---|
| **Phase 1** | 9 new tables | 18 routes | 22 pages | Critical |
| **Phase 2** | 14 new tables | 24 routes | 36 pages | High |
| **Phase 3** | 10 new tables | 18 routes | 24 pages | Medium |
| **Total** | **33 new tables** | **60 routes** | **82 pages** | — |

---

## Already Completed (Pre-Phase 1)

| ระบบ | ไฟล์ |
|---|---|
| ✅ Authentication | `src/app/auth/` |
| ✅ Reservations | `src/app/dashboard/reservations/` |
| ✅ Rooms | `src/app/dashboard/rooms/` |
| ✅ Guests | `src/app/dashboard/guests/` |
| ✅ Front Desk (basic) | `src/app/dashboard/front-desk/` |
| ✅ Housekeeping (basic) | `src/app/dashboard/housekeeping/` |
| ✅ Maintenance (basic) | `src/app/dashboard/maintenance/` |
| ✅ Concierge (full) | `src/app/dashboard/concierge/` |
| ✅ Security (full) | `src/app/dashboard/security/` |
| ✅ Staff Profile (5 tabs) | `src/app/dashboard/profile/` |
| ✅ Role-adaptive Dashboard | `src/app/dashboard/page.tsx` |
| ✅ Sidebar with all dept links | `src/components/layout/sidebar.tsx` |
| ✅ DB: staff_profile_extended | `supabase/migrations/20260514000000_...` |
| ✅ DB: department_work_tables | `supabase/migrations/20260514100000_...` |

---

*อัพเดตล่าสุด: 2026-05-14 | Branch: `claude/audit-consolidate-docs-mj9Dt`*
